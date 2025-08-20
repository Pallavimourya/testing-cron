const mongoose = require("mongoose")
require("dotenv").config()

async function migrateApprovedContentStructure() {
  try {
    console.log("🔄 Migrating Approved Content Structure...")

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI)
    console.log("✅ Connected to MongoDB")

    // Get the raw collection
    const collection = mongoose.connection.db.collection("approvedcontents")

    // Get all documents
    const allDocs = await collection.find({}).toArray()
    console.log(`📊 Found ${allDocs.length} documents to migrate`)

    let migratedCount = 0

    for (const doc of allDocs) {
      try {
        // Create standardized document structure
        const standardizedDoc = {
          // Keep original _id
          _id: doc._id,

          // Standardize ID field
          id: doc.ID || doc.id || doc._id.toString(),

          // Standardize topic fields
          topicId: doc.topicId || doc.topic_id || doc.Topic || `topic-${Date.now()}`,
          topicTitle: doc.Topic || doc.topicTitle || doc.topic_title || "Untitled Topic",

          // Standardize content
          content: doc.generated_content || doc.content || doc.Content || "",

          // Standardize user fields
          userId: doc.user_id || doc.userId,
          email: doc.email,

          // Standardize optional fields
          hashtags: doc.hashtags || doc.Hashtags || [],
          keyPoints: doc.keyPoints || doc.key_points || doc.KeyPoints || [],
          imageUrl: doc.imageUrl || doc.image_url || doc.Image || null,

          // Standardize metadata
          platform: doc.platform || doc.Platform || "linkedin",
          contentType: doc.contentType || doc.content_type || doc.ContentType || "storytelling",
          status: doc.status || doc.Status || "generated",

          // Standardize timestamps
          generatedAt: doc.timestamp || doc.generatedAt || doc.generated_at || doc.createdAt || new Date(),
          createdAt: doc.timestamp || doc.createdAt || doc.created_at || new Date(),
          updatedAt: doc.updatedAt || doc.updated_at || doc.timestamp || new Date(),

          // Keep original fields for backup
          _original: {
            ID: doc.ID,
            Topic: doc.Topic,
            generated_content: doc.generated_content,
            user_id: doc.user_id,
            timestamp: doc.timestamp,
          },
        }

        // Update the document
        await collection.replaceOne({ _id: doc._id }, standardizedDoc)

        migratedCount++
        console.log(`✅ Migrated document ${migratedCount}/${allDocs.length}: ${standardizedDoc.id}`)
      } catch (error) {
        console.error(`❌ Error migrating document ${doc._id}:`, error)
      }
    }

    console.log(`\n🎉 Migration completed! ${migratedCount}/${allDocs.length} documents migrated`)

    // Verify migration
    console.log("\n🔍 Verifying migration...")
    const verifyDoc = await collection.findOne({})
    if (verifyDoc) {
      console.log("✅ Sample migrated document structure:")
      console.log("Fields:", Object.keys(verifyDoc))
      console.log("ID:", verifyDoc.id)
      console.log("Topic Title:", verifyDoc.topicTitle)
      console.log("Content Length:", verifyDoc.content?.length || 0)
      console.log("User ID:", verifyDoc.userId)
      console.log("Email:", verifyDoc.email)
    }
  } catch (error) {
    console.error("❌ Error migrating structure:", error)
  } finally {
    await mongoose.disconnect()
  }
}

migrateApprovedContentStructure()
