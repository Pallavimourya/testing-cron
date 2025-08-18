import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/auth"
import connectDB from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    // Mock recent activity data for now
    const recentActivity = [
      {
        id: "1",
        type: "content_generated",
        title: "New LinkedIn post generated",
        description: "AI generated content about technology trends",
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
        status: "success",
      },
      {
        id: "2",
        type: "content_approved",
        title: "Content approved",
        description: "LinkedIn post about business growth approved",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        status: "success",
      },
      {
        id: "3",
        type: "content_posted",
        title: "Content posted to LinkedIn",
        description: "Successfully posted content to your LinkedIn profile",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        status: "success",
      },
    ]

    return NextResponse.json({
      activities: recentActivity,
      total: recentActivity.length,
    })
  } catch (error) {
    console.error("❌ Error fetching recent activity:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch recent activity",
        activities: [],
        total: 0,
      },
      { status: 500 },
    )
  }
}
