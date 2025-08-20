"use client"

import { useState, useEffect } from "react"
import { Check, Star, Zap, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PaymentModal } from "@/components/payment-modal"

interface Plan {
  id: string
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

export default function PricingClientPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
    } finally {
      setLoading(false)
    }
  }

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "Star":
        return <Star className="h-6 w-6" />
      case "Zap":
        return <Zap className="h-6 w-6" />
      case "Crown":
        return <Crown className="h-6 w-6" />
      default:
        return <Star className="h-6 w-6" />
    }
  }

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString("en-IN")}`
  }

  const [selectedPlan, setSelectedPlan] = useState<{
    type: string
    details: Plan
  } | null>(null)

  const handlePlanSelect = (planType: string, planDetails: Plan) => {
    setSelectedPlan({ type: planType, details: planDetails })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-32 right-20 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-4 sm:mb-6 px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full text-xs sm:text-sm font-semibold">
              Transparent Plans
            </Badge>
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-black mb-6 sm:mb-8 leading-tight tracking-tight">
              <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Choose Your Growth Plan
              </span>
            </h1>
            <p className="text-base sm:text-xl text-slate-300 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed px-4">
              Invest in your professional growth with our comprehensive LinkedIn personal branding services. Select the
              plan that best fits your goals and budget.
            </p>
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {plans.map((plan, index) => (
                <div
                  key={plan.id}
                  className={`relative bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border ${
                    plan.badge === "Most Popular" ? "border-blue-500/50 shadow-lg shadow-blue-500/20" : "border-slate-700/50"
                  } transform transition-all duration-300 hover:scale-105 hover:shadow-xl flex flex-col h-full`}
                >
                  {plan.badge && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-1 rounded-full">
                        {plan.badge}
                      </Badge>
                    </div>
                  )}
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 text-white">
                    {getIcon(plan.icon || "Star")}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-white">{formatPrice(plan.price)}</span>
                    <span className="text-slate-400 ml-2">per {plan.durationDays} days</span>
                  </div>
                  <p className="text-slate-300 mb-6">{plan.description}</p>
                  <ul className="space-y-3 mb-8 flex-grow">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-slate-300">
                        <Check className="h-5 w-5 text-green-400 mr-2 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      {selectedPlan && (
        <PaymentModal
          isOpen={!!selectedPlan}
          onClose={() => setSelectedPlan(null)}
          plan={{
            id: selectedPlan.type,
            slug: selectedPlan.type,
            name: selectedPlan.details.name,
            price: selectedPlan.details.price,
            durationDays: selectedPlan.details.durationDays,
            features: selectedPlan.details.features,
            description: selectedPlan.details.description,
            imageLimit: selectedPlan.details.imageLimit,
            contentLimit: selectedPlan.details.contentLimit,
            isActive: selectedPlan.details.isActive,
          }}
        />
      )}
    </div>
  )
}
