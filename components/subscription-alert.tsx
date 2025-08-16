"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Crown, Star, Zap, AlertCircle, CheckCircle, ArrowRight, Lock, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface Plan {
  id: string
  name: string
  price: number
  duration: string
  imageLimit: number
  features: string[]
}

interface SubscriptionAlertProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  message?: string
  availablePlans?: Plan[]
  currentPlan?: {
    name: string
    status: string
    expiry: string
  }
  billingUrl?: string
}

const plans = {
  zuper15: {
    name: "Zuper 15",
    price: "₹9",
    originalPrice: "₹9",
    icon: <Star className="h-6 w-6" />,
    color: "from-blue-500 to-blue-600",
    badge: "Starter",
    duration: "15 days",
    imageLimit: 7,
    features: [
      "Profile Optimization",
      "Basic Content Strategy",
      "Weekly Post Creation (2 posts)",
      "7 AI Image Generations",
      "Engagement Monitoring",
      "Basic Analytics Report",
      "Email Support",
    ],
  },
  zuper30: {
    name: "Zuper 30",
    price: "₹799",
    originalPrice: "₹799",
    icon: <Zap className="h-6 w-6" />,
    color: "from-purple-500 to-purple-600",
    badge: "Most Popular",
    duration: "30 days",
    imageLimit: 15,
    features: [
      "Everything in Zuper 15",
      "Advanced Profile Optimization",
      "Weekly Post Creation (4 posts)",
      "15 AI Image Generations",
      "Network Growth Strategy",
      "Engagement Management",
      "Detailed Analytics Report",
      "Priority Email Support",
      "Monthly Strategy Call",
    ],
  },
  zuper360: {
    name: "Zuper 360",
    price: "₹5,999",
    originalPrice: "₹5,999",
    icon: <Crown className="h-6 w-6" />,
    color: "from-orange-500 to-orange-600",
    badge: "Premium",
    duration: "360 days",
    imageLimit: 300,
    features: [
      "Everything in Zuper 30",
      "Premium Profile Optimization",
      "Weekly Post Creation (6 posts)",
      "300 AI Image Generations",
      "Advanced Network Growth",
      "Thought Leadership Strategy",
      "Competitor Analysis",
      "Custom Analytics Dashboard",
      "24/7 Priority Support",
      "Weekly Strategy Calls",
      "Content Calendar Management",
      "Annual Strategy Planning",
      "Priority Onboarding",
    ],
  },
}

export default function SubscriptionAlert({
  isOpen,
  onClose,
  title = "Subscription Required",
  message = "You need an active subscription to access this feature.",
  availablePlans = [],
  currentPlan,
  billingUrl = "/dashboard/billing"
}: SubscriptionAlertProps) {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  if (!isOpen) return null

  const handleUpgrade = async (planType: "zuper15" | "zuper30" | "zuper360") => {
    try {
      setIsProcessing(true)
      setSelectedPlan(planType)

      // Create payment order
      const response = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planType }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create payment order")
      }

      const data = await response.json()

      // Initialize Razorpay payment
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "LinkZup",
        description: `${plans[planType].name} Plan`,
        order_id: data.orderId,
        handler: async function (response: any) {
          try {
            // Verify payment
            const verifyResponse = await fetch("/api/payments/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                orderId: data.orderId,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                planId: planType,
              }),
            })

            if (verifyResponse.ok) {
              toast.success("Payment successful! Your subscription has been activated.")
              onClose()
              router.push(billingUrl)
            } else {
              throw new Error("Payment verification failed")
            }
          } catch (error) {
            console.error("Payment verification error:", error)
            toast.error("Payment verification failed. Please contact support.")
          }
        },
        prefill: {
          name: "User",
          email: "user@example.com",
        },
        theme: {
          color: "#3B82F6",
        },
      }

      const razorpay = new (window as any).Razorpay(options)
      razorpay.open()
    } catch (error) {
      console.error("Payment error:", error)
      toast.error("Failed to initiate payment. Please try again.")
    } finally {
      setIsProcessing(false)
      setSelectedPlan(null)
    }
  }

  const handleBillingRedirect = () => {
    router.push(billingUrl)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full">
              <Lock className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">{title}</CardTitle>
          <p className="text-gray-600 mt-2">{message}</p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Current Plan Status */}
          {currentPlan && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong>Current Plan:</strong> {currentPlan.name} ({currentPlan.status})
                {currentPlan.expiry && (
                  <span className="block text-sm mt-1">
                    Expires: {new Date(currentPlan.expiry).toLocaleDateString()}
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Available Plans */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              Choose Your Plan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(plans).map(([key, plan]) => (
                <div
                  key={key}
                  className={`relative p-6 rounded-xl border-2 transition-all hover:shadow-lg ${
                    plan.badge === "Most Popular"
                      ? "border-purple-300 bg-gradient-to-br from-purple-50 to-indigo-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  {plan.badge === "Most Popular" && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white">
                      Most Popular
                    </Badge>
                  )}
                  
                  <div className="text-center mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${plan.color} rounded-xl flex items-center justify-center text-white mx-auto mb-3`}>
                      {plan.icon}
                    </div>
                    <h4 className="text-xl font-bold text-gray-900">{plan.name}</h4>
                    <div className="text-3xl font-bold text-gray-900 mt-2">{plan.price}</div>
                    <div className="text-sm text-gray-600">{plan.duration}</div>
                  </div>

                  <div className="space-y-3 mb-6">
                    {plan.features.slice(0, 5).map((feature, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                    {plan.features.length > 5 && (
                      <div className="text-sm text-gray-500 text-center">
                        +{plan.features.length - 5} more features
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={() => handleUpgrade(key as "zuper15" | "zuper30" | "zuper360")}
                    disabled={isProcessing && selectedPlan === key}
                    className={`w-full ${
                      plan.badge === "Most Popular"
                        ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                        : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                    } text-white`}
                  >
                    {isProcessing && selectedPlan === key ? (
                      <>
                        <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Choose Plan
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleBillingRedirect}
              className="flex-1"
            >
              <Crown className="h-4 w-4 mr-2" />
              View Billing Dashboard
            </Button>
            <Button
              variant="ghost"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
