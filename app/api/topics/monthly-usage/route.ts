import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import Topic from "@/models/Topic"
import ApprovedContent from "@/models/ApprovedContent"

export async function GET() {
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

    // Get start of current month
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const nextMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)

    // Count topics generated this month
    const topicsThisMonth = await Topic.countDocuments({
      userId: user._id,
      createdAt: { $gte: startOfMonth },
    })

    // Count content generated this month
    const contentThisMonth = await ApprovedContent.countDocuments({
      userId: user._id,
      createdAt: { $gte: startOfMonth },
    })

    // Calculate days until reset
    const now = new Date()
    const daysUntilReset = Math.ceil((nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    return NextResponse.json({
      success: true,
      usage: {
        topics: {
          used: topicsThisMonth,
          limit: 30,
          remaining: Math.max(0, 30 - topicsThisMonth),
        },
        content: {
          used: contentThisMonth,
          limit: 30,
          remaining: Math.max(0, 30 - contentThisMonth),
        },
        resetInfo: {
          daysUntilReset,
          nextResetDate: nextMonth.toISOString().split("T")[0],
        },
      },
    })
  } catch (error) {
    console.error("❌ Error fetching monthly usage:", error)
    return NextResponse.json({ error: "Failed to fetch usage data" }, { status: 500 })
  }
}
