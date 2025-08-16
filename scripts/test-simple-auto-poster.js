const mongoose = require('mongoose')

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/linkzup'

// Define the ApprovedContent schema inline
const ApprovedContentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  topicId: { type: String, required: true },
  topicTitle: { type: String, required: true, maxlength: 200 },
  content: { type: String, required: true, maxlength: 5000 },
  hashtags: { type: [String], default: [] },
  keyPoints: { type: [String], default: [] },
  imageUrl: String,
  contentType: { 
    type: String, 
    enum: ["storytelling", "tips", "insight", "question", "list"],
    default: "storytelling" 
  },
  status: { 
    type: String, 
    enum: ["generated", "approved", "rejected", "scheduled", "posted"],
    default: "generated" 
  },
  platform: { 
    type: String, 
    enum: ["linkedin", "twitter", "facebook"],
    default: "linkedin" 
  },
  scheduledFor: Date,
  postedAt: Date,
  linkedinUrl: String
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id
      delete ret._id
      delete ret.__v
      return ret
    }
  }
})

// Create the model
const ApprovedContent = mongoose.models.ApprovedContent || mongoose.model('ApprovedContent', ApprovedContentSchema)

async function testAutoPoster() {
  try {
    console.log('🧪 Testing Auto-Poster Setup...')
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB')
    
    // Test 1: Check if ApprovedContent model exists
    console.log('\n📊 Test 1: Checking ApprovedContent model...')
    const modelExists = mongoose.models.ApprovedContent
    console.log(`✅ Model exists: ${!!modelExists}`)
    
    // Test 2: Check for scheduled posts
    console.log('\n📊 Test 2: Checking for scheduled posts...')
    const scheduledPosts = await ApprovedContent.find({ status: 'scheduled' })
    console.log(`✅ Found ${scheduledPosts.length} scheduled posts`)
    
    if (scheduledPosts.length > 0) {
      console.log('\n📋 Scheduled Posts:')
      scheduledPosts.forEach((post, index) => {
        console.log(`${index + 1}. ${post.topicTitle}`)
        console.log(`   Status: ${post.status}`)
        console.log(`   Scheduled for: ${post.scheduledFor ? post.scheduledFor.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'Not set'}`)
        console.log(`   User ID: ${post.userId}`)
        console.log('')
      })
    }
    
    // Test 3: Check for posts due for posting
    console.log('\n📊 Test 3: Checking for posts due for posting...')
    const now = new Date()
    const istOffset = 5.5 * 60 * 60 * 1000 // IST is UTC+5:30
    const currentIST = new Date(now.getTime() + istOffset)
    
    const duePosts = await ApprovedContent.find({
      status: 'scheduled',
      scheduledFor: {
        $lte: currentIST,
        $gte: new Date(currentIST.getTime() - 60 * 1000)
      }
    })
    
    console.log(`✅ Found ${duePosts.length} posts due for posting`)
    
    if (duePosts.length > 0) {
      console.log('\n📋 Posts Due for Posting:')
      duePosts.forEach((post, index) => {
        console.log(`${index + 1}. ${post.topicTitle}`)
        console.log(`   Scheduled for: ${post.scheduledFor.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`)
        console.log(`   Current IST: ${currentIST.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`)
        console.log('')
      })
    }
    
    // Test 4: Check environment variables
    console.log('\n📊 Test 4: Checking environment variables...')
    const requiredEnvVars = [
      'MONGODB_URI',
      'NEXTAUTH_URL',
      'CRON_SECRET',
      'LINKEDIN_CLIENT_ID',
      'LINKEDIN_CLIENT_SECRET'
    ]
    
    requiredEnvVars.forEach(envVar => {
      const value = process.env[envVar]
      console.log(`${envVar}: ${value ? '✅ Set' : '❌ Not set'}`)
    })
    
    // Test 5: Check if LinkedIn posting API is accessible
    console.log('\n📊 Test 5: Checking LinkedIn posting API...')
    try {
      const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/linkedin/status`)
      if (response.ok) {
        console.log('✅ LinkedIn API endpoint accessible')
      } else {
        console.log('⚠️ LinkedIn API endpoint returned error status')
      }
    } catch (error) {
      console.log('❌ LinkedIn API endpoint not accessible:', error.message)
    }
    
    console.log('\n✅ Auto-Poster test completed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await mongoose.connection.close()
    console.log('🔌 Disconnected from MongoDB')
  }
}

// Run the test
testAutoPoster()
