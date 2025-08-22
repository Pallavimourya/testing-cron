import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
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

    // Get all posts from database
    let allPosts: any[] = []
    let realDataPosts: any[] = []
    
    if (mongoose.connection.db) {
      const approvedContentsCollection = mongoose.connection.db.collection("approvedcontents")

      allPosts = await approvedContentsCollection
        .find({
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
        .toArray()

      // Filter posts with real data
      realDataPosts = allPosts.filter(post => post.isRealData === true)
    }

    const testResults = {
      totalPosts: allPosts.length,
      realDataPosts: realDataPosts.length,
      fakeDataPosts: allPosts.length - realDataPosts.length,
      realDataPercentage: allPosts.length > 0 ? ((realDataPosts.length / allPosts.length) * 100).toFixed(1) : "0",
      postsWithAnalytics: allPosts.filter(post => post.analytics).length,
      postsWithoutAnalytics: allPosts.filter(post => !post.analytics).length,
      sampleRealDataPost: realDataPosts[0] ? {
        id: realDataPosts[0]._id,
        linkedinPostId: realDataPosts[0].linkedinPostId,
        analytics: realDataPosts[0].analytics,
        isRealData: realDataPosts[0].isRealData,
        lastAnalyticsUpdate: realDataPosts[0].lastAnalyticsUpdate,
      } : null,
      sampleFakeDataPost: allPosts.find(post => !post.isRealData) ? {
        id: allPosts.find(post => !post.isRealData)?._id,
        linkedinPostId: allPosts.find(post => !post.isRealData)?.linkedinPostId,
        analytics: allPosts.find(post => !post.isRealData)?.analytics,
        isRealData: allPosts.find(post => !post.isRealData)?.isRealData,
      } : null,
    }

    return NextResponse.json({
      success: true,
      message: "Real data analysis completed",
      results: testResults,
      summary: {
        message: `Found ${realDataPosts.length} posts with real data out of ${allPosts.length} total posts (${testResults.realDataPercentage}%)`,
        recommendation: realDataPosts.length === 0 
          ? "No real data found. Please ensure your LinkedIn posts have been published and analytics are accessible."
          : realDataPosts.length < allPosts.length
          ? "Some posts have fake data. The system will now only show real data."
          : "All posts have real data. Perfect!"
      }
    })
  } catch (error) {
    console.error("❌ Real data test error:", error)
    return NextResponse.json(
      {
        error: "Failed to test real data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
