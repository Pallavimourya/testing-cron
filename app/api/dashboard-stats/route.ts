import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import Topic from "@/models/Topic"
import ApprovedContent from "@/models/ApprovedContent"
import mongoose from "mongoose"

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

    console.log("📊 Fetching dashboard stats for user:", user.email)

    const userPlan = user.subscriptionPlan || "free"
    const planLimits = PLAN_LIMITS[userPlan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free

    // Get current month start
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const startOfWeek = new Date()
    startOfWeek.setDate(startOfWeek.getDate() - 7)

    const userFilter = { userId: user._id }

    // Get topics stats - user-specific only
    const totalTopics = await Topic.countDocuments(userFilter)
    const approvedTopics = await Topic.countDocuments({ ...userFilter, status: "approved" })
    const pendingTopics = await Topic.countDocuments({ ...userFilter, status: "pending" })

    // Get content stats from ApprovedContent model - user-specific only
    let totalContent = await ApprovedContent.countDocuments(userFilter)
    let generatedContent = await ApprovedContent.countDocuments({ ...userFilter, status: "generated" })
    let approvedContent = await ApprovedContent.countDocuments({ ...userFilter, status: "approved" })
    let postedContent = await ApprovedContent.countDocuments({ ...userFilter, status: "posted" })
    let monthlyContent = await ApprovedContent.countDocuments({
      ...userFilter,
      createdAt: { $gte: startOfMonth },
    })

    const imagesGenerated = user.imagesGenerated || 0

    const collection = mongoose.connection.db?.collection("approvedcontents")
    if (collection) {
      // Use only the most reliable user identification methods
      const rawFilter = {
        $or: [
          { userId: user._id },
          { userId: user._id.toString() },
          { email: user.email }, // Only as fallback for legacy data
        ],
      }

      const rawTotalContent = await collection.countDocuments(rawFilter)
      const rawGeneratedContent = await collection.countDocuments({ ...rawFilter, status: "generated" })
      const rawApprovedContent = await collection.countDocuments({ ...rawFilter, status: "approved" })
      const rawPostedContent = await collection.countDocuments({ ...rawFilter, status: "posted" })

      // Get monthly content from raw collection - user-specific
      const rawMonthlyContent = await collection.countDocuments({
        ...rawFilter,
        $or: [
          { createdAt: { $gte: startOfMonth } },
          { timestamp: { $gte: startOfMonth } },
          { created_at: { $gte: startOfMonth } },
        ],
      })

      // Use the higher count from either source for this specific user
      totalContent = Math.max(totalContent, rawTotalContent)
      generatedContent = Math.max(generatedContent, rawGeneratedContent)
      approvedContent = Math.max(approvedContent, rawApprovedContent)
      postedContent = Math.max(postedContent, rawPostedContent)
      monthlyContent = Math.max(monthlyContent, rawMonthlyContent)
    }

    const recentTopics = await Topic.find(userFilter).sort({ createdAt: -1 }).limit(5).select("title status createdAt")

    let recentContent = await ApprovedContent.find(userFilter)
      .sort({ createdAt: -1 })
      .limit(5)
      .select("topicTitle status createdAt")

    if (collection) {
      const rawRecentContent = await collection
        .find({
          $or: [
            { userId: user._id },
            { userId: user._id.toString() },
            { email: user.email }, // Only as fallback
          ],
        })
        .sort({ timestamp: -1, createdAt: -1, _id: -1 })
        .limit(10)
        .toArray()

      // Transform and combine with existing content
      const transformedRawContent = rawRecentContent.map((item) => ({
        topicTitle: item.Topic || item.topicTitle || item.title || "Untitled",
        status: item.status || item.Status || "generated",
        createdAt: item.timestamp || item.createdAt || item.created_at || new Date(),
      }))

      // Combine and sort by date
      const allRecentContent = [...recentContent, ...transformedRawContent]
      allRecentContent.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      recentContent = allRecentContent.slice(0, 5)
    }

    const weeklyData = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)

      const dayContent = await ApprovedContent.countDocuments({
        ...userFilter,
        createdAt: { $gte: startOfDay, $lt: endOfDay },
      })

      weeklyData.push({
        name: date.toLocaleDateString("en-US", { weekday: "short" }),
        content: dayContent,
      })
    }

    // Calculate engagement rate (mock data for now)
    const engagementRate = postedContent > 0 ? Math.round((postedContent / totalContent) * 100) : 0

    // Calculate weekly growth
    const weeklyGrowth = monthlyContent > 0 ? Math.round((monthlyContent / 4) * 100) / 100 : 0

    const stats = {
      totalTopics,
      approvedTopics,
      pendingTopics,
      totalContent,
      generatedContent,
      approvedContent,
      postedContent,
      monthlyContent,
      monthlyLimit: planLimits.contentLimit,
      remainingContent: Math.max(0, planLimits.contentLimit - monthlyContent),
      imageStats: {
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
      engagementRate,
      weeklyGrowth,
      recentActivity: {
        topics: recentTopics,
        content: recentContent,
      },
      contentByStatus: {
        generated: generatedContent,
        approved: approvedContent,
        posted: postedContent,
        failed: totalContent - generatedContent - approvedContent - postedContent,
      },
      monthlyProgress: planLimits.contentLimit > 0 ? Math.round((monthlyContent / planLimits.contentLimit) * 100) : 0,
      weeklyData, // Added user-specific weekly data
    }

    console.log("📊 Dashboard stats calculated for user:", user.email, {
      totalTopics,
      totalContent,
      monthlyContent,
      plan: userPlan,
      planLimits,
      hasRecentActivity: recentContent.length > 0,
    })

    return NextResponse.json({
      success: true,
      stats,
    })
  } catch (error) {
    console.error("❌ Error fetching dashboard stats:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch dashboard stats",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
