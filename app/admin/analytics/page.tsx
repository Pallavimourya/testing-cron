"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, TrendingUp, Users, DollarSign, CreditCard, Tag, Calendar, Download } from "lucide-react"

interface AnalyticsData {
  overview: {
    totalUsers: number
    newUsers: number
    activeUsers: number
    activeSubscriptions: number
    totalRevenue: number
    totalPayments: number
    averageOrderValue: number
    totalCoupons: number
    activeCoupons: number
    userGrowthRate: number
    revenueGrowthRate: number
  }
  paymentsByStatus: Array<{
    _id: string
    count: number
    amount: number
  }>
  planPerformance: Array<{
    _id: string
    planName: string
    sales: number
    revenue: number
  }>
  couponUsage: Array<{
    _id: string
    couponCode: string
    couponName: string
    usageCount: number
    totalDiscount: number
  }>
  dailyAnalytics: Array<{
    _id: { year: number; month: number; day: number }
    revenue: number
    payments: number
  }>
  userRegistrationTrend: Array<{
    _id: { year: number; month: number; day: number }
    newUsers: number
  }>
}

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState("30")

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/analytics?period=${period}`)
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data.analytics)
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  const exportReport = async () => {
    try {
      const response = await fetch(`/api/admin/reports?type=revenue&period=${period}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `analytics-report-${period}days.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Failed to export report:", error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-600 mt-2">Comprehensive insights into your platform performance</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportReport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{analytics?.overview.totalUsers || 0}</div>
            <div className="flex items-center text-xs text-blue-600 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              {analytics?.overview.userGrowthRate || 0}% growth
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-900">
              ₹{Math.round((analytics?.overview.totalRevenue || 0) / 100).toLocaleString("en-IN")}
            </div>
            <div className="flex items-center text-xs text-emerald-600 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              {analytics?.overview.revenueGrowthRate || 0}% growth
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Active Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{analytics?.overview.activeSubscriptions || 0}</div>
            <div className="text-xs text-purple-600 mt-1">
              Avg: ₹{Math.round((analytics?.overview.averageOrderValue || 0) / 100)} per order
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Active Coupons</CardTitle>
            <Tag className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{analytics?.overview.activeCoupons || 0}</div>
            <div className="text-xs text-orange-600 mt-1">Total: {analytics?.overview.totalCoupons || 0} coupons</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Plan Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Plan Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.planPerformance.map((plan, index) => (
                <div key={plan._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">{plan.planName}</div>
                    <div className="text-sm text-gray-600">{plan.sales} sales</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">₹{Math.round(plan.revenue / 100).toLocaleString("en-IN")}</div>
                    <Badge variant="outline" className="text-xs">
                      #{index + 1}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Payment Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.paymentsByStatus.map((status) => (
                <div key={status._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        status._id === "paid" ? "default" : status._id === "failed" ? "destructive" : "secondary"
                      }
                    >
                      {status._id}
                    </Badge>
                    <span className="font-medium capitalize">{status._id} Payments</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{status.count}</div>
                    <div className="text-sm text-gray-600">
                      ₹{Math.round(status.amount / 100).toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Coupons */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Tag className="h-5 w-5 mr-2" />
              Top Performing Coupons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.couponUsage.slice(0, 5).map((coupon) => (
                <div key={coupon._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">{coupon.couponCode}</div>
                    <div className="text-sm text-gray-600">{coupon.couponName}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{coupon.usageCount} uses</div>
                    <div className="text-sm text-gray-600">
                      ₹{Math.round(coupon.totalDiscount / 100).toLocaleString("en-IN")} saved
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Daily Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics?.dailyAnalytics.slice(-7).map((day) => (
                <div
                  key={`${day._id.year}-${day._id.month}-${day._id.day}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="text-sm font-medium">
                    {day._id.day}/{day._id.month}/{day._id.year}
                  </div>
                  <div className="text-right">
                    <div className="font-bold">₹{Math.round(day.revenue / 100).toLocaleString("en-IN")}</div>
                    <div className="text-xs text-gray-600">{day.payments} payments</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
