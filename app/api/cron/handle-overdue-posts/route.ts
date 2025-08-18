import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/auth"
import connectDB from "@/lib/mongodb"
import mongoose from "mongoose"

// Helper function to get current IST time
function getCurrentIST() {
  const now = new Date()
  const istOffset = 5.5 * 60 * 60 * 1000 // IST is UTC+5:30
  return new Date(now.getTime() + istOffset)
}

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

    const currentIST = getCurrentIST()
    console.log(`🕐 Current time (IST): ${currentIST.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`)

    // Find posts that are scheduled but past their time and not posted
    const collections = ["approvedcontents", "linkdin-content-generation", "generatedcontents"]
    let totalOverdue = 0
    let totalProcessed = 0

    for (const collectionName of collections) {
      try {
        const collection = mongoose.connection.db.collection(collectionName)

        // Find overdue posts (scheduled but not posted, and past their scheduled time)
        const overdueQuery = {
          $and: [
            {
              $or: [{ status: "scheduled" }, { Status: "scheduled" }],
            },
            {
              $or: [{ scheduledFor: { $lt: currentIST } }, { scheduled_for: { $lt: currentIST } }],
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

        // Mark these posts as failed so they can be retried
        for (const post of overduePosts) {
          try {
            await collection.updateOne(
              { _id: post._id },
              {
                $set: {
                  status: "failed",
                  Status: "failed",
                  error: "Post was overdue and not processed",
                  updatedAt: new Date(),
                  updated_at: new Date(),
                },
              }
            )
            totalProcessed++
          } catch (error) {
            console.error(`❌ Error marking post ${post._id} as failed:`, error)
          }
        }
      } catch (error) {
        console.error(`❌ Error processing collection ${collectionName}:`, error)
      }
    }

    // Now trigger the external cron to process these failed posts
    try {
      const cronUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/cron/external-auto-post`
      const response = await fetch(cronUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.EXTERNAL_CRON_TOKEN}`,
        },
      })

      if (response.ok) {
        const cronResult = await response.json()
        console.log("✅ External cron triggered successfully:", cronResult)
      } else {
        console.error("❌ Failed to trigger external cron:", response.status)
      }
    } catch (error) {
      console.error("❌ Error triggering external cron:", error)
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${totalProcessed} overdue posts`,
      stats: {
        totalOverdue,
        totalProcessed,
        currentTime: currentIST.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      },
    })
  } catch (error: any) {
    console.error("❌ Error handling overdue posts:", error)
    return NextResponse.json(
      { error: error.message || "Failed to handle overdue posts" },
      { status: 500 }
    )
  }
}
