"use client"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, CreditCard, Loader2, Sparkles, Shield, ArrowRight } from "lucide-react"
import { PLANS, formatPrice, type PlanType } from "@/lib/razorpay"
import { useToast } from "@/hooks/use-toast"

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

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  plan: Plan | null
  onSuccess?: () => void
  userName?: string
  userEmail?: string
  onPaymentStart?: (planSlug: string) => void
  onPaymentComplete?: (orderId: string) => void
}

declare global {
  interface Window {
    Razorpay: any
  }
}

export function PaymentModal({
  isOpen,
  onClose,
  plan,
  onSuccess,
  userName = "",
  userEmail = "",
  onPaymentStart,
  onPaymentComplete,
}: PaymentModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Focus management
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      // Don't auto-focus the button to prevent focus jumping
      buttonRef.current.blur()
    }
  }, [isOpen])

  // Safety check - if plan is not provided, show error and close modal
  if (!plan) {
    console.error("No plan provided to PaymentModal")
    toast({
      title: "Error",
      description: "Selected plan not found. Please try again.",
      variant: "destructive",
    })
    onClose()
    return null
  }

  const handlePayment = async () => {
    try {
      setIsLoading(true)

      // Notify parent component about payment start
      onPaymentStart?.(plan.slug)

      // Create order
      const requestData = {
        planType: plan.slug,
        planId: plan.id,
        amount: plan.price * 100, // Convert to paise for Razorpay
        planName: plan.name
      }
      
      console.log("🔍 Sending order data:", requestData)
      console.log("🔍 Plan object:", plan)
      
      const orderResponse = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      })

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json()
        throw new Error(errorData.error || "Failed to create order")
      }

      const orderData = await orderResponse.json()

      // Notify parent component about payment completion
      onPaymentComplete?.(orderData.orderId)

      // Load Razorpay script if not already loaded
      if (!window.Razorpay) {
        const script = document.createElement("script")
        script.src = "https://checkout.razorpay.com/v1/checkout.js"
        script.async = true
        document.body.appendChild(script)

        await new Promise((resolve, reject) => {
          script.onload = resolve
          script.onerror = reject
        })
      }

      // Configure Razorpay options
      const options = {
        key: orderData.key,
        amount: orderData.amount, // Already in paise from API
        currency: "INR",
        name: "LinkZup",
        description: `${plan.name} Plan - ${plan.durationDays} days`,
        order_id: orderData.orderId,
        image: "/zuper-logo.png",
        handler: async (response: any) => {
          try {
            // Verify payment with plan information
            const verifyResponse = await fetch("/api/payments/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planId: plan.id,
                userEmail: userEmail,
              }),
            })

            if (!verifyResponse.ok) {
              const errorData = await verifyResponse.json()
              throw new Error(errorData.error || "Payment verification failed")
            }

            const verifyData = await verifyResponse.json()

            toast({
              title: "Payment Successful!",
                              description: `Your ${plan.name} subscription is now active.`,
            })

            onSuccess?.()
            onClose()
          } catch (error) {
            console.error("Payment verification error:", error)
            toast({
              title: "Payment Verification Failed",
              description: error instanceof Error ? error.message : "Please contact support.",
              variant: "destructive",
            })
          }
        },
        prefill: {
          name: userName,
          email: userEmail,
          contact: "",
        },
        theme: {
          color: "#3B82F6",
        },
        modal: {
          ondismiss: () => {
            setIsLoading(false)
            // Don't close our modal when Razorpay is dismissed
          },
        },
      }

      const razorpay = new window.Razorpay(options)
      
      // Open Razorpay modal directly without closing our modal first
      try {
        razorpay.open()
      } catch (error) {
        console.error("Razorpay open error:", error)
        toast({
          title: "Payment Error",
          description: "Failed to open payment modal. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Payment error:", error)
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Don't render if plan is not found
  if (!plan) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-lg" 
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4">
            <Sparkles className="h-8 w-8" />
          </div>
          <DialogTitle className="text-2xl font-bold">Complete Your Purchase</DialogTitle>
          <p className="text-gray-600">You&apos;re just one step away from unlocking your LinkedIn potential</p>
        </DialogHeader>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-gray-100">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center gap-3 mb-4">
              <CardTitle className="text-xl font-bold">{plan.name} Plan</CardTitle>
              <Badge variant="secondary" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                {plan.durationDays} days
              </Badge>
            </div>
            <CardDescription className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <span className="text-3xl font-bold text-gray-900">₹{plan.price}</span>
                <span className="text-gray-500">/{plan.durationDays} days</span>
              </div>
              <div className="text-sm text-gray-600">One-time payment • No hidden fees</div>
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" />
                What&apos;s included:
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {plan.features.slice(0, 6).map((feature: string, index: number) => (
                  <div key={index} className="flex items-start gap-3 text-sm">
                    <Check className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
                {plan.features.length > 6 && (
                  <div className="text-sm text-gray-500 italic">+{plan.features.length - 6} more features included</div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <Shield className="h-4 w-4 text-emerald-600" />
              <span className="text-sm text-emerald-700 font-medium">Secure payment powered by Razorpay</span>
            </div>

            <Button
              ref={buttonRef}
              onClick={handlePayment}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg h-12 text-lg font-semibold"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-5 w-5" />
                  Pay ₹{plan.price}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>

            <p className="text-xs text-gray-500 text-center">
              Your subscription will be activated immediately after payment. You can cancel anytime from your dashboard.
            </p>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}
