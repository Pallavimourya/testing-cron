import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import GeneratedStory from "@/models/GeneratedStory"

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

    console.log("🔍 Fetching all stories for user:", user._id.toString())

    // Find all stories for this user
    const stories = await GeneratedStory.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .lean() as any

    console.log(`✅ Found ${stories.length} stories for user`)

    return NextResponse.json({
      success: true,
      stories: stories.map((story: any) => ({
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
      })),
    })
  } catch (error) {
    console.error("Error fetching stories:", error)
    return NextResponse.json({ error: "Failed to fetch stories" }, { status: 500 })
  }
}
