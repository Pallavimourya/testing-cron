"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import SubscriptionAlert from "@/components/subscription-alert"
import { createElement } from "react"

interface SubscriptionData {
  subscription: {
    status: string
    plan: string
    planDetails: any
    startDate: string
    endDate: string
    isActive: boolean
    razorpayCustomerId: string
    razorpaySubscriptionId: string
  }
  usage: {
    contentGenerated: number
    imagesGenerated: number
    imageGenerations: {
      limit: number
      used: number
      remaining: number
    }
  }
  permissions: {
    canGenerateContent: boolean
    canGenerateImages: boolean
    canGenerateTopics: boolean
  }
}

interface SubscriptionAlertState {
  isOpen: boolean
  title: string
  message: string
  currentPlan?: {
    name: string
    status: string
    expiry: string
  }
  availablePlans?: any[]
}

export function useSubscription() {
  const { data: session } = useSession()
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [alertState, setAlertState] = useState<SubscriptionAlertState>({
    isOpen: false,
    title: "",
    message: "",
  })

  const fetchSubscription = useCallback(async () => {
    if (!session?.user?.email) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await fetch("/api/subscription/check")
      
      if (response.ok) {
        const data = await response.json()
        setSubscriptionData(data)
      } else {
        console.error("Failed to fetch subscription data")
      }
    } catch (error) {
      console.error("Error fetching subscription:", error)
    } finally {
      setLoading(false)
    }
  }, [session?.user?.email])

  useEffect(() => {
    fetchSubscription()
  }, [fetchSubscription])

  const showSubscriptionAlert = useCallback((
    title: string = "Subscription Required",
    message: string = "You need an active subscription to access this feature.",
    currentPlan?: { name: string; status: string; expiry: string },
    availablePlans?: any[]
  ) => {
    setAlertState({
      isOpen: true,
      title,
      message,
      currentPlan,
      availablePlans,
    })
  }, [])

  const hideSubscriptionAlert = useCallback(() => {
    setAlertState(prev => ({ ...prev, isOpen: false }))
  }, [])

  const checkSubscriptionAndExecute = useCallback(async (
    action: () => Promise<any>,
    featureName: string = "this feature"
  ) => {
    if (!subscriptionData?.subscription.isActive) {
      showSubscriptionAlert(
        "Subscription Required",
        `You need an active subscription to use ${featureName}.`,
        subscriptionData?.subscription.planDetails ? {
          name: subscriptionData.subscription.planDetails.name,
          status: subscriptionData.subscription.status,
          expiry: subscriptionData.subscription.endDate,
        } : undefined,
        subscriptionData?.subscription.planDetails ? [subscriptionData.subscription.planDetails] : undefined
      )
      return { success: false, error: "SUBSCRIPTION_REQUIRED" }
    }

    try {
      const result = await action()
      return { success: true, data: result }
    } catch (error: any) {
      // Check if it's a subscription error
      if (error?.code === "SUBSCRIPTION_REQUIRED" || error?.message?.includes("subscription")) {
        const errorData = error.data || {}
        showSubscriptionAlert(
          errorData.title || "Subscription Required",
          errorData.message || `You need an active subscription to use ${featureName}.`,
          errorData.currentPlan,
          errorData.availablePlans
        )
        return { success: false, error: "SUBSCRIPTION_REQUIRED" }
      }
      
      // Handle other errors
      console.error("Action execution error:", error)
      toast.error(error?.message || "An error occurred. Please try again.")
      return { success: false, error: "EXECUTION_ERROR" }
    }
  }, [subscriptionData, showSubscriptionAlert])

  const handleApiError = useCallback((error: any, featureName: string = "this feature") => {
    if (error?.code === "SUBSCRIPTION_REQUIRED") {
      showSubscriptionAlert(
        "Subscription Required",
        error.message || `You need an active subscription to use ${featureName}.`,
        error.currentPlan,
        error.availablePlans
      )
      return true // Error was handled
    }
    return false // Error was not handled
  }, [showSubscriptionAlert])

  const SubscriptionAlertComponent = useCallback(() => {
    return createElement(SubscriptionAlert, {
      isOpen: alertState.isOpen,
      onClose: hideSubscriptionAlert,
      title: alertState.title,
      message: alertState.message,
      currentPlan: alertState.currentPlan,
      availablePlans: alertState.availablePlans,
    })
  }, [alertState, hideSubscriptionAlert])

  return {
    subscriptionData,
    loading,
    isActive: subscriptionData?.subscription.isActive || false,
    canGenerateContent: subscriptionData?.permissions.canGenerateContent || false,
    canGenerateImages: subscriptionData?.permissions.canGenerateImages || false,
    canGenerateTopics: subscriptionData?.permissions.canGenerateTopics || false,
    imageGenerations: subscriptionData?.usage.imageGenerations,
    fetchSubscription,
    showSubscriptionAlert,
    hideSubscriptionAlert,
    checkSubscriptionAndExecute,
    handleApiError,
    SubscriptionAlertComponent,
  }
}
