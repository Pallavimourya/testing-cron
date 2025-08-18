import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import mongoose from "mongoose"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (!mongoose.connection.db) {
      throw new Error("Database connection not established")
    }

    const collections = ["approvedcontents", "linkdin-content-generation", "generatedcontents"]
    const now = new Date()

    console.log(`🕐 Status check - Current time: ${now.toISOString()}`)

    let totalScheduled = 0
    let totalPosted = 0
    let totalApproved = 0
    const nextScheduledPosts = []

    // Check each collection
    for (const collectionName of collections) {
      try {
        const collection = mongoose.connection.db.collection(collectionName)

        // Count scheduled posts for this user
        const scheduledQuery = {
          $and: [
            {
              $or: [{ status: "scheduled" }, { Status: "scheduled" }],
            },
            {
              $or: [
                { email: user.email },
                { userId: user._id.toString() },
                { user_id: user._id.toString() },
                { userId: user._id },
              ],
            },
          ],
        }

        const scheduledPosts = await collection.find(scheduledQuery).toArray()
        totalScheduled += scheduledPosts.length

        // Get next scheduled posts
        for (const post of scheduledPosts) {
          const scheduledTime = post.scheduledFor || post.scheduled_for
          if (scheduledTime) {
            // Convert to IST for accurate time calculation
            const istOffset = 5.5 * 60 * 60 * 1000 // IST is UTC+5:30
            const nowIST = new Date(now.getTime() + istOffset)
            const scheduledIST = new Date(new Date(scheduledTime).getTime() + istOffset)
            
            const timeUntilPost = Math.floor((scheduledIST.getTime() - nowIST.getTime()) / (1000 * 60))
            nextScheduledPosts.push({
              id: post._id.toString(),
              topic: post.topicTitle || post.topic_title || post.title || "Untitled",
              scheduledFor: scheduledTime,
              timeUntilPost: timeUntilPost,
              collection: collectionName,
            })
          }
        }

        // Count posted posts
        const postedQuery = {
          $and: [
            {
              $or: [{ status: "posted" }, { Status: "posted" }],
            },
            {
              $or: [
                { email: user.email },
                { userId: user._id.toString() },
                { user_id: user._id.toString() },
                { userId: user._id },
              ],
            },
          ],
        }

        const postedCount = await collection.countDocuments(postedQuery)
        totalPosted += postedCount

        // Count approved posts
        const approvedQuery = {
          $and: [
            {
              $or: [{ status: "approved" }, { Status: "approved" }],
            },
            {
              $or: [
                { email: user.email },
                { userId: user._id.toString() },
                { user_id: user._id.toString() },
                { userId: user._id },
              ],
            },
          ],
        }

        const approvedCount = await collection.countDocuments(approvedQuery)
        totalApproved += approvedCount
      } catch (error) {
        console.error(`Error checking collection ${collectionName}:`, error)
      }
    }

    // Sort next scheduled posts by time
    nextScheduledPosts.sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime())

    return NextResponse.json({
      success: true,
      stats: {
        totalScheduled,
        totalPosted,
        totalApproved,
      },
      nextScheduledPosts: nextScheduledPosts.slice(0, 10), // Return top 10
      cronJobInfo: {
        frequency: "Every minute",
        nextRun: "Continuous monitoring",
        status: "Active",
        lastCheck: now.toISOString(),
      },
      timestamp: now.toISOString(),
    })
  } catch (error: any) {
    console.error("Error getting CRON status:", error)
    return NextResponse.json(
      {
        error: "Failed to get status",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
