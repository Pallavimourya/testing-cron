const { MongoClient } = require('mongodb')

async function testContentScheduling() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/linkzup'
  const client = new MongoClient(uri)

  try {
    await client.connect()
    console.log('Connected to MongoDB')

    const db = client.db()
    const users = db.collection('users')
    const approvedContents = db.collection('approvedcontents')

    // Check if we have users with LinkedIn connections
    const usersWithLinkedIn = await users.find({
      $or: [
        { linkedinAccessToken: { $exists: true, $ne: null } },
        { linkedinTokenExpiry: { $exists: true, $ne: null } }
      ]
    }).toArray()

    console.log(`👥 Users with LinkedIn connections: ${usersWithLinkedIn.length}`)

    if (usersWithLinkedIn.length > 0) {
      console.log('\n📊 LinkedIn Connection Details:')
      usersWithLinkedIn.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email}:`)
        console.log(`   - Has access token: ${!!user.linkedinAccessToken}`)
        console.log(`   - Token expiry: ${user.linkedinTokenExpiry}`)
        console.log(`   - Profile ID: ${user.linkedinProfile?.id || 'Not set'}`)
        console.log(`   - Connected at: ${user.linkedinConnectedAt}`)
      })
    }

    // Check approved content
    const approvedContent = await approvedContents.find({ status: 'approved' }).toArray()
    console.log(`\n📝 Approved content available: ${approvedContent.length}`)

    if (approvedContent.length > 0) {
      console.log('\n📋 Sample approved content:')
      approvedContent.slice(0, 3).forEach((content, index) => {
        console.log(`${index + 1}. ${content.topicTitle || 'Untitled'}:`)
        console.log(`   - Content: ${content.content?.substring(0, 100)}...`)
        console.log(`   - Status: ${content.status}`)
        console.log(`   - User: ${content.email || content.userId}`)
        console.log(`   - Has image: ${!!content.imageUrl}`)
      })
    }

    // Check scheduled content
    const scheduledContent = await approvedContents.find({ status: 'scheduled' }).toArray()
    console.log(`\n⏰ Scheduled content: ${scheduledContent.length}`)

    if (scheduledContent.length > 0) {
      console.log('\n📅 Scheduled posts:')
      scheduledContent.forEach((content, index) => {
        const scheduledFor = new Date(content.scheduledFor)
        const now = new Date()
        const timeUntil = scheduledFor.getTime() - now.getTime()
        const minutesUntil = Math.floor(timeUntil / (1000 * 60))
        
        console.log(`${index + 1}. ${content.topicTitle || 'Untitled'}:`)
        console.log(`   - Scheduled for: ${scheduledFor.toLocaleString()}`)
        console.log(`   - Time until post: ${minutesUntil > 0 ? `${minutesUntil} minutes` : 'Due now'}`)
        console.log(`   - User: ${content.email || content.userId}`)
      })
    }

    // Check posted content
    const postedContent = await approvedContents.find({ status: 'posted' }).toArray()
    console.log(`\n✅ Posted content: ${postedContent.length}`)

    if (postedContent.length > 0) {
      console.log('\n🔗 Posted posts:')
      postedContent.slice(0, 3).forEach((content, index) => {
        console.log(`${index + 1}. ${content.topicTitle || 'Untitled'}:`)
        console.log(`   - Posted at: ${new Date(content.postedAt).toLocaleString()}`)
        console.log(`   - LinkedIn URL: ${content.linkedinUrl || 'Not available'}`)
        console.log(`   - LinkedIn Post ID: ${content.linkedinPostId || 'Not available'}`)
      })
    }

    // Test auto-post functionality
    console.log('\n🧪 Testing auto-post functionality...')
    
    // Find posts that are due now
    const now = new Date()
    const bufferTime = new Date(now.getTime() + 5 * 60 * 1000) // 5 minutes buffer
    
    const duePosts = await approvedContents.find({
      $and: [
        { status: 'scheduled' },
        { scheduledFor: { $lte: bufferTime } }
      ]
    }).toArray()

    console.log(`⏰ Posts due for posting: ${duePosts.length}`)

    if (duePosts.length > 0) {
      console.log('\n📤 Due posts:')
      duePosts.forEach((post, index) => {
        console.log(`${index + 1}. ${post.topicTitle || 'Untitled'}:`)
        console.log(`   - Scheduled for: ${new Date(post.scheduledFor).toLocaleString()}`)
        console.log(`   - User: ${post.email || post.userId}`)
        console.log(`   - Has LinkedIn token: ${!!usersWithLinkedIn.find(u => u.email === post.email)}`)
      })
    }

    // Summary
    console.log('\n📊 SUMMARY:')
    console.log(`✅ Users with LinkedIn: ${usersWithLinkedIn.length}`)
    console.log(`📝 Approved content: ${approvedContent.length}`)
    console.log(`⏰ Scheduled content: ${scheduledContent.length}`)
    console.log(`✅ Posted content: ${postedContent.length}`)
    console.log(`🚀 Due for posting: ${duePosts.length}`)

    if (usersWithLinkedIn.length === 0) {
      console.log('\n⚠️  WARNING: No users have LinkedIn connections!')
      console.log('   Users need to connect their LinkedIn accounts for auto-posting to work.')
    }

    if (approvedContent.length === 0) {
      console.log('\n⚠️  WARNING: No approved content available!')
      console.log('   Create and approve content first to test scheduling.')
    }

    if (duePosts.length > 0 && usersWithLinkedIn.length > 0) {
      console.log('\n🎯 READY: Auto-posting should work!')
      console.log('   Run the auto-post test from the calendar page.')
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.close()
  }
}

testContentScheduling()
