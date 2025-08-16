const { MongoClient } = require('mongodb')

async function fixUserSubscription() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/linkzup'
  const client = new MongoClient(uri)

  try {
    await client.connect()
    console.log('Connected to MongoDB')

    const db = client.db()
    const users = db.collection('users')

    // Find user by email
    const userEmail = 'pallavi@gmail.com' // Replace with actual email
    const user = await users.findOne({ email: userEmail })

    if (!user) {
      console.log('User not found')
      return
    }

    console.log('Current user subscription:', {
      status: user.subscriptionStatus,
      plan: user.subscriptionPlan,
      expiry: user.subscriptionExpiry
    })

    // Update subscription to active Zuper 15 plan
    const subscriptionEndDate = new Date()
    subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 15) // 15 days for Zuper 15

    const result = await users.updateOne(
      { email: userEmail },
      {
        $set: {
          subscriptionStatus: 'active',
          subscriptionPlan: 'zuper15',
          subscriptionExpiry: subscriptionEndDate,
          updatedAt: new Date()
        }
      }
    )

    if (result.modifiedCount > 0) {
      console.log('✅ User subscription updated successfully')
      console.log('New subscription details:', {
        status: 'active',
        plan: 'zuper15',
        expiry: subscriptionEndDate
      })
    } else {
      console.log('❌ Failed to update subscription')
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.close()
  }
}

fixUserSubscription()
