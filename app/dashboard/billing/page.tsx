import type { PlanType } from "@/lib/razorpay"
"use client"

import React from "react"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PaymentHistory } from "@/components/payment-history"
import { PaymentModal } from "@/components/payment-modal"
import {
  CreditCard,
  Crown,
  Star,
  Zap,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  RefreshCw,
  TrendingUp,
  Shield,
  Sparkles,
  ArrowRight,
  Check,
  X,
  Info,
  CalendarDays,
  Target,
  FileText,
  Eye,
} from "lucide-react"
import { format, addDays, differenceInDays } from "date-fns"
import { toast } from "sonner"

interface UserSubscription {
  subscriptionStatus: string
  subscriptionPlan: string
  subscriptionExpiry: string
  contentGenerated?: number
  imagesGenerated?: number
  razorpayCustomerId?: string
  razorpaySubscriptionId?: string
  subscriptionStartDate?: string
  autoRenew?: boolean
}

interface PaymentStatus {
  orderId?: string
  status: "pending" | "processing" | "completed" | "failed" | "none"
  amount?: number
  planName?: string
  timestamp?: string
  error?: string
}

interface Plan {
  id: string
  _id?: string
  name: string
  slug: string
  description: string
  price: number
  originalPrice?: number
  durationDays: number
  features: string[]
  imageLimit: number
  contentLimit: number
  badge?: string
  color?: string
  icon?: string
  isActive: boolean
}

const iconMap = {
  Star: Star,
  Zap: Zap,
  Crown: Crown,
}

export default function BillingPage() {
  const { data: session } = useSession()
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({ status: "none" })
  const [isPolling, setIsPolling] = useState(false)
  const [pollingAttempts, setPollingAttempts] = useState(0)
  const [selectedPlan, setSelectedPlan] = useState<{
    type: string
    details: Plan
  } | null>(null)

  useEffect(() => {
    fetchUserSubscription()
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const response = await fetch("/api/plans/active")
      if (response.ok) {
        const data = await response.json()
        setPlans(data.plans || [])
      }
    } catch (error) {
      console.error("Failed to fetch plans:", error)
      toast.error("Failed to fetch plans")
    }
  }

  const fetchUserSubscription = async () => {
    try {
      const response = await fetch("/api/subscription/check")
      if (response.ok) {
        const data = await response.json()
        setUserSubscription({
          subscriptionStatus: data.subscription.status || "free",
          subscriptionPlan: data.subscription.plan || "free",
          subscriptionExpiry: data.subscription.endDate,
          contentGenerated: data.usage?.contentGenerated || 0,
          imagesGenerated: data.usage?.imagesGenerated || 0,
          razorpayCustomerId: data.subscription.razorpayCustomerId,
          razorpaySubscriptionId: data.subscription.razorpaySubscriptionId,
          subscriptionStartDate: data.subscription.startDate,
          autoRenew: data.subscription.autoRenew || false,
        })
      }
    } catch (error) {
      console.error("Failed to fetch user subscription:", error)
    } finally {
      setLoading(false)
    }
  }

  // Real-time payment status polling with retry limit
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (paymentStatus.status === "pending" || paymentStatus.status === "processing") {
      if (pollingAttempts < 20) {
        // Max 20 attempts (60 seconds)
        setIsPolling(true)
        interval = setInterval(() => {
          checkPaymentStatus()
        }, 3000) // Check every 3 seconds
      } else {
        // Stop polling after max attempts
        setPaymentStatus({ status: "failed", error: "Payment verification timeout" })
        setIsPolling(false)
        toast.error("Payment verification timeout. Please check your payment status manually.")
      }
    } else {
      setIsPolling(false)
      setPollingAttempts(0)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [paymentStatus.status, pollingAttempts])

  const checkPaymentStatus = async () => {
    if (!paymentStatus.orderId) return

    try {
      setPollingAttempts((prev) => prev + 1)
      const response = await fetch(`/api/payments/status/${paymentStatus.orderId}`)

      if (response.ok) {
        const data = await response.json()

        if (data.status === "paid" || data.status === "completed") {
          setPaymentStatus({ status: "completed" })
          toast.success("Payment completed successfully!")
          fetchUserSubscription() // Refresh subscription data
          setIsPolling(false)
          setPollingAttempts(0)
        } else if (data.status === "failed" || data.status === "cancelled") {
          setPaymentStatus({ status: "failed", error: data.error || "Payment failed" })
          toast.error("Payment failed. Please try again.")
          setIsPolling(false)
          setPollingAttempts(0)
        } else {
          setPaymentStatus((prev) => ({ ...prev, status: data.status }))
        }
      } else if (response.status === 404) {
        // Payment record not found, might be still processing
        console.log("Payment record not found, continuing to poll...")
      } else {
        console.error("Payment status check failed:", response.status)
      }
    } catch (error) {
      console.error("Failed to check payment status:", error)
    }
  }

  const handlePaymentStart = (planSlug: string) => {
    const plan = plans.find((p) => p.slug === planSlug)
    if (!plan) return

    setPaymentStatus({
      status: "pending",
      planName: plan.name,
      amount: plan.price,
      timestamp: new Date().toISOString(),
    })
    setPollingAttempts(0)
  }

  const handlePaymentComplete = (orderId: string) => {
    setPaymentStatus((prev) => ({
      ...prev,
      orderId,
      status: "processing",
    }))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-100 text-emerald-800 border-emerald-200"
      case "cancelled":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "expired":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4" />
      case "cancelled":
        return <Clock className="h-4 w-4" />
      case "expired":
        return <X className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const getPaymentStatusColor = (status: PaymentStatus["status"]) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "processing":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "completed":
        return "bg-emerald-100 text-emerald-800 border-emerald-200"
      case "failed":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPaymentStatusIcon = (status: PaymentStatus["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />
      case "processing":
        return <Loader2 className="h-4 w-4 animate-spin" />
      case "completed":
        return <CheckCircle className="h-4 w-4" />
      case "failed":
        return <X className="h-4 w-4" />
      default:
        return <CreditCard className="h-4 w-4" />
    }
  }

  const isExpiringSoon = (expiryDate: string) => {
    if (!expiryDate) return false
    const expiry = new Date(expiryDate)
    const warning = addDays(new Date(), 7) // 7 days warning
    return expiry <= warning
  }

  const getDaysUntilRenewal = (expiryDate: string) => {
    if (!expiryDate) return null
    const expiry = new Date(expiryDate)
    const today = new Date()
    return differenceInDays(expiry, today)
  }

  // Map database plan slugs to PlanType enum
  const mapSlugToPlanType = (slug: string): PlanType => {
    const slugLower = slug.toLowerCase()
    if (slugLower.includes('starter') || slugLower.includes('basic')) return 'starter'
    if (slugLower.includes('professional') || slugLower.includes('pro')) return 'professional'
    if (slugLower.includes('enterprise') || slugLower.includes('premium')) return 'enterprise'
    // Default fallback
    return 'starter'
  }

  const handleUpgrade = (planSlug: string) => {
    const plan = plans.find((p) => p.slug === planSlug)
    if (!plan) return

    const planType = mapSlugToPlanType(planSlug)
    
    setSelectedPlan({
      type: planType,
      details: plan,
    })
    handlePaymentStart(planSlug)
  }

  const getContentLimitText = (plan: Plan) => {
    return plan.contentLimit === -1 ? "Unlimited" : `${plan.contentLimit}`
  }

  const getRemainingContent = (plan: Plan, used: number) => {
    if (plan.contentLimit === -1) return "Unlimited"
    const remaining = plan.contentLimit - used
    return Math.max(0, remaining)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading your billing information...</p>
        </div>
      </div>
    )
  }

  const currentPlan = plans.find((p) => p.slug === userSubscription?.subscriptionPlan)

  // Create a fallback plan object for active subscriptions that don't match available plans
  const fallbackPlan = userSubscription?.subscriptionStatus === "active" && userSubscription?.subscriptionPlan && !currentPlan ? {
    id: "fallback",
    name: userSubscription.subscriptionPlan,
    slug: userSubscription.subscriptionPlan,
    description: "Your current subscription plan",
    price: 0, // We don't know the price for fallback plans
    durationDays: 30, // Default duration
    features: ["Active subscription features"],
    imageLimit: 10, // Default limits
    contentLimit: 50,
    badge: "Active",
    color: "from-green-500 to-green-600",
    icon: "Star",
    isActive: true
  } : null

  // Use currentPlan or fallbackPlan
  const displayPlan = currentPlan || fallbackPlan

  // Debug logging (uncomment for debugging)
  // console.log("🔍 Subscription Debug:", {
  //   userSubscription: userSubscription,
  //   subscriptionPlan: userSubscription?.subscriptionPlan,
  //   availablePlans: plans.map(p => ({ slug: p.slug, name: p.name })),
  //   currentPlan: currentPlan,
  //   fallbackPlan: fallbackPlan,
  //   displayPlan: displayPlan,
  //   isActiveSubscription: userSubscription?.subscriptionStatus === "active"
  // })

  const getDisplayPlanName = () => {
    if (currentPlan) {
      return currentPlan.name
    } else if (userSubscription?.subscriptionStatus === "active" && userSubscription?.subscriptionPlan) {
      return userSubscription.subscriptionPlan
    } else {
      return "Free"
    }
  }

  const daysUntilRenewal = userSubscription?.subscriptionExpiry
    ? getDaysUntilRenewal(userSubscription.subscriptionExpiry)
    : null

  const isActiveSubscription = userSubscription?.subscriptionStatus === "active"

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
          <p className="text-gray-600 mt-2">Manage your subscription and billing details</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchUserSubscription}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Real-time Payment Status */}
      {(paymentStatus.status === "pending" || paymentStatus.status === "processing") && (
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-900">
              <RefreshCw className={`h-5 w-5 mr-2 ${isPolling ? "animate-spin" : ""}`} />
              Payment in Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge className={`${getPaymentStatusColor(paymentStatus.status)} border`}>
                  {getPaymentStatusIcon(paymentStatus.status)}
                  <span className="ml-1 capitalize">
                    {paymentStatus.status === "pending" ? "Initializing..." : "Processing Payment..."}
                  </span>
                </Badge>
                {paymentStatus.planName && (
                  <span className="text-blue-700 font-medium">
                    {paymentStatus.planName} Plan - ₹{paymentStatus.amount}
                  </span>
                )}
              </div>
              {paymentStatus.timestamp && (
                <div className="text-sm text-blue-600">
                  Started at {format(new Date(paymentStatus.timestamp), "HH:mm:ss")}
                </div>
              )}
            </div>
            {paymentStatus.status === "processing" && (
              <div className="mt-3 text-sm text-blue-700">
                Please complete the payment in the popup window. This may take a few moments...
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payment Failed Status */}
      {paymentStatus.status === "failed" && (
        <Card className="border-red-200 bg-gradient-to-r from-red-50 to-pink-50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-red-900">
              <AlertCircle className="h-5 w-5 mr-2" />
              Payment Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge className={`${getPaymentStatusColor(paymentStatus.status)} border`}>
                  {getPaymentStatusIcon(paymentStatus.status)}
                  <span className="ml-1">Payment Failed</span>
                </Badge>
                {paymentStatus.error && <span className="text-red-700 text-sm">{paymentStatus.error}</span>}
              </div>
              <Button size="sm" variant="outline" onClick={() => setPaymentStatus({ status: "none" })}>
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current User's Subscription Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Current Plan Status */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Current Plan</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{getDisplayPlanName()}</div>
            <p className="text-xs text-blue-600 mt-1">{isActiveSubscription ? "Active" : "Inactive"}</p>
            <div className="mt-2">
              <Badge className={`${getStatusColor(userSubscription?.subscriptionStatus || "free")} border text-xs`}>
                {getStatusIcon(userSubscription?.subscriptionStatus || "free")}
                <span className="ml-1">
                  {(userSubscription?.subscriptionStatus?.charAt(0)?.toUpperCase() || "") +
                    (userSubscription?.subscriptionStatus?.slice(1) || "") || "Free"}
                </span>
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Content Generated */}
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700">Content Generated</CardTitle>
            <FileText className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-900">{userSubscription?.contentGenerated || 0}</div>
            <p className="text-xs text-emerald-600 mt-1">
              {displayPlan
                ? `${getRemainingContent(displayPlan, userSubscription?.contentGenerated || 0)} remaining`
                : "No limit"}
            </p>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-3 w-3 text-emerald-600 mr-1" />
              <span className="text-xs text-emerald-600">AI-powered content</span>
            </div>
          </CardContent>
        </Card>

        {/* Images Generated */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Images Generated</CardTitle>
            <Sparkles className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{userSubscription?.imagesGenerated || 0}</div>
            <p className="text-xs text-purple-600 mt-1">
              {displayPlan
                ? `${displayPlan.imageLimit - (userSubscription?.imagesGenerated || 0)} remaining`
                : "No limit"}
            </p>
            <div className="flex items-center mt-2">
              <CheckCircle className="h-3 w-3 text-purple-600 mr-1" />
              <span className="text-xs text-purple-600">AI-generated images</span>
            </div>
          </CardContent>
        </Card>

        {/* Next Billing */}
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Next Billing</CardTitle>
            <CalendarDays className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">
              {daysUntilRenewal !== null && daysUntilRenewal > 0 ? `${daysUntilRenewal}d` : "N/A"}
            </div>
            <p className="text-xs text-orange-600 mt-1">
              {userSubscription?.subscriptionExpiry
                ? format(new Date(userSubscription.subscriptionExpiry), "MMM dd, yyyy")
                : "No active plan"}
            </p>
            {isExpiringSoon(userSubscription?.subscriptionExpiry || "") && (
              <div className="flex items-center mt-2">
                <AlertCircle className="h-3 w-3 text-orange-600 mr-1" />
                <span className="text-xs text-orange-600">Expiring soon</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Current Subscription Details */}
        <div className="xl:col-span-2">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900">
                <Target className="h-5 w-5 mr-2" />
                Your Subscription Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-6 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-6">
                  <div
                    className={`w-16 h-16 bg-gradient-to-br ${displayPlan?.color || "from-gray-500 to-gray-600"} rounded-2xl flex items-center justify-center text-white shadow-lg`}
                  >
                    {displayPlan?.icon && iconMap[displayPlan.icon as keyof typeof iconMap] ? (
                      React.createElement(iconMap[displayPlan.icon as keyof typeof iconMap], { className: "h-8 w-8" })
                    ) : (
                      <Star className="h-8 w-8" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-gray-900">{getDisplayPlanName()} Plan</h3>
                    <p className="text-gray-600 mt-1">
                      {isActiveSubscription ? "Active subscription" : "No active subscription"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">₹{displayPlan?.price || "0"}</div>
                  <div className="text-sm text-gray-600">per {displayPlan?.durationDays || "30"} days</div>
                </div>
              </div>

              {/* Plan Limits */}
              {displayPlan && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-white border rounded-xl shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <Sparkles className="h-5 w-5 text-purple-500" />
                      <span className="text-sm font-semibold text-gray-700">Image Generations</span>
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                      {userSubscription?.imagesGenerated || 0} / {displayPlan.imageLimit}
                    </div>
                    <div className="text-sm text-gray-600 mt-2">
                      {displayPlan.imageLimit - (userSubscription?.imagesGenerated || 0)} remaining
                    </div>
                  </div>

                  <div className="p-6 bg-white border rounded-xl shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <FileText className="h-5 w-5 text-emerald-500" />
                      <span className="text-sm font-semibold text-gray-700">Content Generations</span>
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                      {userSubscription?.contentGenerated || 0} / {getContentLimitText(displayPlan)}
                    </div>
                    <div className="text-sm text-gray-600 mt-2">
                      {getRemainingContent(displayPlan, userSubscription?.contentGenerated || 0)} remaining
                    </div>
                  </div>
                </div>
              )}

              {/* Plan Features */}
              {displayPlan && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4 text-lg">Your Plan Features</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {displayPlan.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border">
                        <Check className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Free Plan Message */}
              {!displayPlan && (
                <div className="text-center py-8">
                  <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">Free Plan</h3>
                  <p className="text-gray-500 mb-4">
                    You&apos;re currently on the free plan. Upgrade to access premium features.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment History */}
          <PaymentHistory />
        </div>

        {/* Available Plans Sidebar */}
        <div className="space-y-6">
          {/* Available Plans */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-gray-900">Available Plans</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {plans.map((plan) => {
                const IconComponent =
                  plan.icon && iconMap[plan.icon as keyof typeof iconMap]
                    ? iconMap[plan.icon as keyof typeof iconMap]
                    : Star

                return (
                  <div
                    key={plan._id || plan.slug}
                    className={`p-6 rounded-xl border-2 transition-all hover:shadow-lg ${
                      userSubscription?.subscriptionPlan === plan.slug
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 bg-gradient-to-br ${plan.color} rounded-lg flex items-center justify-center text-white`}
                        >
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                          <p className="text-sm text-gray-600">{plan.durationDays} days</p>
                        </div>
                      </div>
                      {plan.badge && (
                        <Badge variant={plan.badge === "Most Popular" ? "default" : "secondary"} className="text-xs">
                          {plan.badge}
                        </Badge>
                      )}
                    </div>

                    <div className="mb-4">
                      <div className="text-2xl font-bold text-gray-900">₹{plan.price}</div>
                      <p className="text-sm text-gray-600">per {plan.durationDays} days</p>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Image Generations:</span>
                        <span className="font-medium">{plan.imageLimit}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Content Posts:</span>
                        <span className="font-medium">
                          {plan.contentLimit === -1 ? "Unlimited" : plan.contentLimit}
                        </span>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleUpgrade(plan.slug)}
                      className={`w-full ${
                        userSubscription?.subscriptionPlan === plan.slug
                          ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                          : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                      }`}
                      disabled={userSubscription?.subscriptionPlan === plan.slug}
                    >
                      {userSubscription?.subscriptionPlan === plan.slug ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Current Plan
                        </>
                      ) : (
                        <>
                          <ArrowRight className="h-4 w-4 mr-2" />
                          Choose Plan
                        </>
                      )}
                    </Button>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-gray-900">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full bg-transparent">
                <FileText className="h-4 w-4 mr-2" />
                Download Invoice
              </Button>
              <Button variant="outline" className="w-full bg-transparent">
                <Eye className="h-4 w-4 mr-2" />
                View Billing History
              </Button>
              <Button variant="outline" className="w-full bg-transparent">
                <Shield className="h-4 w-4 mr-2" />
                Payment Methods
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payment Modal */}
      {selectedPlan && (
        <PaymentModal
          isOpen={!!selectedPlan}
          onClose={() => setSelectedPlan(null)}
          plan={selectedPlan.details}
          onPaymentStart={handlePaymentStart}
          onPaymentComplete={handlePaymentComplete}
        />
      )}
    </div>
  )
}
