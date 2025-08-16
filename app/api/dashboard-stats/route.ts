import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import Topic from "@/models/Topic"
import ApprovedContent from "@/models/ApprovedContent"
import mongoose from "mongoose"

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

    // Get current month start
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const startOfWeek = new Date()
    startOfWeek.setDate(startOfWeek.getDate() - 7)

    // Get topics stats
    const totalTopics = await Topic.countDocuments({ userId: user._id })
    const approvedTopics = await Topic.countDocuments({ userId: user._id, status: "approved" })
    const pendingTopics = await Topic.countDocuments({ userId: user._id, status: "pending" })

    // Get content stats from both ApprovedContent model and raw collection
    let totalContent = await ApprovedContent.countDocuments({ userId: user._id })
    let generatedContent = await ApprovedContent.countDocuments({ userId: user._id, status: "generated" })
    let approvedContent = await ApprovedContent.countDocuments({ userId: user._id, status: "approved" })
    let postedContent = await ApprovedContent.countDocuments({ userId: user._id, status: "posted" })
    let monthlyContent = await ApprovedContent.countDocuments({
      userId: user._id,
      createdAt: { $gte: startOfMonth },
    })

    // Also check raw collection for additional content
    const collection = mongoose.connection.db?.collection("approvedcontents")
    if (collection) {
      const rawFilter = {
        $or: [
          { email: user.email },
          { "user id": user._id.toString() },
          { user_id: user._id.toString() },
          { userId: user._id },
          { userId: user._id.toString() },
        ],
      }

      const rawTotalContent = await collection.countDocuments(rawFilter)
      const rawGeneratedContent = await collection.countDocuments({ ...rawFilter, status: "generated" })
      const rawApprovedContent = await collection.countDocuments({ ...rawFilter, status: "approved" })
      const rawPostedContent = await collection.countDocuments({ ...rawFilter, status: "posted" })

      // Get monthly content from raw collection
      const rawMonthlyContent = await collection.countDocuments({
        ...rawFilter,
        $or: [
          { createdAt: { $gte: startOfMonth } },
          { timestamp: { $gte: startOfMonth } },
          { created_at: { $gte: startOfMonth } },
        ],
      })

      // Use the higher count from either source
      totalContent = Math.max(totalContent, rawTotalContent)
      generatedContent = Math.max(generatedContent, rawGeneratedContent)
      approvedContent = Math.max(approvedContent, rawApprovedContent)
      postedContent = Math.max(postedContent, rawPostedContent)
      monthlyContent = Math.max(monthlyContent, rawMonthlyContent)
    }

    // Get recent activity from both sources
    const recentTopics = await Topic.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title status createdAt")

    let recentContent = await ApprovedContent.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("topicTitle status createdAt")

    // Also get recent content from raw collection
    if (collection) {
      const rawRecentContent = await collection
        .find({
          $or: [
            { email: user.email },
            { "user id": user._id.toString() },
            { user_id: user._id.toString() },
            { userId: user._id },
            { userId: user._id.toString() },
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
      monthlyLimit: 30,
      remainingContent: Math.max(0, 30 - monthlyContent),
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
      monthlyProgress: Math.round((monthlyContent / 30) * 100),
    }

    console.log("📊 Dashboard stats calculated:", {
      totalTopics,
      totalContent,
      monthlyContent,
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
