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
    const { content, imageUrl, contentId, scheduledTimeIST } = body

    if (!content || !scheduledTimeIST) {
      return NextResponse.json({ error: "Content and scheduled time are required" }, { status: 400 })
    }

    await connectDB()

    // Get user
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Convert IST timestamp to UTC
    const scheduledTimeUTC = new Date(scheduledTimeIST)
    
    // The timestamp is already in UTC (since it was created with +05:30 offset)
    // We need to convert it back to IST for validation
    const scheduledTimeISTDate = new Date(scheduledTimeIST)
    const scheduledTimeISTString = ISTTime.formatIST(scheduledTimeUTC)

    console.log(`📅 Received timestamp: ${scheduledTimeIST}`)
    console.log(`📅 UTC time: ${scheduledTimeUTC.toISOString()}`)
    console.log(`📅 IST time: ${scheduledTimeISTString}`)

    // Validate scheduled time (must be at least 1 minute from now)
    if (!ISTTime.isValidScheduleTime(scheduledTimeUTC)) {
      return NextResponse.json({ 
        error: "Scheduled time must be at least 1 minute from now (IST)" 
      }, { status: 400 })
    }

    // Create scheduled post
    const scheduledPost = new ScheduledPost({
      userId: user._id,
      userEmail: user.email,
      contentId,
      content,
      imageUrl,
      scheduledTime: scheduledTimeUTC,
      scheduledTimeIST: scheduledTimeISTString,
      status: "pending",
      platform: "linkedin",
    })

    await scheduledPost.save()

    return NextResponse.json({
      success: true,
      scheduledPost: {
        ...scheduledPost.toObject(),
        scheduledTimeDisplay: scheduledTimeISTString,
      },
    })
  } catch (error: any) {
    console.error("❌ Error creating scheduled post:", error)
    return NextResponse.json({ error: error.message || "Failed to create scheduled post" }, { status: 500 })
  }
}
