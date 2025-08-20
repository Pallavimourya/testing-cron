import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import Payment from "@/models/Payment"
import Coupon from "@/models/Coupon"
import CouponUsage from "@/models/CouponUsage"
import Admin from "@/models/Admin"

async function verifyAdminToken(request: Request) {
  const token = request.headers.get("cookie")?.split("admin-token=")[1]?.split(";")[0]

  if (!token) {
    throw new Error("No admin token provided")
  }

  const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || "fallback-secret") as any

  await connectDB()

  const admin = await Admin.findById(decoded.id)
  if (!admin || !admin.isActive) {
    throw new Error("Admin not found or inactive")
  }

  return admin
}

export async function GET(request: Request) {
  try {
    await verifyAdminToken(request)
    await connectDB()

    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get("type") || "payments"
    const startDate = searchParams.get("startDate")
      ? new Date(searchParams.get("startDate")!)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const endDate = searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : new Date()
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const skip = (page - 1) * limit

    let reportData: any = {}

    switch (reportType) {
      case "payments":
        const payments = await Payment.find({
          createdAt: { $gte: startDate, $lte: endDate },
        })
          .populate("userId", "name email")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)

        const totalPayments = await Payment.countDocuments({
          createdAt: { $gte: startDate, $lte: endDate },
        })

        reportData = {
          payments: payments.map((payment) => ({
            id: payment._id,
            user: payment.userId,
            planName: payment.planName,
            amount: payment.amount,
            originalAmount: payment.originalAmount,
            discountAmount: payment.discountAmount,
            couponCode: payment.couponCode,
            status: payment.status,
            razorpayOrderId: payment.razorpayOrderId,
            razorpayPaymentId: payment.razorpayPaymentId,
            createdAt: payment.createdAt,
            updatedAt: payment.updatedAt,
          })),
          pagination: {
            page,
            limit,
            total: totalPayments,
            pages: Math.ceil(totalPayments / limit),
          },
        }
        break

      case "users":
        const users = await User.find({
          createdAt: { $gte: startDate, $lte: endDate },
        })
          .select(
            "name email mobile city subscriptionStatus subscriptionPlan subscriptionExpiry createdAt lastActiveAt blocked",
          )
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)

        const totalUsers = await User.countDocuments({
          createdAt: { $gte: startDate, $lte: endDate },
        })

        reportData = {
          users: users.map((user) => ({
            id: user._id,
            name: user.name,
            email: user.email,
            mobile: user.mobile,
            city: user.city,
            subscriptionStatus: user.subscriptionStatus,
            subscriptionPlan: user.subscriptionPlan,
            subscriptionExpiry: user.subscriptionExpiry,
            createdAt: user.createdAt,
            lastActiveAt: user.lastActiveAt,
            blocked: user.blocked,
          })),
          pagination: {
            page,
            limit,
            total: totalUsers,
            pages: Math.ceil(totalUsers / limit),
          },
        }
        break

      case "coupons":
        const coupons = await Coupon.find({
          createdAt: { $gte: startDate, $lte: endDate },
        })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)

        const totalCoupons = await Coupon.countDocuments({
          createdAt: { $gte: startDate, $lte: endDate },
        })

        // Get usage data for each coupon
        const couponsWithUsage = await Promise.all(
          coupons.map(async (coupon) => {
            const usage = await CouponUsage.countDocuments({ couponId: coupon._id })
            const totalDiscount = await CouponUsage.aggregate([
              { $match: { couponId: coupon._id } },
              { $group: { _id: null, total: { $sum: "$discountAmount" } } },
            ])

            return {
              id: coupon._id,
              code: coupon.code,
              name: coupon.name,
              description: coupon.description,
              type: coupon.type,
              value: coupon.value,
              minAmount: coupon.minAmount,
              maxDiscount: coupon.maxDiscount,
              usageLimit: coupon.usageLimit,
              usageCount: coupon.usageCount,
              actualUsage: usage,
              totalDiscount: totalDiscount[0]?.total || 0,
              validFrom: coupon.validFrom,
              validUntil: coupon.validUntil,
              isActive: coupon.isActive,
              createdAt: coupon.createdAt,
            }
          }),
        )

        reportData = {
          coupons: couponsWithUsage,
          pagination: {
            page,
            limit,
            total: totalCoupons,
            pages: Math.ceil(totalCoupons / limit),
          },
        }
        break

      case "revenue":
        const revenueByPlan = await Payment.aggregate([
          {
            $match: {
              status: "paid",
              createdAt: { $gte: startDate, $lte: endDate },
            },
          },
          {
            $group: {
              _id: "$planId",
              planName: { $first: "$planName" },
              totalRevenue: { $sum: "$amount" },
              totalSales: { $sum: 1 },
              averageOrderValue: { $avg: "$amount" },
              totalDiscount: { $sum: "$discountAmount" },
            },
          },
          {
            $sort: { totalRevenue: -1 },
          },
        ])

        const revenueByDate = await Payment.aggregate([
          {
            $match: {
              status: "paid",
              createdAt: { $gte: startDate, $lte: endDate },
            },
          },
          {
            $group: {
              _id: {
                year: { $year: "$createdAt" },
                month: { $month: "$createdAt" },
                day: { $dayOfMonth: "$createdAt" },
              },
              revenue: { $sum: "$amount" },
              sales: { $sum: 1 },
              discount: { $sum: "$discountAmount" },
            },
          },
          {
            $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 },
          },
        ])

        reportData = {
          revenueByPlan,
          revenueByDate,
          summary: {
            totalRevenue: revenueByPlan.reduce((sum, plan) => sum + plan.totalRevenue, 0),
            totalSales: revenueByPlan.reduce((sum, plan) => sum + plan.totalSales, 0),
            totalDiscount: revenueByPlan.reduce((sum, plan) => sum + plan.totalDiscount, 0),
          },
        }
        break

      default:
        return NextResponse.json({ message: "Invalid report type" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      reportType,
      dateRange: { startDate, endDate },
      data: reportData,
    })
  } catch (error: any) {
    console.error("Admin reports error:", error)
    return NextResponse.json({ message: error.message || "Failed to generate report" }, { status: 500 })
  }
}
