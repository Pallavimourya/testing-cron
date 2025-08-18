import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import mongoose from "mongoose"

// Global variables to prevent multiple simultaneous runs
let isAutoPostingRunning = false
let lastRunTime: Date | null = null

function shouldRunAutoPosting() {
  if (!lastRunTime) return true
  
  const timeSinceLastRun = new Date().getTime() - lastRunTime.getTime()
  const oneMinute = 1 * 60 * 1000
  
  return timeSinceLastRun >= oneMinute
}

function isPostDue(scheduledFor: string | Date) {
  const now = new Date()
  const scheduled = new Date(scheduledFor)
  
  // Convert both to IST for accurate comparison
  const istOffset = 5.5 * 60 * 60 * 1000 // IST is UTC+5:30
  const nowIST = new Date(now.getTime() + istOffset)
  const scheduledIST = new Date(scheduled.getTime() + istOffset)
  
  // Add 1 minute buffer for processing
  const bufferTime = new Date(nowIST.getTime() + 1 * 60 * 1000)
  
  return scheduledIST <= bufferTime
}

export async function GET(request: Request) {
  try {
    // Security check for external cron jobs
    const authHeader = request.headers.get('Authorization')
    const userAgent = request.headers.get('User-Agent')
    const cronJobToken = request.headers.get('X-Cron-Job-Token')
    
    // Allow requests from external cron services
    const isExternalCron = userAgent?.includes('cron-job.org') || userAgent?.includes('cron-job')
    const hasValidSecret = process.env.EXTERNAL_CRON_SECRET && authHeader === `Bearer ${process.env.EXTERNAL_CRON_SECRET}`
    const hasValidToken = process.env.CRON_JOB_TOKEN && cronJobToken === process.env.CRON_JOB_TOKEN
    const isManualTest = !authHeader && !userAgent // Allow manual testing
    
    if (!isExternalCron && !hasValidSecret && !hasValidToken && !isManualTest) {
      console.log('🚫 Unauthorized external cron job access attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('✅ Authorized external cron job request', { isExternalCron, hasValidSecret, hasValidToken, isManualTest })
    
    // Check if we should run auto-posting
    if (!shouldRunAutoPosting()) {
      const timeUntilNextRun = lastRunTime ? 1 * 60 * 1000 - (new Date().getTime() - lastRunTime.getTime()) : 0
      const secondsUntilNextRun = Math.floor(timeUntilNextRun / 1000)
      
      return NextResponse.json({
        status: "ok",
        success: true,
        message: `Auto-posting is running. Next check in ${secondsUntilNextRun} seconds.`,
        lastRun: lastRunTime?.toISOString(),
        nextRun: lastRunTime ? new Date(lastRunTime.getTime() + 1 * 60 * 1000).toISOString() : null,
        isRunning: isAutoPostingRunning,
      })
    }

    // Prevent multiple simultaneous runs
    if (isAutoPostingRunning) {
      return NextResponse.json({
        status: "ok",
        success: true,
        message: "Auto-posting already in progress",
        isRunning: true,
      })
    }

    isAutoPostingRunning = true
    lastRunTime = new Date()

    console.log("🚀 EXTERNAL CRON Job: Auto-post started at", new Date().toISOString())

    await connectDB()

    if (!mongoose.connection.db) {
      throw new Error("Database connection not established")
    }

    // Check multiple collections for scheduled posts
    const collections = ["approvedcontents", "linkdin-content-generation", "generatedcontents"]
    const usersCollection = mongoose.connection.db.collection("users")

    let totalProcessed = 0
    let totalPosted = 0
    let totalErrors = 0
    const results = []

    console.log("🔍 Starting external auto-post process...")

    for (const collectionName of collections) {
      try {
        const collection = mongoose.connection.db.collection(collectionName)

        // Find posts that are scheduled and due now (with 1 minute buffer) based on IST
        const now = new Date()
        const istOffset = 5.5 * 60 * 60 * 1000 // IST is UTC+5:30
        const nowIST = new Date(now.getTime() + istOffset)
        const bufferTime = new Date(nowIST.getTime() + 1 * 60 * 1000) // 1 minute buffer

        console.log(`🕐 Current time (IST): ${nowIST.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`)
        console.log(`🕐 Buffer time (IST): ${bufferTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`)

        const dueQuery = {
          $and: [
            {
              $or: [{ status: "scheduled" }, { Status: "scheduled" }],
            },
            {
              $or: [{ scheduledFor: { $lte: bufferTime } }, { scheduled_for: { $lte: bufferTime } }],
            },
            // Ensure the post hasn't been posted already
            {
              $or: [
                { postedAt: { $exists: false } },
                { posted_at: { $exists: false } },
                { linkedinPostId: { $exists: false } },
                { linkedin_post_id: { $exists: false } }
              ]
            }
          ],
        }

        const duePosts = await collection.find(dueQuery).toArray()
        console.log(`📊 Found ${duePosts.length} posts due for posting in ${collectionName}`)

        if (duePosts.length === 0) {
          continue
        }

        for (const post of duePosts) {
          try {
            totalProcessed++
            console.log(`📤 Processing post ${totalProcessed}: ${post.topicTitle || post.Topic || 'Untitled'}`)

            // Get user information
            const userEmail = post.email || post.userEmail || post.user_email
            const userId = post.userId || post.user_id || post["user id"]

            if (!userEmail && !userId) {
              console.log(`⚠️ Skipping post ${post._id}: No user information found`)
              continue
            }

            // Find user
            let user = null
            if (userEmail) {
              user = await usersCollection.findOne({ email: userEmail })
            } else if (userId) {
              user = await usersCollection.findOne({ _id: new mongoose.Types.ObjectId(userId) })
            }

            if (!user) {
              console.log(`⚠️ Skipping post ${post._id}: User not found`)
              continue
            }

            // Extract content details
            const content = post.content || post.Content || post["generated content"] || ""
            const imageUrl = post.imageUrl || post.Image || post.image_url || null
            const topicTitle = post.topicTitle || post.Topic || post.topic_title || ""

            if (!content) {
              console.log(`⚠️ Skipping post ${post._id}: No content found`)
              continue
            }

            console.log(`📝 Posting content: ${content.substring(0, 100)}...`)

            // Get the host from the request
            const host = request.headers.get("host") || "localhost:3000"
            const protocol = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https")

            // Post to LinkedIn using the existing LinkedIn API
            const linkedinResponse = await fetch(`${protocol}://${host}/api/linkedin/post`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Cookie: request.headers.get("cookie") || "",
              },
              body: JSON.stringify({
                content: content,
                imageUrl: imageUrl,
                contentId: post._id.toString(),
              }),
            })

            const linkedinResult = await linkedinResponse.json()

            if (linkedinResponse.ok) {
              console.log(`✅ Successfully posted to LinkedIn: ${linkedinResult.postId || linkedinResult.linkedinPostId}`)
              totalPosted++

              // Update content status to posted
              await collection.updateOne(
                { _id: post._id },
                {
                  $set: {
                    status: "posted",
                    Status: "posted",
                    postedAt: new Date(),
                    posted_at: new Date(),
                    linkedinPostId: linkedinResult.postId || linkedinResult.linkedinPostId,
                    linkedin_post_id: linkedinResult.postId || linkedinResult.linkedinPostId,
                    linkedinUrl: linkedinResult.url,
                    linkedin_url: linkedinResult.url,
                    updatedAt: new Date(),
                    updated_at: new Date(),
                  },
                }
              )

              results.push({
                id: post._id.toString(),
                status: "posted",
                linkedinPostId: linkedinResult.postId || linkedinResult.linkedinPostId,
                linkedinUrl: linkedinResult.url,
              })
            } else {
              console.error(`❌ Failed to post to LinkedIn: ${linkedinResult.error}`)
              totalErrors++

              // Update content status to failed
              await collection.updateOne(
                { _id: post._id },
                {
                  $set: {
                    status: "failed",
                    Status: "failed",
                    error: linkedinResult.error || "Failed to post to LinkedIn",
                    updatedAt: new Date(),
                    updated_at: new Date(),
                  },
                }
              )

              results.push({
                id: post._id.toString(),
                status: "failed",
                error: linkedinResult.error || "Failed to post to LinkedIn",
              })
            }

            // Add a small delay between posts to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000))

          } catch (error) {
            console.error(`❌ Error processing post ${post._id}:`, error)
            totalErrors++

            // Update content status to failed
            try {
              await collection.updateOne(
                { _id: post._id },
                {
                  $set: {
                    status: "failed",
                    Status: "failed",
                    error: error instanceof Error ? error.message : "Unknown error",
                    updatedAt: new Date(),
                    updated_at: new Date(),
                  },
                }
              )
            } catch (updateError) {
              console.error(`❌ Error updating post status:`, updateError)
            }

            results.push({
              id: post._id.toString(),
              status: "failed",
              error: error instanceof Error ? error.message : "Unknown error",
            })
          }
        }
      } catch (error) {
        console.error(`❌ Error processing collection ${collectionName}:`, error)
      }
    }

    console.log(`🎉 External auto-post completed: ${totalPosted} posted, ${totalErrors} errors, ${totalProcessed} processed`)

    return NextResponse.json({
      status: "ok",
      success: true,
      message: `Auto-post completed: ${totalPosted} posted, ${totalErrors} errors`,
      stats: {
        totalProcessed,
        totalPosted,
        totalErrors,
      },
      results,
      timestamp: new Date().toISOString(),
      isRunning: false,
    })

  } catch (error) {
    console.error("❌ External cron job error:", error)
    return NextResponse.json(
      {
        status: "error",
        success: false,
        message: "Auto-post failed",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
        isRunning: false,
      },
      { status: 500 }
    )
  } finally {
    isAutoPostingRunning = false
  }
}

// Helper function to upload image to LinkedIn
async function uploadImageToLinkedIn(imageUrl: string, accessToken: string, linkedinPersonId: string) {
  try {
    console.log("🖼️ Starting image upload to LinkedIn:", imageUrl)

    // Step 1: Register the image upload
    const registerUploadUrl = "https://api.linkedin.com/v2/assets?action=registerUpload"
    const registerUploadBody = {
      registerUploadRequest: {
        recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
        owner: `urn:li:person:${linkedinPersonId}`,
        serviceRelationships: [
          {
            relationshipType: "OWNER",
            identifier: "urn:li:userGeneratedContent",
          },
        ],
      },
    }

    const registerResponse = await fetch(registerUploadUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(registerUploadBody),
    })

    if (!registerResponse.ok) {
      const errorText = await registerResponse.text()
      console.error("❌ Failed to register upload:", errorText)
      throw new Error(`Failed to register upload: ${registerResponse.status} ${errorText}`)
    }

    const registerData = await registerResponse.json()
    console.log("📝 Upload registered successfully")

    // Step 2: Download the image from the URL
    const imageResponse = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    })

    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.status}`)
    }

    const imageBuffer = await imageResponse.arrayBuffer()
    console.log("📷 Image downloaded, size:", imageBuffer.byteLength)

    // Step 3: Upload the image to LinkedIn
    const uploadUrl =
      registerData.value.uploadMechanism["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"].uploadUrl

    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/octet-stream",
      },
      body: imageBuffer,
    })

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      console.error("❌ Failed to upload image:", errorText)
      throw new Error(`Failed to upload image: ${uploadResponse.status} ${errorText}`)
    }

    console.log("✅ Image uploaded successfully to LinkedIn")
    return registerData.value.asset
  } catch (error) {
    console.error("❌ Error uploading image to LinkedIn:", error)
    throw error
  }
}

// Also handle POST requests for manual testing
export async function POST(request: Request) {
  return GET(request)
}
