import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import mongoose from "mongoose"

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { posts, scheduleType, startDate, startTime } = body

    if (!posts || !Array.isArray(posts) || posts.length === 0) {
      return NextResponse.json({ error: "No posts provided" }, { status: 400 })
    }

    if (!scheduleType || !startDate || !startTime) {
      return NextResponse.json({ error: "Missing scheduling parameters" }, { status: 400 })
    }

    console.log("📅 Bulk scheduling posts:", {
      postCount: posts.length,
      scheduleType,
      startDate,
      startTime,
    })

    if (!mongoose.connection.db) {
      throw new Error("Database connection not established")
    }

    // Parse start date and time
    const baseDate = new Date(startDate)
    const [hours, minutes] = startTime.split(":")
    baseDate.setHours(Number.parseInt(hours), Number.parseInt(minutes), 0, 0)

    // Convert to IST timezone for scheduling
    const istOffset = 5.5 * 60 * 60 * 1000 // IST is UTC+5:30
    const baseDateIST = new Date(baseDate.getTime() - istOffset)

    console.log(`📅 Bulk scheduling - Base date (IST): ${baseDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`)
    console.log(`📅 Bulk scheduling - UTC time: ${baseDateIST.toISOString()}`)

    // Calculate intervals based on schedule type
    const getNextScheduleTime = (index: number) => {
      const scheduleDate = new Date(baseDateIST)

      switch (scheduleType) {
        case "15min":
          scheduleDate.setMinutes(scheduleDate.getMinutes() + index * 15)
          break
        case "30min":
          scheduleDate.setMinutes(scheduleDate.getMinutes() + index * 30)
          break
        case "hourly":
          scheduleDate.setHours(scheduleDate.getHours() + index)
          break
        case "twice-daily":
          // Morning (9 AM) and Evening (6 PM) posts
          const dayIndex = Math.floor(index / 2)
          const isEvening = index % 2 === 1
          scheduleDate.setDate(scheduleDate.getDate() + dayIndex)
          scheduleDate.setHours(isEvening ? 18 : 9, 0, 0, 0)
          break
        case "daily":
          scheduleDate.setDate(scheduleDate.getDate() + index)
          break
        case "3days":
          scheduleDate.setDate(scheduleDate.getDate() + index * 3)
          break
        case "weekly":
          scheduleDate.setDate(scheduleDate.getDate() + index * 7)
          break
        default:
          scheduleDate.setHours(scheduleDate.getHours() + index)
      }

      return scheduleDate
    }

    const collections = ["approvedcontents", "linkdin-content-generation", "generatedcontents"]
    let successCount = 0
    let errorCount = 0
    const results = []

    // Process each post
    for (let i = 0; i < posts.length; i++) {
      const postId = posts[i]
      const scheduledTime = getNextScheduleTime(i)

      console.log(`📅 Scheduling post ${postId} for ${scheduledTime.toISOString()}`)

      let scheduled = false

      // Try to find and update the post in each collection
      for (const collectionName of collections) {
        try {
          const collection = mongoose.connection.db.collection(collectionName)

          const result = await collection.updateOne(
            {
              $and: [
                {
                  $or: [{ _id: new mongoose.Types.ObjectId(postId) }, { id: postId }, { ID: postId }],
                },
                {
                  $or: [
                    { email: user.email },
                    { userId: user._id.toString() },
                    { user_id: user._id.toString() },
                    { userId: user._id },
                  ],
                },
                {
                  $or: [{ status: "approved" }, { Status: "approved" }],
                },
              ],
            },
            {
              $set: {
                status: "scheduled",
                Status: "scheduled",
                scheduledFor: scheduledTime,
                scheduled_for: scheduledTime,
                scheduleType: scheduleType,
                updatedAt: new Date(),
                updated_at: new Date(),
                scheduledBy: user._id,
                scheduledAt: new Date(),
              },
              $unset: {
                error: 1,
              },
            },
          )

          if (result.matchedCount > 0) {
            console.log(`✅ Scheduled post ${postId} in ${collectionName}`)
            successCount++
            scheduled = true
            results.push({
              postId,
              collection: collectionName,
              scheduledFor: scheduledTime,
              status: "scheduled",
            })
            break
          }
        } catch (error) {
          console.error(`❌ Error scheduling post ${postId} in ${collectionName}:`, error)
        }
      }

      if (!scheduled) {
        console.log(`❌ Failed to schedule post ${postId}`)
        errorCount++
        results.push({
          postId,
          status: "error",
          error: "Post not found or not approved",
        })
      }
    }

    console.log(`🎯 Bulk scheduling completed: ${successCount} scheduled, ${errorCount} errors`)

    return NextResponse.json({
      success: true,
      message: `Successfully scheduled ${successCount} posts`,
      successCount,
      errorCount,
      results,
      scheduleInfo: {
        scheduleType,
        startDate: baseDate.toISOString(),
        totalPosts: posts.length,
      },
    })
  } catch (error: any) {
    console.error("❌ Error in bulk scheduling:", error)
    return NextResponse.json(
      {
        error: "Failed to schedule posts",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
