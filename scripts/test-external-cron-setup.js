const { MongoClient } = require('mongodb')

async function testExternalCronSetup() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/linkzup'
  const client = new MongoClient(uri)

  try {
    await client.connect()
    console.log('✅ Connected to MongoDB')

    const db = client.db()
    
    // Test 1: Check if ScheduledPost collection exists
    console.log('\n📋 Test 1: Checking ScheduledPost collection...')
    const collections = await db.listCollections().toArray()
    const hasScheduledPostCollection = collections.some(col => col.name === 'scheduledposts')
    console.log(`✅ ScheduledPost collection exists: ${hasScheduledPostCollection}`)

    if (hasScheduledPostCollection) {
      const scheduledPosts = db.collection('scheduledposts')
      const count = await scheduledPosts.countDocuments()
      console.log(`📊 Total scheduled posts: ${count}`)
      
      // Show sample posts
      const samplePosts = await scheduledPosts.find().limit(3).toArray()
      if (samplePosts.length > 0) {
        console.log('\n📝 Sample scheduled posts:')
        samplePosts.forEach((post, index) => {
          console.log(`${index + 1}. ID: ${post._id}`)
          console.log(`   Content: ${post.content?.substring(0, 50)}...`)
          console.log(`   Status: ${post.status}`)
          console.log(`   Scheduled: ${post.scheduledTimeIST}`)
          console.log(`   User: ${post.userEmail}`)
        })
      }
    }

    // Test 2: Check if users have LinkedIn credentials
    console.log('\n👤 Test 2: Checking user LinkedIn credentials...')
    const users = db.collection('users')
    const usersWithLinkedIn = await users.find({
      linkedinAccessToken: { $exists: true, $ne: null }
    }).toArray()
    
    console.log(`✅ Users with LinkedIn credentials: ${usersWithLinkedIn.length}`)
    
    if (usersWithLinkedIn.length > 0) {
      console.log('\n🔗 LinkedIn credentials summary:')
      usersWithLinkedIn.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email}:`)
        console.log(`   - Has access token: ${!!user.linkedinAccessToken}`)
        console.log(`   - Token expiry: ${user.linkedinTokenExpiry}`)
        console.log(`   - Profile ID: ${user.linkedinProfile?.id}`)
      })
    }

    // Test 3: Check environment variables
    console.log('\n🔧 Test 3: Checking environment variables...')
    const requiredEnvVars = [
      'MONGODB_URI',
      'CRON_SECRET',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL'
    ]
    
    requiredEnvVars.forEach(envVar => {
      const value = process.env[envVar]
      console.log(`   ${envVar}: ${value ? '✅ SET' : '❌ NOT SET'}`)
      if (value && envVar === 'CRON_SECRET') {
        console.log(`   CRON_SECRET value: ${value.substring(0, 10)}...`)
      }
    })

    // Test 4: Test external cron endpoint
    console.log('\n🌐 Test 4: Testing external cron endpoint...')
    const cronSecret = process.env.CRON_SECRET || 'BzbHyiKVrc6rDLWHn4uYLHo+s1WkHp2ucuzsCi/euRI='
    const baseUrl = process.env.NEXTAUTH_URL || 'https://testing-cron.vercel.app'
    
    console.log(`   Base URL: ${baseUrl}`)
    console.log(`   Endpoint: ${baseUrl}/api/cron/external-auto-post`)
    console.log(`   CRON_SECRET: ${cronSecret.substring(0, 10)}...`)
    
    console.log('\n📡 To test the endpoint manually, run:')
    console.log(`curl -X GET "${baseUrl}/api/cron/external-auto-post" \\`)
    console.log(`  -H "Authorization: Bearer ${cronSecret}" \\`)
    console.log(`  -H "Content-Type: application/json"`)

    // Test 5: Create test scheduled post
    console.log('\n📝 Test 5: Creating test scheduled post...')
    if (usersWithLinkedIn.length > 0) {
      const testUser = usersWithLinkedIn[0]
      const scheduledPosts = db.collection('scheduledposts')
      
      // Schedule a post for 2 minutes from now
      const scheduledTime = new Date(Date.now() + 2 * 60 * 1000) // 2 minutes from now
      const scheduledTimeIST = scheduledTime.toLocaleString('en-IN', { 
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
      
      const testPost = {
        userId: testUser._id,
        userEmail: testUser.email,
        contentId: 'test-content-id',
        content: '🧪 Test post from external cron system\n\nThis is a test post to verify the external cron functionality is working correctly.\n\n#Testing #CronJob #LinkedIn',
        imageUrl: null,
        scheduledTime: scheduledTime,
        scheduledTimeIST: scheduledTimeIST,
        status: 'pending',
        platform: 'linkedin',
        attempts: 0,
        maxAttempts: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      const result = await scheduledPosts.insertOne(testPost)
      console.log(`✅ Test scheduled post created with ID: ${result.insertedId}`)
      console.log(`   Scheduled for: ${scheduledTimeIST}`)
      console.log(`   User: ${testUser.email}`)
      
      console.log('\n⏰ The test post will be processed by the cron job in the next few minutes.')
      console.log('   Check the scheduled posts page to see the status.')
    } else {
      console.log('❌ No users with LinkedIn credentials found. Cannot create test post.')
    }

    console.log('\n🎉 External cron setup test completed!')
    console.log('\n📋 Next Steps:')
    console.log('1. Verify cron-job.org is configured with the correct URL and headers')
    console.log('2. Check that the cron job is running every minute')
    console.log('3. Monitor the scheduled posts page for status updates')
    console.log('4. Check Vercel logs for any errors')

  } catch (error) {
    console.error('❌ Error testing external cron setup:', error)
  } finally {
    await client.close()
    console.log('✅ Database connection closed')
  }
}

testExternalCronSetup()
