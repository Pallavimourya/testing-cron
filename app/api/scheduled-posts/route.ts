import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/auth"
import connectDB from "@/lib/mongodb"
import ScheduledPost from "@/models/ScheduledPost"
import User from "@/models/User"
import { ISTTime } from "@/lib/utils/ist-time"

export async function GET(req: Request) {
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

    // Get all scheduled posts for the user
    const scheduledPosts = await ScheduledPost.find({
      userId: user._id,
    }).sort({ scheduledTime: 1 }) // Sort by scheduled time ascending

    // Convert UTC times to IST for display
    const postsWithIST = scheduledPosts.map((post) => ({
      ...post.toObject(),
      scheduledTimeDisplay: ISTTime.formatIST(post.scheduledTime),
      isOverdue: ISTTime.isInPast(post.scheduledTime) && post.status === "pending",
    }))

    return NextResponse.json({
      success: true,
      posts: postsWithIST,
      total: scheduledPosts.length,
    })
  } catch (error: any) {
    console.error("❌ Error fetching scheduled posts:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch scheduled posts" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { content, imageUrl, scheduledTimeIST, contentId } = body

    if (!content || !scheduledTimeIST) {
      return NextResponse.json({ error: "Content and scheduled time are required" }, { status: 400 })
    }

    await connectDB()

    // Get user
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Parse the scheduled time (timestamp from frontend)
    const scheduledDate = new Date(scheduledTimeIST)
    
    // Simple validation: must be at least 5 minutes from now
    const currentTime = new Date()
    const minTime = new Date(currentTime.getTime() + 5 * 60 * 1000) // 5 minutes from now
    
    if (scheduledDate.getTime() < minTime.getTime()) {
      return NextResponse.json({ error: "Scheduled time must be at least 5 minutes from now" }, { status: 400 })
    }

    // Store the scheduled time as is (it's already in the correct timezone)
    const utcDate = scheduledDate

    // Create scheduled post
    const scheduledPost = new ScheduledPost({
      userId: user._id,
      userEmail: user.email,
      contentId: contentId || null,
      content: content.trim(),
      imageUrl: imageUrl || null,
      scheduledTime: utcDate,
      scheduledTimeIST: ISTTime.formatIST(utcDate),
      status: "pending",
      platform: "linkedin",
    })

    await scheduledPost.save()

    console.log("✅ Scheduled post created:", {
      id: scheduledPost._id,
      scheduledTimeIST: scheduledPost.scheduledTimeIST,
      scheduledTimeUTC: utcDate.toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: "Post scheduled successfully!",
      scheduledPost: {
        ...scheduledPost.toObject(),
        scheduledTimeDisplay: ISTTime.formatIST(scheduledPost.scheduledTime),
      },
    })
  } catch (error: any) {
    console.error("❌ Error scheduling post:", error)
    return NextResponse.json({ error: error.message || "Failed to schedule post" }, { status: 500 })
  }
}
