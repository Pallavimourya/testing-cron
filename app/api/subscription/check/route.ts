import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import { isSubscriptionActive, getRemainingImageGenerations, PLANS } from "@/lib/razorpay"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const user = await User.findOne({ email: session.user.email }).select(
      'subscriptionStatus subscriptionPlan subscriptionExpiry imagesGenerated contentGenerated razorpayCustomerId razorpaySubscriptionId createdAt'
    )

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const hasActiveSubscription = isSubscriptionActive(
      user.subscriptionStatus || "free",
      user.subscriptionExpiry
    )

    const imageGenerations = getRemainingImageGenerations(
      user.subscriptionPlan || "free",
      user.imagesGenerated || 0
    )

    const currentPlan = user.subscriptionPlan && PLANS[user.subscriptionPlan as keyof typeof PLANS] 
      ? PLANS[user.subscriptionPlan as keyof typeof PLANS] 
      : null

    // Get plan details for display
    let planDetails = null
    if (user.subscriptionPlan && user.subscriptionPlan !== "free") {
      planDetails = PLANS[user.subscriptionPlan as keyof typeof PLANS]
    }

    return NextResponse.json({
      subscription: {
        status: user.subscriptionStatus || "free",
        plan: user.subscriptionPlan || "free",
        planDetails: planDetails,
        startDate: user.createdAt,
        endDate: user.subscriptionExpiry,
        isActive: hasActiveSubscription,
        razorpayCustomerId: user.razorpayCustomerId,
        razorpaySubscriptionId: user.razorpaySubscriptionId,
        autoRenew: user.subscriptionStatus === "active" && user.subscriptionExpiry && new Date(user.subscriptionExpiry) > new Date()
      },
      usage: {
        contentGenerated: user.contentGenerated || 0,
        imagesGenerated: user.imagesGenerated || 0,
        imageGenerations
      },
      permissions: {
        canGenerateContent: hasActiveSubscription,
        canGenerateImages: hasActiveSubscription && imageGenerations.remaining > 0,
        canGenerateTopics: hasActiveSubscription
      }
    })

  } catch (error) {
    console.error("Error checking subscription:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
