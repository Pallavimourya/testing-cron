import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import connectDB from "@/lib/mongodb"
import ScheduledPost from "@/models/ScheduledPost"
import User from "@/models/User"
import { convertISTToUTC, convertUTCToIST } from "@/lib/timezone-utils"

// GET - List scheduled posts
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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    // Build query
    const query: any = { userId: user._id }
    if (status && status !== "all") {
      query.status = status
    }

    // Get posts with pagination
    const posts = await ScheduledPost.find(query).sort({ scheduledAt: -1 }).skip(skip).limit(limit).lean()

    const total = await ScheduledPost.countDocuments(query)

    // Convert UTC times to IST for display
    const postsWithIST = posts.map((post) => ({
      ...post,
      scheduledAtDisplay: convertUTCToIST(post.scheduledAt),
      postedAtDisplay: post.postedAt ? convertUTCToIST(post.postedAt) : null,
    }))

    return NextResponse.json({
      success: true,
      posts: postsWithIST,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching scheduled posts:", error)
    return NextResponse.json({ error: "Failed to fetch scheduled posts" }, { status: 500 })
  }
}

// POST - Schedule a new post
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { content, imageUrl, scheduledAtIST } = body

    // Validate required fields
    if (!content || !scheduledAtIST) {
      return NextResponse.json({ error: "Content and scheduled time are required" }, { status: 400 })
    }

    // Check if user has LinkedIn connected
    if (!user.linkedinAccessToken) {
      return NextResponse.json(
        { error: "LinkedIn account not connected. Please connect your LinkedIn account first." },
        { status: 400 },
      )
    }

    // Convert IST to UTC
    const scheduledAtUTC = convertISTToUTC(scheduledAtIST)

    // Check if scheduled time is in the future
    if (scheduledAtUTC <= new Date()) {
      return NextResponse.json({ error: "Scheduled time must be in the future" }, { status: 400 })
    }

    // Create scheduled post
    const scheduledPost = new ScheduledPost({
      userId: user._id,
      userEmail: user.email,
      content: content.trim(),
      imageUrl: imageUrl || null,
      scheduledAt: scheduledAtUTC,
      scheduledAtIST,
      status: "pending",
    })

    await scheduledPost.save()

    return NextResponse.json({
      success: true,
      message: "Post scheduled successfully",
      post: {
        ...scheduledPost.toObject(),
        scheduledAtDisplay: convertUTCToIST(scheduledPost.scheduledAt),
      },
    })
  } catch (error) {
    console.error("Error scheduling post:", error)
    return NextResponse.json({ error: "Failed to schedule post" }, { status: 500 })
  }
}
