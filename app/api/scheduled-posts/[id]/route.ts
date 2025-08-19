import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/auth"
import connectDB from "@/lib/mongodb"
import ScheduledPost from "@/models/ScheduledPost"
import User from "@/models/User"

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    // Get user
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { id } = await params

    // Find the scheduled post and verify ownership
    const scheduledPost = await ScheduledPost.findOne({
      _id: id,
      userId: user._id,
    })

    if (!scheduledPost) {
      return NextResponse.json({ error: "Scheduled post not found" }, { status: 404 })
    }

    // Only allow cancellation of pending posts
    if (scheduledPost.status !== "pending") {
      return NextResponse.json(
        { error: "Only pending posts can be cancelled" },
        { status: 400 }
      )
    }

    // Update status to cancelled instead of deleting
    await ScheduledPost.findByIdAndUpdate(id, {
      status: "cancelled",
      updatedAt: new Date(),
    })

    console.log("✅ Scheduled post cancelled:", {
      id: scheduledPost._id,
      userEmail: user.email,
    })

    return NextResponse.json({
      success: true,
      message: "Scheduled post cancelled successfully",
    })
  } catch (error: any) {
    console.error("❌ Error cancelling scheduled post:", error)
    return NextResponse.json(
      { error: error.message || "Failed to cancel scheduled post" },
      { status: 500 }
    )
  }
}
