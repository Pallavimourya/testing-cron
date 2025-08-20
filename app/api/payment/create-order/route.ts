import type { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/auth"
import connectDB from "@/lib/mongodb"
import Order from "@/models/Order"
import Plan from "@/models/Plan"
import Coupon from "@/models/Coupon"
import PaymentSettings from "@/models/PaymentSettings"
import { calculatePriceQuote } from "@/lib/payment-engine"
import { createRazorpayInstance } from "@/lib/razorpay"

// POST /api/payment/create-order
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return Response.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const body = await request.json()
    const { planId, couponCode } = body

    if (!planId) {
      return Response.json({ success: false, error: "Plan ID is required" }, { status: 400 })
    }

    await connectDB()

    // Check if payments are enabled
    const settings = await PaymentSettings.findOne()
    if (!settings?.paymentsEnabled) {
      return Response.json({ success: false, error: "Payments are currently disabled" }, { status: 503 })
    }

    // Get plan details
    const plan = await Plan.findById(planId)
    if (!plan || !plan.isActive) {
      return Response.json({ success: false, error: "Plan not found or inactive" }, { status: 400 })
    }

    // Get coupon details if provided
    let coupon = null
    if (couponCode) {
      coupon = await Coupon.findOne({ code: couponCode.toUpperCase() })
    }

    // Calculate price quote
    const priceQuote = calculatePriceQuote(
      plan.price,
      couponCode,
      coupon ? {
        type: coupon.type,
        value: coupon.value,
        maxDiscount: coupon.maxDiscount,
        minAmount: coupon.minAmount,
        isActive: coupon.isActive,
        validFrom: coupon.validFrom,
        validUntil: coupon.validUntil,
        usageLimit: coupon.usageLimit,
        usedCount: coupon.usageCount,
        applicablePlans: coupon.applicablePlans,
      } : undefined,
      planId
    )

    if (!priceQuote.isValid) {
      return Response.json({ success: false, error: priceQuote.error }, { status: 400 })
    }

    const { baseAmount, discountAmount, finalAmount } = priceQuote

    // Create Razorpay order
    const razorpay = createRazorpayInstance()
    const razorpayOrder = await razorpay.orders.create({
      amount: finalAmount, // Amount in paise
      currency: settings.currency || "INR",
      receipt: `order_${Date.now()}_${session.user.id}`,
      notes: {
        planId,
        planName: plan.name,
        userId: session.user.id,
        userEmail: session.user.email || "",
        couponCode: couponCode || "",
      },
    })

    // Save order to database
    const order = new Order({
      userId: session.user.id,
      planId,
      baseAmount,
      discountApplied: discountAmount,
      finalAmount,
      couponCode: couponCode || undefined,
      couponId: coupon?._id?.toString() || null,
      razorpayOrderId: razorpayOrder.id,
      status: "created",
      metadata: {
        planName: plan.name,
        couponName: coupon?.name,
        userEmail: session.user.email || "",
        userName: session.user.name || "",
      },
    })

    await order.save()

    return Response.json({
      success: true,
      orderId: razorpayOrder.id,
      amount: finalAmount,
      currency: razorpayOrder.currency,
      keyId: settings.razorpayKeyId,
      planName: plan.name,
      discountAmount,
      coupon: coupon
        ? {
            code: coupon.code,
            name: coupon.name,
            discountAmount,
          }
        : undefined,
    })
  } catch (error) {
    console.error("Create order error:", error)
    return Response.json({ success: false, error: "Failed to create order" }, { status: 500 })
  }
}
