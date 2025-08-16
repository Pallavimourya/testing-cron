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

    console.log("🔍 Checking ApprovedContent table for user:", user._id.toString())

    // Get all content for this user
    const allContent = await ApprovedContent.find({ userId: user._id })
    console.log("📊 Total content in ApprovedContent table:", allContent.length)

    // Show sample content
    const sampleContent = allContent.slice(0, 3).map((item: any) => ({
      id: item.id,
      topicId: item.topicId,
      topicTitle: item.topicTitle,
      content: item.content ? item.content.substring(0, 100) + "..." : "No content",
      status: item.status,
      createdAt: item.createdAt,
      generatedAt: item.generatedAt
    }))

    return NextResponse.json({
      success: true,
      userId: user._id.toString(),
      email: user.email,
      totalContent: allContent.length,
      sampleContent
    })

  } catch (error) {
    console.error("❌ Error checking approved content:", error)
    return NextResponse.json({ 
      error: "Failed to check approved content",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
