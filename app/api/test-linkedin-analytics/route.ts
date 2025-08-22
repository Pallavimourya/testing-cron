import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import { LinkedInService } from "@/lib/services/linkedin-service"
import mongoose from "mongoose"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const user = await User.findOne({ email: session.user.email }).select(
      "+linkedinAccessToken +linkedinTokenExpiry +linkedinProfile",
    )

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (!user.linkedinAccessToken) {
      return NextResponse.json({ error: "LinkedIn not connected" }, { status: 400 })
    }

    const linkedinService = new LinkedInService()

    // Test token validation
    const isTokenValid = await linkedinService.validateToken(user.linkedinAccessToken)
    
    if (!isTokenValid) {
      return NextResponse.json({ 
        error: "LinkedIn token is invalid or expired",
        tokenExpiry: user.linkedinTokenExpiry 
      }, { status: 400 })
    }

    // Get a sample post ID to test analytics
    let samplePost: any = null
    if (mongoose.connection.db) {
      const approvedContentsCollection = mongoose.connection.db.collection("approvedcontents")
      samplePost = await approvedContentsCollection.findOne({
        $and: [
          {
            $or: [
              { email: user.email },
              { "user id": user._id.toString() },
              { user_id: user._id.toString() },
              { userId: user._id.toString() },
              { userId: user._id },
            ],
          },
          {
            status: "posted",
            linkedinPostId: { $exists: true, $ne: null },
          },
        ],
      })
    }

    if (!samplePost?.linkedinPostId) {
      return NextResponse.json({ 
        error: "No posted content found to test analytics",
        message: "Please post some content to LinkedIn first to test analytics"
      }, { status: 404 })
    }

    const postId = samplePost.linkedinPostId || samplePost.linkedin_post_id

    // Test different analytics endpoints
    const results: any = {
      tokenValid: isTokenValid,
      postId,
      endpoints: {},
    }

    // Test UGC Posts endpoint
    try {
      const ugcResponse = await fetch(
        `https://api.linkedin.com/v2/ugcPosts/${postId}?projection=(shareStatistics,likesSummary,commentsSummary)`,
        {
          headers: {
            Authorization: `Bearer ${user.linkedinAccessToken}`,
            "X-Restli-Protocol-Version": "2.0.0",
          },
        },
      )

      results.endpoints.ugcPosts = {
        status: ugcResponse.status,
        ok: ugcResponse.ok,
        data: ugcResponse.ok ? await ugcResponse.json() : await ugcResponse.text(),
      }
    } catch (error) {
      results.endpoints.ugcPosts = {
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }

    // Test Social Actions endpoint
    try {
      const socialResponse = await fetch(
        `https://api.linkedin.com/v2/socialActions/${postId}?projection=(likesSummary,commentsSummary)`,
        {
          headers: {
            Authorization: `Bearer ${user.linkedinAccessToken}`,
            "X-Restli-Protocol-Version": "2.0.0",
          },
        },
      )

      results.endpoints.socialActions = {
        status: socialResponse.status,
        ok: socialResponse.ok,
        data: socialResponse.ok ? await socialResponse.json() : await socialResponse.text(),
      }
    } catch (error) {
      results.endpoints.socialActions = {
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }

    // Test Shares endpoint
    try {
      const sharesResponse = await fetch(
        `https://api.linkedin.com/v2/shares/${postId}?projection=(shareStatistics)`,
        {
          headers: {
            Authorization: `Bearer ${user.linkedinAccessToken}`,
            "X-Restli-Protocol-Version": "2.0.0",
          },
        },
      )

      results.endpoints.shares = {
        status: sharesResponse.status,
        ok: sharesResponse.ok,
        data: sharesResponse.ok ? await sharesResponse.json() : await sharesResponse.text(),
      }
    } catch (error) {
      results.endpoints.shares = {
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }

    // Test using the service method
    try {
      const serviceAnalytics = await linkedinService.getPostAnalytics(postId, user.linkedinAccessToken)
      results.serviceAnalytics = serviceAnalytics
    } catch (error) {
      results.serviceAnalytics = {
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error) {
    console.error("❌ LinkedIn analytics test error:", error)
    return NextResponse.json(
      {
        error: "Failed to test LinkedIn analytics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
