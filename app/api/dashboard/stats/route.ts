import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import connectDB from "@/lib/mongodb"
import { authOptions } from "../../auth/[...nextauth]/auth"
import mongoose from "mongoose"

const MONTHLY_LIMIT = 30

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    if (!mongoose.connection.db) {
      throw new Error("Database connection not established")
    }

    const collection = mongoose.connection.db.collection("linkdin-content-generation")

    // Get current month dates
    const currentMonth = new Date()
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59)

    // Get monthly content generation count
    const monthlyContentCount = await collection.countDocuments({
      $and: [
        {
          $or: [
            { "User ID\t": session.user.id },
            { userId: session.user.id },
            { userId: new mongoose.Types.ObjectId(session.user.id) },
          ]
        },
        {
          $or: [
            { createdAt: { $gte: startOfMonth, $lte: endOfMonth } },
            { modifiedTime: { $gte: startOfMonth, $lte: endOfMonth } },
          ]
        }
      ]
    })

    // Get total content stats
    const totalContent = await collection.countDocuments({
      $or: [
        { "User ID\t": session.user.id },
        { userId: session.user.id },
        { userId: new mongoose.Types.ObjectId(session.user.id) },
      ],
    })

    const approvedContent = await collection.countDocuments({
      $or: [
        { "User ID\t": session.user.id },
        { userId: session.user.id },
        { userId: new mongoose.Types.ObjectId(session.user.id) },
      ],
      status: "approved",
    })

    const scheduledContent = await collection.countDocuments({
      $or: [
        { "User ID\t": session.user.id },
        { userId: session.user.id },
        { userId: new mongoose.Types.ObjectId(session.user.id) },
      ],
      status: "scheduled",
    })

    const postedContent = await collection.countDocuments({
      $or: [
        { "User ID\t": session.user.id },
        { userId: session.user.id },
        { userId: new mongoose.Types.ObjectId(session.user.id) },
      ],
      status: "posted",
    })

    // Get recent activity (last 7 days)
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const recentContent = await collection.countDocuments({
      $and: [
        {
          $or: [
            { "User ID\t": session.user.id },
            { userId: session.user.id },
            { userId: new mongoose.Types.ObjectId(session.user.id) },
          ]
        },
        {
          $or: [
            { createdAt: { $gte: last7Days } },
            { modifiedTime: { $gte: last7Days } }
          ]
        }
      ]
    })

    // Get upcoming scheduled posts (next 24 hours)
    const next24Hours = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const upcomingPosts = await collection.countDocuments({
      $or: [
        { "User ID\t": session.user.id },
        { userId: session.user.id },
        { userId: new mongoose.Types.ObjectId(session.user.id) },
      ],
      status: "scheduled",
      scheduledFor: { $gte: new Date(), $lte: next24Hours },
    })

    const stats = {
      totalRecordings: totalContent, // Using total content as recordings proxy
      generatedContent: totalContent,
      approvedContent,
      pendingContent: totalContent - approvedContent - scheduledContent - postedContent,
      scheduledContent,
      postedContent,
      recentContent,
      upcomingPosts,
      totalViews: Math.floor(Math.random() * 10000) + 1000, // Mock data
      engagement: Math.floor(Math.random() * 50) + 25, // Mock data
      monthlyUsage: {
        used: monthlyContentCount,
        limit: MONTHLY_LIMIT,
        remaining: Math.max(0, MONTHLY_LIMIT - monthlyContentCount),
        percentage: Math.round((monthlyContentCount / MONTHLY_LIMIT) * 100),
        resetDate: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1).toISOString(),
      },
    }

    return NextResponse.json({ stats })
  } catch (error: any) {
    console.error("Dashboard stats error:", error)
    return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 })
  }
}
