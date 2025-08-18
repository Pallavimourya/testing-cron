import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import Topic from "@/models/Topic"

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

    // Get all topics for the user, sorted by creation date (newest first)
    const topics = await Topic.find({ userId: user._id }).sort({ createdAt: -1 }).lean()

    // Get topic statistics
    const totalTopics = topics.length
    const pendingTopics = topics.filter((t) => t.status === "pending").length
    const approvedTopics = topics.filter((t) => t.status === "approved").length
    const dismissedTopics = topics.filter((t) => t.status === "dismissed").length

    // Calculate remaining topics (max 30)
    const maxLimit = 30
    const currentActiveTopics = topics.filter((t) => t.status === "pending" || t.status === "approved").length
    const remaining = Math.max(0, maxLimit - currentActiveTopics)

    console.log(
      `📊 Topics loaded for user ${user._id}: ${totalTopics} total, ${pendingTopics} pending, ${approvedTopics} approved`,
    )

    return NextResponse.json({
      topics: topics.map((topic) => ({
        id: topic.id,
        title: topic.title,
        status: topic.status,
        contentStatus: topic.contentStatus || "not_generated",
        contentId: topic.contentId || null,
        source: topic.source || "auto",
        generationType: topic.generationType || "auto",
        userPrompt: topic.userPrompt || null,
        createdAt: topic.createdAt,
        updatedAt: topic.updatedAt,
      })),
      total: totalTopics,
      pending: pendingTopics,
      approved: approvedTopics,
      dismissed: dismissedTopics,
      limit: maxLimit,
      remaining: remaining,
      currentCount: currentActiveTopics,
    })
  } catch (error) {
    console.error("Error loading topics:", error)
    return NextResponse.json({ error: "Failed to load topics" }, { status: 500 })
  }
}
