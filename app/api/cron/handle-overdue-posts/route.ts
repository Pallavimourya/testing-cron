import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/auth"
import connectDB from "@/lib/mongodb"
import ScheduledPost from "@/models/ScheduledPost"
import User from "@/models/User"
import { ISTTime } from "@/lib/utils/ist-time"

export async function POST(request: Request) {
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

    const currentUTC = ISTTime.getCurrentUTC()
    console.log(`🕐 Current time (UTC): ${currentUTC.toISOString()}`)
    console.log(`🕐 Current time (IST): ${ISTTime.getCurrentISTString()}`)

    // Find failed scheduled posts for this user that can be retried
    const failedPosts = await ScheduledPost.find({
      userId: user._id,
      status: "failed",
      attempts: { $lt: 3 }, // Don't retry posts that have failed 3 times
    }).sort({ scheduledTime: 1 })

    console.log(`📊 Found ${failedPosts.length} failed posts that can be retried`)

    if (failedPosts.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No failed posts to retry",
        stats: {
          totalFailed: 0,
          totalProcessed: 0,
          currentTime: ISTTime.getCurrentISTString(),
        },
      })
    }

    let totalProcessed = 0

    // Reset failed posts to pending status so they can be retried
    for (const post of failedPosts) {
      try {
        await ScheduledPost.findByIdAndUpdate(post._id, {
          status: "pending",
          error: null, // Clear the error
          lastAttempt: new Date(),
        })
        totalProcessed++
        console.log(`🔄 Reset failed post ${post._id} to pending status`)
      } catch (error) {
        console.error(`❌ Error resetting failed post ${post._id}:`, error)
      }
    }

    // Now trigger the external cron to process these pending posts
    try {
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
      const cronUrl = `${baseUrl}/api/cron/external-auto-post`
      
      console.log(`📡 Triggering external cron at: ${cronUrl}`)
      
      const response = await fetch(cronUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.EXTERNAL_CRON_TOKEN}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const cronResult = await response.json()
        console.log("✅ External cron triggered successfully:", cronResult)
        
        return NextResponse.json({
          success: true,
          message: `Reset ${totalProcessed} failed posts to pending and triggered external cron`,
          stats: {
            totalFailed: failedPosts.length,
            totalProcessed,
            cronResult,
            currentTime: ISTTime.getCurrentISTString(),
          },
        })
      } else {
        console.error("❌ Failed to trigger external cron:", response.status)
        const errorText = await response.text()
        
        return NextResponse.json({
          success: false,
          message: `Reset ${totalProcessed} failed posts but failed to trigger external cron`,
          error: `Cron trigger failed: ${response.status} - ${errorText}`,
          stats: {
            totalFailed: failedPosts.length,
            totalProcessed,
            currentTime: ISTTime.getCurrentISTString(),
          },
        })
      }
    } catch (error: any) {
      console.error("❌ Error triggering external cron:", error)
      
      return NextResponse.json({
        success: false,
        message: `Reset ${totalProcessed} failed posts but failed to trigger external cron`,
        error: error.message,
        stats: {
          totalFailed: failedPosts.length,
          totalProcessed,
          currentTime: ISTTime.getCurrentISTString(),
        },
      })
    }
  } catch (error: any) {
    console.error("❌ Error handling overdue posts:", error)
    return NextResponse.json(
      { error: error.message || "Failed to handle overdue posts" },
      { status: 500 }
    )
  }
}
