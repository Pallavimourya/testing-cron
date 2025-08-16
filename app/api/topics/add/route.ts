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

    const topicData = await req.json()

    await connectDB()
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const newTopic = new Topic({
      ...topicData,
      userId: user._id,
    })

    await newTopic.save()

    return NextResponse.json({
      success: true,
      message: "Topic added successfully",
      topic: newTopic,
    })
  } catch (error) {
    console.error("Error adding topic:", error)
    return NextResponse.json({ error: "Failed to add topic" }, { status: 500 })
  }
}
