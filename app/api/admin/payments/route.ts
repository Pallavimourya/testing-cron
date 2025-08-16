import type { NextRequest } from "next/server"
import connectDB from "@/lib/mongodb"
import Payment from "@/models/Payment"
import User from "@/models/User"
import { withAdminAuth } from "@/lib/admin-middleware"

export async function GET(request: NextRequest) {
  return withAdminAuth(async () => {
    try {
      await connectDB()

      // Get all payments with user details
      const payments = await Payment.find()
        .sort({ createdAt: -1 })
        .lean()

      // Get user details for each payment
      const ordersWithUserDetails = await Promise.all(
        payments.map(async (payment: any) => {
          const user = await User.findById(payment.userId).select('name email').lean() as any
          return {
            id: payment._id.toString(),
            userId: payment.userId,
            userName: user?.name || 'Unknown User',
            userEmail: user?.email || 'unknown@email.com',
            planName: payment.planName,
            baseAmount: payment.originalAmount,
            discountApplied: payment.discountAmount,
            finalAmount: payment.amount,
            couponCode: payment.couponCode,
            razorpayOrderId: payment.razorpayOrderId,
            razorpayPaymentId: payment.razorpayPaymentId,
            status: payment.status,
            createdAt: payment.createdAt,
            updatedAt: payment.updatedAt,
            currency: payment.currency,
            planDuration: payment.planDuration,
          }
        })
      )

      // Calculate analytics
      const totalRevenue = payments
        .filter((p: any) => p.status === 'paid')
        .reduce((sum: number, p: any) => sum + p.amount, 0)

      const totalDiscounts = payments
        .filter((p: any) => p.status === 'paid')
        .reduce((sum: number, p: any) => sum + p.discountAmount, 0)

      const successfulPayments = payments.filter((p: any) => p.status === 'paid').length
      const failedPayments = payments.filter((p: any) => p.status === 'failed').length
      const pendingPayments = payments.filter((p: any) => p.status === 'created').length

      const successRate = payments.length > 0 
        ? Math.round((successfulPayments / payments.length) * 100) 
        : 0

      // Monthly breakdown
      const now = new Date()
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

      const thisMonthPayments = payments.filter((p: any) => 
        p.status === 'paid' && new Date(p.createdAt) >= thisMonth
      )
      const lastMonthPayments = payments.filter((p: any) => 
        p.status === 'paid' && 
        new Date(p.createdAt) >= lastMonth && 
        new Date(p.createdAt) < thisMonth
      )

      const thisMonthRevenue = thisMonthPayments.reduce((sum: number, p: any) => sum + p.amount, 0)
      const lastMonthRevenue = lastMonthPayments.reduce((sum: number, p: any) => sum + p.amount, 0)

      const revenueGrowth = lastMonthRevenue > 0 
        ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) 
        : 0

      // Plan-wise breakdown
      const planBreakdown: Record<string, { count: number; revenue: number; avgAmount: number }> = payments
        .filter((p: any) => p.status === 'paid')
        .reduce((acc: Record<string, { count: number; revenue: number; avgAmount: number }>, payment: any) => {
          const planName = payment.planName
          if (!acc[planName]) {
            acc[planName] = {
              count: 0,
              revenue: 0,
              avgAmount: 0
            }
          }
          acc[planName].count++
          acc[planName].revenue += payment.amount
          return acc
        }, {})

      // Calculate average amounts
      Object.keys(planBreakdown).forEach(planName => {
        planBreakdown[planName].avgAmount = Math.round(planBreakdown[planName].revenue / planBreakdown[planName].count)
      })

      return Response.json({
        orders: ordersWithUserDetails,
        analytics: {
          totalRevenue: Math.round(totalRevenue / 100), // Convert from paise to rupees
          totalDiscounts: Math.round(totalDiscounts / 100),
          totalPayments: payments.length,
          successfulPayments,
          failedPayments,
          pendingPayments,
          successRate,
          thisMonthRevenue: Math.round(thisMonthRevenue / 100),
          lastMonthRevenue: Math.round(lastMonthRevenue / 100),
          revenueGrowth,
          thisMonthPayments: thisMonthPayments.length,
          lastMonthPayments: lastMonthPayments.length,
          planBreakdown: Object.entries(planBreakdown).map(([planName, data]) => ({
            planName,
            count: data.count,
            revenue: Math.round(data.revenue / 100),
            avgAmount: Math.round(data.avgAmount / 100)
          }))
        }
      })
    } catch (error) {
      console.error("Get payments error:", error)
      return Response.json({ error: "Failed to fetch payments" }, { status: 500 })
    }
  })(request)
}
