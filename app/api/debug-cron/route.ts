import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import mongoose from "mongoose"

export async function GET(req: Request) {
  try {
    console.log("🔍 Debug cron job - checking for scheduled posts")
    
    await connectDB()

    if (!mongoose.connection.db) {
      throw new Error("Database connection not established")
    }

    const collections = ["approvedcontents", "linkdin-content-generation", "generatedcontents"]
    const debugInfo = {
      currentTime: {
        utc: new Date().toISOString(),
        ist: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
      },
      collections: {} as Record<string, any>
    }

    for (const collectionName of collections) {
      try {
        const collection = mongoose.connection.db.collection(collectionName)
        
        // Get current time with IST offset
        const now = new Date()
        const istOffset = 5.5 * 60 * 60 * 1000 // IST is UTC+5:30
        const nowIST = new Date(now.getTime() + istOffset)
        const bufferTime = new Date(nowIST.getTime() + 1 * 60 * 1000) // 1 minute buffer

        // Find all scheduled posts
        const scheduledQuery = {
          $or: [
            { status: "scheduled" }, 
            { Status: "scheduled" },
            { status: "pending" },
            { Status: "pending" }
          ]
        }

        const scheduledPosts = await collection.find(scheduledQuery).toArray()
        
        // Find posts that should be due
        const dueQuery = {
          $and: [
            {
              $or: [
                { status: "scheduled" }, 
                { Status: "scheduled" },
                { status: "pending" },
                { Status: "pending" }
              ],
            },
            {
              $or: [
                { scheduledFor: { $lte: bufferTime } }, 
                { scheduled_for: { $lte: bufferTime } },
                { scheduledTime: { $lte: bufferTime } }
              ],
            },
            {
              $or: [
                { postedAt: { $exists: false } },
                { posted_at: { $exists: false } },
                { linkedinPostId: { $exists: false } },
                { linkedin_post_id: { $exists: false } }
              ]
            }
          ],
        }

        const duePosts = await collection.find(dueQuery).toArray()

        debugInfo.collections[collectionName] = {
          totalScheduled: scheduledPosts.length,
          duePosts: duePosts.length,
          scheduledPosts: scheduledPosts.map(post => ({
            id: post._id,
            status: post.status || post.Status,
            scheduledFor: post.scheduledFor || post.scheduled_for || post.scheduledTime,
            email: post.email,
            userId: post.userId || post.user_id,
            hasContent: !!(post.content || post.Content),
            contentLength: (post.content || post.Content || '').length,
            isDue: duePosts.some(duePost => duePost._id.toString() === post._id.toString())
          })),
          duePostsDetails: duePosts.map(post => ({
            id: post._id,
            status: post.status || post.Status,
            scheduledFor: post.scheduledFor || post.scheduled_for || post.scheduledTime,
            email: post.email,
            userId: post.userId || post.user_id,
            hasContent: !!(post.content || post.Content),
            contentLength: (post.content || post.Content || '').length
          }))
        }

      } catch (error) {
        console.error(`❌ Error checking collection ${collectionName}:`, error)
        debugInfo.collections[collectionName] = {
          error: error instanceof Error ? error.message : "Unknown error"
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Debug information for cron job",
      debug: debugInfo,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error("❌ Debug cron error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
