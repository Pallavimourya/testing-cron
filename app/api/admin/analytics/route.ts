import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import Payment from "@/models/Payment"
import Plan from "@/models/Plan"
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
    const period = searchParams.get("period") || "30" // days
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - Number.parseInt(period))

    // User Analytics
    const totalUsers = await User.countDocuments()
    const newUsers = await User.countDocuments({ createdAt: { $gte: startDate } })
    const activeUsers = await User.countDocuments({
      lastActiveAt: { $gte: startDate },
      subscriptionStatus: "active",
    })
    const blockedUsers = await User.countDocuments({ blocked: true })

    // Subscription Analytics
    const activeSubscriptions = await User.countDocuments({ subscriptionStatus: "active" })
    const expiredSubscriptions = await User.countDocuments({ subscriptionStatus: "expired" })
    const cancelledSubscriptions = await User.countDocuments({ subscriptionStatus: "cancelled" })
    const freeUsers = await User.countDocuments({ subscriptionStatus: "free" })

    // Revenue Analytics
    const revenueData = await Payment.aggregate([
      {
        $match: {
          status: "paid",
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
          totalPayments: { $sum: 1 },
          averageOrderValue: { $avg: "$amount" },
        },
      },
    ])

    const revenue = revenueData[0] || { totalRevenue: 0, totalPayments: 0, averageOrderValue: 0 }

    // Payment Status Analytics
    const paymentsByStatus = await Payment.aggregate([
      {
        $match: { createdAt: { $gte: startDate } },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          amount: { $sum: "$amount" },
        },
      },
    ])

    // Plan Performance
    const planPerformance = await Payment.aggregate([
      {
        $match: {
          status: "paid",
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$planId",
          sales: { $sum: 1 },
          revenue: { $sum: "$amount" },
          planName: { $first: "$planName" },
        },
      },
      {
        $sort: { sales: -1 },
      },
    ])

    // Coupon Analytics
    const totalCoupons = await Coupon.countDocuments()
    const activeCoupons = await Coupon.countDocuments({
      isActive: true,
      validFrom: { $lte: new Date() },
      validUntil: { $gte: new Date() },
    })

    const couponUsage = await CouponUsage.aggregate([
      {
        $match: { createdAt: { $gte: startDate } },
      },
      {
        $lookup: {
          from: "coupons",
          localField: "couponId",
          foreignField: "_id",
          as: "coupon",
        },
      },
      {
        $unwind: "$coupon",
      },
      {
        $group: {
          _id: "$couponId",
          usageCount: { $sum: 1 },
          couponCode: { $first: "$coupon.code" },
          couponName: { $first: "$coupon.name" },
          totalDiscount: { $sum: "$discountAmount" },
        },
      },
      {
        $sort: { usageCount: -1 },
      },
    ])

    // Daily Analytics for Charts
    const dailyAnalytics = await Payment.aggregate([
      {
        $match: {
          status: "paid",
          createdAt: { $gte: startDate },
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
          payments: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 },
      },
    ])

    // User Registration Trend
    const userRegistrationTrend = await User.aggregate([
      {
        $match: { createdAt: { $gte: startDate } },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          newUsers: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 },
      },
    ])

    // Top Performing Plans
    const topPlans = await Plan.aggregate([
      {
        $lookup: {
          from: "payments",
          let: { planId: { $toString: "$_id" } },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$planId", "$$planId"] },
                status: "paid",
                createdAt: { $gte: startDate },
              },
            },
          ],
          as: "payments",
        },
      },
      {
        $addFields: {
          salesCount: { $size: "$payments" },
          totalRevenue: { $sum: "$payments.amount" },
        },
      },
      {
        $sort: { salesCount: -1 },
      },
      {
        $limit: 5,
      },
    ])

    // Calculate growth rates
    const previousPeriodStart = new Date(startDate)
    previousPeriodStart.setDate(previousPeriodStart.getDate() - Number.parseInt(period))

    const previousPeriodUsers = await User.countDocuments({
      createdAt: { $gte: previousPeriodStart, $lt: startDate },
    })
    const previousPeriodRevenue = await Payment.aggregate([
      {
        $match: {
          status: "paid",
          createdAt: { $gte: previousPeriodStart, $lt: startDate },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ])

    const prevRevenue = previousPeriodRevenue[0]?.total || 0
    const userGrowthRate = previousPeriodUsers > 0 ? ((newUsers - previousPeriodUsers) / previousPeriodUsers) * 100 : 0
    const revenueGrowthRate = prevRevenue > 0 ? ((revenue.totalRevenue - prevRevenue) / prevRevenue) * 100 : 0

    return NextResponse.json({
      success: true,
      analytics: {
        overview: {
          totalUsers,
          newUsers,
          activeUsers,
          blockedUsers,
          activeSubscriptions,
          expiredSubscriptions,
          cancelledSubscriptions,
          freeUsers,
          totalRevenue: revenue.totalRevenue,
          totalPayments: revenue.totalPayments,
          averageOrderValue: revenue.averageOrderValue,
          totalCoupons,
          activeCoupons,
          userGrowthRate: Math.round(userGrowthRate * 100) / 100,
          revenueGrowthRate: Math.round(revenueGrowthRate * 100) / 100,
        },
        paymentsByStatus,
        planPerformance,
        couponUsage,
        dailyAnalytics,
        userRegistrationTrend,
        topPlans,
      },
    })
  } catch (error: any) {
    console.error("Admin analytics error:", error)
    return NextResponse.json({ message: error.message || "Failed to fetch analytics" }, { status: 500 })
  }
}
