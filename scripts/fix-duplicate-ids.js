const { MongoClient } = require("mongodb")

async function fixDuplicateIds() {
  const client = new MongoClient(process.env.MONGODB_URI)

  try {
    await client.connect()
    console.log("🔗 Connected to MongoDB")

    const db = client.db("LinkZup")
    const collection = db.collection("approvedcontents")

    // Find documents with null or missing id
    const nullIdDocs = await collection
      .find({
        $or: [{ id: null }, { id: { $exists: false } }, { id: "" }],
      })
      .toArray()

    console.log(`📊 Found ${nullIdDocs.length} documents with null/missing id`)

    // Update each document with a unique ID
    for (const doc of nullIdDocs) {
      const newId = `content-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${doc._id.toString().substr(-4)}`

      await collection.updateOne(
        { _id: doc._id },
        {
          $set: {
            id: newId,
            updatedAt: new Date(),
          },
        },
      )

      console.log(`✅ Updated document ${doc._id} with new id: ${newId}`)
    }

    // Find and fix any remaining duplicates
    const pipeline = [
      {
        $group: {
          _id: "$id",
          count: { $sum: 1 },
          docs: { $push: "$$ROOT" },
        },
      },
      {
        $match: {
          count: { $gt: 1 },
        },
      },
    ]

    const duplicates = await collection.aggregate(pipeline).toArray()
    console.log(`📊 Found ${duplicates.length} groups of duplicate ids`)

    // Fix duplicates by updating all but the first document
    for (const group of duplicates) {
      const docsToUpdate = group.docs.slice(1) // Keep first, update rest

      for (const doc of docsToUpdate) {
        const newId = `content-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${doc._id.toString().substr(-4)}`

        await collection.updateOne(
          { _id: doc._id },
          {
            $set: {
              id: newId,
              updatedAt: new Date(),
            },
          },
        )

        console.log(`✅ Fixed duplicate: ${doc._id} -> ${newId}`)
      }
    }

    // Verify the fix
    const remainingNulls = await collection.countDocuments({
      $or: [{ id: null }, { id: { $exists: false } }, { id: "" }],
    })

    const remainingDuplicates = await collection
      .aggregate([
        {
          $group: {
            _id: "$id",
            count: { $sum: 1 },
          },
        },
        {
          $match: {
            count: { $gt: 1 },
          },
        },
        {
          $count: "duplicateGroups",
        },
      ])
      .toArray()

    console.log("📊 Final status:")
    console.log(`   - Documents with null/missing id: ${remainingNulls}`)
    console.log(
      `   - Duplicate id groups: ${remainingDuplicates.length > 0 ? remainingDuplicates[0].duplicateGroups : 0}`,
    )

    if (remainingNulls === 0 && remainingDuplicates.length === 0) {
      console.log("✅ All duplicate ID issues have been resolved!")
    }
  } catch (error) {
    console.error("❌ Error fixing duplicate IDs:", error)
  } finally {
    await client.close()
  }
}

// Run the fix
fixDuplicateIds()
