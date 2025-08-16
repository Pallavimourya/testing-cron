import User from "@/models/User"
import ScheduledPost from "@/models/ScheduledPost"
import connectDB from "@/lib/mongodb"

interface PostToLinkedInParams {
  content: string
  imageUrl?: string
  user: any
  scheduledPostId?: string
}

interface LinkedInPostResponse {
  id: string
  url: string
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
      throw new Error(`Failed to register upload: ${registerResponse.status} ${errorText}`)
    }

    const registerData = await registerResponse.json()

    // Step 2: Download the image
    const imageResponse = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    })

    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.status}`)
    }

    const imageBuffer = await imageResponse.arrayBuffer()

    // Step 3: Upload the image
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
      throw new Error(`Failed to upload image: ${uploadResponse.status} ${errorText}`)
    }

    return registerData.value.asset
  } catch (error) {
    console.error("❌ Error uploading image to LinkedIn:", error)
    throw error
  }
}

// Check if LinkedIn token is valid and refresh if needed
async function validateLinkedInToken(user: any): Promise<boolean> {
  try {
    if (!user.linkedinAccessToken || !user.linkedinTokenExpiry) {
      return false
    }

    const now = new Date()
    const expiry = new Date(user.linkedinTokenExpiry)

    // If token expires in less than 5 minutes, consider it invalid
    const bufferTime = 5 * 60 * 1000 // 5 minutes
    if (expiry.getTime() - now.getTime() < bufferTime) {
      console.log("🔄 LinkedIn token expired or expiring soon")
      return false
    }

    // Test the token with a simple API call
    const testResponse = await fetch("https://api.linkedin.com/v2/me", {
      headers: {
        Authorization: `Bearer ${user.linkedinAccessToken}`,
      },
    })

    return testResponse.ok
  } catch (error) {
    console.error("❌ Error validating LinkedIn token:", error)
    return false
  }
}

// Main function to post content to LinkedIn
export async function postToLinkedIn({
  content,
  imageUrl,
  user,
  scheduledPostId,
}: PostToLinkedInParams): Promise<LinkedInPostResponse> {
  try {
    console.log("📤 Starting LinkedIn post for user:", user.email)

    // Validate LinkedIn token
    const isTokenValid = await validateLinkedInToken(user)
    if (!isTokenValid) {
      throw new Error("LinkedIn access token is invalid or expired. Please reconnect your LinkedIn account.")
    }

    // Prepare LinkedIn post data
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

    // Handle image if present
    if (imageUrl) {
      try {
        console.log("📷 Uploading image to LinkedIn")
        const imageAsset = await uploadImageToLinkedIn(imageUrl, user.linkedinAccessToken, user.linkedinProfile?.id)

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
      } catch (imageError) {
        console.error("❌ Error uploading image, posting without image:", imageError)
        // Continue with text-only post
      }
    }

    // Post to LinkedIn
    const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${user.linkedinAccessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(postBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`LinkedIn API error: ${response.status} ${errorText}`)
    }

    const linkedinResponse = await response.json()
    const linkedinUrl = `https://www.linkedin.com/feed/update/${linkedinResponse.id}/`

    console.log("✅ Successfully posted to LinkedIn:", linkedinResponse.id)

    return {
      id: linkedinResponse.id,
      url: linkedinUrl,
    }
  } catch (error) {
    console.error("❌ Error posting to LinkedIn:", error)
    throw error
  }
}

// Function to process scheduled posts (used by cron job)
export async function processScheduledPosts(): Promise<{
  processed: number
  posted: number
  failed: number
  errors: string[]
}> {
  const results = {
    processed: 0,
    posted: 0,
    failed: 0,
    errors: [] as string[],
  }

  try {
    await connectDB()

    const now = new Date()
    console.log(`🔍 Checking for scheduled posts at ${now.toISOString()}`)

    // Find posts that are due for posting
    const duePosts = await ScheduledPost.find({
      scheduledAt: { $lte: now },
      status: "pending",
      retries: { $lt: 3 }, // Don't retry posts that have failed 3 times
    }).sort({ scheduledAt: 1 }) // Process oldest first

    console.log(`📊 Found ${duePosts.length} posts due for posting`)

    for (const post of duePosts) {
      results.processed++

      try {
        console.log(`📤 Processing scheduled post: ${post._id}`)

        // Get user details
        const user = await User.findById(post.userId).select(
          "+linkedinAccessToken +linkedinTokenExpiry +linkedinProfile",
        )
        if (!user) {
          throw new Error("User not found")
        }

        // Post to LinkedIn
        const linkedinResult = await postToLinkedIn({
          content: post.content,
          imageUrl: post.imageUrl || undefined,
          user,
          scheduledPostId: post._id.toString(),
        })

        // Update post status to posted
        await ScheduledPost.findByIdAndUpdate(post._id, {
          status: "posted",
          postedAt: new Date(),
          linkedinPostId: linkedinResult.id,
          linkedinUrl: linkedinResult.url,
          errorMessage: null,
          lastAttemptAt: new Date(),
        })

        results.posted++
        console.log(`✅ Successfully posted scheduled post: ${post._id}`)
      } catch (error) {
        console.error(`❌ Error processing scheduled post ${post._id}:`, error)

        const errorMessage = error instanceof Error ? error.message : String(error)
        results.errors.push(`Post ${post._id}: ${errorMessage}`)

        // Update post with error and increment retries
        const updatedPost = await ScheduledPost.findByIdAndUpdate(
          post._id,
          {
            $inc: { retries: 1 },
            errorMessage,
            lastAttemptAt: new Date(),
          },
          { new: true },
        )

        // If max retries reached, mark as failed
        if (updatedPost && updatedPost.retries >= 3) {
          await ScheduledPost.findByIdAndUpdate(post._id, {
            status: "failed",
          })
          results.failed++
          console.log(`❌ Post ${post._id} marked as failed after 3 retries`)
        } else {
          console.log(`🔄 Post ${post._id} will retry (attempt ${updatedPost?.retries}/3)`)
        }
      }
    }

    console.log(`🎯 Scheduled posts processing complete:`, results)
    return results
  } catch (error) {
    console.error("❌ Error in processScheduledPosts:", error)
    results.errors.push(`System error: ${error instanceof Error ? error.message : String(error)}`)
    return results
  }
}
