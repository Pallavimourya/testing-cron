const { MongoClient } = require('mongodb')

async function setupTestLinkedIn() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/linkzup'
  const client = new MongoClient(uri)

  try {
    await client.connect()
    console.log('Connected to MongoDB')

    const db = client.db()
    const users = db.collection('users')

    // Update test users with mock LinkedIn data
    const testUsers = ['test@example.com', 'adii@gmail.com']
    
    for (const email of testUsers) {
      const user = await users.findOne({ email })
      
      if (user) {
        console.log(`Setting up LinkedIn connection for ${email}...`)
        
        // Set mock LinkedIn data (for testing purposes)
        const result = await users.updateOne(
          { email },
          {
            $set: {
              linkedinAccessToken: 'test_linkedin_token_' + Date.now(),
              linkedinTokenExpiry: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
              linkedinProfile: {
                id: 'test_linkedin_profile_id',
                name: 'Test LinkedIn User',
                email: email,
                profileUrl: 'https://www.linkedin.com/in/testuser'
              },
              linkedinConnectedAt: new Date(),
              linkedinLastSync: new Date(),
              updatedAt: new Date()
            }
          }
        )

        if (result.modifiedCount > 0) {
          console.log(`✅ LinkedIn connection set up for ${email}`)
        } else {
          console.log(`⚠️  User ${email} not found or already has LinkedIn data`)
        }
      } else {
        console.log(`❌ User ${email} not found`)
      }
    }

    // Verify the setup
    const usersWithLinkedIn = await users.find({
      linkedinAccessToken: { $exists: true, $ne: null }
    }).toArray()

    console.log(`\n📊 LinkedIn Setup Summary:`)
    console.log(`✅ Users with LinkedIn connections: ${usersWithLinkedIn.length}`)
    
    usersWithLinkedIn.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}:`)
      console.log(`   - Has access token: ${!!user.linkedinAccessToken}`)
      console.log(`   - Token expiry: ${user.linkedinTokenExpiry}`)
      console.log(`   - Profile ID: ${user.linkedinProfile?.id}`)
    })

    console.log('\n🎯 Next Steps:')
    console.log('1. Go to the Content Calendar page')
    console.log('2. Schedule some approved content')
    console.log('3. Test the auto-posting functionality')
    console.log('4. Check the "Test Auto-Post" button')

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.close()
  }
}

setupTestLinkedIn()
