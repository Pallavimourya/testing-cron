import React, { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"

interface OnboardingFormProps {
  onComplete: () => void;
}

export default function OnboardingForm({ onComplete }: OnboardingFormProps) {
  const { data: session } = useSession()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    name: "",
    niche: "",
    targetAudience: "",
    contentTone: "",
    preferredPlatforms: [] as string[],
    preferences: {
      industry: "",
      primaryGoal: "",
      contentFrequency: "",
      targetAudienceAge: "",
      targetAudienceLocation: "",
      targetAudienceInterests: [] as string[],
      contentTypes: [] as string[],
      competitors: [] as string[],
      keywords: [] as string[],
      hashtags: [] as string[],
      brandVoice: "",
      brandValues: [] as string[],
      brandPersonality: [] as string[],
      contentGoals: [] as string[],
      contentMetrics: [] as string[],
      contentCalendar: [] as string[],
      contentWorkflow: [] as string[],
      contentTeam: [] as string[],
      contentBudget: "",
      contentTools: [] as string[],
      contentResources: [] as string[],
      contentGuidelines: [] as string[],
      contentTemplates: [] as string[],
      contentExamples: [] as string[],
      contentInspiration: [] as string[],
      contentTrends: [] as string[],
      contentAnalytics: [] as string[],
      contentReports: [] as string[],
      contentFeedback: [] as string[],
      contentImprovements: [] as string[],
      contentSuccess: [] as string[],
      contentChallenges: [] as string[],
      contentSolutions: [] as string[],
      contentInnovations: [] as string[],
      contentExperiments: [] as string[],
      contentResults: [] as string[],
      contentLearnings: [] as string[],
      contentRecommendations: [] as string[],
      contentNextSteps: [] as string[],
      contentFuture: [] as string[],
      contentVision: [] as string[],
      contentMission: [] as string[],
      contentStrategy: [] as string[],
      contentTactics: [] as string[],
      contentExecution: [] as string[],
      contentEvaluation: [] as string[],
      contentOptimization: [] as string[],
      contentScaling: [] as string[],
      contentGrowth: [] as string[],
      contentImpact: [] as string[],
      contentValue: [] as string[],
      contentROI: [] as string[],
      contentKPIs: [] as string[],
    },
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasCompleted, setHasCompleted] = useState(false)

  // Check if user has already completed onboarding
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const response = await fetch("/api/user/profile")
        if (response.ok) {
          const userData = await response.json()
          if (userData.onboardingCompleted) {
            setHasCompleted(true)
            onComplete() // Call onComplete to show dashboard
          }
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error)
      }
    }

    if (session?.user?.email) {
      checkOnboardingStatus()
    }
  }, [session, onComplete])

  // If user has already completed onboarding, don't show the form
  if (hasCompleted) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return // Prevent multiple submissions

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/user/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          email: session?.user?.email,
          onboardingCompleted: true, // Mark onboarding as completed
        }),
      })

      if (response.ok) {
        setHasCompleted(true)
        onComplete() // Call onComplete to show dashboard
      } else {
        throw new Error("Failed to save profile")
      }
    } catch (error) {
      console.error("Error saving profile:", error)
      toast.error("Failed to save profile. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // ... rest of the existing code ...
}
