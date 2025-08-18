import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/auth"
import connectDB from "@/lib/mongodb"
import ScheduledPost from "@/models/ScheduledPost"
import User from "@/models/User"
import { ISTTime } from "@/lib/utils/ist-time"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const now = new Date()
    console.log(`🕐 Status check - Current time: ${now.toISOString()}`)

    // Get scheduled posts for this user
    const scheduledPosts = await ScheduledPost.find({
      userId: user._id,
      status: "pending",
    }).sort({ scheduledTime: 1 })

    const postedPosts = await ScheduledPost.find({
      userId: user._id,
      status: "posted",
    }).sort({ postedAt: -1 })

    const failedPosts = await ScheduledPost.find({
      userId: user._id,
      status: "failed",
    }).sort({ lastAttempt: -1 })

    // Get next scheduled posts
    const nextScheduledPosts = scheduledPosts.slice(0, 10).map((post) => {
      const timeUntilPost = Math.floor((post.scheduledTime.getTime() - now.getTime()) / (1000 * 60))
      return {
        id: post._id.toString(),
        topic: post.content.substring(0, 50) + "...",
        scheduledFor: post.scheduledTime,
        timeUntilPost: timeUntilPost,
      }
    })

    return NextResponse.json({
      success: true,
      stats: {
        totalScheduled: scheduledPosts.length,
        totalPosted: postedPosts.length,
        totalFailed: failedPosts.length,
      },
      nextScheduledPosts: nextScheduledPosts,
      cronJobInfo: {
        frequency: "Every minute",
        nextRun: "Continuous monitoring",
        status: "Active",
        lastCheck: now.toISOString(),
      },
      timestamp: now.toISOString(),
    })
  } catch (error: any) {
    console.error("Error getting CRON status:", error)
    return NextResponse.json(
      {
        error: "Failed to get status",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
