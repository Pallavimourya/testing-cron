import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import GeneratedStory from "@/models/GeneratedStory"

export async function POST(req: Request) {
  try {
    console.log("🔧 Updating story status...")
    
    await connectDB()

    const data = await req.json()
    const { storyId, status, generatedStory } = data

    // Find and update the story
    const story = await GeneratedStory.findById(storyId)
    
    if (!story) {
      return NextResponse.json({ 
        success: false,
        error: "Story not found" 
      }, { status: 404 })
    }

    // Update the story
    story.status = status || "generated"
    if (generatedStory) {
      story.generatedStory = generatedStory
    }

    await story.save()

    console.log("✅ Story updated:", {
      id: story._id,
      status: story.status,
      contentLength: story.generatedStory?.length || 0
    })

    return NextResponse.json({
      success: true,
      storyId: story._id.toString(),
      status: story.status,
      message: "Story status updated successfully"
    })
  } catch (error) {
    console.error("❌ Error updating story status:", error)
    return NextResponse.json({ 
      success: false,
      error: "Failed to update story status" 
    }, { status: 500 })
  }
}
