const mongoose = require("mongoose")
require("dotenv").config()

async function debugApprovedContentStructure() {
  try {
    console.log("🔍 Debugging Approved Content Structure...")

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI)
    console.log("✅ Connected to MongoDB")

    // Get the raw collection
    const collection = mongoose.connection.db.collection("approvedcontents")

    // Check if collection exists
    const collections = await mongoose.connection.db.listCollections().toArray()
    const approvedContentCollection = collections.find((col) => col.name === "approvedcontents")

    if (!approvedContentCollection) {
      console.log("❌ approvedcontents collection not found!")
      console.log(
        "Available collections:",
        collections.map((col) => col.name),
      )
      return
    }

    console.log("✅ approvedcontents collection found")

    // Get collection stats
    const stats = await mongoose.connection.db.command({ collStats: "approvedcontents" })
    console.log("📊 Collection Stats:")
    console.log("- Document count:", stats.count)
    console.log("- Storage size:", stats.storageSize)
    console.log("- Average document size:", stats.avgObjSize)

    // Get sample document to analyze structure
    const sampleDoc = await collection.findOne({})
    if (sampleDoc) {
      console.log("\n📋 Sample Document Structure:")
      console.log("Fields found:", Object.keys(sampleDoc))

      // Analyze each field
      Object.entries(sampleDoc).forEach(([key, value]) => {
        console.log(
          `- ${key}: ${typeof value} ${Array.isArray(value) ? "(array)" : ""} - ${
            typeof value === "string"
              ? `"${value.substring(0, 50)}${value.length > 50 ? "..." : ""}"`
              : typeof value === "object" && value !== null
                ? JSON.stringify(value).substring(0, 50) + "..."
                : value
          }`,
        )
      })

      // Check for user identification fields
      console.log("\n👤 User Identification Fields:")
      console.log("- email:", sampleDoc.email)
      console.log("- user_id:", sampleDoc.user_id)
      console.log("- userId:", sampleDoc.userId)

      // Check for content fields
      console.log("\n📝 Content Fields:")
      console.log("- ID:", sampleDoc.ID)
      console.log("- id:", sampleDoc.id)
      console.log("- Topic:", sampleDoc.Topic)
      console.log("- topicTitle:", sampleDoc.topicTitle)
      console.log("- generated_content:", sampleDoc.generated_content ? "Present" : "Missing")
      console.log("- content:", sampleDoc.content ? "Present" : "Missing")

      // Check for timestamp fields
      console.log("\n⏰ Timestamp Fields:")
      console.log("- timestamp:", sampleDoc.timestamp)
      console.log("- createdAt:", sampleDoc.createdAt)
      console.log("- updatedAt:", sampleDoc.updatedAt)
    } else {
      console.log("❌ No documents found in collection")
    }

    // Test different query patterns
    console.log("\n🧪 Testing Query Patterns:")

    const testQueries = [{ email: "pallavimourya99@gmail.com" }, { user_id: "686ce0359ac7d703b054f77" }, { ID: "1" }]

    for (const query of testQueries) {
      const count = await collection.countDocuments(query)
      console.log(`Query ${JSON.stringify(query)}: ${count} documents`)
    }

    console.log("\n✅ Debug completed!")
  } catch (error) {
    console.error("❌ Error debugging structure:", error)
  } finally {
    await mongoose.disconnect()
  }
}

debugApprovedContentStructure()
