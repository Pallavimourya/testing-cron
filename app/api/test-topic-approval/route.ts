import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import Topic from "@/models/Topic"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    console.log("🔍 Test Topic Approval - Session data:", {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userEmail: session?.user?.email
    })

    if (!session?.user?.email && !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    
    // Find user by email or id
    let user = null
    if (session.user.email) {
      user = await User.findOne({ email: session.user.email })
      console.log("👤 User found by email:", user ? user._id.toString() : "Not found")
    }
    if (!user && session.user.id) {
      user = await User.findById(session.user.id)
      console.log("👤 User found by id:", user ? user._id.toString() : "Not found")
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get all topics for this user
    const allTopics = await Topic.find({ userId: user._id })
    console.log("📊 Total topics for user:", allTopics.length)

    // Get topics by status
    const pendingTopics = allTopics.filter(t => t.status === "pending")
    const approvedTopics = allTopics.filter(t => t.status === "approved")
    const dismissedTopics = allTopics.filter(t => t.status === "dismissed")

    console.log("📈 Topics by status:")
    console.log("   - Pending:", pendingTopics.length)
    console.log("   - Approved:", approvedTopics.length)
    console.log("   - Dismissed:", dismissedTopics.length)

    // Show sample topics
    const sampleTopics = allTopics.slice(0, 3).map(topic => ({
      id: topic.id,
      _id: topic._id.toString(),
      title: topic.title,
      status: topic.status,
      source: topic.source,
      userId: topic.userId?.toString(),
      createdAt: topic.createdAt
    }))

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email
      },
      topics: {
        total: allTopics.length,
        pending: pendingTopics.length,
        approved: approvedTopics.length,
        dismissed: dismissedTopics.length,
        sample: sampleTopics
      },
      session: {
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id,
        userEmail: session?.user?.email
      }
    })

  } catch (error) {
    console.error("❌ Test topic approval error:", error)
    return NextResponse.json({
      error: "Test failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
