const { MongoClient } = require('mongodb')

async function debugAutoPost() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/linkzup'
  const client = new MongoClient(uri)

  try {
    await client.connect()
    console.log('Connected to MongoDB')

    const db = client.db()
    const approvedContents = db.collection('approvedcontents')
    const users = db.collection('users')

    const now = new Date()
    const bufferTime = new Date(now.getTime() + 5 * 60 * 1000) // 5 minutes buffer

    console.log('🔍 Debug Auto-Post Process')
    console.log(`⏰ Current time: ${now.toISOString()}`)
    console.log(`⏰ Buffer time: ${bufferTime.toISOString()}`)

    // Check all scheduled posts
    const allScheduledPosts = await approvedContents.find({ 
      $or: [{ status: "scheduled" }, { Status: "scheduled" }]
    }).toArray()

    console.log(`\n📊 All scheduled posts: ${allScheduledPosts.length}`)
    
    allScheduledPosts.forEach((post, index) => {
      const scheduledFor = post.scheduledFor || post.scheduled_for
      const isDue = scheduledFor && new Date(scheduledFor) <= bufferTime
      const timeUntil = scheduledFor ? Math.floor((new Date(scheduledFor) - now) / (1000 * 60)) : "N/A"
      
      console.log(`${index + 1}. ${post.topicTitle || 'Untitled'}:`)
      console.log(`   - ID: ${post._id}`)
      console.log(`   - Scheduled for: ${scheduledFor ? new Date(scheduledFor).toISOString() : 'No date'}`)
      console.log(`   - Time until: ${timeUntil} minutes`)
      console.log(`   - Is due: ${isDue}`)
      console.log(`   - User: ${post.email || post.userId}`)
      console.log(`   - Status: ${post.status || post.Status}`)
    })

    // Check due posts with the same query as the API
    const dueQuery = {
      $and: [
        {
          $or: [{ status: "scheduled" }, { Status: "scheduled" }],
        },
        {
          $or: [{ scheduledFor: { $lte: bufferTime } }, { scheduled_for: { $lte: bufferTime } }],
        },
      ],
    }

    console.log('\n🔍 Due posts query:', JSON.stringify(dueQuery, null, 2))
    
    const duePosts = await approvedContents.find(dueQuery).toArray()
    console.log(`\n📤 Due posts found: ${duePosts.length}`)

    duePosts.forEach((post, index) => {
      console.log(`${index + 1}. ${post.topicTitle || 'Untitled'}:`)
      console.log(`   - ID: ${post._id}`)
      console.log(`   - Scheduled for: ${post.scheduledFor || post.scheduled_for}`)
      console.log(`   - User: ${post.email || post.userId}`)
    })

    // Check users with LinkedIn
    const usersWithLinkedIn = await users.find({
      linkedinAccessToken: { $exists: true, $ne: null }
    }).toArray()

    console.log(`\n👥 Users with LinkedIn: ${usersWithLinkedIn.length}`)
    usersWithLinkedIn.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}:`)
      console.log(`   - Has token: ${!!user.linkedinAccessToken}`)
      console.log(`   - Token expiry: ${user.linkedinTokenExpiry}`)
      console.log(`   - Profile ID: ${user.linkedinProfile?.id}`)
    })

    // Test the actual posting process for one post
    if (duePosts.length > 0) {
      console.log('\n🧪 Testing actual posting process...')
      const testPost = duePosts[0]
      
      console.log(`Testing post: ${testPost.topicTitle}`)
      console.log(`Post ID: ${testPost._id}`)
      console.log(`User: ${testPost.email || testPost.userId}`)
      
      // Find the user
      const user = await users.findOne({ email: testPost.email })
      if (user) {
        console.log(`✅ Found user: ${user.email}`)
        console.log(`✅ Has LinkedIn token: ${!!user.linkedinAccessToken}`)
        console.log(`✅ Token expiry: ${user.linkedinTokenExpiry}`)
        console.log(`✅ Token valid: ${user.linkedinTokenExpiry ? new Date(user.linkedinTokenExpiry) > now : false}`)
      } else {
        console.log(`❌ User not found for email: ${testPost.email}`)
      }
    }

    // Check if posts are in the right collection
    console.log('\n📋 Collection check:')
    const collections = ["approvedcontents", "linkdin-content-generation", "generatedcontents"]
    
    for (const collectionName of collections) {
      try {
        const collection = db.collection(collectionName)
        const count = await collection.countDocuments({ 
          $or: [{ status: "scheduled" }, { Status: "scheduled" }]
        })
        console.log(`${collectionName}: ${count} scheduled posts`)
      } catch (error) {
        console.log(`${collectionName}: Error - ${error.message}`)
      }
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.close()
  }
}

debugAutoPost()
