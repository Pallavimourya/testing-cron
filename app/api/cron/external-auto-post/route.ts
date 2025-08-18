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
          description: {
            text: "Image attachment",
          },
          media: imageUrl,
          title: {
            text: "LinkedIn Post Image",
          },
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

// Helper function to get current IST time
function getCurrentISTString() {
  const now = new Date()
  const istOffset = 5.5 * 60 * 60 * 1000 // IST is UTC+5:30
  const istTime = new Date(now.getTime() + istOffset)
  return istTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
}

// Helper function to get current UTC time
function getCurrentUTC() {
  return new Date()
}

export async function GET(req: Request) {
  try {
    console.log("🔄 External cron job triggered at", getCurrentISTString())
    
    // Simple authentication for external cron services
    const url = new URL(req.url)
    const token = url.searchParams.get('token')
    const authHeader = req.headers.get('authorization')
    
    // Check for token in query params or authorization header
    const isAuthenticated = token === process.env.EXTERNAL_CRON_TOKEN || 
                           authHeader === `Bearer ${process.env.EXTERNAL_CRON_TOKEN}`
    
    if (!isAuthenticated) {
      console.log("❌ External cron authentication failed")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("✅ External cron authenticated successfully")

    await connectDB()

    if (!mongoose.connection.db) {
      throw new Error("Database connection not established")
    }

    // Get current time in IST
    const now = new Date()
    const istOffset = 5.5 * 60 * 60 * 1000 // IST is UTC+5:30
    const nowIST = new Date(now.getTime() + istOffset)
    
    console.log("⏰ Current time (IST):", nowIST.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }))

    // Find scheduled posts in approvedcontents collection
    const collection = mongoose.connection.db.collection("approvedcontents")
    
    const scheduledPosts = await collection.find({
      $and: [
        {
          $or: [
            { status: "scheduled" },
            { Status: "scheduled" }
          ]
        },
        {
          $or: [
            { scheduledFor: { $lte: now } },
            { scheduled_for: { $lte: now } }
          ]
        },
        {
          $or: [
            { postedAt: { $exists: false } },
            { posted_at: { $exists: false } },
            { linkedinPostId: { $exists: false } },
            { linkedin_post_id: { $exists: false } }
          ]
        }
      ]
    }).toArray()

    console.log(`📋 Found ${scheduledPosts.length} scheduled posts due for posting`)

    if (scheduledPosts.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No scheduled posts due",
        postsProcessed: 0,
        currentTime: getCurrentISTString(),
      })
    }

    let successCount = 0
    let failureCount = 0
    const results = []

    // Process each scheduled post
    for (const scheduledPost of scheduledPosts) {
      try {
        console.log(`🔄 Processing scheduled post ${scheduledPost._id}`)

        // Get user with LinkedIn credentials
        const user = await User.findById(scheduledPost.userId || scheduledPost["user id"] || scheduledPost.user_id).select(
          "+linkedinAccessToken +linkedinTokenExpiry +linkedinProfile",
        )

        if (!user) {
          console.error(`❌ User not found for scheduled post ${scheduledPost._id}`)
          
          // Update post as failed
          await collection.updateOne(
            { _id: scheduledPost._id },
            {
              $set: {
                status: "failed",
                Status: "failed",
                error: "User not found",
                updatedAt: new Date(),
                updated_at: new Date(),
              },
            }
          )
          
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
          
          // Update post as failed
          await collection.updateOne(
            { _id: scheduledPost._id },
            {
              $set: {
                status: "failed",
                Status: "failed",
                error: "LinkedIn account not connected or token expired",
                updatedAt: new Date(),
                updated_at: new Date(),
              },
            }
          )
          
          failureCount++
          results.push({
            postId: scheduledPost._id,
            status: "failed",
            error: "LinkedIn not connected",
          })
          continue
        }

        // Extract content and image
        const content = scheduledPost.content || scheduledPost.Content || scheduledPost["generated content"] || ""
        const imageUrl = scheduledPost.imageUrl || scheduledPost.Image || scheduledPost.image_url || scheduledPost.image || null

        if (!content || !content.trim()) {
          console.error(`❌ No content found for scheduled post ${scheduledPost._id}`)
          
          await collection.updateOne(
            { _id: scheduledPost._id },
            {
              $set: {
                status: "failed",
                Status: "failed",
                error: "No content to post",
                updatedAt: new Date(),
                updated_at: new Date(),
              },
            }
          )
          
          failureCount++
          results.push({
            postId: scheduledPost._id,
            status: "failed",
            error: "No content to post",
          })
          continue
        }

        // Post to LinkedIn
        const postResult = await postToLinkedIn(content, imageUrl, user)

        if (postResult.success) {
          // Update post as posted
          await collection.updateOne(
            { _id: scheduledPost._id },
            {
              $set: {
                status: "posted",
                Status: "posted",
                postedAt: new Date(),
                posted_at: new Date(),
                linkedinPostId: postResult.linkedinPostId,
                linkedin_post_id: postResult.linkedinPostId,
                linkedinUrl: postResult.linkedinUrl,
                linkedin_url: postResult.linkedinUrl,
                updatedAt: new Date(),
                updated_at: new Date(),
              },
            }
          )

          console.log(`✅ Successfully posted scheduled content ${scheduledPost._id}`)
          successCount++
          results.push({
            postId: scheduledPost._id,
            status: "posted",
            linkedinPostId: postResult.linkedinPostId,
            linkedinUrl: postResult.linkedinUrl,
          })
        } else {
          // Update post as failed
          await collection.updateOne(
            { _id: scheduledPost._id },
            {
              $set: {
                status: "failed",
                Status: "failed",
                error: postResult.error,
                updatedAt: new Date(),
                updated_at: new Date(),
              },
            }
          )

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

        // Update post as failed
        await collection.updateOne(
          { _id: scheduledPost._id },
          {
            $set: {
              status: "failed",
              Status: "failed",
              error: error.message || "Unknown error occurred",
              updatedAt: new Date(),
              updated_at: new Date(),
            },
          }
        )

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
      message: `Processed ${scheduledPosts.length} scheduled posts`,
      postsProcessed: scheduledPosts.length,
      successCount,
      failureCount,
      results,
      currentTime: getCurrentISTString(),
    })
  } catch (error: any) {
    console.error("❌ External cron job error:", error)
    return NextResponse.json({ 
      error: error.message || "External cron job failed",
      currentTime: getCurrentISTString()
    }, { status: 500 })
  }
}

// Also handle POST requests for manual testing
export async function POST(request: Request) {
  return GET(request)
}
