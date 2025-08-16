import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import mongoose from "mongoose"

// Global variable to track if auto-posting is running
let isAutoPostingRunning = false
let lastRunTime: Date | null = null

function getErrorMessage(error: unknown) {
  return typeof error === "object" && error && "message" in error
    ? (error as { message: string }).message
    : String(error)
}

// Function to check if we should run auto-posting
function shouldRunAutoPosting() {
  const now = new Date()
  
  // If never run before, run now
  if (!lastRunTime) {
    return true
  }
  
  // Check if 1 minute has passed since last run
  const timeSinceLastRun = now.getTime() - lastRunTime.getTime()
  const oneMinute = 1 * 60 * 1000
  
  return timeSinceLastRun >= oneMinute
}

// Function to check if a post is due for posting based on Indian Standard Time
function isPostDue(scheduledFor: string | Date) {
  const now = new Date()
  const scheduled = new Date(scheduledFor)
  
  // Convert both times to Indian Standard Time (IST)
  const istOffset = 5.5 * 60 * 60 * 1000 // IST is UTC+5:30
  const nowIST = new Date(now.getTime() + istOffset)
  const scheduledIST = new Date(scheduled.getTime() + istOffset)
  
  // Add 1 minute buffer for processing time
  const bufferTime = new Date(nowIST.getTime() + 1 * 60 * 1000)
  
  console.log(`⏰ Time check - Now (IST): ${nowIST.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`)
  console.log(`⏰ Time check - Scheduled (IST): ${scheduledIST.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`)
  console.log(`⏰ Time check - Buffer (IST): ${bufferTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`)
  
  return scheduledIST <= bufferTime
}

export async function GET(request: Request) {
  try {
    // Security check for Vercel cron jobs
    const authHeader = request.headers.get('Authorization')
    const userAgent = request.headers.get('User-Agent')
    
    // Allow requests from Vercel cron jobs or manual testing
    const isVercelCron = userAgent === 'vercel-cron/1.0'
    const hasValidSecret = process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`
    const isManualTest = !authHeader && !userAgent // Allow manual testing
    
    if (!isVercelCron && !hasValidSecret && !isManualTest) {
      console.log('🚫 Unauthorized cron job access attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('✅ Authorized cron job request', { isVercelCron, hasValidSecret, isManualTest })
    
    // Check if we should run auto-posting
    if (!shouldRunAutoPosting()) {
      const timeUntilNextRun = lastRunTime ? 1 * 60 * 1000 - (new Date().getTime() - lastRunTime.getTime()) : 0
      const secondsUntilNextRun = Math.floor(timeUntilNextRun / 1000)
      
      return NextResponse.json({
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
        success: true,
        message: "Auto-posting already in progress",
        isRunning: true,
      })
    }

    isAutoPostingRunning = true
    lastRunTime = new Date()

    console.log("🚀 CRON Job: Auto-post started at", new Date().toISOString())

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

    console.log("🔍 Starting auto-post process...")

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

        console.log(`🔍 Checking ${collectionName} for due posts...`)
        console.log(`⏰ Current time: ${now.toISOString()}`)
        console.log(`⏰ Buffer time: ${bufferTime.toISOString()}`)
        
        const duePosts = await collection.find(dueQuery).toArray()
        console.log(`📊 Found ${duePosts.length} posts due for posting in ${collectionName}`)

        if (duePosts.length === 0) {
          console.log(`⏭️  No due posts in ${collectionName}, continuing...`)
          continue
        }

        // Log details of each due post
        duePosts.forEach((post, index) => {
          console.log(`📋 Due post ${index + 1}:`)
          console.log(`   - ID: ${post._id}`)
          console.log(`   - Title: ${post.topicTitle || 'Untitled'}`)
          console.log(`   - Scheduled for: ${post.scheduledFor || post.scheduled_for}`)
          console.log(`   - User: ${post.email || post.userId}`)
          console.log(`   - Status: ${post.status || post.Status}`)
        })

        for (const post of duePosts) {
          totalProcessed++

          try {
            console.log(`📤 Processing post: ${post._id} from ${collectionName}`)

            // Get user details for LinkedIn posting
            const userId = post.userId || post.user_id || post["User ID"] || post["user id"]
            let user = null

            // Try different user ID formats
            if (userId) {
              try {
                if (mongoose.Types.ObjectId.isValid(userId)) {
                  user = await usersCollection.findOne({ _id: new mongoose.Types.ObjectId(userId) })
                } else {
                  user = await usersCollection.findOne({ _id: userId })
                }
              } catch (e) {
                console.log(`⚠️ Error finding user with ID ${userId}:`, e)
              }
            }

            // Also try to find user by email
            if (!user && post.email) {
              user = await usersCollection.findOne({ email: post.email })
              console.log(`🔍 Found user by email: ${post.email} - ${user ? 'Yes' : 'No'}`)
            }

            if (!user) {
              console.log(`❌ User not found for post ${post._id}, userId: ${userId}, email: ${post.email}`)
              await collection.updateOne(
                { _id: post._id },
                {
                  $set: {
                    status: "approved",
                    Status: "approved",
                    error: "User not found",
                    updatedAt: new Date(),
                    updated_at: new Date(),
                  },
                  $unset: {
                    scheduledFor: 1,
                    scheduled_for: 1,
                  },
                },
              )
              totalErrors++
              results.push({
                postId: post._id,
                collection: collectionName,
                status: "error",
                error: "User not found",
              })
              continue
            }

            console.log(`✅ Found user: ${user.email}`)

            // Check if user has LinkedIn access token in User model
            if (!user.linkedinAccessToken || !user.linkedinTokenExpiry || new Date(user.linkedinTokenExpiry) <= new Date()) {
              console.log(`❌ LinkedIn access token not found or expired for user ${user._id}`)
              console.log(`   - Has token: ${!!user.linkedinAccessToken}`)
              console.log(`   - Token expiry: ${user.linkedinTokenExpiry}`)
              console.log(`   - Token expired: ${user.linkedinTokenExpiry ? new Date(user.linkedinTokenExpiry) <= new Date() : 'No expiry date'}`)
              
              await collection.updateOne(
                { _id: post._id },
                {
                  $set: {
                    status: "approved",
                    Status: "approved",
                    error: "LinkedIn not connected or token expired. Please reconnect your LinkedIn account.",
                    updatedAt: new Date(),
                    updated_at: new Date(),
                    lastAttempt: new Date(),
                  },
                  $unset: {
                    scheduledFor: 1,
                    scheduled_for: 1,
                  },
                },
              )
              totalErrors++
              results.push({
                postId: post._id,
                collection: collectionName,
                status: "error",
                error: "LinkedIn not connected",
              })
              continue
            }

            console.log(`✅ LinkedIn token valid for user ${user.email}`)

            // Prepare post content
            const postContent = post.content || post.Content || post.text || ""
            if (!postContent.trim()) {
              console.log(`❌ Empty content for post ${post._id}`)
              await collection.updateOne(
                { _id: post._id },
                {
                  $set: {
                    status: "approved",
                    Status: "approved",
                    error: "Empty content",
                    updatedAt: new Date(),
                    updated_at: new Date(),
                  },
                  $unset: {
                    scheduledFor: 1,
                    scheduled_for: 1,
                  },
                },
              )
              totalErrors++
              results.push({
                postId: post._id,
                collection: collectionName,
                status: "error",
                error: "Empty content",
              })
              continue
            }

            console.log(`📝 Post content length: ${postContent.length} characters`)

            // Prepare LinkedIn post data
            const postBody: any = {
              author: `urn:li:person:${user.linkedinProfile?.id}`,
              lifecycleState: "PUBLISHED",
              specificContent: {
                "com.linkedin.ugc.ShareContent": {
                  shareCommentary: {
                    text: postContent,
                  },
                  shareMediaCategory: "NONE",
                },
              },
              visibility: {
                "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
              },
            }

            // Handle image if present
            const imageUrl = post.imageUrl || post.Image || post.image_url
            if (imageUrl) {
              try {
                console.log(`📷 Post has image, uploading to LinkedIn: ${imageUrl}`)
                
                // Upload image to LinkedIn
                const imageAsset = await uploadImageToLinkedIn(imageUrl, user.linkedinAccessToken, user.linkedinProfile?.id)
                
                // Update post body to include the image
                postBody.specificContent["com.linkedin.ugc.ShareContent"].shareMediaCategory = "IMAGE"
                postBody.specificContent["com.linkedin.ugc.ShareContent"].media = [
                  {
                    status: "READY",
                    description: {
                      text: "LinkedIn Post Image",
                    },
                    media: imageAsset,
                    title: {
                      text: "LinkedIn Post Image",
                    },
                  },
                ]
                
                console.log("✅ Image prepared for LinkedIn post")
              } catch (imageError) {
                console.error("❌ Error handling image:", imageError)
                // Continue with text-only post if image upload fails
                console.log("🔄 Falling back to text-only post")
              }
            }

            // Post to LinkedIn
            console.log(`🔗 Posting to LinkedIn for user ${user.linkedinProfile?.id}`)

            const linkedinResponse = await fetch("https://api.linkedin.com/v2/ugcPosts", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${user.linkedinAccessToken}`,
                "Content-Type": "application/json",
                "X-Restli-Protocol-Version": "2.0.0",
              },
              body: JSON.stringify(postBody),
            })

            if (linkedinResponse.ok) {
              const linkedinData = await linkedinResponse.json()
              console.log(`✅ Successfully posted to LinkedIn: ${post._id}`)

              // Create LinkedIn URL
              const linkedinUrl = `https://www.linkedin.com/feed/update/${linkedinData.id}/`

              // Update post status to posted
              await collection.updateOne(
                { _id: post._id },
                {
                  $set: {
                    status: "posted",
                    Status: "posted",
                    postedAt: new Date(),
                    posted_at: new Date(),
                    linkedinPostId: linkedinData.id,
                    linkedinUrl: linkedinUrl,
                    updatedAt: new Date(),
                    updated_at: new Date(),
                  },
                  $unset: {
                    error: 1,
                    scheduledFor: 1,
                    scheduled_for: 1,
                  },
                },
              )

              totalPosted++
              results.push({
                postId: post._id,
                collection: collectionName,
                status: "posted",
                linkedinPostId: linkedinData.id,
                linkedinUrl: linkedinUrl,
              })
            } else {
              const errorText = await linkedinResponse.text()
              console.log(`❌ LinkedIn API error for post ${post._id}:`, errorText)

              // Check if it's an access token error
              if (errorText.includes("Invalid access token") || errorText.includes("token_expired")) {
                await collection.updateOne(
                  { _id: post._id },
                  {
                    $set: {
                      status: "approved",
                      Status: "approved",
                      error: "LinkedIn access token expired. Please reconnect LinkedIn.",
                      updatedAt: new Date(),
                      updated_at: new Date(),
                    },
                    $unset: {
                      scheduledFor: 1,
                      scheduled_for: 1,
                    },
                  },
                )
              } else {
                // For other errors, keep it scheduled but add error info
                await collection.updateOne(
                  { _id: post._id },
                  {
                    $set: {
                      error: `LinkedIn API error: ${errorText}`,
                      lastAttempt: new Date(),
                      updatedAt: new Date(),
                      updated_at: new Date(),
                    },
                  },
                )
              }

              totalErrors++
              results.push({
                postId: post._id,
                collection: collectionName,
                status: "error",
                error: errorText,
              })
            }
          } catch (error) {
            console.error(`❌ Error processing post ${post._id}:`, error)

            await collection.updateOne(
              { _id: post._id },
              {
                $set: {
                  status: "approved",
                  Status: "approved",
                  error: getErrorMessage(error),
                  lastAttempt: new Date(),
                  updatedAt: new Date(),
                  updated_at: new Date(),
                },
                $unset: {
                  scheduledFor: 1,
                  scheduled_for: 1,
                },
              },
            )

            totalErrors++
            results.push({
              postId: post._id,
              collection: collectionName,
              status: "error",
              error: getErrorMessage(error),
            })
          }
        }
      } catch (collectionError) {
        console.error(`❌ Error processing collection ${collectionName}:`, collectionError)
      }
    }

    console.log(
      `🎯 CRON Job completed: ${totalPosted} posted, ${totalErrors} errors, ${totalProcessed} total processed`,
    )

    // Reset the running flag
    isAutoPostingRunning = false

    return NextResponse.json({
      success: true,
      message: `Processed ${totalProcessed} posts across all collections`,
      posted: totalPosted,
      errors: totalErrors,
      totalProcessed,
      results,
      timestamp: new Date().toISOString(),
      lastRun: lastRunTime.toISOString(),
      nextRun: new Date(lastRunTime.getTime() + 1 * 60 * 1000).toISOString(),
    })
  } catch (error) {
    // Reset the running flag on error
    isAutoPostingRunning = false
    
    console.error("❌ CRON Job error:", error)
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
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
