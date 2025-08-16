const { MongoClient } = require("mongodb")

async function dropAndRecreateIndex() {
  const client = new MongoClient(process.env.MONGODB_URI)

  try {
    await client.connect()
    console.log("🔗 Connected to MongoDB")

    const db = client.db("LinkZup")
    const collection = db.collection("approvedcontents")

    // List current indexes
    const indexes = await collection.indexes()
    console.log("📊 Current indexes:")
    indexes.forEach((index) => {
      console.log(`   - ${index.name}: ${JSON.stringify(index.key)}`)
    })

    // Drop the problematic unique index on id
    try {
      await collection.dropIndex("id_1")
      console.log("✅ Dropped id_1 index")
    } catch (error) {
      console.log("⚠️ Index id_1 may not exist:", error.message)
    }

    // Recreate the index after fixing duplicates
    await collection.createIndex(
      { id: 1 },
      {
        unique: true,
        sparse: false,
        background: true,
      },
    )
    console.log("✅ Recreated unique index on id field")

    // Verify the new index
    const newIndexes = await collection.indexes()
    console.log("📊 Updated indexes:")
    newIndexes.forEach((index) => {
      console.log(`   - ${index.name}: ${JSON.stringify(index.key)}`)
    })
  } catch (error) {
    console.error("❌ Error managing indexes:", error)
  } finally {
    await client.close()
  }
}

// Run the index management
dropAndRecreateIndex()
