const mongoose = require("mongoose")

// MongoDB connection
const MONGODB_URI = "mongodb://localhost:27017/linkzup"

async function cleanupTestData() {
  try {
    console.log("🧹 Cleaning up test data...")

    await mongoose.connect(MONGODB_URI)
    console.log("✅ Connected to MongoDB")

    // Clean up test topics
    const topicResult = await mongoose.connection.db.collection("topics").deleteMany({
      $or: [
        { id: { $regex: /^test-/ } },
        { id: { $regex: /^auto-topic-/ } },
        { id: { $regex: /^replacement-/ } },
        { id: { $regex: /^fill-topic-/ } },
        { id: { $regex: /^story-topic-/ } },
      ],
    })

    console.log(`🗑️ Deleted ${topicResult.deletedCount} test topics`)

    // Clean up test stories
    const storyResult = await mongoose.connection.db.collection("generatedstories").deleteMany({
      generatedStory: "This is my unique story...",
    })

    console.log(`🗑️ Deleted ${storyResult.deletedCount} test stories`)

    console.log("✅ Test data cleanup completed")
  } catch (error) {
    console.error("❌ Error cleaning up test data:", error)
  } finally {
    await mongoose.disconnect()
  }
}

cleanupTestData()
