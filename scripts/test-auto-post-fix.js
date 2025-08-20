const mongoose = require("mongoose")

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/linkzup"

async function testAutoPostFix() {
  try {
    console.log("🔗 Connecting to MongoDB...")
    await mongoose.connect(MONGODB_URI)
    console.log("✅ Connected to MongoDB")

    const db = mongoose.connection.db
    const collections = ["approvedcontents", "linkdin-content-generation", "generatedcontents"]

    console.log("\n📊 Checking scheduled posts across collections...")

    const now = new Date()
    const bufferTime = new Date(now.getTime() + 5 * 60 * 1000) // 5 minutes buffer

    for (const collectionName of collections) {
      try {
        const collection = db.collection(collectionName)

        // Find scheduled posts
        const scheduledQuery = {
          $or: [{ status: "scheduled" }, { Status: "scheduled" }],
        }

        const scheduledPosts = await collection.find(scheduledQuery).toArray()
        console.log(`\n📋 ${collectionName}: ${scheduledPosts.length} scheduled posts`)

        if (scheduledPosts.length > 0) {
          console.log("📅 Scheduled posts details:")
          scheduledPosts.forEach((post, index) => {
            const scheduledTime = post.scheduledFor || post.scheduled_for
            const isDue = scheduledTime && new Date(scheduledTime) <= bufferTime
            const timeUntil = scheduledTime ? Math.floor((new Date(scheduledTime) - now) / (1000 * 60)) : "N/A"

            console.log(`  ${index + 1}. ID: ${post._id}`)
            console.log(`     Title: ${post.topicTitle || post.topic_title || post.title || "Untitled"}`)
            console.log(`     Scheduled: ${scheduledTime ? new Date(scheduledTime).toLocaleString() : "No time set"}`)
            console.log(`     Status: ${isDue ? "🔴 DUE NOW" : `⏰ in ${timeUntil}m`}`)
            console.log(`     User: ${post.userId || post.user_id || post.email || "Unknown"}`)
            console.log("")
          })

          // Find due posts
          const dueQuery = {
            $and: [
              scheduledQuery,
              {
                $or: [{ scheduledFor: { $lte: bufferTime } }, { scheduled_for: { $lte: bufferTime } }],
              },
            ],
          }

          const duePosts = await collection.find(dueQuery).toArray()
          console.log(`🚨 ${duePosts.length} posts are due for posting in ${collectionName}`)
        }

        // Check posted posts
        const postedQuery = {
          $or: [{ status: "posted" }, { Status: "posted" }],
        }

        const postedCount = await collection.countDocuments(postedQuery)
        console.log(`✅ ${postedCount} posts already posted in ${collectionName}`)
      } catch (error) {
        console.error(`❌ Error checking ${collectionName}:`, error.message)
      }
    }

    console.log("\n🧪 Testing auto-post API call...")

    // Test the auto-post endpoint
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"

    try {
      const response = await fetch(`${baseUrl}/api/cron/auto-post`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log("✅ Auto-post API response:", JSON.stringify(data, null, 2))
      } else {
        const errorData = await response.text()
        console.log("❌ Auto-post API error:", response.status, errorData)
      }
    } catch (fetchError) {
      console.error("❌ Error calling auto-post API:", fetchError.message)
      console.log("💡 Make sure your Next.js server is running on", baseUrl)
    }
  } catch (error) {
    console.error("❌ Test failed:", error)
  } finally {
    await mongoose.disconnect()
    console.log("\n🔌 Disconnected from MongoDB")
  }
}

// Run the test
testAutoPostFix()
