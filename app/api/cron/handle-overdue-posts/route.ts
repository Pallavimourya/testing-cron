import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/auth"
import connectDB from "@/lib/mongodb"
import mongoose from "mongoose"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    if (!mongoose.connection.db) {
      throw new Error("Database connection not established")
    }

    // Find overdue posts (scheduled but not posted, and past their scheduled time)
    const now = new Date()
    const istOffset = 5.5 * 60 * 60 * 1000 // IST is UTC+5:30
    const nowIST = new Date(now.getTime() + istOffset)

    console.log(`🕐 Current time (IST): ${nowIST.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`)

    const collections = ["approvedcontents", "linkdin-content-generation", "generatedcontents"]
    let totalOverdue = 0
    let totalProcessed = 0

    for (const collectionName of collections) {
      try {
        const collection = mongoose.connection.db.collection(collectionName)

        // Find overdue posts
        const overdueQuery = {
          $and: [
            {
              $or: [{ status: "scheduled" }, { Status: "scheduled" }],
            },
            {
              $or: [{ scheduledFor: { $lt: now } }, { scheduled_for: { $lt: now } }],
            },
            // Ensure the post hasn't been posted already
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

        const overduePosts = await collection.find(overdueQuery).toArray()
        console.log(`📊 Found ${overduePosts.length} overdue posts in ${collectionName}`)

        if (overduePosts.length === 0) {
          continue
        }

        totalOverdue += overduePosts.length

        // Send each overdue post to the external cron job
        for (const post of overduePosts) {
          try {
            console.log(`🔄 Processing overdue post: ${post.topicTitle || post.Topic || 'Untitled'}`)

            // Get the host from the request
            const host = request.headers.get("host") || "localhost:3000"
            const protocol = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https")

            // Call the external cron job to post this content
            const cronResponse = await fetch(`${protocol}://${host}/api/cron/external-auto-post`, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Cookie: request.headers.get("cookie") || "",
              },
            })

            if (cronResponse.ok) {
              const cronResult = await cronResponse.json()
              console.log(`✅ Overdue post sent to cron: ${post._id}`)
              totalProcessed++
            } else {
              console.error(`❌ Failed to send overdue post to cron: ${post._id}`)
            }

            // Add a small delay between requests
            await new Promise(resolve => setTimeout(resolve, 500))

          } catch (error) {
            console.error(`❌ Error processing overdue post ${post._id}:`, error)
          }
        }
      } catch (error) {
        console.error(`❌ Error processing collection ${collectionName}:`, error)
      }
    }

    console.log(`🎉 Overdue posts processing completed: ${totalProcessed}/${totalOverdue} processed`)

    return NextResponse.json({
      success: true,
      message: `Overdue posts processed: ${totalProcessed}/${totalOverdue}`,
      stats: {
        totalOverdue,
        totalProcessed,
      },
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error("❌ Error handling overdue posts:", error)
    return NextResponse.json(
      {
        error: "Failed to handle overdue posts",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
