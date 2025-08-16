import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import GeneratedStory from "@/models/GeneratedStory"

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session?.user?.email && !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    
    // Try to find user by email first, then by id
    let user = null
    if (session.user.email) {
      user = await User.findOne({ email: session.user.email })
    }
    
    if (!user && session.user.id) {
      user = await User.findById(session.user.id)
    }
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log("🔍 Looking for latest story for user:", user._id.toString())

    // Find the latest story for this user
    const story = await GeneratedStory.findOne({ userId: user._id }).sort({ createdAt: -1 }).limit(1)

    if (!story) {
      console.log("📝 No story found for user")
      return NextResponse.json({
        success: false,
        message: "No story found",
        story: null,
      })
    }

    console.log("✅ Latest story found:", story._id.toString(), "Status:", story.status)

    return NextResponse.json({
      success: true,
      story: {
        _id: story._id.toString(),
        userId: story.userId.toString(),
        status: story.status,
        generatedStory: story.generatedStory || "",
        editedStory: story.editedStory || "",
        finalStory: story.finalStory || "",
        generatedTopics: story.generatedTopics || [],
        baseStoryData: story.baseStoryData || {},
        customizationData: story.customizationData || {},
        createdAt: story.createdAt,
        updatedAt: story.updatedAt,
      },
    })
  } catch (error) {
    console.error("Error fetching latest story:", error)
    return NextResponse.json({ error: "Failed to fetch latest story" }, { status: 500 })
  }
}
