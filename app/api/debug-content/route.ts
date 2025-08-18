import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import ApprovedContent from "@/models/ApprovedContent"

export async function GET(req: Request) {
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

    console.log("🔍 Debug: Checking content for user:", user._id.toString())

    // Check ApprovedContent table only
    const approvedContent = await ApprovedContent.find({ userId: user._id })
    console.log("📊 ApprovedContent table:", approvedContent.length, "records")

    // Show sample data from ApprovedContent
    const sampleApprovedContent = approvedContent.slice(0, 3).map((item: any) => ({
      id: item.id,
      topicId: item.topicId,
      userId: item.userId,
      topicTitle: item.topicTitle,
      content: item.content ? item.content.substring(0, 100) + "..." : "No content",
      hashtags: item.hashtags,
      keyPoints: item.keyPoints,
      status: item.status,
      createdAt: item.createdAt
    }))

    return NextResponse.json({
      success: true,
      debug: {
        userId: user._id.toString(),
        email: user.email,
        approvedContentCount: approvedContent.length,
        sampleApprovedContent
      }
    })

  } catch (error) {
    console.error("❌ Debug error:", error)
    return NextResponse.json({ 
      error: "Debug failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
