import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import Topic from "@/models/Topic"
import ApprovedContent from "@/models/ApprovedContent"

export async function POST(request: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { topicId } = await request.json()
    if (!topicId) {
      return NextResponse.json({ error: "Topic ID is required" }, { status: 400 })
    }

    await connectDB()

    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Find the topic first
    const topic = await Topic.findOne({ id: topicId, userId: user._id })
    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 })
    }

    // Delete associated content if exists
    if (topic.contentId) {
      await ApprovedContent.deleteOne({ id: topic.contentId, userId: user._id })
      console.log(`🗑️ Deleted associated content for topic ${topicId}`)
    }

    // Delete the topic
    await Topic.deleteOne({ id: topicId, userId: user._id })

    console.log(`✅ Deleted topic ${topicId}`)

    return NextResponse.json({
      success: true,
      message: "Topic deleted successfully",
      deletedTopicId: topicId,
    })
  } catch (error) {
    console.error("❌ Error deleting topic:", error)
    return NextResponse.json({ error: "Failed to delete topic" }, { status: 500 })
  }
}
