"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatPrice } from "@/lib/razorpay"
import { Calendar, CreditCard, CheckCircle, XCircle, Clock, Receipt, TrendingUp, Hash, Copy } from "lucide-react"
import { toast } from "sonner"

interface Payment {
  _id: string
  razorpayOrderId: string
  razorpayPaymentId?: string
  amount: number
  currency: string
  status: "created" | "pending" | "paid" | "failed" | "cancelled"
  planName: string
  planDuration: number
  createdAt: string
  paidAt?: string
  failureReason?: string
}

interface PaymentHistoryResponse {
  payments: Payment[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// Plan name mapping
const getPlanDisplayName = (planName: string): string => {
  switch (planName) {
    case "Zuper 15":
      return "Starter"
    case "Zuper 30":
      return "Most Popular"
    case "Zuper 360":
      return "Professional"
    default:
      return planName
  }
}

export function PaymentHistory() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  })

  const fetchPayments = async (pageNum = 1) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/payments/history?page=${pageNum}&limit=10&status=paid`)

      if (!response.ok) {
        throw new Error("Failed to fetch payment history")
      }

      const data: PaymentHistoryResponse = await response.json()
      // Filter to show only completed payments
      const completedPayments = data.payments.filter(payment => payment.status === "paid")
      setPayments(completedPayments)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayments(page)
  }, [page])

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  if (loading) {
    return (
      <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Receipt className="h-5 w-5" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 bg-white rounded-lg border">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[150px]" />
                </div>
                <Skeleton className="h-8 w-[100px]" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Receipt className="h-5 w-5" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => fetchPayments(page)} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <Receipt className="h-5 w-5" />
          Completed Payments
        </CardTitle>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-500 rounded-2xl flex items-center justify-center text-white mx-auto mb-4">
              <CreditCard className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Completed Payments</h3>
            <p className="text-gray-600">Your completed payment history will appear here once you make your first successful purchase.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div
                key={payment._id}
                className="p-6 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center text-white">
                      <CheckCircle className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{getPlanDisplayName(payment.planName)}</h4>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {new Date(payment.createdAt).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        {payment.paidAt && (
                          <span className="text-emerald-600 font-medium">
                            • Paid on{" "}
                            {new Date(payment.paidAt).toLocaleDateString("en-IN", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg text-gray-900">{formatPrice(payment.amount)}</div>
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 border mt-1">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Completed
                    </Badge>
                  </div>
                </div>

                {/* Transaction Details */}
                <div className="border-t pt-4 mt-4">
                  <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Transaction Details
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Order ID:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                            {payment.razorpayOrderId}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(payment.razorpayOrderId, "Order ID")}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      {payment.razorpayPaymentId && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Payment ID:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                              {payment.razorpayPaymentId}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(payment.razorpayPaymentId || "", "Payment ID")}
                              className="h-6 w-6 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Amount:</span>
                        <span className="font-medium">{formatPrice(payment.amount)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Currency:</span>
                        <span className="font-medium">{payment.currency}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-medium">{payment.planDuration} days</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {pagination.pages > 1 && (
              <div className="flex justify-center space-x-2 mt-8">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(page - 1)} 
                  disabled={page === 1}
                  className="hover:bg-gray-100"
                >
                  Previous
                </Button>
                <div className="flex items-center px-4 py-2 bg-white rounded-lg border">
                  <span className="text-sm text-gray-600">
                    Page {page} of {pagination.pages}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === pagination.pages}
                  className="hover:bg-gray-100"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
