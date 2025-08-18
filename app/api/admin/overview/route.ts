import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/auth"
import connectToDatabase from "@/lib/mongodb"
import User from "@/models/User"
import Payment from "@/models/Payment"
import GeneratedContent from "@/models/GeneratedContent"
import Admin from "@/models/Admin"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email || (session.user.role !== "admin" && session.user.role !== "super_admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()
    
    // Verify admin exists and is active
    const admin = await Admin.findOne({
      email: session.user.email,
      isActive: true,
    })

    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get current date and last month date
    const now = new Date()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1)

    // Total users
    const totalUsers = await User.countDocuments()
    const lastMonthUsers = await User.countDocuments({
      createdAt: { $lt: lastMonth },
    })
    const userGrowth = lastMonthUsers > 0 ? Math.round(((totalUsers - lastMonthUsers) / lastMonthUsers) * 100) : 0

    // Active subscriptions
    const activeSubscriptions = await User.countDocuments({
      subscriptionStatus: "active",
    })
    const lastMonthActiveSubscriptions = await User.countDocuments({
      subscriptionStatus: "active",
      subscriptionStartDate: { $lt: lastMonth },
    })
    const subscriptionGrowth =
      lastMonthActiveSubscriptions > 0
        ? Math.round(((activeSubscriptions - lastMonthActiveSubscriptions) / lastMonthActiveSubscriptions) * 100)
        : 0

    // Payment Analytics
    const totalPayments = await Payment.countDocuments({ status: "paid" })
    const totalRevenue = await Payment.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ])
    const totalRevenueAmount = totalRevenue[0]?.total || 0

    // This month payments
    const thisMonthPayments = await Payment.countDocuments({
      status: "paid",
      createdAt: { $gte: thisMonthStart }
    })
    const thisMonthRevenue = await Payment.aggregate([
      {
        $match: {
          status: "paid",
          createdAt: { $gte: thisMonthStart }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" }
        }
      }
    ])
    const thisMonthRevenueAmount = thisMonthRevenue[0]?.total || 0

    // Last month payments
    const lastMonthPayments = await Payment.countDocuments({
      status: "paid",
      createdAt: { $gte: lastMonthStart, $lt: lastMonthEnd }
    })
    const lastMonthRevenue = await Payment.aggregate([
      {
        $match: {
          status: "paid",
          createdAt: { $gte: lastMonthStart, $lt: lastMonthEnd }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" }
        }
      }
    ])
    const lastMonthRevenueAmount = lastMonthRevenue[0]?.total || 0

    // Revenue growth
    const revenueGrowth = lastMonthRevenueAmount > 0 
      ? Math.round(((thisMonthRevenueAmount - lastMonthRevenueAmount) / lastMonthRevenueAmount) * 100) 
      : 0

    // Payment success rate
    const totalPaymentAttempts = await Payment.countDocuments()
    const successfulPayments = await Payment.countDocuments({ status: "paid" })
    const failedPayments = await Payment.countDocuments({ status: "failed" })
    const paymentSuccessRate = totalPaymentAttempts > 0 
      ? Math.round((successfulPayments / totalPaymentAttempts) * 100) 
      : 0

    // Average order value
    const avgOrderValue = successfulPayments > 0 
      ? Math.round(totalRevenueAmount / successfulPayments) 
      : 0

    // Recent payments (last 7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const recentPayments = await Payment.countDocuments({
      status: "paid",
      createdAt: { $gte: sevenDaysAgo }
    })
    const recentRevenue = await Payment.aggregate([
      {
        $match: {
          status: "paid",
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" }
        }
      }
    ])
    const recentRevenueAmount = recentRevenue[0]?.total || 0

    // Plan-wise revenue breakdown
    const planRevenue = await Payment.aggregate([
      { $match: { status: "paid" } },
      {
        $group: {
          _id: "$planName",
          totalRevenue: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ])

    // Content generated
    const contentGenerated = await GeneratedContent.countDocuments()
    const lastMonthContent = await GeneratedContent.countDocuments({
      createdAt: { $lt: lastMonth },
    })
    const contentGrowth =
      lastMonthContent > 0 ? Math.round(((contentGenerated - lastMonthContent) / lastMonthContent) * 100) : 0

    return NextResponse.json({
      // Basic stats
      totalUsers,
      activeSubscriptions,
      contentGenerated,
      userGrowth,
      subscriptionGrowth,
      contentGrowth,

      // Revenue stats
      totalRevenue: Math.round(totalRevenueAmount / 100), // Convert from paise to rupees
      monthlyRevenue: Math.round(thisMonthRevenueAmount / 100),
      revenueGrowth,
      
      // Payment analytics
      totalPayments,
      thisMonthPayments,
      lastMonthPayments,
      paymentSuccessRate,
      avgOrderValue: Math.round(avgOrderValue / 100), // Convert from paise to rupees
      recentPayments,
      recentRevenue: Math.round(recentRevenueAmount / 100),
      
      // Plan breakdown
      planRevenue: planRevenue.map(plan => ({
        planName: plan._id,
        revenue: Math.round(plan.totalRevenue / 100),
        count: plan.count
      })),

      // Financial summary
      financialSummary: {
        totalRevenue: Math.round(totalRevenueAmount / 100),
        thisMonthRevenue: Math.round(thisMonthRevenueAmount / 100),
        lastMonthRevenue: Math.round(lastMonthRevenueAmount / 100),
        avgOrderValue: Math.round(avgOrderValue / 100),
        paymentSuccessRate,
        totalTransactions: totalPayments,
        failedTransactions: failedPayments
      }
    })
  } catch (error) {
    console.error("Admin overview error:", error)
    return NextResponse.json({ error: "Failed to fetch admin overview" }, { status: 500 })
  }
}
