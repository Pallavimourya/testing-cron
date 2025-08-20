"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  DollarSign, 
  Search, 
  Calendar, 
  User, 
  CreditCard, 
  Filter, 
  TrendingUp, 
  TrendingDown,
  Target,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart
} from "lucide-react"
import { formatPrice } from "@/lib/payment-engine"
import { useToast } from "@/hooks/use-toast"

interface PaymentOrder {
  id: string
  userId: string
  userName: string
  userEmail: string
  planName: string
  baseAmount: number
  discountApplied: number
  finalAmount: number
  couponCode?: string
  razorpayOrderId: string
  razorpayPaymentId?: string
  status: "created" | "paid" | "failed" | "cancelled"
  createdAt: string
  updatedAt: string
  currency: string
  planDuration: string
}

interface PaymentAnalytics {
  totalRevenue: number
  totalDiscounts: number
  totalPayments: number
  successfulPayments: number
  failedPayments: number
  pendingPayments: number
  successRate: number
  thisMonthRevenue: number
  lastMonthRevenue: number
  revenueGrowth: number
  thisMonthPayments: number
  lastMonthPayments: number
  planBreakdown: Array<{
    planName: string
    count: number
    revenue: number
    avgAmount: number
  }>
}

export default function PaymentsPage() {
  const [orders, setOrders] = useState<PaymentOrder[]>([])
  const [analytics, setAnalytics] = useState<PaymentAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const { toast } = useToast()

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/admin/payments")
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders)
        setAnalytics(data.analytics)
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error)
      toast({
        title: "Error",
        description: "Failed to fetch payment orders",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.planName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.razorpayOrderId.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || order.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      case "cancelled":
        return <Badge className="bg-gray-100 text-gray-800">Cancelled</Badge>
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Created</Badge>
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
      <div className="space-y-6 sm:space-y-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Payments Management</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Payments Management</h1>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-green-900">{formatCurrency(analytics?.totalRevenue || 0)}</div>
            <p className={`text-xs mt-1 ${getGrowthColor(analytics?.revenueGrowth || 0)}`}>
              {getGrowthIcon(analytics?.revenueGrowth || 0)}{Math.abs(analytics?.revenueGrowth || 0)}% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Total Orders</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-blue-900">{analytics?.totalPayments || 0}</div>
            <p className="text-xs text-blue-600 mt-1">{analytics?.successfulPayments || 0} successful</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Success Rate</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-purple-900">{analytics?.successRate || 0}%</div>
            <p className="text-xs text-purple-600 mt-1">{analytics?.failedPayments || 0} failed</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-orange-900">{formatCurrency(analytics?.thisMonthRevenue || 0)}</div>
            <p className="text-xs text-orange-600 mt-1">{analytics?.thisMonthPayments || 0} payments</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="lg:col-span-2 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900 text-lg">
              <BarChart3 className="h-5 w-5 mr-2" />
              Payment Performance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
                <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 mx-auto mb-2" />
                <div className="text-lg sm:text-xl font-bold text-green-800">{analytics?.successfulPayments || 0}</div>
                <div className="text-xs sm:text-sm text-green-600">Successful</div>
              </div>
              
              <div className="text-center p-3 sm:p-4 bg-red-50 rounded-lg">
                <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-red-600 mx-auto mb-2" />
                <div className="text-lg sm:text-xl font-bold text-red-800">{analytics?.failedPayments || 0}</div>
                <div className="text-xs sm:text-sm text-red-600">Failed</div>
              </div>
              
              <div className="text-center p-3 sm:p-4 bg-yellow-50 rounded-lg">
                <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600 mx-auto mb-2" />
                <div className="text-lg sm:text-xl font-bold text-yellow-800">{analytics?.pendingPayments || 0}</div>
                <div className="text-xs sm:text-sm text-yellow-600">Pending</div>
              </div>
              
              <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
                <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-lg sm:text-xl font-bold text-blue-800">{formatCurrency(analytics?.totalDiscounts || 0)}</div>
                <div className="text-xs sm:text-sm text-blue-600">Discounts Given</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plan Revenue Breakdown */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900 text-lg">
              <PieChart className="h-5 w-5 mr-2" />
              Plan Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics?.planBreakdown.map((plan, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-medium text-sm">{plan.planName}</div>
                    <Badge variant="outline" className="text-xs">{plan.count}</Badge>
                  </div>
                  <div className="text-base sm:text-lg font-bold text-green-600">{formatCurrency(plan.revenue)}</div>
                  <div className="text-xs text-gray-600">Avg: {formatCurrency(plan.avgAmount)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="created">Created</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No orders found</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {filteredOrders.map((order) => (
                <div key={order.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg hover:bg-gray-50 transition-colors gap-3 sm:gap-4">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm sm:text-base truncate">{order.userName}</p>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">{order.userEmail}</p>
                      <p className="text-xs text-gray-500 font-mono truncate">{order.razorpayOrderId}</p>
                    </div>
                  </div>

                  <div className="text-center sm:text-left">
                    <p className="font-medium text-sm sm:text-base">{order.planName}</p>
                    <p className="text-xs text-gray-600">{order.planDuration}</p>
                    {order.couponCode && <p className="text-xs text-green-600">Coupon: {order.couponCode}</p>}
                  </div>

                  <div className="text-center sm:text-right">
                    <div className="flex items-center justify-center sm:justify-end gap-2">
                      <div>
                        <p className="font-bold text-sm sm:text-base">{formatCurrency(order.finalAmount / 100)}</p>
                        {order.discountApplied > 0 && (
                          <p className="text-xs text-gray-500 line-through">{formatCurrency(order.baseAmount / 100)}</p>
                        )}
                      </div>
                      {getStatusBadge(order.status)}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
