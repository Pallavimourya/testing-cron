const mongoose = require("mongoose")
require("dotenv").config()

async function testUpdateContent() {
  try {
    console.log("🔍 Testing Content Update...")

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI)
    console.log("✅ Connected to MongoDB")

    // Get the raw collection
    const collection = mongoose.connection.db.collection("approvedcontents")

    // Find existing content
    const existingContent = await collection.findOne({ email: "pallavimourya99@gmail.com" })
    
    if (!existingContent) {
      console.log("❌ No content found to test with")
      return
    }

    console.log("📋 Found content:", {
      id: existingContent.ID,
      topic: existingContent.Topic,
      contentLength: existingContent["generated content"]?.length || 0
    })

    // Test update
    const testUpdate = {
      topicTitle: "Updated Topic Title - Test",
      content: "Updated content for testing purposes"
    }

    console.log("🔄 Testing update...")
    
    // First check if we can find the document
    const foundDoc = await collection.findOne({
      $and: [
        { $or: [{ ID: existingContent.ID }, { id: existingContent.ID }] },
        { email: "pallavimourya99@gmail.com" }
      ]
    })
    
    console.log("🔍 Found document for update:", foundDoc ? "Yes" : "No")
    if (foundDoc) {
      console.log("📋 Document found:", {
        ID: foundDoc.ID,
        Topic: foundDoc.Topic,
        email: foundDoc.email
      })
    }
    
    // Try updateOne instead
    const updateResult = await collection.updateOne(
      { ID: existingContent.ID },
      {
        $set: {
          Topic: testUpdate.topicTitle,
          "generated content": testUpdate.content,
          updated_at: new Date(),
          updatedAt: new Date()
        }
      }
    )

    console.log("📊 Update result:", {
      matchedCount: updateResult.matchedCount,
      modifiedCount: updateResult.modifiedCount,
      acknowledged: updateResult.acknowledged
    })

    if (updateResult.modifiedCount > 0) {
      console.log("✅ Update successful")
      
      // Get the updated document
      const updatedDoc = await collection.findOne({ ID: existingContent.ID })
      console.log("📋 Updated document:", {
        id: updatedDoc.ID,
        topicTitle: updatedDoc.Topic,
        contentLength: updatedDoc["generated content"]?.length || 0
      })
    } else {
      console.log("❌ Update failed")
    }

  } catch (error) {
    console.error("❌ Error testing content update:", error)
  } finally {
    await mongoose.disconnect()
  }
}

testUpdateContent()
