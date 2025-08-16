import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import mongoose from "mongoose"

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

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { content, imageUrl, contentId } = body

    if (!content && !contentId) {
      return NextResponse.json({ error: "Content or contentId is required" }, { status: 400 })
    }

    await connectDB()

    // Get user with LinkedIn fields
    const user = await User.findOne({ email: session.user.email }).select('+linkedinAccessToken +linkedinTokenExpiry +linkedinProfile')
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check LinkedIn connection in User model
    if (!user.linkedinAccessToken || !user.linkedinTokenExpiry || new Date(user.linkedinTokenExpiry) <= new Date()) {
      return NextResponse.json(
        {
          error: "LinkedIn account not connected. Please connect your LinkedIn account first.",
        },
        { status: 400 },
      )
    }

    console.log("🔗 LinkedIn connected for user:", user.email)

    let postContent = content
    let postImageUrl = imageUrl

    // If contentId is provided, fetch content from approvedcontents collection
    if (contentId && !content) {
      if (mongoose.connection.db) {
        const approvedContentsCollection = mongoose.connection.db.collection("approvedcontents")

        const contentData = await approvedContentsCollection.findOne({
          $and: [
            {
              $or: [{ _id: new mongoose.Types.ObjectId(contentId) }, { id: contentId }, { ID: contentId }],
            },
            {
              $or: [
                { email: user.email },
                { "user id": user._id.toString() },
                { user_id: user._id.toString() },
                { userId: user._id.toString() },
                { userId: user._id },
              ],
            },
          ],
        })

        if (!contentData) {
          return NextResponse.json({ error: "Approved content not found" }, { status: 404 })
        }

        postContent = contentData.content || contentData.Content || contentData["generated content"] || ""
        postImageUrl = contentData.imageUrl || contentData.Image || contentData.image_url || null

        console.log("📋 Content fetched from approvedcontents:", {
          contentLength: postContent.length,
          hasImage: !!postImageUrl,
        })
      }
    }

    if (!postContent || !postContent.trim()) {
      return NextResponse.json({ error: "Content is empty" }, { status: 400 })
    }

    console.log("📤 Posting content to LinkedIn:", {
      contentId: contentId,
      contentLength: postContent.length,
      hasImage: !!postImageUrl,
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
            text: postContent,
          },
          shareMediaCategory: "NONE",
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    }

    // If there's an image, upload it to LinkedIn first
    if (postImageUrl) {
      try {
        console.log("📷 Content has image, uploading to LinkedIn:", postImageUrl)

        // Upload image to LinkedIn
        const imageAsset = await uploadImageToLinkedIn(
          postImageUrl,
          user.linkedinAccessToken!,
          user.linkedinProfile?.id!,
        )

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

      // Update content status to posted if contentId is provided
      if (contentId && mongoose.connection.db) {
        const updateData = {
          status: "posted",
          postedAt: new Date(),
          posted_at: new Date(),
          linkedinPostId: linkedinResponse.id,
          linkedin_post_id: linkedinResponse.id,
          linkedinUrl: linkedinUrl,
          linkedin_url: linkedinUrl,
          linkedinResponse: linkedinResponse,
          updatedAt: new Date(),
          updated_at: new Date(),
        }

        // Update in approvedcontents collection
        const approvedContentsCollection = mongoose.connection.db.collection("approvedcontents")
        await approvedContentsCollection.updateOne(
          {
            $and: [
              {
                $or: [{ _id: new mongoose.Types.ObjectId(contentId) }, { id: contentId }, { ID: contentId }],
              },
              {
                $or: [
                  { email: user.email },
                  { "user id": user._id.toString() },
                  { user_id: user._id.toString() },
                  { userId: user._id.toString() },
                  { userId: user._id },
                ],
              },
            ],
          },
          {
            $set: updateData,
            $unset: { error: 1 },
          },
        )

        console.log("✅ Updated content status to 'posted' in approvedcontents")
      }

      return NextResponse.json({
        success: true,
        message: "Content posted to LinkedIn successfully!",
        linkedinPostId: linkedinResponse.id,
        postId: linkedinResponse.id,
        url: linkedinUrl,
        linkedinResponse: linkedinResponse,
      })
    } else {
      const errorData = await response.text()
      console.error("❌ Failed to post to LinkedIn:", response.status, errorData)

      // Update content with error if contentId is provided
      if (contentId && mongoose.connection.db) {
        const errorUpdateData = {
          error: `LinkedIn posting failed: ${response.status} ${response.statusText}`,
          lastAttempt: new Date(),
          updatedAt: new Date(),
          updated_at: new Date(),
        }

        const approvedContentsCollection = mongoose.connection.db.collection("approvedcontents")
        await approvedContentsCollection.updateOne(
          {
            $and: [
              {
                $or: [{ _id: new mongoose.Types.ObjectId(contentId) }, { id: contentId }, { ID: contentId }],
              },
              {
                $or: [
                  { email: user.email },
                  { "user id": user._id.toString() },
                  { user_id: user._id.toString() },
                  { userId: user._id.toString() },
                  { userId: user._id },
                ],
              },
            ],
          },
          { $set: errorUpdateData },
        )

        console.log("❌ Updated content with error in approvedcontents")
      }

      return NextResponse.json(
        {
          error: `Failed to post to LinkedIn: ${response.status} ${response.statusText}`,
          details: errorData,
        },
        { status: response.status },
      )
    }
  } catch (error: any) {
    console.error("❌ Error posting to LinkedIn:", error)
    return NextResponse.json(
      {
        error: error.message || "Failed to post to LinkedIn",
      },
      { status: 500 },
    )
  }
}
