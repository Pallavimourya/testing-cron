import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import GeneratedStory from "@/models/GeneratedStory"

export async function GET(req: Request, { params }: { params: Promise<{ storyId: string }> }) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { storyId } = await params

    if (!storyId) {
      return NextResponse.json({ error: "Story ID is required" }, { status: 400 })
    }

    await connectDB()
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Find the story by ID and user
    const story = await GeneratedStory.findOne({
      _id: storyId,
      userId: user._id,
    })

    if (!story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 })
    }

    console.log("✅ Story found:", storyId, "Status:", story.status)

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
    console.error("Error fetching story:", error)
    return NextResponse.json({ error: "Failed to fetch story" }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ storyId: string }> }) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { storyId } = await params
    if (!storyId) {
      return NextResponse.json({ error: "Story ID is required" }, { status: 400 })
    }

    const { editedStory } = await req.json()

    await connectDB()
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Update the story
    const updatedStory = await GeneratedStory.findOneAndUpdate(
      {
        _id: storyId,
        userId: user._id,
      },
      {
        $set: {
          editedStory: editedStory,
          updatedAt: new Date(),
        },
      },
      { new: true }
    )

    if (!updatedStory) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      story: {
        _id: updatedStory._id.toString(),
        status: updatedStory.status,
        generatedStory: updatedStory.generatedStory || "",
        editedStory: updatedStory.editedStory || "",
        finalStory: updatedStory.finalStory || "",
        baseStoryData: updatedStory.baseStoryData || {},
        customizationData: updatedStory.customizationData || {},
        createdAt: updatedStory.createdAt,
        updatedAt: updatedStory.updatedAt,
      },
    })
  } catch (error) {
    console.error("Error updating story:", error)
    return NextResponse.json({ error: "Failed to update story" }, { status: 500 })
  }
}
