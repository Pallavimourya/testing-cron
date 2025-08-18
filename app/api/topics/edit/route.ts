import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import Topic from "@/models/Topic"

export async function POST(req: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { topicId, title } = await req.json()

    await connectDB()
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const topic = await Topic.findOne({
      id: topicId,
      userId: user._id,
    })

    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 })
    }

    topic.title = title
    await topic.save()

    return NextResponse.json({
      success: true,
      message: "Topic updated successfully",
    })
  } catch (error) {
    console.error("Error editing topic:", error)
    return NextResponse.json({ error: "Failed to edit topic" }, { status: 500 })
  }
}
