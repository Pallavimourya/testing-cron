const { MongoClient } = require('mongodb')

async function listUsers() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/linkzup'
  const client = new MongoClient(uri)

  try {
    await client.connect()
    console.log('Connected to MongoDB')

    const db = client.db()
    const users = db.collection('users')

    // Find all users
    const allUsers = await users.find({}).toArray()
    
    console.log(`👥 Found ${allUsers.length} users:`)
    
    allUsers.forEach((user, index) => {
      console.log(`\n${index + 1}. User:`, {
        email: user.email,
        name: user.name,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionPlan: user.subscriptionPlan,
        createdAt: user.createdAt
      })
    })

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.close()
  }
}

listUsers()
