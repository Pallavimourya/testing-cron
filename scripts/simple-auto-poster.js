const cron = require('node-cron')
const mongoose = require('mongoose')
const fetch = require('node-fetch')

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/linkzup'

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err))

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

// Function to get current time in IST
function getCurrentISTTime() {
  const now = new Date()
  const istOffset = 5.5 * 60 * 60 * 1000 // IST is UTC+5:30
  return new Date(now.getTime() + istOffset)
}

// Function to check and post due content
async function checkAndPostDueContent() {
  try {
    console.log('🕐 Checking for posts due for posting...')
    console.log('🕐 Current time (IST):', getCurrentISTTime().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }))
    
    // Get current IST time
    const currentIST = getCurrentISTTime()
    
    // Find posts that are scheduled and due for posting (within 1 minute buffer)
    const duePosts = await ApprovedContent.find({
      status: 'scheduled',
      scheduledFor: {
        $lte: currentIST, // Posts scheduled for current time or earlier
        $gte: new Date(currentIST.getTime() - 60 * 1000) // Within last 1 minute (buffer)
      }
    }).populate('userId', 'linkedinAccessToken linkedinRefreshToken linkedinUserId')
    
    console.log(`📊 Found ${duePosts.length} posts due for posting`)
    
    if (duePosts.length === 0) {
      console.log('✅ No posts due for posting')
      return
    }
    
    // Process each due post
    for (const post of duePosts) {
      try {
        console.log(`📝 Processing post: ${post.topicTitle}`)
        console.log(`📅 Scheduled for: ${post.scheduledFor.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`)
        
        // Check if user has LinkedIn credentials
        if (!post.userId.linkedinAccessToken) {
          console.log(`❌ User ${post.userId._id} has no LinkedIn access token`)
          continue
        }
        
        // Post to LinkedIn
        const postResult = await postToLinkedIn(post)
        
        if (postResult.success) {
          // Update post status to posted
          await ApprovedContent.findByIdAndUpdate(post._id, {
            status: 'posted',
            postedAt: new Date(),
            linkedinUrl: postResult.linkedinUrl
          })
          
          console.log(`✅ Successfully posted: ${post.topicTitle}`)
          console.log(`🔗 LinkedIn URL: ${postResult.linkedinUrl}`)
        } else {
          console.log(`❌ Failed to post: ${post.topicTitle} - ${postResult.error}`)
        }
        
      } catch (error) {
        console.error(`❌ Error processing post ${post._id}:`, error)
      }
    }
    
  } catch (error) {
    console.error('❌ Error in checkAndPostDueContent:', error)
  }
}

// Function to post to LinkedIn
async function postToLinkedIn(post) {
  try {
    // Call your existing LinkedIn posting API
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/linkedin/post`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CRON_SECRET || 'your-cron-secret'}`
      },
      body: JSON.stringify({
        content: post.content,
        hashtags: post.hashtags,
        imageUrl: post.imageUrl,
        userId: post.userId._id.toString(),
        contentType: post.contentType,
        topicTitle: post.topicTitle
      })
    })
    
    if (response.ok) {
      const result = await response.json()
      return {
        success: true,
        linkedinUrl: result.linkedinUrl
      }
    } else {
      const error = await response.json()
      return {
        success: false,
        error: error.message || 'Failed to post to LinkedIn'
      }
    }
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

// Schedule the cron job to run every minute
console.log('🚀 Starting auto-poster cron job...')
console.log('⏰ Will check for due posts every minute')

cron.schedule('* * * * *', async () => {
  await checkAndPostDueContent()
}, {
  scheduled: true,
  timezone: "Asia/Kolkata"
})

// Also run immediately on startup
checkAndPostDueContent()

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Shutting down auto-poster...')
  mongoose.connection.close()
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('🛑 Shutting down auto-poster...')
  mongoose.connection.close()
  process.exit(0)
})
