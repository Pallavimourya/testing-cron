import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import { isSubscriptionActive, getRemainingImageGenerations, PLANS } from "@/lib/razorpay"

export interface SubscriptionCheck {
  hasActiveSubscription: boolean
  subscriptionPlan: string | null
  subscriptionExpiry: Date | null
  canGenerateContent: boolean
  canGenerateImages: boolean
  imageGenerations: {
    limit: number
    used: number
    remaining: number
  }
  error?: string
}

export async function checkSubscriptionAccess(requiresImageGeneration: boolean = false): Promise<{
  success: boolean
  data?: SubscriptionCheck
  response?: NextResponse
}> {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return {
        success: false,
        response: NextResponse.json(
          { 
            error: "Authentication required",
            code: "AUTH_REQUIRED",
            message: "Please sign in to access this feature."
          }, 
          { status: 401 }
        )
      }
    }

    // Connect to database
    await connectDB()

    // Get user with subscription details
    const user = await User.findOne({ email: session.user.email }).select(
      'subscriptionStatus subscriptionPlan subscriptionExpiry imagesGenerated contentGenerated'
    )

    if (!user) {
      return {
        success: false,
        response: NextResponse.json(
          { 
            error: "User not found",
            code: "USER_NOT_FOUND",
            message: "User account not found. Please contact support."
          }, 
          { status: 404 }
        )
      }
    }

    // Check if subscription is active
    const hasActiveSubscription = isSubscriptionActive(
      user.subscriptionStatus || "free",
      user.subscriptionExpiry
    )

    // Free users cannot generate anything
    if (!hasActiveSubscription) {
      const currentPlan = user.subscriptionPlan && PLANS[user.subscriptionPlan as keyof typeof PLANS] 
        ? PLANS[user.subscriptionPlan as keyof typeof PLANS] 
        : null

      return {
        success: false,
        response: NextResponse.json(
          {
            error: "Active subscription required",
            code: "SUBSCRIPTION_REQUIRED",
            message: "You need an active subscription to use this feature. Please upgrade your plan to continue.",
            currentPlan: currentPlan ? {
              name: currentPlan.name,
              status: user.subscriptionStatus,
              expiry: user.subscriptionExpiry
            } : null,
            availablePlans: Object.entries(PLANS).map(([key, plan]) => ({
              id: key,
              name: plan.name,
              price: plan.price,
              duration: plan.duration,
              imageLimit: plan.imageLimit,
              features: plan.features
            })),
            billingUrl: "/dashboard/billing"
          },
          { status: 403 }
        )
      }
    }

    // Get image generation limits
    const imageGenerations = getRemainingImageGenerations(
      user.subscriptionPlan || "free",
      user.imagesGenerated || 0
    )

    // Check image generation limits if required
    if (requiresImageGeneration && imageGenerations.remaining <= 0) {
      return {
        success: false,
        response: NextResponse.json(
          {
            error: "Image generation limit exceeded",
            code: "IMAGE_LIMIT_EXCEEDED",
            message: `You have reached your image generation limit of ${imageGenerations.total} images for your ${user.subscriptionPlan} plan.`,
            imageGenerations,
            upgradeMessage: "Upgrade your plan to get more image generations.",
            billingUrl: "/dashboard/billing"
          },
          { status: 429 }
        )
      }
    }

    // Return success with subscription details
    return {
      success: true,
      data: {
        hasActiveSubscription: true,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionExpiry: user.subscriptionExpiry,
        canGenerateContent: true,
        canGenerateImages: imageGenerations.remaining > 0,
        imageGenerations
      }
    }

  } catch (error) {
    console.error("Subscription check error:", error)
    return {
      success: false,
      response: NextResponse.json(
        { 
          error: "Internal server error",
          code: "INTERNAL_ERROR",
          message: "An error occurred while checking your subscription. Please try again."
        }, 
        { status: 500 }
      )
    }
  }
}

export async function incrementImageGeneration(userEmail: string): Promise<boolean> {
  try {
    await connectDB()
    
    const result = await User.updateOne(
      { email: userEmail },
      { $inc: { imagesGenerated: 1 } }
    )
    
    return result.modifiedCount > 0
  } catch (error) {
    console.error("Error incrementing image generation:", error)
    return false
  }
}

export async function incrementContentGeneration(userEmail: string): Promise<boolean> {
  try {
    await connectDB()
    
    const result = await User.updateOne(
      { email: userEmail },
      { $inc: { contentGenerated: 1 } }
    )
    
    return result.modifiedCount > 0
  } catch (error) {
    console.error("Error incrementing content generation:", error)
    return false
  }
}

export async function resetImageGenerations(userEmail: string): Promise<boolean> {
  try {
    await connectDB()
    
    const result = await User.updateOne(
      { email: userEmail },
      { $set: { imagesGenerated: 0 } }
    )
    
    return result.modifiedCount > 0
  } catch (error) {
    console.error("Error resetting image generations:", error)
    return false
  }
}
