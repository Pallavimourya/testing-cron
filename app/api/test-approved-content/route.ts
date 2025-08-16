import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import ApprovedContent from "@/models/ApprovedContent"

export async function POST(req: Request) {
  try {
    await connectDB()
    
    // Test creating a sample approved content
    const testContent = new ApprovedContent({
      topicId: `test-topic-${Date.now()}`,
      userId: "test-user-id",
      topicTitle: "Test Topic",
      content: "This is a test content for verification",
      hashtags: ["#test", "#verification"],
      keyPoints: ["Test point 1", "Test point 2"],
      platform: "linkedin",
      status: "generated",
      makeWebhookId: "test-webhook-id",
    })
    
    await testContent.save()
    
    console.log("✅ Test content saved successfully:", testContent.id)
    
    // Clean up - delete the test content
    await ApprovedContent.findByIdAndDelete(testContent._id)
    
    return NextResponse.json({
      success: true,
      message: "ApprovedContent model is working correctly",
      testId: testContent.id
    })
    
  } catch (error: any) {
    console.error("❌ Test failed:", error)
    return NextResponse.json({
      success: false,
      message: "Test failed",
      error: error.message,
      details: error
    }, { status: 500 })
  }
}
