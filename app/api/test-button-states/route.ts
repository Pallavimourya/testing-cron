import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Topic from "@/models/Topic"

export async function GET(req: Request) {
  try {
    await connectDB()
    
    // Get all topics with their content status
    const topics = await Topic.find({}).select('id title status contentStatus contentId')
    
    console.log("📊 All topics with content status:")
    topics.forEach(topic => {
      console.log({
        id: topic.id,
        title: topic.title,
        status: topic.status,
        contentStatus: topic.contentStatus,
        contentId: topic.contentId,
        shouldBeDisabled: topic.contentStatus === "generated" || topic.contentStatus === "generating" || !!topic.contentId
      })
    })
    
    return NextResponse.json({
      success: true,
      topics: topics.map(topic => ({
        id: topic.id,
        title: topic.title,
        status: topic.status,
        contentStatus: topic.contentStatus,
        contentId: topic.contentId,
        shouldBeDisabled: topic.contentStatus === "generated" || topic.contentStatus === "generating" || !!topic.contentId
      }))
    })
    
  } catch (error: any) {
    console.error("❌ Test failed:", error)
    return NextResponse.json({
      success: false,
      message: "Test failed",
      error: error.message
    }, { status: 500 })
  }
}
