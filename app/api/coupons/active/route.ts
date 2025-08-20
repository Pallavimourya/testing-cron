import type { NextRequest } from "next/server"
import connectDB from "@/lib/mongodb"
import Coupon from "@/models/Coupon"

// GET /api/coupons/active - Get active coupons (public endpoint)
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const now = new Date()
    const coupons = await Coupon.find({
      isActive: true,
      validFrom: { $lte: now },
      validUntil: { $gte: now },
    })
      .select("code name description type value minAmount maxDiscount")
      .sort({ createdAt: -1 })

    // Format coupons for frontend display
    const formattedCoupons = coupons.map((coupon) => ({
      ...coupon.toJSON(),
      value: coupon.type === "percentage" ? coupon.value : coupon.value / 100,
      minAmount: coupon.minAmount ? coupon.minAmount / 100 : undefined,
      maxDiscount: coupon.maxDiscount ? coupon.maxDiscount / 100 : undefined,
      displayText:
        coupon.type === "percentage" ? `${coupon.value}% OFF` : `₹${(coupon.value / 100).toLocaleString("en-IN")} OFF`,
    }))

    return Response.json({
      success: true,
      coupons: formattedCoupons,
    })
  } catch (error) {
    console.error("Get active coupons error:", error)
    return Response.json({ success: false, error: "Failed to fetch coupons" }, { status: 500 })
  }
}
