import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import connectDB from "@/lib/mongodb"
import ScheduledPost from "@/models/ScheduledPost"
import User from "@/models/User"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get stats for the user
    const stats = await ScheduledPost.aggregate([
      { $match: { userId: user._id } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ])

    // Format stats
    const formattedStats = {
      pending: 0,
      posted: 0,
      failed: 0,
      cancelled: 0,
      total: 0,
    }

    stats.forEach((stat) => {
      formattedStats[stat._id as keyof typeof formattedStats] = stat.count
      formattedStats.total += stat.count
    })

    // Get upcoming posts (next 7 days)
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)

    const upcomingPosts = await ScheduledPost.find({
      userId: user._id,
      status: "pending",
      scheduledAt: {
        $gte: new Date(),
        $lte: nextWeek,
      },
    })
      .sort({ scheduledAt: 1 })
      .limit(5)
      .lean()

    return NextResponse.json({
      success: true,
      stats: formattedStats,
      upcomingPosts: upcomingPosts.length,
    })
  } catch (error) {
    console.error("Error fetching scheduled posts stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
