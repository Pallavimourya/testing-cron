import type { NextRequest } from "next/server"
import { calculatePriceQuote } from "@/lib/payment-engine"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/auth"
import connectDB from "@/lib/mongodb"
import Plan from "@/models/Plan"
import Coupon from "@/models/Coupon"

// GET /api/price-quote?planId=&coupon= - Get price quote (public endpoint)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const planId = searchParams.get("planId")
    const couponCode = searchParams.get("coupon")

    if (!planId) {
      return Response.json({ success: false, error: "Plan ID is required" }, { status: 400 })
    }

    await connectDB()

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
    const result = calculatePriceQuote(
      plan.price,
      couponCode || undefined,
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

    if (!result.isValid) {
      return Response.json({ success: false, error: result.error }, { status: 400 })
    }

    return Response.json({
      success: true,
      data: {
        planName: plan.name,
        baseAmount: result.baseAmount,
        discountAmount: result.discountAmount,
        finalAmount: result.finalAmount,
        coupon: coupon ? {
          code: coupon.code,
          name: coupon.name,
          discountAmount: result.discountAmount,
        } : undefined,
      },
    })
  } catch (error) {
    console.error("Price quote error:", error)
    return Response.json({ success: false, error: "Failed to calculate price" }, { status: 500 })
  }
}
