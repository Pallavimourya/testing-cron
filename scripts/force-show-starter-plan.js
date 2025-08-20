const { MongoClient } = require('mongodb')

async function forceShowStarterPlan() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/linkzup'
  const client = new MongoClient(uri)

  try {
    await client.connect()
    console.log('Connected to MongoDB')

    const db = client.db()
    const users = db.collection('users')

    // Update all users to have Starter plan for testing
    const result = await users.updateMany(
      { subscriptionStatus: 'active' },
      {
        $set: {
          subscriptionPlan: 'zuper15',
          subscriptionStatus: 'active',
          subscriptionExpiry: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
          contentGenerated: 5,
          imagesGenerated: 3,
          updatedAt: new Date()
        }
      }
    )

    console.log(`✅ Updated ${result.modifiedCount} users to have Starter plan`)

    // Verify the changes
    const activeUsers = await users.find({ subscriptionStatus: 'active' }).toArray()
    console.log('\n📊 Active Users:')
    activeUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} - ${user.subscriptionPlan} (${user.subscriptionStatus})`)
    })

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.close()
  }
}

forceShowStarterPlan()
