import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import GeneratedStory from "@/models/GeneratedStory"

export async function GET(req: Request, { params }: { params: Promise<{ storyId: string }> }) {
  try {
    const { storyId } = await params
    
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const story = await GeneratedStory.findOne({
      _id: storyId,
      userId: user._id,
    })

    if (!story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 })
    }

    return NextResponse.json({
      storyId: story._id,
      status: story.status,
      generatedStory: story.generatedStory,
      editedStory: story.editedStory,
      finalStory: story.finalStory,
      generatedTopics: story.generatedTopics,
      updatedAt: story.updatedAt,
    })
  } catch (error) {
    console.error("Error fetching story status:", error)
    return NextResponse.json({ error: "Failed to fetch story status" }, { status: 500 })
  }
}
