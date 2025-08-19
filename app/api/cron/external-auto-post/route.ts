import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import ScheduledPost from "@/models/ScheduledPost"
import User from "@/models/User"
import { ISTTime } from "@/lib/utils/ist-time"
import mongoose from "mongoose"

// Helper function to post to LinkedIn (simplified version)
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
    const authHeader = req.headers.get('authorization')
    const cronSecret = req.headers.get('cron-secret')
    const userAgent = req.headers.get('user-agent')

    console.log("🔐 Authentication check:", {
      hasToken: !!token,
      hasAuthHeader: !!authHeader,
      hasCronSecret: !!cronSecret,
      userAgent: userAgent,
      nodeEnv: process.env.NODE_ENV
    })

    // Check for various authentication methods
    const isAuthenticated =
      token === process.env.EXTERNAL_CRON_TOKEN ||
      authHeader === `Bearer ${process.env.EXTERNAL_CRON_TOKEN}` ||
      cronSecret === process.env.EXTERNAL_CRON_TOKEN ||
      cronSecret === process.env.CRON_SECRET ||
      userAgent?.includes('cron-job.org') ||
      process.env.NODE_ENV === 'development'

    if (!isAuthenticated) {
      console.log("❌ External cron authentication failed")
      console.log("Expected tokens:", {
        EXTERNAL_CRON_TOKEN: process.env.EXTERNAL_CRON_TOKEN ? "SET" : "NOT SET",
        CRON_SECRET: process.env.CRON_SECRET ? "SET" : "NOT SET"
      })
      return NextResponse.json({ 
        error: "Unauthorized", 
        message: "Use ?token=your-token, Authorization: Bearer your-token header, or CRON_SECRET header",
        received: {
          token: !!token,
          authHeader: !!authHeader,
          cronSecret: !!cronSecret,
          userAgent: userAgent
        }
      }, { status: 401 })
    }

    console.log("✅ External cron authentication successful")
    console.log("🔄 External cron job trigger started at", ISTTime.getCurrentISTString())

    await connectDB()

    // Get current UTC time
    const currentUTC = ISTTime.getCurrentUTC()
    console.log("⏰ Current UTC time:", currentUTC.toISOString())

    let totalProcessed = 0
    let successCount = 0
    let failureCount = 0
    const results = []

    // 1. First, check ScheduledPost model (new system)
    console.log("📋 Checking ScheduledPost model...")
    const scheduledPosts = await ScheduledPost.find({
      status: "pending",
      scheduledTime: { $lte: currentUTC },
      attempts: { $lt: 3 }, // Don't retry more than 3 times
    }).sort({ scheduledTime: 1 })

    console.log(`📋 Found ${scheduledPosts.length} due posts in ScheduledPost model`)

    // Process ScheduledPost entries
    for (const scheduledPost of scheduledPosts) {
      try {
        console.log(`🔄 Processing ScheduledPost: ${scheduledPost._id}`)

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
            source: "ScheduledPost",
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
            source: "ScheduledPost",
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
        const postResult = await postToLinkedIn(scheduledPost.content, scheduledPost.imageUrl, user)

        if (postResult.success) {
          // Update scheduled post as posted
          await ScheduledPost.findByIdAndUpdate(scheduledPost._id, {
            status: "posted",
            linkedinPostId: postResult.linkedinPostId,
            linkedinUrl: postResult.linkedinUrl,
            postedAt: new Date(),
            error: null, // Clear any previous errors
          })

          console.log(`✅ Successfully posted ScheduledPost: ${scheduledPost._id}`)
          successCount++
          totalProcessed++
          results.push({
            postId: scheduledPost._id,
            source: "ScheduledPost",
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

          console.error(`❌ Failed to post ScheduledPost ${scheduledPost._id}:`, postResult.error)
          failureCount++
          totalProcessed++
          results.push({
            postId: scheduledPost._id,
            source: "ScheduledPost",
            status: "failed",
            error: postResult.error,
          })
        }
      } catch (error: any) {
        console.error(`❌ Error processing ScheduledPost ${scheduledPost._id}:`, error)

        // Update scheduled post as failed
        await ScheduledPost.findByIdAndUpdate(scheduledPost._id, {
          status: "failed",
          error: error.message || "Unknown error occurred",
          attempts: scheduledPost.attempts + 1,
          lastAttempt: new Date(),
        })

        failureCount++
        totalProcessed++
        results.push({
          postId: scheduledPost._id,
          source: "ScheduledPost",
          status: "failed",
          error: error.message || "Unknown error",
        })
      }
    }

    // 2. Now check existing collections (old system)
    console.log("📋 Checking existing collections...")
    const collections = ["approvedcontents", "linkdin-content-generation", "generatedcontents"]
    
    if (!mongoose.connection.db) {
      console.error("❌ Database connection not established")
      return NextResponse.json({ error: "Database connection not established" }, { status: 500 })
    }
    
    for (const collectionName of collections) {
      try {
        const collection = mongoose.connection.db.collection(collectionName)
        
        // Find scheduled posts that are due
        const dueQuery = {
        $and: [
          { $or: [{ status: "scheduled" }, { Status: "scheduled" }] },
            { $or: [{ scheduledFor: { $lte: currentUTC } }, { scheduled_for: { $lte: currentUTC } }] },
          { $or: [
            { postedAt: { $exists: false } },
            { posted_at: { $exists: false } },
            { linkedinPostId: { $exists: false } },
            { linkedin_post_id: { $exists: false } }
          ] }
        ]
        }

        const duePosts = await collection.find(dueQuery).toArray()
        console.log(`📋 Found ${duePosts.length} due posts in ${collectionName}`)

        for (const post of duePosts) {
          try {
            console.log(`🔄 Processing ${collectionName} post: ${post._id}`)

        // Get user with LinkedIn credentials
            const userId = post.userId || post["user id"] || post.user_id
            const user = await User.findById(userId).select("+linkedinAccessToken +linkedinTokenExpiry +linkedinProfile")

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
              totalProcessed++
              results.push({ 
                postId: post._id, 
                source: collectionName,
                status: "failed", 
                error: "User not found" 
              })
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
              totalProcessed++
              results.push({ 
                postId: post._id, 
                source: collectionName,
                status: "failed", 
                error: "LinkedIn not connected" 
              })
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
              totalProcessed++
              results.push({ 
                postId: post._id, 
                source: collectionName,
                status: "failed", 
                error: "No content to post" 
              })
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
              totalProcessed++
              results.push({ 
                postId: post._id, 
                source: collectionName,
                status: "posted", 
                linkedinPostId: postResult.linkedinPostId, 
                linkedinUrl: postResult.linkedinUrl 
              })
              console.log(`✅ Successfully posted ${collectionName} post: ${post._id}`)
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
              totalProcessed++
              results.push({ 
                postId: post._id, 
                source: collectionName,
                status: "failed", 
                error: postResult.error 
              })
              console.log(`❌ Failed to post ${collectionName} post: ${post._id} - ${postResult.error}`)
        }
      } catch (error: any) {
            console.error(`❌ Error processing ${collectionName} post ${post._id}:`, error)
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
            totalProcessed++
            results.push({ 
              postId: post._id, 
              source: collectionName,
              status: "failed", 
              error: error.message 
            })
          }
        }
      } catch (error) {
        console.error(`❌ Error checking collection ${collectionName}:`, error)
      }
    }

    console.log(`✅ External cron job completed: ${successCount} successful, ${failureCount} failed, ${totalProcessed} total processed`)

    return NextResponse.json({
      success: true,
      message: `Processed ${totalProcessed} scheduled posts`,
      postsProcessed: totalProcessed,
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

// Also handle POST requests for manual testing
export async function POST(request: Request) {
  return GET(request)
}
