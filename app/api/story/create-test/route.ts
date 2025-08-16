import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import GeneratedStory from "@/models/GeneratedStory"

export async function POST(req: Request) {
  try {
    console.log("🔧 Creating test story...")
    
    await connectDB()

    const data = await req.json()

    // Create a new test story
    const testStory = new GeneratedStory({
      userId: data.userId || "test_user_123",
      status: data.status || "generated",
      generatedStory: data.generatedStory,
      editedStory: data.editedStory || "",
      finalStory: data.finalStory || "",
      generatedTopics: data.generatedTopics || [],
      baseStoryData: data.baseStoryData || {},
      customizationData: data.customizationData || {},
    })

    await testStory.save()

    console.log("✅ Test story created:", {
      id: testStory._id,
      status: testStory.status,
      storyLength: testStory.generatedStory?.length || 0
    })

    return NextResponse.json({
      success: true,
      storyId: testStory._id.toString(),
      status: testStory.status,
      message: "Test story created successfully"
    })
  } catch (error) {
    console.error("❌ Error creating test story:", error)
    return NextResponse.json({ 
      success: false,
      error: "Failed to create test story" 
    }, { status: 500 })
  }
}
