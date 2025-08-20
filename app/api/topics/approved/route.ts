import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import Topic from "@/models/Topic"
import mongoose from "mongoose"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check for both email and id in session
    if (!session?.user?.email && !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    
    // Find user by email or id
    let user = null
    if (session.user.email) {
      user = await User.findOne({ email: session.user.email })
    }
    if (!user && session.user.id) {
      user = await User.findById(session.user.id)
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { topicId } = await request.json()

    if (!topicId) {
      return NextResponse.json({ error: "Topic ID is required" }, { status: 400 })
    }

    console.log("🎯 Approving topic:", topicId, "for user:", user._id.toString())

    // Build query to handle both string and ObjectId topic IDs
    const query: any = {
      $and: [
        {
          $or: [
            { id: topicId },
            { _id: topicId }
          ]
        },
        {
          userId: user._id
        }
      ]
    }

    // Only try ObjectId conversion if the ID looks like a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(topicId) && topicId.length === 24) {
      query.$and[0].$or.push({ _id: new mongoose.Types.ObjectId(topicId) })
    }

    const updatedTopic = await Topic.findOneAndUpdate(
      query,
      {
        status: "approved",
        updatedAt: new Date(),
      },
      { new: true },
    )

    if (!updatedTopic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 })
    }

    console.log("✅ Topic approved successfully:", updatedTopic.title)

    return NextResponse.json({
      success: true,
      message: "Topic approved successfully",
      topic: updatedTopic,
    })
  } catch (error) {
    console.error("Error approving topic:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
