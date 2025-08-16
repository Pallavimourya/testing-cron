import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import GeneratedStory from "@/models/GeneratedStory"
import Topic from "@/models/Topic"

export async function POST(req: Request) {
  try {
    const session = await getServerSession()
    console.log("🔍 Session data:", session?.user ? { id: session.user.id, email: session.user.email } : "No session")

    if (!session?.user?.email && !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { storyId, topicId } = await req.json()
    console.log("📝 Approval request:", { storyId, topicId })

    if (!storyId || !topicId) {
      return NextResponse.json({ error: "Story ID and Topic ID are required" }, { status: 400 })
    }

    await connectDB()

    // Try to find user by email first, then by id
    let user = null
    if (session.user.email) {
      user = await User.findOne({ email: session.user.email })
      console.log("👤 User found by email:", user ? user._id.toString() : "Not found")
    }

    if (!user && session.user.id) {
      user = await User.findById(session.user.id)
      console.log("👤 User found by id:", user ? user._id.toString() : "Not found")
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Find the story
    const story = await GeneratedStory.findOne({ _id: storyId, userId: user._id })
    console.log("📚 Story lookup:", { storyId, userId: user._id.toString(), storyFound: !!story })

    if (!story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 })
    }

    // Find the topic in the story's generated topics
    const topicIndex = story.generatedTopics.findIndex((topic: any) => topic.id === topicId)
    console.log("🎯 Topic lookup:", { topicId, topicIndex, totalTopics: story.generatedTopics.length })

    if (topicIndex === -1) {
      return NextResponse.json({ error: "Topic not found in story" }, { status: 404 })
    }

    const topicTitle = story.generatedTopics[topicIndex].title

    // Check current topic count in Topic Bank
    const currentTopicCount = await Topic.countDocuments({
      userId: user._id,
      status: { $in: ["pending", "approved"] },
    })

    if (currentTopicCount >= 30) {
      return NextResponse.json(
        {
          error:
            "You have reached the maximum limit of 30 topics in Topic Bank. Please approve or dismiss some topics first.",
          currentCount: currentTopicCount,
          maxLimit: 30,
        },
        { status: 400 },
      )
    }

    // Update the topic status in the story
    story.generatedTopics[topicIndex].status = "approved"
    story.generatedTopics[topicIndex].approvedAt = new Date()
    await story.save()

    const uniqueTopicId = `topic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Add the topic to the Topic Bank with proper initialization
    const topicDocument = {
      id: uniqueTopicId,
      userId: user._id,
      storyId: story._id,
      title: topicTitle,
      status: "approved", // Set as approved since user approved it from profile
      source: "story",
      generationType: "auto",
      contentStatus: "not_generated", // Initialize content status properly
      contentId: null, // Initialize as null
      content: null, // Initialize as null
      hashtags: [],
      keyPoints: [],
      imageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const createdTopic = await Topic.create(topicDocument)

    console.log(`✅ Topic approved and added to Topic Bank: ${topicTitle}`)
    console.log(`🆔 Topic ID: ${uniqueTopicId}`)
    console.log(`📊 Content Status: ${createdTopic.contentStatus}`)

    return NextResponse.json({
      success: true,
      message: "Topic approved and added to Topic Bank",
      topicId: uniqueTopicId,
      contentStatus: "not_generated",
    })
  } catch (error: any) {
    console.error("Error approving topic:", error)
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
    })
    return NextResponse.json({ error: "Failed to approve topic" }, { status: 500 })
  }
}
