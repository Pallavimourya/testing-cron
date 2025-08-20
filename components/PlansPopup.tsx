"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Check, Star, Zap, Crown, Loader2, CreditCard, X } from "lucide-react"
import { toast } from "sonner"
import { PLANS, formatPrice, type PlanType } from "@/lib/razorpay"

declare global {
  interface Window {
    Razorpay: any
  }
}

const plans = [
  {
    id: "zuper15" as PlanType,
    name: "Zuper 15",
    description: "Perfect for individuals starting their LinkedIn journey",
    icon: <Star className="h-5 w-5" />,
    popular: false,
    gradient: "from-blue-500 to-indigo-500",
  },
  {
    id: "zuper30" as PlanType,
    name: "Zuper 30",
    description: "Ideal for professionals looking to grow their network",
    icon: <Zap className="h-5 w-5" />,
    popular: true,
    gradient: "from-purple-500 to-pink-500",
  },
  {
    id: "zuper360" as PlanType,
    name: "Zuper 360",
    description: "For businesses and executives seeking maximum impact",
    icon: <Crown className="h-5 w-5" />,
    popular: false,
    gradient: "from-yellow-500 to-orange-500",
  },
]

export default function PlansPopup({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { data: session, status } = useSession()
  const [expanded, setExpanded] = useState([false, false, false])
  const [processingPlan, setProcessingPlan] = useState<string | null>(null)
  const [razorpayLoaded, setRazorpayLoaded] = useState(false)

  const toggleExpand = (index: number) => {
    setExpanded((prev) => prev.map((val, i) => (i === index ? !val : val)))
  }

  // Load Razorpay script on component mount
  useEffect(() => {
    const loadRazorpayScript = async () => {
      if (window.Razorpay) {
        setRazorpayLoaded(true)
        return
      }

      try {
        const script = document.createElement("script")
        script.src = "https://checkout.razorpay.com/v1/checkout.js"
        script.async = true

        const loadPromise = new Promise((resolve, reject) => {
          script.onload = resolve
          script.onerror = reject
        })

        document.head.appendChild(script)
        await loadPromise

        setRazorpayLoaded(true)
        console.log("✅ Razorpay script loaded successfully")
      } catch (error) {
        console.error("❌ Failed to load Razorpay script:", error)
        toast.error("Failed to load payment system. Please refresh the page.")
      }
    }

    if (open) {
      loadRazorpayScript()
    }
  }, [open])

  const handlePayment = async (planId: PlanType) => {
    console.log("🔍 Payment attempt started for plan:", planId)

    // Prevent multiple clicks
    if (processingPlan) {
      console.log("⚠️ Payment already in progress")
      return
    }

    // Check authentication
    if (status === "loading") {
      toast.error("Please wait while we load your session...")
      return
    }

    if (status === "unauthenticated" || !session?.user) {
      console.log("❌ User not authenticated")
      toast.error("Please sign in to continue with payment")
      onOpenChange(false)
      window.location.href = "/signin"
      return
    }

    // Check if Razorpay is loaded
    if (!razorpayLoaded || !window.Razorpay) {
      toast.error("Payment system is loading. Please try again in a moment.")
      return
    }

    setProcessingPlan(planId)

    try {
      console.log("🔍 Creating payment order...")

      // Create order
      const orderResponse = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planType: planId }),
      })

      console.log("🔍 Order response status:", orderResponse.status)

      if (!orderResponse.ok) {
        const errorText = await orderResponse.text()
        console.error("❌ Order creation failed:", errorText)

        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch (parseError) {
          console.error("❌ Failed to parse error response:", parseError)
          throw new Error("Server error occurred. Please try again.")
        }

        throw new Error(errorData.error || "Failed to create payment order")
      }

      const orderData = await orderResponse.json()
      console.log("✅ Order created successfully:", orderData)

      // Hide the plans popup before opening Razorpay
      onOpenChange(false)

      // Configure Razorpay options
      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "LinkZup",
        description: `${orderData.planName} Plan Subscription`,
        image: "https://your-domain.com/zuper-logo.png", // Use absolute URL to avoid mixed content
        order_id: orderData.orderId,
        prefill: {
          name: session.user.name || "User",
          email: session.user.email || "user@example.com",
        },
        theme: {
          color: "#3B82F6",
        },
        handler: async (response: any) => {
          console.log("🔍 Payment completed, verifying...")
          try {
            const verifyResponse = await fetch("/api/payments/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planId: planId,
                userEmail: session.user.email,
              }),
            })

            if (verifyResponse.ok) {
              console.log("✅ Payment verified successfully")
              toast.success("Payment successful! Your subscription is now active.")
              setTimeout(() => {
                window.location.reload()
              }, 1000)
            } else {
              const errorData = await verifyResponse.json()
              console.error("❌ Payment verification failed:", errorData)
              throw new Error(errorData.error || "Payment verification failed")
            }
          } catch (error) {
            console.error("❌ Payment verification error:", error)
            const errorMessage = error instanceof Error ? error.message : "Payment verification failed"
            toast.error(`${errorMessage}. Please contact support if amount was deducted.`)
          } finally {
            setProcessingPlan(null)
          }
        },
        modal: {
          ondismiss: () => {
            console.log("🔍 Payment modal dismissed")
            setProcessingPlan(null)
            toast.info("Payment cancelled")
            // Reopen the plans popup if payment was cancelled
            onOpenChange(true)
          },
        },
        notes: {
          plan_name: PLANS[planId].name,
          plan_type: planId,
        },
      }

      console.log("🔍 Opening Razorpay checkout with options:", {
        key: options.key,
        amount: options.amount,
        order_id: options.order_id,
      })

      // Create and open Razorpay instance
      const razorpay = new window.Razorpay(options)

      // Add error handler for Razorpay
      razorpay.on("payment.failed", (response: any) => {
        console.error("❌ Razorpay payment failed:", response.error)
        toast.error(`Payment failed: ${response.error.description}`)
        setProcessingPlan(null)
        onOpenChange(true) // Reopen plans popup on failure
      })

      razorpay.open()
    } catch (error) {
      console.error("❌ Payment error:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to initiate payment. Please try again."
      toast.error(errorMessage)
      setProcessingPlan(null)
      onOpenChange(true) // Reopen plans popup on error
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] w-full max-w-5xl overflow-y-auto border-none p-0 shadow-2xl"
        style={{ zIndex: 50 }} // Ensure proper z-index
      >
        {/* Custom close button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <DialogHeader className="px-8 pt-8">
          <DialogTitle className="text-3xl font-bold text-center">Choose Your Plan</DialogTitle>
          <DialogDescription className="text-center text-gray-500">
            Pick a subscription that suits your growth journey.
          </DialogDescription>
        </DialogHeader>

        <div className="w-full px-6 pb-8 flex justify-center">
          <div className="max-w-md w-full flex flex-col items-center">
            {plans.map((planConfig, index) => {
              const plan = PLANS[planConfig.id]
              const showAll = expanded[index]
              const featuresToShow = showAll ? plan.features : plan.features.slice(0, 5)
              const isProcessing = processingPlan === planConfig.id

              return (
                <div
                  key={index}
                  className={`relative flex flex-col rounded-2xl border bg-white p-8 shadow-xl transition-all w-full items-center text-center border-blue-500`}
                >
                  <div
                    className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br ${planConfig.gradient} text-white shadow-lg mx-auto`}
                  >
                    {planConfig.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                  <p className="mb-3 text-base text-gray-500">{planConfig.description}</p>
                  <div className="mb-4 flex items-end justify-center gap-1 text-center">
                    <span className="text-3xl font-extrabold text-gray-900">{formatPrice(plan.price)}</span>
                    <span className="text-base text-gray-500">/month</span>
                  </div>
                  <ul className="mb-4 space-y-2 overflow-y-auto text-sm text-gray-700 pr-1 w-full max-w-xs mx-auto">
                    {featuresToShow.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 justify-center">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {plan.features.length > 5 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleExpand(index)
                      }}
                      className="mb-4 text-xs text-blue-600 underline transition hover:text-blue-800"
                    >
                      {showAll ? "Show less" : `Show all features (+${plan.features.length - 5})`}
                    </button>
                  )}
                  <Button
                    className={`mt-4 w-full rounded-xl py-3 font-semibold text-white shadow bg-gradient-to-r ${planConfig.gradient} hover:opacity-90 disabled:opacity-50 text-lg`}
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePayment(planConfig.id)
                    }}
                    disabled={isProcessing || status === "loading" || !razorpayLoaded}
                  >
                    {status === "loading" ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading Session...
                      </>
                    ) : !razorpayLoaded ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading Payment...
                      </>
                    ) : isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : status === "unauthenticated" ? (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Sign In to Pay
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Pay Now
                      </>
                    )}
                  </Button>
                </div>
              )
            })}
            {/* Payment Security Info */}
            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full text-sm text-green-700">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Secure payments powered by Razorpay
              </div>
              <p className="text-xs text-gray-500 mt-2">
                We accept UPI, Credit/Debit Cards, Net Banking & Digital Wallets
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
