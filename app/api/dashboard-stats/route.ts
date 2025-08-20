import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import Topic from "@/models/Topic"
import ApprovedContent from "@/models/ApprovedContent"
import ScheduledPost from "@/models/ScheduledPost"
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

function getPlanDateRange(user: any, planLimits: any) {
  const now = new Date()

  if (!user.subscriptionStartDate || planLimits.duration === 0) {
    // For free users or users without subscription start date, use current month
    return new Date(now.getFullYear(), now.getMonth(), 1)
  }

  const subscriptionStart = new Date(user.subscriptionStartDate)
  const daysSinceStart = Math.floor((now.getTime() - subscriptionStart.getTime()) / (1000 * 60 * 60 * 24))

  // Calculate which billing cycle we're in
  const cycleNumber = Math.floor(daysSinceStart / planLimits.duration)
  const currentCycleStart = new Date(subscriptionStart)
  currentCycleStart.setDate(currentCycleStart.getDate() + cycleNumber * planLimits.duration)

  return currentCycleStart
}

// Cache for dashboard stats (in-memory cache for now)
const statsCache = new Map()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

function getCacheKey(userId: string, minimal: boolean) {
  return `${userId}_${minimal ? 'minimal' : 'full'}`
}

function getCachedStats(userId: string, minimal: boolean) {
  const key = getCacheKey(userId, minimal)
  const cached = statsCache.get(key)
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }
  
  return null
}

function setCachedStats(userId: string, minimal: boolean, data: any) {
  const key = getCacheKey(userId, minimal)
  statsCache.set(key, {
    data,
    timestamp: Date.now()
  })
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const minimal = searchParams.get('minimal') === 'true'
    
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check cache first
    const cachedStats = getCachedStats(user._id.toString(), minimal)
    if (cachedStats) {
      return NextResponse.json({
        success: true,
        stats: cachedStats,
        cached: true
      })
    }

    console.log("📊 Fetching dashboard stats for user:", user.email, minimal ? "(minimal)" : "(full)")

    const userPlan = user.subscriptionPlan || "free"
    const planLimits = PLAN_LIMITS[userPlan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free

    const planStartDate = getPlanDateRange(user, planLimits)
    const userFilter = { userId: user._id }

    // Get basic stats - always needed
    const totalTopics = await Topic.countDocuments(userFilter)
    const approvedTopics = await Topic.countDocuments({ ...userFilter, status: "approved" })
    const pendingTopics = await Topic.countDocuments({ ...userFilter, status: "pending" })

    let totalContent = await ApprovedContent.countDocuments(userFilter)
    let generatedContent = await ApprovedContent.countDocuments({ ...userFilter, status: "generated" })
    let approvedContent = await ApprovedContent.countDocuments({ ...userFilter, status: "approved" })
    let postedContent = await ApprovedContent.countDocuments({ ...userFilter, status: "posted" })
    let failedContent = await ApprovedContent.countDocuments({ ...userFilter, status: "failed" })

    let monthlyContent = await ApprovedContent.countDocuments({
      ...userFilter,
      createdAt: { $gte: planStartDate },
    })

    const scheduledPosts = await ScheduledPost.countDocuments({ userId: user._id })
    const pendingScheduled = await ScheduledPost.countDocuments({ userId: user._id, status: "pending" })
    const postedScheduled = await ScheduledPost.countDocuments({ userId: user._id, status: "posted" })
    const failedScheduled = await ScheduledPost.countDocuments({ userId: user._id, status: "failed" })

    const imagesGenerated = user.imagesGenerated || 0

    // Only process additional collections if not minimal mode
    if (!minimal) {
    const collections = ["approvedcontents", "linkdin-content-generation", "generatedcontents"]

    if (mongoose.connection.db) {
      for (const collectionName of collections) {
        try {
          const collection = mongoose.connection.db.collection(collectionName)

          const rawFilter = {
            $or: [
              { userId: user._id },
              { userId: user._id.toString() },
              { "user id": user._id },
              { "user id": user._id.toString() },
              { user_id: user._id },
              { user_id: user._id.toString() },
            ],
          }

          const rawTotalContent = await collection.countDocuments(rawFilter)
          const rawGeneratedContent = await collection.countDocuments({
            ...rawFilter,
            $or: [{ status: "generated" }, { Status: "generated" }],
          })
          const rawApprovedContent = await collection.countDocuments({
            ...rawFilter,
            $or: [{ status: "approved" }, { Status: "approved" }],
          })
          const rawPostedContent = await collection.countDocuments({
            ...rawFilter,
            $or: [{ status: "posted" }, { Status: "posted" }],
          })
          const rawFailedContent = await collection.countDocuments({
            ...rawFilter,
            $or: [{ status: "failed" }, { Status: "failed" }],
          })

          const rawMonthlyContent = await collection.countDocuments({
            ...rawFilter,
            $or: [
              { createdAt: { $gte: planStartDate } },
              { timestamp: { $gte: planStartDate } },
              { created_at: { $gte: planStartDate } },
              { "created at": { $gte: planStartDate } },
            ],
          })

          totalContent += rawTotalContent
          generatedContent += rawGeneratedContent
          approvedContent += rawApprovedContent
          postedContent += rawPostedContent
          failedContent += rawFailedContent
          monthlyContent += rawMonthlyContent

          console.log(`📊 Collection ${collectionName} stats:`, {
            total: rawTotalContent,
            monthly: rawMonthlyContent,
            posted: rawPostedContent,
          })
        } catch (error) {
          console.error(`❌ Error processing collection ${collectionName}:`, error)
          }
        }
      }
    }

    totalContent += scheduledPosts
    postedContent += postedScheduled
    failedContent += failedScheduled

    const engagementRate = totalContent > 0 ? Math.round((postedContent / totalContent) * 100) : 0

    // For minimal mode, use simplified data
    let weeklyData = []
    let recentTopics = []
    let recentContent = []
    let weeklyGrowth = 0

    if (!minimal) {
      // Get weekly data
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)

      let dayContent = await ApprovedContent.countDocuments({
        ...userFilter,
        createdAt: { $gte: startOfDay, $lt: endOfDay },
      })

      if (mongoose.connection.db) {
          const collections = ["approvedcontents", "linkdin-content-generation", "generatedcontents"]
        for (const collectionName of collections) {
          try {
            const collection = mongoose.connection.db.collection(collectionName)
            const rawDayContent = await collection.countDocuments({
              $and: [
                {
                  $or: [
                    { userId: user._id },
                    { userId: user._id.toString() },
                    { "user id": user._id },
                    { "user id": user._id.toString() },
                  ],
                },
                {
                  $or: [
                    { createdAt: { $gte: startOfDay, $lt: endOfDay } },
                    { timestamp: { $gte: startOfDay, $lt: endOfDay } },
                    { created_at: { $gte: startOfDay, $lt: endOfDay } },
                  ],
                },
              ],
            })
            dayContent += rawDayContent
          } catch (error) {
            console.error(`Error getting daily content from ${collectionName}:`, error)
          }
        }
      }

      weeklyData.push({
        name: date.toLocaleDateString("en-US", { weekday: "short" }),
        content: dayContent,
      })
    }

    const lastWeekContent = weeklyData.slice(0, 3).reduce((sum, day) => sum + day.content, 0)
    const thisWeekContent = weeklyData.slice(4, 7).reduce((sum, day) => sum + day.content, 0)
      weeklyGrowth =
      lastWeekContent > 0 ? Math.round(((thisWeekContent - lastWeekContent) / lastWeekContent) * 100) : 0

      // Get recent activity
      recentTopics = await Topic.find(userFilter).sort({ createdAt: -1 }).limit(5).select("title status createdAt")

      recentContent = await ApprovedContent.find(userFilter)
      .sort({ createdAt: -1 })
      .limit(5)
      .select("topicTitle status createdAt")

    if (mongoose.connection.db) {
      const allRecentContent = [...recentContent]
        const collections = ["approvedcontents", "linkdin-content-generation", "generatedcontents"]

      for (const collectionName of collections) {
        try {
          const collection = mongoose.connection.db.collection(collectionName)
          const rawRecentContent = await collection
            .find({
              $or: [
                { userId: user._id },
                { userId: user._id.toString() },
                { "user id": user._id },
                { "user id": user._id.toString() },
              ],
            })
            .sort({ timestamp: -1, createdAt: -1, _id: -1 })
            .limit(10)
            .toArray()

          // Transform and add to recent content
          const transformedContent = rawRecentContent.map((item) => ({
            topicTitle: item.Topic || item.topicTitle || item.title || item["Topic Title"] || "Untitled",
            status: item.status || item.Status || "generated",
            createdAt: item.timestamp || item.createdAt || item.created_at || item["created at"] || new Date(),
          }))

          allRecentContent.push(...transformedContent)
        } catch (error) {
          console.error(`Error getting recent content from ${collectionName}:`, error)
        }
      }

      // Sort all content by date and take the 5 most recent
      allRecentContent.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      recentContent = allRecentContent.slice(0, 5)
    }
    } else {
      // Minimal mode - use default data
      weeklyData = [
        { name: "Mon", content: 0 },
        { name: "Tue", content: 0 },
        { name: "Wed", content: 0 },
        { name: "Thu", content: 0 },
        { name: "Fri", content: 0 },
        { name: "Sat", content: 0 },
        { name: "Sun", content: 0 },
      ]
      recentTopics = []
      recentContent = []
    }

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
        currentPeriodStart: planStartDate,
        daysInCurrentPeriod: Math.floor((new Date().getTime() - planStartDate.getTime()) / (1000 * 60 * 60 * 24)),
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
        failed: failedContent,
        scheduled: pendingScheduled,
      },
      monthlyProgress: planLimits.contentLimit > 0 ? Math.round((monthlyContent / planLimits.contentLimit) * 100) : 0,
      weeklyData,
      schedulingStats: {
        totalScheduled: scheduledPosts,
        pendingScheduled,
        postedScheduled,
        failedScheduled,
      },
    }

    // Cache the results
    setCachedStats(user._id.toString(), minimal, stats)

    console.log("📊 Dashboard stats calculated for user:", user.email, {
      totalTopics,
      totalContent,
      monthlyContent,
      plan: userPlan,
      minimal,
      cached: false
    })

    return NextResponse.json({
      success: true,
      stats,
      cached: false
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

export async function POST(request: Request) {
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

    // Clear cache for this user
    const minimalKey = getCacheKey(user._id.toString(), true)
    const fullKey = getCacheKey(user._id.toString(), false)
    statsCache.delete(minimalKey)
    statsCache.delete(fullKey)

    console.log("🗑️ Cache cleared for user:", user.email)

    return NextResponse.json({
      success: true,
      message: "Cache cleared successfully"
    })
  } catch (error) {
    console.error("❌ Error clearing cache:", error)
    return NextResponse.json(
      {
        error: "Failed to clear cache",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
