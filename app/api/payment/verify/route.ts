import type { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/auth"
import connectDB from "@/lib/mongodb"
import Order from "@/models/Order"
import User from "@/models/User"
import Coupon from "@/models/Coupon"
import CouponUsage from "@/models/CouponUsage"
import Plan from "@/models/Plan"
import { verifyPaymentSignature } from "@/lib/razorpay"

// POST /api/payment/verify
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return Response.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const body = await request.json()
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return Response.json({ success: false, error: "Missing payment details" }, { status: 400 })
    }

    await connectDB()

    // Find the order
    const order = await Order.findOne({ razorpayOrderId: razorpay_order_id })
    if (!order) {
      return Response.json({ success: false, error: "Order not found" }, { status: 404 })
    }

    // Verify payment signature
    const isValidSignature = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)

    if (!isValidSignature) {
      // Mark order as failed
      order.status = "failed"
      await order.save()

      return Response.json({ success: false, error: "Invalid payment signature" }, { status: 400 })
    }

    // Check if order is already processed
    if (order.status === "paid") {
      return Response.json({
        success: true,
        message: "Payment already processed",
        subscription: {
          status: "active",
          plan: order.metadata?.planName,
        },
      })
    }

    // Update order status
    order.status = "paid"
    order.razorpayPaymentId = razorpay_payment_id
    order.razorpaySignature = razorpay_signature
    await order.save()

    // Get plan details
    const plan = await Plan.findById(order.planId)
    if (!plan) {
      throw new Error("Plan not found")
    }

    // Update user subscription
    const user = await User.findById(session.user.id)
    if (!user) {
      throw new Error("User not found")
    }

    const now = new Date()
    const subscriptionExpiry = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000)

    user.subscriptionStatus = "active"
    user.subscriptionPlan = order.planId
    user.subscriptionExpiry = subscriptionExpiry
    user.razorpayCustomerId = user.razorpayCustomerId || `cust_${user._id}`
    await user.save()

    // Handle coupon usage if applicable
    if (order.couponCode && order.couponId) {
      // Increment coupon usage count
      await Coupon.findByIdAndUpdate(order.couponId, {
        $inc: { usageCount: 1 },
      })

      // Record coupon usage
      const couponUsage = new CouponUsage({
        userId: session.user.id,
        couponId: order.couponId,
        couponCode: order.couponCode,
        orderId: order._id.toString(),
        discountAmount: order.discountApplied,
      })
      await couponUsage.save()
    }

    return Response.json({
      success: true,
      message: "Payment verified successfully",
      subscription: {
        status: "active",
        plan: plan.name,
        expiry: subscriptionExpiry,
        durationDays: plan.durationDays,
      },
      order: {
        id: order._id,
        amount: order.finalAmount,
        discount: order.discountApplied,
        coupon: order.couponCode,
      },
    })
  } catch (error) {
    console.error("Payment verification error:", error)
    return Response.json({ success: false, error: "Payment verification failed" }, { status: 500 })
  }
}
