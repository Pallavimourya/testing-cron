import type { NextRequest } from "next/server"
import connectDB from "@/lib/mongodb"
import Coupon from "@/models/Coupon"
import CouponUsage from "@/models/CouponUsage"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/auth"

// POST /api/coupons/validate - Validate coupon code
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { code, planSlug, amount } = await request.json()

    if (!code || !planSlug || !amount) {
      return Response.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    await connectDB()

    // Find coupon
    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
      validFrom: { $lte: new Date() },
      validUntil: { $gte: new Date() },
    })

    if (!coupon) {
      return Response.json({ success: false, error: "Invalid or expired coupon" }, { status: 400 })
    }

    // Check usage limits
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return Response.json({ success: false, error: "Coupon usage limit exceeded" }, { status: 400 })
    }

    // Check per-user limit
    const userUsageCount = await CouponUsage.countDocuments({
      couponId: coupon._id,
      userId: session.user.id,
    })

    if (coupon.perUserLimit && userUsageCount >= coupon.perUserLimit) {
      return Response.json({ success: false, error: "You have already used this coupon" }, { status: 400 })
    }

    // Check applicable plans
    if (coupon.applicablePlans.length > 0 && !coupon.applicablePlans.includes(planSlug)) {
      return Response.json({ success: false, error: "Coupon not applicable for this plan" }, { status: 400 })
    }

    // Check minimum amount
    if (coupon.minAmount && amount < coupon.minAmount) {
      return Response.json(
        {
          success: false,
          error: `Minimum order amount ₹${coupon.minAmount / 100} required`,
        },
        { status: 400 },
      )
    }

    // Calculate discount
    let discountAmount = 0
    if (coupon.type === "percentage") {
      discountAmount = Math.round((amount * coupon.value) / 100)
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount
      }
    } else {
      discountAmount = coupon.value
    }

    // Ensure discount doesn't exceed amount
    discountAmount = Math.min(discountAmount, amount)

    const finalAmount = amount - discountAmount

    return Response.json({
      success: true,
      coupon: {
        id: coupon._id,
        code: coupon.code,
        name: coupon.name,
        type: coupon.type,
        value: coupon.value,
      },
      discount: {
        amount: discountAmount,
        percentage: Math.round((discountAmount / amount) * 100),
      },
      finalAmount,
    })
  } catch (error) {
    console.error("Validate coupon error:", error)
    return Response.json({ success: false, error: "Failed to validate coupon" }, { status: 500 })
  }
}
