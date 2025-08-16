import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Topic from "@/models/Topic"

export async function GET() {
  try {
    await connectDB()

    // Find dismissed topics that are older than 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    const dismissedTopics = await Topic.find({
      status: "dismissed",
      updatedAt: { $lt: twentyFourHoursAgo }
    })

    if (dismissedTopics.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No dismissed topics to clean up",
        cleanedCount: 0
      })
    }

    // Delete dismissed topics
    const result = await Topic.deleteMany({
      status: "dismissed",
      updatedAt: { $lt: twentyFourHoursAgo }
    })

    console.log(`🧹 Cleaned up ${result.deletedCount} dismissed topics`)

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${result.deletedCount} dismissed topics`,
      cleanedCount: result.deletedCount,
      cutoffTime: twentyFourHoursAgo.toISOString()
    })

  } catch (error) {
    console.error("Error cleaning up dismissed topics:", error)
    return NextResponse.json({ 
      error: "Failed to clean up dismissed topics",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
