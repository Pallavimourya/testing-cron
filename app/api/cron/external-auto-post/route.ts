import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import mongoose from "mongoose"

// Helper function to post to LinkedIn
async function postToLinkedIn(content: string, imageUrl: string | null, user: any) {
  try {
    console.log("📤 Attempting to post content to LinkedIn:", {
      contentLength: content.length,
      hasImage: !!imageUrl,
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
            text: content,
          },
          shareMediaCategory: "NONE",
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    }

    // Add image if available
    if (imageUrl) {
      postBody.specificContent["com.linkedin.ugc.ShareContent"].shareMediaCategory = "IMAGE"
      postBody.specificContent["com.linkedin.ugc.ShareContent"].media = [
        {
          status: "READY",
          description: { text: "Image attachment" },
          media: imageUrl,
          title: { text: "LinkedIn Post Image" },
        },
      ]
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
      return { success: false, error: `LinkedIn posting failed: ${response.status} ${response.statusText}`, details: errorData }
    }
  } catch (error: any) {
    console.error("❌ Error posting to LinkedIn:", error)
    return { success: false, error: error.message || "Failed to post to LinkedIn" }
  }
}

// Helper function to get current IST time
function getCurrentISTString() {
  const now = new Date()
  const istOffset = 5.5 * 60 * 60 * 1000 // IST is UTC+5:30
  const istTime = new Date(now.getTime() + istOffset)
  return istTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
}

export async function GET(req: Request) {
  try {
    console.log("🔄 External cron job triggered at", getCurrentISTString())

    // More flexible authentication for external cron services
    const url = new URL(req.url)
    const token = url.searchParams.get('token')
    const authHeader = req.headers.get('authorization')
    const userAgent = req.headers.get('user-agent')

    // Check for various authentication methods
    const isAuthenticated =
      token === process.env.EXTERNAL_CRON_TOKEN ||
      authHeader === `Bearer ${process.env.EXTERNAL_CRON_TOKEN}` ||
      userAgent?.includes('cron-job.org') ||
      process.env.NODE_ENV === 'development'

    console.log("🔍 Auth debug:", { hasToken: !!token, hasAuthHeader: !!authHeader, userAgent: userAgent?.substring(0, 50), isAuthenticated, nodeEnv: process.env.NODE_ENV })

    if (!isAuthenticated) {
      console.log("❌ External cron authentication failed")
      return NextResponse.json({ error: "Unauthorized", message: "Use ?token=your-token or Authorization: Bearer your-token header" }, { status: 401 })
    }

    console.log("✅ External cron authenticated successfully")

    await connectDB()
    if (!mongoose.connection.db) throw new Error("Database connection not established")

    const collection = mongoose.connection.db.collection("approvedcontents")

    const now = new Date()

    // 1) Mark due scheduled posts as OVERDUE
    const markResult = await collection.updateMany(
      {
        $and: [
          { $or: [{ status: "scheduled" }, { Status: "scheduled" }] },
          { $or: [{ scheduledFor: { $lte: now } }, { scheduled_for: { $lte: now } }] },
          { $or: [
            { postedAt: { $exists: false } },
            { posted_at: { $exists: false } },
            { linkedinPostId: { $exists: false } },
            { linkedin_post_id: { $exists: false } }
          ] }
        ]
      },
      { $set: { status: "overdue", Status: "overdue", overdueSince: new Date(), updatedAt: new Date(), updated_at: new Date() }, $setOnInsert: {} }
    )

    console.log(`⚠️ Marked ${markResult.modifiedCount || 0} scheduled posts as overdue`)

    // 2) Process OVERDUE posts with limited retries
    const MAX_ATTEMPTS = 3
    const overduePosts = await collection.find({
      $and: [
        { $or: [{ status: "overdue" }, { Status: "overdue" }] },
        { $or: [
          { postedAt: { $exists: false } },
          { posted_at: { $exists: false } },
          { linkedinPostId: { $exists: false } },
          { linkedin_post_id: { $exists: false } }
        ] },
        { $or: [ { attempts: { $lt: MAX_ATTEMPTS } }, { attempts: { $exists: false } } ] }
      ]
    }).toArray()

    console.log(`📋 Found ${overduePosts.length} overdue posts to process`)

    if (overduePosts.length === 0) {
      return NextResponse.json({ success: true, message: "No posts to process", markedOverdue: markResult.modifiedCount || 0, processed: 0, currentTime: getCurrentISTString(), authStatus: "authenticated" })
    }

    let successCount = 0
    let failureCount = 0
    const results: any[] = []

    for (const post of overduePosts) {
      try {
        // Get user with LinkedIn credentials
        const user = await User.findById(post.userId || post["user id"] || post.user_id).select("+linkedinAccessToken +linkedinTokenExpiry +linkedinProfile")

        // Increment attempts and set lastAttempt early to avoid double-processing
        const currentAttempts = (post.attempts as number) || 0
        await collection.updateOne({ _id: post._id }, { $set: { lastAttempt: new Date(), attempts: currentAttempts + 1, updatedAt: new Date(), updated_at: new Date() } })

        if (!user) {
          console.error(`❌ User not found for post ${post._id}`)
          await collection.updateOne({ _id: post._id }, { $set: { error: "User not found" } })
          failureCount++
          results.push({ postId: post._id, status: "overdue", error: "User not found" })
          continue
        }

        // Check LinkedIn connection
        if (!user.linkedinAccessToken || !user.linkedinTokenExpiry || new Date(user.linkedinTokenExpiry) <= new Date()) {
          await collection.updateOne({ _id: post._id }, { $set: { error: "LinkedIn account not connected or token expired" } })
          failureCount++
          results.push({ postId: post._id, status: "overdue", error: "LinkedIn not connected" })
          continue
        }

        const content = post.content || post.Content || post["generated content"] || ""
        const imageUrl = post.imageUrl || post.Image || post.image_url || post.image || null

        if (!content || !content.trim()) {
          await collection.updateOne({ _id: post._id }, { $set: { error: "No content to post" } })
          failureCount++
          results.push({ postId: post._id, status: "overdue", error: "No content to post" })
          continue
        }

        console.log(`📝 Posting overdue content: ${content.substring(0, 100)}...`)
        const postResult = await postToLinkedIn(content, imageUrl, user)

        if (postResult.success) {
          await collection.updateOne({ _id: post._id }, { $set: {
            status: "posted", Status: "posted",
            postedAt: new Date(), posted_at: new Date(),
            linkedinPostId: postResult.linkedinPostId, linkedin_post_id: postResult.linkedinPostId,
            linkedinUrl: postResult.linkedinUrl, linkedin_url: postResult.linkedinUrl,
            error: null, updatedAt: new Date(), updated_at: new Date()
          } })
          successCount++
          results.push({ postId: post._id, status: "posted", linkedinPostId: postResult.linkedinPostId, linkedinUrl: postResult.linkedinUrl })
        } else {
          const newAttempts = currentAttempts + 1
          const reachedLimit = newAttempts >= MAX_ATTEMPTS
          await collection.updateOne({ _id: post._id }, { $set: {
            status: reachedLimit ? "failed" : "overdue",
            Status: reachedLimit ? "failed" : "overdue",
            error: postResult.error || "Failed to post to LinkedIn",
            updatedAt: new Date(), updated_at: new Date()
          } })
          if (reachedLimit) failureCount++
          results.push({ postId: post._id, status: reachedLimit ? "failed" : "overdue", error: postResult.error })
        }
      } catch (error: any) {
        const currentAttempts = (post as any).attempts || 0
        const newAttempts = currentAttempts + 1
        const reachedLimit = newAttempts >= MAX_ATTEMPTS
        await collection.updateOne({ _id: post._id }, { $set: {
          status: reachedLimit ? "failed" : "overdue",
          Status: reachedLimit ? "failed" : "overdue",
          error: error.message || "Unknown error occurred",
          attempts: newAttempts,
          lastAttempt: new Date(),
          updatedAt: new Date(), updated_at: new Date()
        } })
        if (reachedLimit) failureCount++
        results.push({ postId: post._id, status: reachedLimit ? "failed" : "overdue", error: error.message })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${overduePosts.length} overdue posts` ,
      markedOverdue: markResult.modifiedCount || 0,
      processed: overduePosts.length,
      successCount,
      failureCount,
      results,
      currentTime: getCurrentISTString(),
      authStatus: "authenticated"
    })
  } catch (error: any) {
    console.error("❌ External cron job error:", error)
    return NextResponse.json({ error: error.message || "External cron job failed", currentTime: getCurrentISTString() }, { status: 500 })
  }
}

// Also handle POST requests for manual testing
export async function POST(request: Request) {
  return GET(request)
}
