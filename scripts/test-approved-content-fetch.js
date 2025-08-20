const mongoose = require("mongoose")
require("dotenv").config()

async function testApprovedContentFetch() {
  try {
    console.log("🔍 Testing Approved Content Fetch...")

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI)
    console.log("✅ Connected to MongoDB")

    // Get the raw collection
    const collection = mongoose.connection.db.collection("approvedcontents")

    // Check total documents
    const totalDocs = await collection.countDocuments()
    console.log(`📊 Total documents in approvedcontents: ${totalDocs}`)

    // Get all documents to see structure
    const allDocs = await collection.find({}).limit(5).toArray()
    console.log("📋 Sample documents:")
    allDocs.forEach((doc, index) => {
      console.log(`\n--- Document ${index + 1} ---`)
      console.log("Fields:", Object.keys(doc))
      console.log("ID:", doc.ID || doc.id || doc._id)
      console.log("Topic:", doc.Topic || doc.topicTitle || doc.topic)
      console.log("Email:", doc.email)
      console.log("User ID:", doc.user_id || doc.userId)
      console.log("Content preview:", (doc["generated content"] || doc.generated_content || doc.content || "").substring(0, 100) + "...")
      console.log("Timestamp:", doc.timestamp || doc.createdAt)
    })

    // Test specific user query
    const testEmail = "pallavimourya99@gmail.com"
    console.log(`\n🔍 Testing query for email: ${testEmail}`)

    const userDocs = await collection.find({ email: testEmail }).toArray()
    console.log(`📊 Documents found for ${testEmail}: ${userDocs.length}`)

    if (userDocs.length > 0) {
      console.log("✅ Sample user document:")
      const sample = userDocs[0]
      console.log({
        ID: sample.ID,
        Topic: sample.Topic,
        email: sample.email,
        user_id: sample.user_id,
        content_preview: (sample["generated content"] || sample.generated_content || "").substring(0, 100) + "...",
        timestamp: sample.timestamp,
      })
    }

    // Test API simulation
    console.log("\n🧪 Simulating API transformation...")
    const transformedDocs = userDocs.map((item) => ({
      id: item.ID || item.id || item._id?.toString(),
      topicId: item.topicId || item.topic_id || item.Topic,
      topicTitle: item.Topic || item.topicTitle || "Untitled",
      content: item["generated content"] || item.generated_content || item.content || "",
      hashtags: item.hashtags || [],
      keyPoints: item.keyPoints || [],
      imageUrl: item.imageUrl || item.Image || null,
      platform: item.platform || "linkedin",
      contentType: item.contentType || "storytelling",
      status: item.status || "generated",
      generatedAt: item.timestamp || item.generatedAt || new Date().toISOString(),
      createdAt: item.timestamp || item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || item.timestamp || new Date().toISOString(),
    }))

    console.log("✅ Transformed documents:")
    transformedDocs.forEach((doc, index) => {
      console.log(`\n--- Transformed Document ${index + 1} ---`)
      console.log("ID:", doc.id)
      console.log("Topic Title:", doc.topicTitle)
      console.log("Content Length:", doc.content.length)
      console.log("Platform:", doc.platform)
      console.log("Status:", doc.status)
    })

    console.log("\n✅ Test completed successfully!")
  } catch (error) {
    console.error("❌ Error testing approved content fetch:", error)
  } finally {
    await mongoose.disconnect()
  }
}

testApprovedContentFetch()
