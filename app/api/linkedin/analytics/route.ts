import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import mongoose from "mongoose"

interface LinkedInPost {
  id: string
  text: string
  createdAt: string
  likes: number
  comments: number
  shares: number
  impressions: number
  clicks: number
  url: string
  status: "posted" | "failed" | "pending"
  contentId?: string
  imageUrl?: string
  engagementRate: number
  reach: number
  type: "text" | "image" | "video" | "article"
  isRealData: boolean
}

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

    console.log("📊 Fetching REAL LinkedIn analytics for user:", user.email)

    // Check if LinkedIn is connected
    if (!user.linkedinAccessToken || (user.linkedinTokenExpiry && new Date(user.linkedinTokenExpiry) <= new Date())) {
      return NextResponse.json({ error: "LinkedIn not connected or token expired" }, { status: 400 })
    }

    // Get posts from approvedcontents collection that were posted to LinkedIn
    let postedContent: any[] = []
    if (mongoose.connection.db) {
      const approvedContentsCollection = mongoose.connection.db.collection("approvedcontents")

      postedContent = await approvedContentsCollection
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
        .sort({ postedAt: -1 })
        .limit(100)
        .toArray()

      console.log("📋 Found posted content for analytics:", postedContent.length)
    }

    const linkedInPosts: LinkedInPost[] = []
    let totalLikes = 0
    let totalComments = 0
    let totalShares = 0
    let totalImpressions = 0
    let totalClicks = 0
    let realDataPosts = 0

    for (const content of postedContent) {
      try {
        const linkedinPostId = content.linkedinPostId || content.linkedin_post_id
        if (!linkedinPostId) continue

        let postAnalytics = {
          likes: 0,
          comments: 0,
          shares: 0,
          impressions: 0,
          clicks: 0,
        }

        let isRealData = false

        // Try to get REAL analytics from LinkedIn API
        try {
          // Try the UGC Posts endpoint first (most comprehensive)
          const ugcController = new AbortController()
          const ugcTimeoutId = setTimeout(() => ugcController.abort(), 15000)

          const ugcResponse = await fetch(
            `https://api.linkedin.com/v2/ugcPosts/${linkedinPostId}?projection=(shareStatistics,likesSummary,commentsSummary)`,
            {
              headers: {
                Authorization: `Bearer ${user.linkedinAccessToken}`,
                "X-Restli-Protocol-Version": "2.0.0",
              },
              signal: ugcController.signal,
            },
          )

          clearTimeout(ugcTimeoutId)

          if (ugcResponse.ok) {
            const ugcData = await ugcResponse.json()
            
            // Extract engagement data
            if (ugcData.likesSummary) {
              postAnalytics.likes = ugcData.likesSummary.totalLikes || 0
            }
            if (ugcData.commentsSummary) {
              postAnalytics.comments = ugcData.commentsSummary.totalComments || 0
            }
            if (ugcData.shareStatistics) {
              postAnalytics.shares = ugcData.shareStatistics.shareCount || 0
              postAnalytics.impressions = ugcData.shareStatistics.impressionCount || 0
              postAnalytics.clicks = ugcData.shareStatistics.clickCount || 0
            }
            
            isRealData = true
            console.log(`✅ REAL UGC analytics for post ${linkedinPostId}:`, {
              likes: postAnalytics.likes,
              comments: postAnalytics.comments,
              shares: postAnalytics.shares,
              impressions: postAnalytics.impressions,
              clicks: postAnalytics.clicks,
            })
          } else {
            console.warn(`⚠️ UGC endpoint failed for post ${linkedinPostId}:`, ugcResponse.status)
            
            // Fallback to social actions endpoint
            try {
              const socialController = new AbortController()
              const socialTimeoutId = setTimeout(() => socialController.abort(), 10000)

              const socialResponse = await fetch(
                `https://api.linkedin.com/v2/socialActions/${linkedinPostId}?projection=(likesSummary,commentsSummary)`,
                {
                  headers: {
                    Authorization: `Bearer ${user.linkedinAccessToken}`,
                    "X-Restli-Protocol-Version": "2.0.0",
                  },
                  signal: socialController.signal,
                },
              )

              clearTimeout(socialTimeoutId)

              if (socialResponse.ok) {
                const socialData = await socialResponse.json()
                postAnalytics.likes = socialData.likesSummary?.totalLikes || 0
                postAnalytics.comments = socialData.commentsSummary?.totalComments || 0
                isRealData = true
                console.log(`✅ REAL social actions analytics for post ${linkedinPostId}:`, {
                  likes: postAnalytics.likes,
                  comments: postAnalytics.comments,
                })
              } else {
                console.warn(`⚠️ Social actions endpoint failed for post ${linkedinPostId}:`, socialResponse.status)
              }
            } catch (socialError) {
              console.warn("⚠️ Social actions fetch error:", socialError)
            }

            // Try shares endpoint for additional metrics
            try {
              const sharesController = new AbortController()
              const sharesTimeoutId = setTimeout(() => sharesController.abort(), 10000)

              const sharesResponse = await fetch(
                `https://api.linkedin.com/v2/shares/${linkedinPostId}?projection=(shareStatistics)`,
                {
                  headers: {
                    Authorization: `Bearer ${user.linkedinAccessToken}`,
                    "X-Restli-Protocol-Version": "2.0.0",
                  },
                  signal: sharesController.signal,
                },
              )

              clearTimeout(sharesTimeoutId)

              if (sharesResponse.ok) {
                const sharesData = await sharesResponse.json()
                if (sharesData.shareStatistics) {
                  postAnalytics.shares = sharesData.shareStatistics.shareCount || postAnalytics.shares
                  postAnalytics.impressions = sharesData.shareStatistics.impressionCount || postAnalytics.impressions
                  postAnalytics.clicks = sharesData.shareStatistics.clickCount || postAnalytics.clicks
                  isRealData = true
                  console.log(`✅ REAL shares analytics for post ${linkedinPostId}:`, sharesData.shareStatistics)
                }
              } else {
                console.warn(`⚠️ Shares endpoint failed for post ${linkedinPostId}:`, sharesResponse.status)
              }
            } catch (sharesError) {
              console.warn("⚠️ Shares fetch error:", sharesError)
            }
          }
        } catch (apiError) {
          console.warn("⚠️ Could not fetch real analytics for post:", linkedinPostId, apiError)
        }

        // ONLY include posts with real data
        if (isRealData) {
          // Determine post type based on content
          let postType: "text" | "image" | "video" | "article" = "text"
          if (content.imageUrl || content.image_url || content.Image) {
            postType = "image"
          } else if (content.videoUrl || content.video_url) {
            postType = "video"
          } else if (content.articleUrl || content.article_url) {
            postType = "article"
          }

          // Calculate engagement rate
          const totalEngagement = postAnalytics.likes + postAnalytics.comments + postAnalytics.shares
          const engagementRate = postAnalytics.impressions > 0 ? (totalEngagement / postAnalytics.impressions) * 100 : 0

          const post: LinkedInPost = {
            id: linkedinPostId,
            text: content.content || content.Content || content["generated content"] || "",
            createdAt: content.postedAt || content.posted_at || content.createdAt || new Date().toISOString(),
            likes: postAnalytics.likes,
            comments: postAnalytics.comments,
            shares: postAnalytics.shares,
            impressions: postAnalytics.impressions,
            clicks: postAnalytics.clicks,
            url: content.linkedinUrl || content.linkedin_url || `https://www.linkedin.com/feed/update/${linkedinPostId}/`,
            status: "posted",
            contentId: content._id?.toString() || content.id || content.ID,
            imageUrl: content.imageUrl || content.image_url || content.Image || null,
            engagementRate,
            reach: postAnalytics.impressions,
            type: postType,
            isRealData: true,
          }

          linkedInPosts.push(post)
          realDataPosts++

          // Add to totals
          totalLikes += postAnalytics.likes
          totalComments += postAnalytics.comments
          totalShares += postAnalytics.shares
          totalImpressions += postAnalytics.impressions
          totalClicks += postAnalytics.clicks

          // Store updated analytics in database
          if (mongoose.connection.db) {
            const approvedContentsCollection = mongoose.connection.db.collection("approvedcontents")
            await approvedContentsCollection.updateOne(
              { _id: content._id },
              {
                $set: {
                  analytics: postAnalytics,
                  lastAnalyticsUpdate: new Date(),
                  isRealData: true,
                },
              },
            )
          }
        } else {
          console.log(`❌ Skipping post ${linkedinPostId} - no real data available`)
        }
      } catch (postError) {
        console.error("❌ Error processing post analytics:", postError)
      }
    }

    // Only calculate analytics if we have real data
    if (linkedInPosts.length === 0) {
      return NextResponse.json({
        success: true,
        analytics: {
          totalPosts: 0,
          totalLikes: 0,
          totalComments: 0,
          totalShares: 0,
          totalImpressions: 0,
          totalClicks: 0,
          averageEngagement: 0,
          topPost: null,
          recentPosts: [],
          monthlyStats: {
            posts: 0,
            engagement: 0,
            reach: 0,
            growth: 0,
          },
          weeklyStats: {
            posts: 0,
            engagement: 0,
            reach: 0,
          },
          performanceMetrics: {
            bestPerformingDay: "Monday",
            bestPerformingTime: "Morning",
            averagePostsPerWeek: 0,
            engagementTrend: "stable" as "up" | "down" | "stable",
          },
          realDataPosts: 0,
          message: "No real LinkedIn data available. Please ensure your posts have been published and analytics are accessible.",
        },
      })
    }

    // Calculate comprehensive analytics from REAL data only
    const totalPosts = linkedInPosts.length
    const totalEngagement = totalLikes + totalComments + totalShares
    const averageEngagement = totalImpressions > 0 ? (totalEngagement / totalImpressions) * 100 : 0

    // Find top performing post
    const topPost = linkedInPosts.reduce((prev, current) => {
      const prevEngagement = prev.likes + prev.comments + prev.shares
      const currentEngagement = current.likes + current.comments + current.shares
      return currentEngagement > prevEngagement ? current : prev
    }, linkedInPosts[0] || null)

    // Get recent posts (last 20)
    const recentPosts = linkedInPosts.slice(0, 20)

    // Calculate monthly stats
    const thisMonth = new Date()
    thisMonth.setDate(1)
    const monthlyPosts = linkedInPosts.filter((post) => new Date(post.createdAt) >= thisMonth)
    const monthlyEngagement = monthlyPosts.reduce((sum, post) => sum + post.likes + post.comments + post.shares, 0)
    const monthlyReach = monthlyPosts.reduce((sum, post) => sum + post.impressions, 0)

    // Calculate weekly stats
    const thisWeek = new Date()
    thisWeek.setDate(thisWeek.getDate() - 7)
    const weeklyPosts = linkedInPosts.filter((post) => new Date(post.createdAt) >= thisWeek)
    const weeklyEngagement = weeklyPosts.reduce((sum, post) => sum + post.likes + post.comments + post.shares, 0)
    const weeklyReach = weeklyPosts.reduce((sum, post) => sum + post.impressions, 0)

    // Calculate performance metrics
    const postsByDay = linkedInPosts.reduce(
      (acc, post) => {
        const day = new Date(post.createdAt).toLocaleDateString("en-US", { weekday: "long" })
        acc[day] = (acc[day] || 0) + (post.likes + post.comments + post.shares)
        return acc
      },
      {} as Record<string, number>,
    )

    const bestPerformingDay =
      Object.entries(postsByDay).reduce((a, b) => (postsByDay[a[0]] > postsByDay[b[0]] ? a : b), ["Monday", 0])[0] ||
      "Monday"

    const postsByHour = linkedInPosts.reduce(
      (acc, post) => {
        const hour = new Date(post.createdAt).getHours()
        const timeSlot = hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening"
        acc[timeSlot] = (acc[timeSlot] || 0) + (post.likes + post.comments + post.shares)
        return acc
      },
      {} as Record<string, number>,
    )

    const bestPerformingTime =
      Object.entries(postsByHour).reduce(
        (a, b) => (postsByHour[a[0]] > postsByHour[b[0]] ? a : b),
        ["Morning", 0],
      )[0] || "Morning"

    // Calculate engagement trend
    const recentEngagement =
      recentPosts.slice(0, 5).reduce((sum, post) => sum + post.engagementRate, 0) /
      Math.max(1, recentPosts.slice(0, 5).length)
    const olderEngagement =
      recentPosts.slice(5, 10).reduce((sum, post) => sum + post.engagementRate, 0) /
      Math.max(1, recentPosts.slice(5, 10).length)
    const engagementTrend =
      recentEngagement > olderEngagement * 1.1 ? "up" : recentEngagement < olderEngagement * 0.9 ? "down" : "stable"

    const analytics = {
      totalPosts,
      totalLikes,
      totalComments,
      totalShares,
      totalImpressions,
      totalClicks,
      averageEngagement: isNaN(averageEngagement) ? 0 : averageEngagement,
      topPost,
      recentPosts,
      monthlyStats: {
        posts: monthlyPosts.length,
        engagement: monthlyEngagement,
        reach: monthlyReach,
        growth: monthlyReach > 0 ? (monthlyEngagement / monthlyReach) * 100 : 0,
      },
      weeklyStats: {
        posts: weeklyPosts.length,
        engagement: weeklyEngagement,
        reach: weeklyReach,
      },
      performanceMetrics: {
        bestPerformingDay,
        bestPerformingTime,
        averagePostsPerWeek:
          totalPosts > 0
            ? totalPosts /
              Math.max(
                1,
                Math.ceil(
                  (Date.now() - new Date(linkedInPosts[linkedInPosts.length - 1]?.createdAt || Date.now()).getTime()) /
                    (7 * 24 * 60 * 60 * 1000),
                ),
              )
            : 0,
        engagementTrend: engagementTrend as "up" | "down" | "stable",
      },
      realDataPosts,
      message: `Showing ${realDataPosts} posts with real LinkedIn data`,
    }

    console.log("✅ REAL LinkedIn analytics calculated:", {
      totalPosts,
      realDataPosts,
      totalLikes,
      totalComments,
      totalShares,
      totalImpressions,
      totalEngagement,
      averageEngagement: analytics.averageEngagement.toFixed(2) + "%",
      bestPerformingDay,
      bestPerformingTime,
    })

    return NextResponse.json({
      success: true,
      analytics,
    })
  } catch (error) {
    console.error("❌ LinkedIn analytics error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch LinkedIn analytics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
