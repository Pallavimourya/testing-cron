import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import GeneratedStory from "@/models/GeneratedStory"

export async function POST(req: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { storyId, editedStory, finalStory, baseStoryData, customizationData } = await req.json()

    await connectDB()
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // If storyId is provided, update existing story
    if (storyId) {
      console.log("📝 Updating existing story:", storyId)
      
      const story = await GeneratedStory.findOne({
        _id: storyId,
        userId: user._id
      })

      if (!story) {
        return NextResponse.json({ error: "Story not found" }, { status: 404 })
      }

      // Update story with edited content
      if (editedStory !== undefined) {
        story.editedStory = editedStory
      }
      if (finalStory !== undefined) {
        story.finalStory = finalStory
      }
      story.status = "approved"
      story.updatedAt = new Date()
      await story.save()

      console.log("✅ Story updated successfully")
      return NextResponse.json({
        success: true,
        message: "Story updated successfully",
        story
      })
    }

    // If no storyId, handle form data saving (existing functionality)
    if (!baseStoryData) {
      return NextResponse.json({ error: "Missing baseStoryData" }, { status: 400 })
    }

    if (!customizationData) {
      return NextResponse.json({ error: "Missing customizationData" }, { status: 400 })
    }

    console.log("💾 Saving form data for user:", user._id.toString())

    // Check if user has an existing story
    let existingStory = await GeneratedStory.findOne({
      userId: user._id,
      status: { $in: ["generated", "edited", "approved"] }
    }).sort({ createdAt: -1 })

    if (existingStory) {
      // Update existing story with new form data
      existingStory.baseStoryData = baseStoryData
      existingStory.customizationData = customizationData
      existingStory.updatedAt = new Date()
      await existingStory.save()

      console.log("✅ Updated existing story with new form data")
    } else {
      // Create a new story record with form data (but not generated yet)
      const newStory = new GeneratedStory({
        userId: user._id,
        baseStoryData,
        customizationData,
        generatedStory: "",
        status: "draft",
      })
      await newStory.save()

      console.log("✅ Created new story record with form data")
    }

    return NextResponse.json({
      success: true,
      message: "Form data saved successfully",
    })
  } catch (error) {
    console.error("❌ Error updating story:", error)
    return NextResponse.json({ error: "Failed to update story" }, { status: 500 })
  }
}
