import type { NextRequest } from "next/server"
import connectDB from "@/lib/mongodb"
import Coupon from "@/models/Coupon"
import { withAdminAuth } from "@/lib/admin-middleware"

// GET /api/coupons - Get all coupons (admin only)
export async function GET(request: NextRequest) {
  return withAdminAuth(async () => {
    try {
      await connectDB()
      const coupons = await Coupon.find().sort({ createdAt: -1 })

      return Response.json({
        success: true,
        coupons,
      })
    } catch (error) {
      console.error("Get coupons error:", error)
      return Response.json({ success: false, error: "Failed to fetch coupons" }, { status: 500 })
    }
  })(request)
}

// POST /api/coupons - Create new coupon (admin only)
export async function POST(request: NextRequest) {
  return withAdminAuth(async () => {
    try {
      const body = await request.json()
      const {
        code,
        name,
        description,
        type,
        value,
        minAmount,
        maxDiscount,
        usageLimit,
        perUserLimit,
        validFrom,
        validUntil,
        applicablePlans,
      } = body

      if (!code || !name || !type || !value || !validFrom || !validUntil) {
        return Response.json({ success: false, error: "Missing required fields" }, { status: 400 })
      }

      await connectDB()

      // Check if coupon code already exists
      const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() })
      if (existingCoupon) {
        return Response.json({ success: false, error: "Coupon code already exists" }, { status: 400 })
      }

      const coupon = new Coupon({
        code: code.toUpperCase(),
        name,
        description,
        type,
        value,
        minAmount,
        maxDiscount,
        usageLimit,
        perUserLimit: perUserLimit || 1,
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
        applicablePlans: applicablePlans || [],
        isActive: true,
      })

      await coupon.save()

      return Response.json({
        success: true,
        coupon,
      })
    } catch (error) {
      console.error("Create coupon error:", error)
      return Response.json({ success: false, error: "Failed to create coupon" }, { status: 500 })
    }
  })(request)
}
