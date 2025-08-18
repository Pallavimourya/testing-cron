import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import Topic from "@/models/Topic"
import ApprovedContent from "@/models/ApprovedContent"

const PLAN_LIMITS = {
  zuper15: {
    imageLimit: 10,
    contentLimit: 20,
    duration: 15,
  },
  zuper30: {
    imageLimit: 50,
    contentLimit: 100,
    duration: 30,
  },
  zuper360: {
    imageLimit: 200,
    contentLimit: 500,
    duration: 360,
  },
  free: {
    imageLimit: 0,
    contentLimit: 0,
    duration: 0,
  },
}

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userPlan = user.subscriptionPlan || "free"
    const planLimits = PLAN_LIMITS[userPlan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free

    // Get start of current month
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const nextMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)

    const userFilter = { userId: user._id }

    // Count topics generated this month - user-specific only
    const topicsThisMonth = await Topic.countDocuments({
      ...userFilter,
      createdAt: { $gte: startOfMonth },
    })

    // Count content generated this month - user-specific only
    const contentThisMonth = await ApprovedContent.countDocuments({
      ...userFilter,
      createdAt: { $gte: startOfMonth },
    })

    const imagesGenerated = user.imagesGenerated || 0

    // Calculate days until reset
    const now = new Date()
    const daysUntilReset = Math.ceil((nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    console.log("📊 Monthly usage for user:", user.email, {
      topicsThisMonth,
      contentThisMonth,
      imagesGenerated,
      plan: userPlan,
      planLimits,
      daysUntilReset,
    })

    return NextResponse.json({
      success: true,
      usage: {
        topics: {
          used: topicsThisMonth,
          limit: planLimits.contentLimit,
          remaining: Math.max(0, planLimits.contentLimit - topicsThisMonth),
        },
        content: {
          used: contentThisMonth,
          limit: planLimits.contentLimit,
          remaining: Math.max(0, planLimits.contentLimit - contentThisMonth),
        },
        images: {
          used: imagesGenerated,
          limit: planLimits.imageLimit,
          remaining: Math.max(0, planLimits.imageLimit - imagesGenerated),
        },
        planInfo: {
          name: userPlan,
          imageLimit: planLimits.imageLimit,
          contentLimit: planLimits.contentLimit,
          duration: planLimits.duration,
          subscriptionStatus: user.subscriptionStatus,
          subscriptionExpiry: user.subscriptionExpiry,
        },
        resetInfo: {
          daysUntilReset,
          nextResetDate: nextMonth.toISOString().split("T")[0],
        },
      },
    })
  } catch (error) {
    console.error("❌ Error fetching monthly usage:", error)
    return NextResponse.json({ error: "Failed to fetch usage data" }, { status: 500 })
  }
}
