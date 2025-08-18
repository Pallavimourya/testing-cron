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

// Helper function to get current IST time as Date object
function getCurrentIST() {
  const now = new Date()
  const istOffset = 5.5 * 60 * 60 * 1000 // IST is UTC+5:30
  return new Date(now.getTime() + istOffset)
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
    const currentIST = getCurrentIST()

    console.log(`🕐 Current time (IST): ${currentIST.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`)

    // Find scheduled posts that are due for posting (within 1 minute buffer)
    const bufferTime = new Date(currentIST.getTime() + 1 * 60 * 1000) // 1 minute buffer
    
    const dueQuery = {
      $and: [
        { $or: [{ status: "scheduled" }, { Status: "scheduled" }] },
        { $or: [{ scheduledFor: { $lte: bufferTime } }, { scheduled_for: { $lte: bufferTime } }] },
        { $or: [
          { postedAt: { $exists: false } },
          { posted_at: { $exists: false } },
          { linkedinPostId: { $exists: false } },
          { linkedin_post_id: { $exists: false } }
        ] }
      ]
    }

    const duePosts = await collection.find(dueQuery).toArray()
    console.log(`📋 Found ${duePosts.length} scheduled posts due for posting`)

    if (duePosts.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: "No posts to process", 
        processed: 0, 
        currentTime: getCurrentISTString(), 
        authStatus: "authenticated" 
      })
    }

    let successCount = 0
    let failureCount = 0
    const results: any[] = []

    for (const post of duePosts) {
      try {
        console.log(`📝 Processing scheduled post: ${post._id}`)

        // Get user with LinkedIn credentials
        const user = await User.findById(post.userId || post["user id"] || post.user_id).select("+linkedinAccessToken +linkedinTokenExpiry +linkedinProfile")

        if (!user) {
          console.error(`❌ User not found for post ${post._id}`)
          await collection.updateOne({ _id: post._id }, { 
            $set: { 
              status: "failed", 
              Status: "failed",
              error: "User not found",
              updatedAt: new Date(), 
              updated_at: new Date() 
            } 
          })
          failureCount++
          results.push({ postId: post._id, status: "failed", error: "User not found" })
          continue
        }

        // Check LinkedIn connection
        if (!user.linkedinAccessToken || !user.linkedinTokenExpiry || new Date(user.linkedinTokenExpiry) <= new Date()) {
          await collection.updateOne({ _id: post._id }, { 
            $set: { 
              status: "failed", 
              Status: "failed",
              error: "LinkedIn account not connected or token expired",
              updatedAt: new Date(), 
              updated_at: new Date() 
            } 
          })
          failureCount++
          results.push({ postId: post._id, status: "failed", error: "LinkedIn not connected" })
          continue
        }

        const content = post.content || post.Content || post["generated content"] || ""
        const imageUrl = post.imageUrl || post.Image || post.image_url || post.image || null

        if (!content || !content.trim()) {
          await collection.updateOne({ _id: post._id }, { 
            $set: { 
              status: "failed", 
              Status: "failed",
              error: "No content to post",
              updatedAt: new Date(), 
              updated_at: new Date() 
            } 
          })
          failureCount++
          results.push({ postId: post._id, status: "failed", error: "No content to post" })
          continue
        }

        console.log(`📤 Posting content: ${content.substring(0, 100)}...`)
        const postResult = await postToLinkedIn(content, imageUrl, user)

        if (postResult.success) {
          await collection.updateOne({ _id: post._id }, { 
            $set: {
              status: "posted", 
              Status: "posted",
              postedAt: new Date(), 
              posted_at: new Date(),
              linkedinPostId: postResult.linkedinPostId, 
              linkedin_post_id: postResult.linkedinPostId,
              linkedinUrl: postResult.linkedinUrl, 
              linkedin_url: postResult.linkedinUrl,
              error: null, 
              updatedAt: new Date(), 
              updated_at: new Date()
            } 
          })
          successCount++
          results.push({ 
            postId: post._id, 
            status: "posted", 
            linkedinPostId: postResult.linkedinPostId, 
            linkedinUrl: postResult.linkedinUrl 
          })
          console.log(`✅ Successfully posted post: ${post._id}`)
        } else {
          await collection.updateOne({ _id: post._id }, { 
            $set: {
              status: "failed", 
              Status: "failed",
              error: postResult.error || "Failed to post to LinkedIn",
              updatedAt: new Date(), 
              updated_at: new Date()
            } 
          })
          failureCount++
          results.push({ postId: post._id, status: "failed", error: postResult.error })
          console.log(`❌ Failed to post post: ${post._id} - ${postResult.error}`)
        }
      } catch (error: any) {
        console.error(`❌ Error processing post ${post._id}:`, error)
        await collection.updateOne({ _id: post._id }, { 
          $set: {
            status: "failed", 
            Status: "failed",
            error: error.message || "Unknown error occurred",
            updatedAt: new Date(), 
            updated_at: new Date()
          } 
        })
        failureCount++
        results.push({ postId: post._id, status: "failed", error: error.message })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${duePosts.length} scheduled posts`,
      processed: duePosts.length,
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
