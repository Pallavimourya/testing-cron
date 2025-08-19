import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import ScheduledPost from "@/models/ScheduledPost"
import User from "@/models/User"
import { ISTTime } from "@/lib/utils/ist-time"

// Helper function to post to LinkedIn (simplified version)
async function postToLinkedIn(scheduledPost: any, user: any) {
  try {
    console.log("📤 Attempting to post scheduled content to LinkedIn:", {
      postId: scheduledPost._id,
      contentLength: scheduledPost.content.length,
      hasImage: !!scheduledPost.imageUrl,
      linkedinId: user.linkedinProfile?.id,
    })

    // Prepare LinkedIn post data
    const LINKEDIN_UGC_POST_URL = "https://api.linkedin.com/v2/ugcPosts"

    const postBody: any = {
      author: `urn:li:person:${user.linkedinProfile?.id}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: {
            text: scheduledPost.content,
          },
          shareMediaCategory: "NONE",
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    }

    // Post to LinkedIn
    const response = await fetch(LINKEDIN_UGC_POST_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${user.linkedinAccessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(postBody),
    })

    if (response.ok) {
      const linkedinResponse = await response.json()
      console.log("✅ Successfully posted to LinkedIn:", linkedinResponse.id)

      // Generate LinkedIn post URL
      const linkedinUrl = `https://www.linkedin.com/feed/update/${linkedinResponse.id}/`

      return {
        success: true,
        linkedinPostId: linkedinResponse.id,
        linkedinUrl: linkedinUrl,
      }
    } else {
      const errorData = await response.text()
      console.error("❌ Failed to post to LinkedIn:", response.status, errorData)
      
      return {
        success: false,
        error: `LinkedIn posting failed: ${response.status} ${response.statusText}`,
        details: errorData,
      }
    }
  } catch (error: any) {
    console.error("❌ Error posting to LinkedIn:", error)
    return {
      success: false,
      error: error.message || "Failed to post to LinkedIn",
    }
  }
}

export async function GET(req: Request) {
  try {
    // Simple authentication for external cron services
    const url = new URL(req.url)
    const token = url.searchParams.get('token')
    
    if (token !== process.env.EXTERNAL_CRON_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("🔄 External cron job trigger started at", ISTTime.getCurrentISTString())

    await connectDB()

    // Get current UTC time
    const currentUTC = ISTTime.getCurrentUTC()
    console.log("⏰ Current UTC time:", currentUTC.toISOString())

    // Find all pending scheduled posts that are due
    const dueScheduledPosts = await ScheduledPost.find({
      status: "pending",
      scheduledTime: { $lte: currentUTC },
      attempts: { $lt: 3 }, // Don't retry more than 3 times
    }).sort({ scheduledTime: 1 })

    console.log(`📋 Found ${dueScheduledPosts.length} due scheduled posts`)

    if (dueScheduledPosts.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No scheduled posts due",
        postsProcessed: 0,
        currentTime: ISTTime.getCurrentISTString(),
      })
    }

    let successCount = 0
    let failureCount = 0
    const results = []

    // Process each scheduled post
    for (const scheduledPost of dueScheduledPosts) {
      try {
        console.log(`🔄 Processing scheduled post ${scheduledPost._id}`)

        // Get user with LinkedIn credentials
        const user = await User.findById(scheduledPost.userId).select(
          "+linkedinAccessToken +linkedinTokenExpiry +linkedinProfile",
        )

        if (!user) {
          console.error(`❌ User not found for scheduled post ${scheduledPost._id}`)
          await ScheduledPost.findByIdAndUpdate(scheduledPost._id, {
            status: "failed",
            error: "User not found",
            attempts: scheduledPost.attempts + 1,
            lastAttempt: new Date(),
          })
          failureCount++
          results.push({
            postId: scheduledPost._id,
            status: "failed",
            error: "User not found",
          })
          continue
        }

        // Check LinkedIn connection
        if (
          !user.linkedinAccessToken ||
          !user.linkedinTokenExpiry ||
          new Date(user.linkedinTokenExpiry) <= new Date()
        ) {
          console.error(`❌ LinkedIn not connected or token expired for user ${user.email}`)
          await ScheduledPost.findByIdAndUpdate(scheduledPost._id, {
            status: "failed",
            error: "LinkedIn account not connected or token expired",
            attempts: scheduledPost.attempts + 1,
            lastAttempt: new Date(),
          })
          failureCount++
          results.push({
            postId: scheduledPost._id,
            status: "failed",
            error: "LinkedIn not connected",
          })
          continue
        }

        // Update attempt count
        await ScheduledPost.findByIdAndUpdate(scheduledPost._id, {
          attempts: scheduledPost.attempts + 1,
          lastAttempt: new Date(),
        })

        // Post to LinkedIn
        const postResult = await postToLinkedIn(scheduledPost, user)

        if (postResult.success) {
          // Update scheduled post as posted
          await ScheduledPost.findByIdAndUpdate(scheduledPost._id, {
            status: "posted",
            linkedinPostId: postResult.linkedinPostId,
            linkedinUrl: postResult.linkedinUrl,
            postedAt: new Date(),
            error: null, // Clear any previous errors
          })

          console.log(`✅ Successfully posted scheduled content ${scheduledPost._id}`)
          successCount++
          results.push({
            postId: scheduledPost._id,
            status: "posted",
            linkedinPostId: postResult.linkedinPostId,
            linkedinUrl: postResult.linkedinUrl,
          })
        } else {
          // Update scheduled post as failed
          await ScheduledPost.findByIdAndUpdate(scheduledPost._id, {
            status: "failed",
            error: postResult.error,
          })

          console.error(`❌ Failed to post scheduled content ${scheduledPost._id}:`, postResult.error)
          failureCount++
          results.push({
            postId: scheduledPost._id,
            status: "failed",
            error: postResult.error,
          })
        }
      } catch (error: any) {
        console.error(`❌ Error processing scheduled post ${scheduledPost._id}:`, error)

        // Update scheduled post as failed
        await ScheduledPost.findByIdAndUpdate(scheduledPost._id, {
          status: "failed",
          error: error.message || "Unknown error occurred",
          attempts: scheduledPost.attempts + 1,
          lastAttempt: new Date(),
        })

        failureCount++
        results.push({
          postId: scheduledPost._id,
          status: "failed",
          error: error.message || "Unknown error",
        })
      }
    }

    console.log(`✅ External cron job completed: ${successCount} successful, ${failureCount} failed`)

    return NextResponse.json({
      success: true,
      message: `Processed ${dueScheduledPosts.length} scheduled posts`,
      postsProcessed: dueScheduledPosts.length,
      successCount,
      failureCount,
      results,
      currentTime: ISTTime.getCurrentISTString(),
    })
  } catch (error: any) {
    console.error("❌ External cron job error:", error)
    return NextResponse.json({ error: error.message || "External cron job failed" }, { status: 500 })
  }
}
