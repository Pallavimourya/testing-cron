const { MongoClient } = require('mongodb')

async function createTestScheduledContent() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/linkzup'
  const client = new MongoClient(uri)

  try {
    await client.connect()
    console.log('Connected to MongoDB')

    const db = client.db()
    const approvedContents = db.collection('approvedcontents')
    const users = db.collection('users')

    // Get test user
    const testUser = await users.findOne({ email: 'test@example.com' })
    
    if (!testUser) {
      console.log('❌ Test user not found')
      return
    }

    console.log(`Creating test scheduled content for ${testUser.email}...`)

    // Create test scheduled posts
    const testPosts = [
      {
        topicTitle: "LinkedIn Marketing Tips for 2024",
        content: "🚀 LinkedIn Marketing Tips for 2024:\n\n1. Optimize your profile with keywords\n2. Share valuable content consistently\n3. Engage with your network actively\n4. Use LinkedIn Analytics to track performance\n5. Join relevant groups and participate\n\n#LinkedInMarketing #DigitalMarketing #2024 #Growth",
        status: "scheduled",
        scheduledFor: new Date(Date.now() + 2 * 60 * 1000), // 2 minutes from now
        email: testUser.email,
        userId: testUser._id.toString(),
        platform: "linkedin",
        contentType: "post",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        topicTitle: "Building Your Personal Brand",
        content: "🎯 Building Your Personal Brand:\n\nYour personal brand is your digital reputation. Here's how to build it:\n\n• Define your unique value proposition\n• Create consistent content that reflects your expertise\n• Network authentically with industry leaders\n• Share your knowledge and insights regularly\n• Be genuine and transparent in your communications\n\nRemember: Your brand is what people say about you when you're not in the room.\n\n#PersonalBranding #ProfessionalGrowth #Networking",
        status: "scheduled", 
        scheduledFor: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
        email: testUser.email,
        userId: testUser._id.toString(),
        platform: "linkedin",
        contentType: "post",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        topicTitle: "AI in Content Marketing",
        content: "🤖 AI in Content Marketing:\n\nArtificial Intelligence is revolutionizing how we create and distribute content:\n\n• AI-powered content generation\n• Personalized content recommendations\n• Automated scheduling and optimization\n• Data-driven content strategy\n• Enhanced audience targeting\n\nEmbrace AI tools to scale your content marketing efforts while maintaining authenticity and human connection.\n\n#AIMarketing #ContentMarketing #Innovation #DigitalTransformation",
        status: "scheduled",
        scheduledFor: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
        email: testUser.email,
        userId: testUser._id.toString(),
        platform: "linkedin",
        contentType: "post",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    // Insert test posts
    const results = await approvedContents.insertMany(testPosts)
    console.log(`✅ Created ${results.insertedIds.length} test scheduled posts`)

    // Verify the scheduled posts
    const scheduledPosts = await approvedContents.find({ 
      status: 'scheduled',
      email: testUser.email 
    }).toArray()

    console.log(`\n📅 Scheduled Posts Created:`)
    scheduledPosts.forEach((post, index) => {
      const scheduledFor = new Date(post.scheduledFor)
      const now = new Date()
      const timeUntil = scheduledFor.getTime() - now.getTime()
      const minutesUntil = Math.floor(timeUntil / (1000 * 60))
      
      console.log(`${index + 1}. ${post.topicTitle}:`)
      console.log(`   - Scheduled for: ${scheduledFor.toLocaleString()}`)
      console.log(`   - Time until post: ${minutesUntil} minutes`)
      console.log(`   - Status: ${post.status}`)
    })

    // Check total scheduled posts
    const totalScheduled = await approvedContents.countDocuments({ status: 'scheduled' })
    const totalApproved = await approvedContents.countDocuments({ status: 'approved' })
    const totalPosted = await approvedContents.countDocuments({ status: 'posted' })

    console.log(`\n📊 Content Summary:`)
    console.log(`✅ Approved: ${totalApproved}`)
    console.log(`⏰ Scheduled: ${totalScheduled}`)
    console.log(`✅ Posted: ${totalPosted}`)

    console.log(`\n🎯 Auto-Posting Test Ready!`)
    console.log(`1. Go to Content Calendar page`)
    console.log(`2. You'll see ${scheduledPosts.length} scheduled posts`)
    console.log(`3. Click "Test Auto-Post" button`)
    console.log(`4. Posts will be processed in the next 5 minutes`)

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.close()
  }
}

createTestScheduledContent()
