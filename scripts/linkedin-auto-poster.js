const cron = require("node-cron")
const mongoose = require("mongoose")

// Import the processing function
const { processScheduledPosts } = require("../lib/linkedin-poster")

// MongoDB connection
async function connectDB() {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/linkzup", {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
      console.log("✅ Connected to MongoDB")
    }
  } catch (error) {
    console.error("❌ MongoDB connection error:", error)
    process.exit(1)
  }
}

// Main cron job function
async function runAutoPosting() {
  try {
    console.log(`🚀 Auto-posting cron job started at ${new Date().toISOString()}`)

    await connectDB()
    const results = await processScheduledPosts()

    console.log("📊 Auto-posting results:", {
      processed: results.processed,
      posted: results.posted,
      failed: results.failed,
      errors: results.errors.length,
    })

    if (results.errors.length > 0) {
      console.log("❌ Errors encountered:")
      results.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`)
      })
    }
  } catch (error) {
    console.error("❌ Auto-posting cron job error:", error)
  }
}

// Schedule the cron job to run every minute
console.log("⏰ Setting up LinkedIn auto-posting cron job...")
console.log("📅 Schedule: Every minute (* * * * *)")

const task = cron.schedule("* * * * *", runAutoPosting, {
  scheduled: true,
  timezone: "Asia/Kolkata", // Use IST timezone for logging
})

console.log("✅ LinkedIn auto-posting cron job scheduled successfully")

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("🛑 Stopping LinkedIn auto-posting cron job...")
  task.stop()
  mongoose.connection.close()
  process.exit(0)
})

process.on("SIGTERM", () => {
  console.log("🛑 Stopping LinkedIn auto-posting cron job...")
  task.stop()
  mongoose.connection.close()
  process.exit(0)
})

// Initial connection test
connectDB().then(() => {
  console.log("🔄 Running initial auto-posting check in 10 seconds...")
  setTimeout(runAutoPosting, 10000)
})
