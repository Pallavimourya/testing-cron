import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import connectDB from "@/lib/mongodb"
import Post from "@/models/Post"
import { authOptions } from "../auth/[...nextauth]/auth"

interface PostDocument {
  views?: number
  likes?: string[]
  comments?: Array<{
    userId: string
    content: string
    createdAt: Date
  }>
  title: string
  createdAt: Date
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    // Get total posts
    const totalPosts = await Post.countDocuments({ userId: session.user.id })

    // Get total views (sum of views from all posts)
    const posts = await Post.find({ userId: session.user.id }) as PostDocument[]
    const totalViews = posts.reduce((sum: number, post: PostDocument) => sum + (post.views || 0), 0)

    // Calculate engagement rate (likes + comments / views * 100)
    const totalEngagement = posts.reduce((sum: number, post: PostDocument) => {
      const likes = post.likes?.length || 0
      const comments = post.comments?.length || 0
      return sum + likes + comments
    }, 0)
    const engagementRate = totalViews > 0 ? (totalEngagement / totalViews) * 100 : 0

    // Get total followers (this would come from your user model)
    const totalFollowers = 0 // TODO: Implement follower system

    // Get recent activity
    const recentActivity = posts
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 3)
      .map(post => ({
        title: "New post created",
        description: post.title,
        time: post.createdAt,
        type: "info"
      }))

    return NextResponse.json({
      stats: {
        totalPosts,
        totalViews,
        engagement: engagementRate.toFixed(1),
        followers: totalFollowers
      },
      recentActivity
    })
  } catch (error: any) {
    console.error("Error fetching stats:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch stats" },
      { status: 500 }
    )
  }
}
