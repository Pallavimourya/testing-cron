import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/auth"
import connectDB from "@/lib/mongodb"
import ScheduledPost from "@/models/ScheduledPost"
import User from "@/models/User"
import { ISTTime } from "@/lib/utils/ist-time"
import mongoose from "mongoose"

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

    let totalProcessed = 0
    let totalFailed = 0

    // 1. Handle ScheduledPost model (new system)
    console.log("📋 Checking ScheduledPost model for failed posts...")
    const failedScheduledPosts = await ScheduledPost.find({
      userId: user._id,
      status: "failed",
      attempts: { $lt: 3 }, // Don't retry posts that have failed 3 times
    }).sort({ scheduledTime: 1 })

    console.log(`📊 Found ${failedScheduledPosts.length} failed posts in ScheduledPost model`)

    for (const post of failedScheduledPosts) {
      try {
        await ScheduledPost.findByIdAndUpdate(post._id, {
          status: "pending",
          error: null, // Clear the error
          lastAttempt: new Date(),
        })
        totalProcessed++
        console.log(`🔄 Reset failed ScheduledPost ${post._id} to pending status`)
      } catch (error) {
        console.error(`❌ Error resetting failed ScheduledPost ${post._id}:`, error)
      }
    }

    // 2. Handle existing collections (old system)
    console.log("📋 Checking existing collections for overdue posts...")
    const collections = ["approvedcontents", "linkdin-content-generation", "generatedcontents"]
    
    if (!mongoose.connection.db) {
      console.error("❌ Database connection not established")
      return NextResponse.json({ error: "Database connection not established" }, { status: 500 })
    }
    
    for (const collectionName of collections) {
      try {
        const collection = mongoose.connection.db.collection(collectionName)
        
        // Find scheduled posts that are past their time and not posted
        const overdueQuery = {
          $and: [
            { $or: [{ status: "scheduled" }, { Status: "scheduled" }] },
            { $or: [{ scheduledFor: { $lt: currentUTC } }, { scheduled_for: { $lt: currentUTC } }] },
            // Ensure the post hasn't been posted already
            { $or: [
              { postedAt: { $exists: false } },
              { posted_at: { $exists: false } },
              { linkedinPostId: { $exists: false } },
              { linkedin_post_id: { $exists: false } }
            ] }
          ],
        }

        const overduePosts = await collection.find(overdueQuery).toArray()
        console.log(`📊 Found ${overduePosts.length} overdue posts in ${collectionName}`)

        for (const post of overduePosts) {
          try {
            await collection.updateOne(
              { _id: post._id },
              {
                $set: {
                  status: "failed",
                  Status: "failed",
                  error: "Post was overdue and not processed",
                  updatedAt: new Date(),
                  updated_at: new Date(),
                },
              }
            )
            totalFailed++
            console.log(`🔄 Marked overdue post ${post._id} in ${collectionName} as failed`)
          } catch (error) {
            console.error(`❌ Error marking overdue post ${post._id} as failed:`, error)
          }
        }
      } catch (error) {
        console.error(`❌ Error checking collection ${collectionName}:`, error)
      }
    }

    // Now trigger the external cron to process these posts
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
          message: `Reset ${totalProcessed} failed posts to pending and marked ${totalFailed} overdue posts as failed. External cron triggered.`,
          stats: {
            totalProcessed,
            totalFailed,
            cronResult,
            currentTime: ISTTime.getCurrentISTString(),
          },
        })
      } else {
        console.error("❌ Failed to trigger external cron:", response.status)
        const errorText = await response.text()
        
        return NextResponse.json({
          success: false,
          message: `Reset ${totalProcessed} failed posts and marked ${totalFailed} overdue posts, but failed to trigger external cron`,
          error: `Cron trigger failed: ${response.status} - ${errorText}`,
          stats: {
            totalProcessed,
            totalFailed,
            currentTime: ISTTime.getCurrentISTString(),
          },
        })
      }
    } catch (error: any) {
      console.error("❌ Error triggering external cron:", error)
      
      return NextResponse.json({
        success: false,
        message: `Reset ${totalProcessed} failed posts and marked ${totalFailed} overdue posts, but failed to trigger external cron`,
        error: error.message,
        stats: {
          totalProcessed,
          totalFailed,
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
