import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import Topic from "@/models/Topic"
import ApprovedContent from "@/models/ApprovedContent"

export async function POST() {
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

    console.log("🧹 Cleaning up corrupted topics for user:", user._id)

    // Delete topics with corrupted titles or invalid sources
    const deleteResult = await Topic.deleteMany({
      userId: user._id,
      $or: [
        { title: { $regex: "I help founders and creators" } }, // Corrupted titles
        { source: "auto_replacement" }, // Invalid source
        { source: { $nin: ["auto", "manual"] } }, // Invalid source values
        { title: { $regex: "^The Unexpected Lesson That Changed My.*I help founders" } }, // Specific corrupted pattern
      ],
    })

    // Also clean up any associated content
    const contentDeleteResult = await ApprovedContent.deleteMany({
      userId: user._id,
      topicTitle: { $regex: "I help founders and creators" },
    })

    console.log(
      `✅ Cleaned up ${deleteResult.deletedCount} corrupted topics and ${contentDeleteResult.deletedCount} associated content`,
    )

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${deleteResult.deletedCount} corrupted topics successfully`,
      deletedTopics: deleteResult.deletedCount,
      deletedContent: contentDeleteResult.deletedCount,
    })
  } catch (error) {
    console.error("❌ Error cleaning up topics:", error)
    return NextResponse.json({ error: "Failed to clean up topics" }, { status: 500 })
  }
}
