import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/auth"
import connectDB from "@/lib/mongodb"
import GeneratedContent from "@/models/GeneratedContent"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { contentId, scheduledFor } = await req.json()

    if (!contentId || !scheduledFor) {
      return NextResponse.json({ error: "Content ID and schedule time are required" }, { status: 400 })
    }

    const scheduleDate = new Date(scheduledFor)
    if (scheduleDate <= new Date()) {
      return NextResponse.json({ error: "Schedule time must be in the future" }, { status: 400 })
    }

    await connectDB()

    // Find and update the content
    const content = await GeneratedContent.findOneAndUpdate(
      {
        _id: contentId,
        userId: session.user.id,
        status: { $in: ["pending", "approved"] },
      },
      {
        status: "scheduled",
        scheduledFor: scheduleDate,
        approvedAt: new Date(),
        updatedAt: new Date(),
      },
      { new: true },
    )

    if (!content) {
      return NextResponse.json({ error: "Content not found or cannot be scheduled" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: `Content scheduled for ${scheduleDate.toLocaleString()}`,
      content,
      scheduledFor: scheduleDate,
    })
  } catch (error: any) {
    console.error("Error scheduling content:", error)
    return NextResponse.json({ error: error.message || "Failed to schedule content" }, { status: 500 })
  }
}
