export interface LinkedInPostResult {
  success: boolean
  postId?: string
  url?: string
  error?: string
}

export interface LinkedInAnalytics {
  likes: number
  comments: number
  shares: number
  impressions: number
  clicks: number
}

export class LinkedInService {
  constructor() {
    // No logger dependency needed
  }

  async validateToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch("https://api.linkedin.com/v2/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Restli-Protocol-Version": "2.0.0",
        },
      })
      return response.ok
    } catch (error) {
      console.error("Token validation error:", error)
      return false
    }
  }

  async getPostAnalytics(postId: string, accessToken: string): Promise<LinkedInAnalytics | null> {
    const analytics: LinkedInAnalytics = {
      likes: 0,
      comments: 0,
      shares: 0,
      impressions: 0,
      clicks: 0,
    }

    try {
      // Try UGC Posts endpoint first (most comprehensive)
      const ugcResponse = await fetch(
        `https://api.linkedin.com/v2/ugcPosts/${postId}?projection=(shareStatistics,likesSummary,commentsSummary)`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "X-Restli-Protocol-Version": "2.0.0",
          },
        },
      )

      if (ugcResponse.ok) {
        const data = await ugcResponse.json()
        
        if (data.likesSummary) {
          analytics.likes = data.likesSummary.totalLikes || 0
        }
        if (data.commentsSummary) {
          analytics.comments = data.commentsSummary.totalComments || 0
        }
        if (data.shareStatistics) {
          analytics.shares = data.shareStatistics.shareCount || 0
          analytics.impressions = data.shareStatistics.impressionCount || 0
          analytics.clicks = data.shareStatistics.clickCount || 0
        }
        
        return analytics
      }

      // Fallback to social actions endpoint
      const socialResponse = await fetch(
        `https://api.linkedin.com/v2/socialActions/${postId}?projection=(likesSummary,commentsSummary)`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "X-Restli-Protocol-Version": "2.0.0",
          },
        },
      )

      if (socialResponse.ok) {
        const data = await socialResponse.json()
        analytics.likes = data.likesSummary?.totalLikes || 0
        analytics.comments = data.commentsSummary?.totalComments || 0
        return analytics
      }

      // Try shares endpoint for additional metrics
      const sharesResponse = await fetch(
        `https://api.linkedin.com/v2/shares/${postId}?projection=(shareStatistics)`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "X-Restli-Protocol-Version": "2.0.0",
          },
        },
      )

      if (sharesResponse.ok) {
        const data = await sharesResponse.json()
        if (data.shareStatistics) {
          analytics.shares = data.shareStatistics.shareCount || analytics.shares
          analytics.impressions = data.shareStatistics.impressionCount || analytics.impressions
          analytics.clicks = data.shareStatistics.clickCount || analytics.clicks
        }
      }

      return analytics
    } catch (error) {
      console.error("Error fetching post analytics:", error)
      return null
    }
  }

  async postToLinkedIn(
    content: string,
    imageUrl?: string,
    accessToken?: string,
    linkedinPersonId?: string,
  ): Promise<LinkedInPostResult> {
    if (!accessToken || !linkedinPersonId) {
      return { success: false, error: "Missing LinkedIn credentials" }
    }

    try {
      console.log("Posting to LinkedIn", {
        contentLength: content.length,
        hasImage: !!imageUrl,
        personId: linkedinPersonId,
      })

      // Prepare post body
      const postBody: any = {
        author: `urn:li:person:${linkedinPersonId}`,
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
          const imageAsset = await this.uploadImageToLinkedIn(imageUrl, accessToken, linkedinPersonId)

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

          console.log("Image prepared for LinkedIn post")
        } catch (imageError) {
          console.warn("Failed to upload image, posting without image", { error: imageError })
          // Continue with text-only post
        }
      }

      // Post to LinkedIn
      const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0",
        },
        body: JSON.stringify(postBody),
      })

      if (response.ok) {
        const data = await response.json()
        const linkedinUrl = `https://www.linkedin.com/feed/update/${data.id}/`

        console.log("Successfully posted to LinkedIn", { postId: data.id })

        return {
          success: true,
          postId: data.id,
          url: linkedinUrl,
        }
      } else {
        const errorText = await response.text()
        console.error("LinkedIn API error", { status: response.status, error: errorText })

        return {
          success: false,
          error: `LinkedIn API error: ${response.status} - ${errorText}`,
        }
      }
    } catch (error: any) {
      console.error("Error posting to LinkedIn", { error: error.message })
      return {
        success: false,
        error: error.message || "Failed to post to LinkedIn",
      }
    }
  }

  private async uploadImageToLinkedIn(
    imageUrl: string,
    accessToken: string,
    linkedinPersonId: string,
  ): Promise<string> {
    try {
      // Step 1: Register upload
      const registerResponse = await fetch(
        "https://api.linkedin.com/v2/assets?action=registerUpload",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0",
          },
          body: JSON.stringify({
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
          }),
        },
      )

      if (!registerResponse.ok) {
        throw new Error(`Failed to register upload: ${registerResponse.status}`)
      }

      const registerData = await registerResponse.json()
      const uploadUrl = registerData.value.uploadMechanism["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"]
        .uploadUrl
      const asset = registerData.value.asset

      // Step 2: Download and upload image
      const imageResponse = await fetch(imageUrl)
      if (!imageResponse.ok) {
        throw new Error(`Failed to download image: ${imageResponse.status}`)
      }

      const imageBuffer = await imageResponse.arrayBuffer()

      // Step 3: Upload to LinkedIn
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/octet-stream",
        },
        body: imageBuffer,
      })

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload image: ${uploadResponse.status}`)
      }

      return asset
    } catch (error: any) {
      console.error("Error uploading image to LinkedIn", { error: error.message })
      throw error
    }
  }
}
