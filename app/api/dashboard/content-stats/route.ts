import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import connectDB from "@/lib/mongodb"
import Content from "../../../../models/Content"
import Prompt from "../../../../models/Prompt"

export async function GET() {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const userEmail = session.user.email

    // Get content statistics
    const [totalContent, pendingContent, approvedContent, postedContent, recentContent] = await Promise.all([
      Content.countDocuments({ user_id: userEmail }),
      Content.countDocuments({ user_id: userEmail, status: "pending" }),
      Content.countDocuments({ user_id: userEmail, status: "approved" }),
      Content.countDocuments({ user_id: userEmail, status: "posted" }),
      Content.find({ user_id: userEmail })
        .sort({ createdAt: -1 })
        .limit(10)
        .select("title content status platform createdAt engagement"),
    ])

    // Get prompt statistics
    const totalPrompts = await Prompt.countDocuments({ user_id: userEmail })

    // Calculate engagement rate
    const totalEngagement = await Content.aggregate([
      { $match: { user_id: userEmail, status: "posted" } },
      {
        $group: {
          _id: null,
          totalLikes: { $sum: "$engagement.likes" },
          totalComments: { $sum: "$engagement.comments" },
          totalShares: { $sum: "$engagement.shares" },
          totalViews: { $sum: "$engagement.views" },
        },
      },
    ])

    const engagement = totalEngagement[0] || {
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      totalViews: 0,
    }

    const engagementRate =
      engagement.totalViews > 0
        ? (
            ((engagement.totalLikes + engagement.totalComments + engagement.totalShares) / engagement.totalViews) *
            100
          ).toFixed(1)
        : "0"

    return NextResponse.json({
      stats: {
        totalContent,
        pendingContent,
        approvedContent,
        postedContent,
        totalPrompts,
        engagementRate: `${engagementRate}%`,
        totalEngagement: engagement,
      },
      recentContent,
    })
  } catch (error: any) {
    console.error("❌ Error fetching content stats:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch stats" }, { status: 500 })
  }
}
