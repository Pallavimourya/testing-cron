"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Users,
  CreditCard,
  DollarSign,
  FileText,
  TrendingUp,
  TrendingDown,
  Activity,
  CheckCircle,
  Clock,
  Database,
  BarChart3,
  Settings,
  Target,
  AlertCircle,
  Calendar,
  PieChart,
} from "lucide-react"

interface AdminStats {
  totalUsers: number
  activeSubscriptions: number
  contentGenerated: number
  userGrowth: number
  subscriptionGrowth: number
  contentGrowth: number
  
  // Revenue stats
  totalRevenue: number
  monthlyRevenue: number
  revenueGrowth: number
  
  // Payment analytics
  totalPayments: number
  thisMonthPayments: number
  lastMonthPayments: number
  paymentSuccessRate: number
  avgOrderValue: number
  recentPayments: number
  recentRevenue: number
  
  // Plan breakdown
  planRevenue: Array<{
    planName: string
    revenue: number
    count: number
  }>
  
  // Financial summary
  financialSummary: {
    totalRevenue: number
    thisMonthRevenue: number
    lastMonthRevenue: number
    avgOrderValue: number
    paymentSuccessRate: number
    totalTransactions: number
    failedTransactions: number
  }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/overview")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Failed to fetch admin stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? (
      <TrendingUp className="inline h-3 w-3 mr-1 text-green-600" />
    ) : (
      <TrendingDown className="inline h-3 w-3 mr-1 text-red-600" />
    )
  }

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? "text-green-600" : "text-red-600"
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Welcome back! Here&apos;s what&apos;s happening with LinkZup.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            Live Data
          </Badge>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-blue-900">{stats?.totalUsers || 0}</div>
            <p className={`text-xs mt-1 ${getGrowthColor(stats?.userGrowth || 0)}`}>
              {getGrowthIcon(stats?.userGrowth || 0)}{Math.abs(stats?.userGrowth || 0)}% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700">Active Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-emerald-900">{stats?.activeSubscriptions || 0}</div>
            <p className={`text-xs mt-1 ${getGrowthColor(stats?.subscriptionGrowth || 0)}`}>
              {getGrowthIcon(stats?.subscriptionGrowth || 0)}{Math.abs(stats?.subscriptionGrowth || 0)}% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-purple-900">{formatCurrency(stats?.monthlyRevenue || 0)}</div>
            <p className={`text-xs mt-1 ${getGrowthColor(stats?.revenueGrowth || 0)}`}>
              {getGrowthIcon(stats?.revenueGrowth || 0)}{Math.abs(stats?.revenueGrowth || 0)}% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Content Generated</CardTitle>
            <FileText className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-orange-900">{stats?.contentGenerated || 0}</div>
            <p className={`text-xs mt-1 ${getGrowthColor(stats?.contentGrowth || 0)}`}>
              {getGrowthIcon(stats?.contentGrowth || 0)}{Math.abs(stats?.contentGrowth || 0)}% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Financial Overview */}
        <Card className="lg:col-span-2 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900 text-lg">
              <DollarSign className="h-5 w-5 mr-2" />
              Financial Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-bold text-green-600">{formatCurrency(stats?.totalRevenue || 0)}</div>
                <div className="text-xs sm:text-sm text-gray-600">Total Revenue</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-bold text-blue-600">{formatCurrency(stats?.avgOrderValue || 0)}</div>
                <div className="text-xs sm:text-sm text-gray-600">Avg Order Value</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-bold text-purple-600">{stats?.paymentSuccessRate || 0}%</div>
                <div className="text-xs sm:text-sm text-gray-600">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-bold text-orange-600">{stats?.totalPayments || 0}</div>
                <div className="text-xs sm:text-sm text-gray-600">Total Transactions</div>
              </div>
            </div>
            
            <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs sm:text-sm text-green-600">This Month</div>
                    <div className="text-lg sm:text-xl font-bold text-green-800">{formatCurrency(stats?.monthlyRevenue || 0)}</div>
                    <div className="text-xs text-green-600">{stats?.thisMonthPayments || 0} payments</div>
                  </div>
                  <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                </div>
              </div>
              
              <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs sm:text-sm text-blue-600">Last 7 Days</div>
                    <div className="text-lg sm:text-xl font-bold text-blue-800">{formatCurrency(stats?.recentRevenue || 0)}</div>
                    <div className="text-xs text-blue-600">{stats?.recentPayments || 0} payments</div>
                  </div>
                  <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Performance */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900 text-lg">
              <BarChart3 className="h-5 w-5 mr-2" />
              Payment Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Successful</span>
              </div>
              <Badge className="bg-green-100 text-green-800">{stats?.totalPayments || 0}</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium">Failed</span>
              </div>
              <Badge className="bg-red-100 text-red-800">{stats?.financialSummary?.failedTransactions || 0}</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Success Rate</span>
              </div>
              <Badge className="bg-blue-100 text-blue-800">{stats?.paymentSuccessRate || 0}%</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plan Revenue Breakdown */}
      {stats?.planRevenue && stats.planRevenue.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900 text-lg">
              <PieChart className="h-5 w-5 mr-2" />
              Plan Revenue Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {stats.planRevenue.map((plan, index) => (
                <div key={index} className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-gray-900 text-sm sm:text-base">{plan.planName}</div>
                    <Badge variant="outline" className="text-xs">{plan.count} sales</Badge>
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-green-600">{formatCurrency(plan.revenue)}</div>
                  <div className="text-xs text-gray-600">
                    {plan.count > 0 ? Math.round(plan.revenue / plan.count) : 0} avg per sale
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Status and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* System Status */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900 text-lg">
              <Activity className="h-5 w-5 mr-2" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between p-3 sm:p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 sm:gap-3">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                <span className="font-medium text-green-900 text-sm sm:text-base">Payment Gateway</span>
              </div>
              <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">Active</Badge>
            </div>

            <div className="flex items-center justify-between p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 sm:gap-3">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                <span className="font-medium text-blue-900 text-sm sm:text-base">Auto Posting</span>
              </div>
              <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">Running</Badge>
            </div>

            <div className="flex items-center justify-between p-3 sm:p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 sm:gap-3">
                <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                <span className="font-medium text-green-900 text-sm sm:text-base">Content Generation</span>
              </div>
              <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">Operational</Badge>
            </div>

            <div className="flex items-center justify-between p-3 sm:p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 sm:gap-3">
                <Database className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                <span className="font-medium text-green-900 text-sm sm:text-base">Database</span>
              </div>
              <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">Connected</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900 text-lg">
              <Activity className="h-5 w-5 mr-2" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <Button
              className="w-full justify-start bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
              variant="outline"
              onClick={() => (window.location.href = "/admin/users")}
            >
              <Users className="h-4 w-4 mr-2 sm:mr-3" />
              <div className="text-left">
                <div className="font-medium text-sm sm:text-base">View All Users</div>
                <div className="text-xs text-blue-600">Manage user accounts and subscriptions</div>
              </div>
            </Button>

            <Button
              className="w-full justify-start bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
              variant="outline"
              onClick={() => (window.location.href = "/admin/payments")}
            >
              <BarChart3 className="h-4 w-4 mr-2 sm:mr-3" />
              <div className="text-left">
                <div className="font-medium text-sm sm:text-base">Payment Analytics</div>
                <div className="text-xs text-emerald-600">View detailed revenue and payment insights</div>
              </div>
            </Button>

            <Button
              className="w-full justify-start bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100"
              variant="outline"
              onClick={() => (window.location.href = "/admin/settings")}
            >
              <Settings className="h-4 w-4 mr-2 sm:mr-3" />
              <div className="text-left">
                <div className="font-medium text-sm sm:text-base">System Settings</div>
                <div className="text-xs text-purple-600">Configure platform settings</div>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
