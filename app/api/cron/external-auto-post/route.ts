import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import ScheduledPost from "@/models/ScheduledPost"
import User from "@/models/User"
import { ISTTime } from "@/lib/utils/ist-time"
import { LinkedInService } from "@/lib/services/linkedin-service"

export async function GET(req: Request) {
  try {
    console.log("🔄 External cron job triggered at", ISTTime.getCurrentISTString())
    
    // Check for auth header for external cron services
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'BzbHyiKVrc6rDLWHn4uYLHo+s1WkHp2ucuzsCi/euRI='
    
    console.log("🔍 Auth debug:", {
      hasAuthHeader: !!authHeader,
      authHeaderValue: authHeader ? authHeader.substring(0, 20) + '...' : 'none',
      expectedSecret: cronSecret.substring(0, 10) + '...',
      expectedHeader: `Bearer ${cronSecret}`,
      url: req.url
    })
    
    // Allow header authentication for external cron services
    const isAuthenticated = authHeader === `Bearer ${cronSecret}`
    
    if (!isAuthenticated) {
      console.log("❌ Cron job authentication failed")
      return NextResponse.json({ 
        error: "Unauthorized", 
        message: "Use Authorization: Bearer CRON_SECRET header",
        debug: {
          hasAuthHeader: !!authHeader,
          expectedSecret: cronSecret.substring(0, 10) + '...',
        }
      }, { status: 401 })
    }

    console.log("✅ External cron authentication successful")
    console.log("🔄 External cron job trigger started at", ISTTime.getCurrentISTString())

    await connectDB()

    // Get current UTC time
    const currentUTC = ISTTime.getCurrentUTC()
    console.log("⏰ Current UTC time:", currentUTC.toISOString())

    // Find all pending scheduled posts that are due (including overdue posts)
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
        cronService: "external-cron-job.org",
        authStatus: "authenticated"
      })
    }

    let successCount = 0
    let failureCount = 0
    const results = []

    // Process each scheduled post
    for (const scheduledPost of dueScheduledPosts) {
      try {
        console.log(`🔄 Processing scheduled post ${scheduledPost._id} (scheduled for: ${scheduledPost.scheduledTime})`)

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
          results.push({ postId: scheduledPost._id, status: "failed", error: "User not found" })
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
          results.push({ postId: scheduledPost._id, status: "failed", error: "LinkedIn not connected" })
          continue
        }

        // Update attempt count
        await ScheduledPost.findByIdAndUpdate(scheduledPost._id, {
          attempts: scheduledPost.attempts + 1,
          lastAttempt: new Date(),
        })

        // Post to LinkedIn using LinkedInService
        const linkedinService = new LinkedInService()
        const postResult = await linkedinService.postToLinkedIn(
          scheduledPost.content,
          scheduledPost.imageUrl,
          user.linkedinAccessToken,
          user.linkedinProfile?.id
        )

        if (postResult.success) {
          // Update scheduled post as posted
          await ScheduledPost.findByIdAndUpdate(scheduledPost._id, {
            status: "posted",
            linkedinPostId: postResult.postId,
            linkedinUrl: postResult.url,
            postedAt: new Date(),
            error: null,
          })

          successCount++
          results.push({
            postId: scheduledPost._id,
            status: "posted",
            linkedinPostId: postResult.postId,
            linkedinUrl: postResult.url,
          })

          console.log(`✅ Successfully posted scheduled post ${scheduledPost._id} to LinkedIn`)
        } else {
          // Update scheduled post as failed
          await ScheduledPost.findByIdAndUpdate(scheduledPost._id, {
            status: "failed",
            error: postResult.error,
            attempts: scheduledPost.attempts + 1,
            lastAttempt: new Date(),
          })

          failureCount++
          results.push({
            postId: scheduledPost._id,
            status: "failed",
            error: postResult.error,
          })

          console.error(`❌ Failed to post scheduled post ${scheduledPost._id}: ${postResult.error}`)
        }
      } catch (error: any) {
        console.error(`❌ Error processing scheduled post ${scheduledPost._id}:`, error)

        // Update scheduled post as failed
        await ScheduledPost.findByIdAndUpdate(scheduledPost._id, {
          status: "failed",
          error: error.message || "Unknown error",
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

    console.log(`🎉 External cron job completed: ${successCount} successful, ${failureCount} failed`)

    return NextResponse.json({
      success: true,
      message: `External cron processed ${successCount + failureCount} posts`,
      postsProcessed: successCount + failureCount,
      successCount,
      failureCount,
      results,
      currentTime: ISTTime.getCurrentISTString(),
      cronService: "external-cron-job.org",
      authStatus: "authenticated"
    })
  } catch (error: any) {
    console.error("❌ Error in external cron job:", error)
    return NextResponse.json({
      success: false,
      error: error.message || "Internal server error",
      currentTime: ISTTime.getCurrentISTString(),
      cronService: "external-cron-job.org"
    }, { status: 500 })
  }
}

// Also handle POST requests for manual testing
export async function POST(request: Request) {
  return GET(request)
}
