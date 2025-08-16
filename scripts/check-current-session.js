const { MongoClient } = require('mongodb')

async function checkCurrentSession() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/linkzup'
  const client = new MongoClient(uri)

  try {
    await client.connect()
    console.log('Connected to MongoDB')

    const db = client.db()
    const users = db.collection('users')

    // Check all users and their subscription status
    const allUsers = await users.find({}).toArray()
    
    console.log('👥 All users and their subscription status:')
    
    allUsers.forEach((user, index) => {
      console.log(`\n${index + 1}. User:`, {
        email: user.email,
        name: user.name,
        subscriptionStatus: user.subscriptionStatus || 'free',
        subscriptionPlan: user.subscriptionPlan || 'free',
        subscriptionExpiry: user.subscriptionExpiry,
        createdAt: user.createdAt
      })
    })

    // Check which user has active subscription
    const activeUsers = allUsers.filter(u => u.subscriptionStatus === 'active')
    console.log(`\n✅ Users with active subscription: ${activeUsers.length}`)
    
    activeUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} - ${user.subscriptionPlan}`)
    })

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.close()
  }
}

checkCurrentSession()
