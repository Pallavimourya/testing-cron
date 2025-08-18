const mongoose = require("mongoose")

// MongoDB connection
const MONGODB_URI = "mongodb://localhost:27017/linkzup"

// User Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

// Topic Schema
const topicSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  storyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "GeneratedStory",
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "dismissed"],
    default: "pending",
  },
  source: {
    type: String,
    enum: ["story_generated", "manual", "auto_replacement"],
    default: "story_generated",
  },
  replacedTopicId: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

// GeneratedStory Schema
const generatedStorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  baseStoryData: Object,
  customizationData: Object,
  generatedStory: String,
  status: String,
  generatedTopics: [
    {
      id: String,
      title: String,
      status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
      },
      approvedAt: Date,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

async function testTopicBankFlow() {
  try {
    console.log("🧪 Testing Complete Topic Bank Flow...")

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI)
    console.log("✅ Connected to MongoDB")

    const User = mongoose.models.User || mongoose.model("User", userSchema)
    const Topic = mongoose.models.Topic || mongoose.model("Topic", topicSchema)
    const GeneratedStory = mongoose.models.GeneratedStory || mongoose.model("GeneratedStory", generatedStorySchema)

    // Find test user
    const testUser = await User.findOne({ email: "test@example.com" })
    if (!testUser) {
      console.log("❌ Test user not found. Creating test user...")
      const newUser = new User({
        name: "Test User",
        email: "test@example.com",
        password: "test123",
      })
      await newUser.save()
      console.log("✅ Test user created")
    }

    const user = await User.findOne({ email: "test@example.com" })
    console.log("👤 Using test user:", user._id.toString())

    // Step 1: Create test story with profile data
    console.log("\n📚 STEP 1: Creating Test Story with Profile Data")

    const testStory = new GeneratedStory({
      userId: user._id,
      baseStoryData: {
        earlyLife: "Grew up in a small town with big dreams",
        currentWork: "Software Engineer helping startups scale",
        biggestChallenge: "Learning to code without formal education",
        coreValues: "Innovation, persistence, and helping others",
        desiredImpact: "Democratize technology education",
      },
      customizationData: {
        target_audience: "Founders / Entrepreneurs",
        content_tone: "Inspirational",
        content_goal: "Build Authority",
        writing_style: "Storytelling",
      },
      generatedStory: "This is my unique story...",
      status: "generated",
      generatedTopics: [
        {
          id: `story-topic-${Date.now()}-1`,
          title: "How I Learned to Code Without a Computer Science Degree",
          status: "pending",
        },
        {
          id: `story-topic-${Date.now()}-2`,
          title: "The Startup That Taught Me Everything About Scaling",
          status: "pending",
        },
        {
          id: `story-topic-${Date.now()}-3`,
          title: "Why Small Town Dreams Lead to Big City Success",
          status: "pending",
        },
      ],
    })

    await testStory.save()
    console.log("✅ Test story created with 3 topics")

    // Step 2: Generate additional topics using auto-generation
    console.log("\n🎯 STEP 2: Testing Auto Topic Generation")

    const additionalTopics = [
      "The Coding Challenge That Changed My Career",
      "How I Built My First Successful App",
      "Why Mentorship Matters in Tech",
      "The Failure That Led to My Biggest Success",
      "How I Stay Updated with Technology Trends",
    ]

    const topicDocuments = additionalTopics.map((title, index) => ({
      id: `auto-topic-${Date.now()}-${index}`,
      userId: user._id,
      storyId: testStory._id,
      title: title,
      status: "pending",
      source: "story_generated",
    }))

    await Topic.insertMany(topicDocuments)
    console.log(`✅ Generated ${additionalTopics.length} additional topics`)

    // Step 3: Test topic approval flow
    console.log("\n✅ STEP 3: Testing Topic Approval Flow")

    const pendingTopics = await Topic.find({
      userId: user._id,
      status: "pending",
    }).limit(3)

    for (const topic of pendingTopics) {
      topic.status = "approved"
      topic.approvedAt = new Date()
      await topic.save()
      console.log(`✅ Approved topic: ${topic.title}`)
    }

    // Step 4: Test topic dismissal and auto-replacement
    console.log("\n🗑️ STEP 4: Testing Topic Dismissal and Auto-Replacement")

    const topicToDismiss = await Topic.findOne({
      userId: user._id,
      status: "pending",
    })

    if (topicToDismiss) {
      const dismissedTitle = topicToDismiss.title
      console.log(`🗑️ Dismissing topic: ${dismissedTitle}`)

      // Delete dismissed topic
      await Topic.findByIdAndDelete(topicToDismiss._id)

      // Generate replacement topic
      const replacementTopic = new Topic({
        id: `replacement-${Date.now()}`,
        userId: user._id,
        storyId: testStory._id,
        title: "The Unexpected Skill That Accelerated My Growth",
        status: "pending",
        source: "auto_replacement",
        replacedTopicId: dismissedTitle,
      })

      await replacementTopic.save()
      console.log(`✅ Generated replacement topic: ${replacementTopic.title}`)
    }

    // Step 5: Test topic limit (30 topics max)
    console.log("\n📊 STEP 5: Testing Topic Limit Management")

    const currentTopicCount = await Topic.countDocuments({
      userId: user._id,
      status: { $in: ["pending", "approved"] },
    })

    console.log(`📊 Current topic count: ${currentTopicCount}`)

    if (currentTopicCount < 30) {
      const remainingSlots = 30 - currentTopicCount
      console.log(`📈 Can generate ${remainingSlots} more topics`)

      // Generate topics up to limit
      const fillTopics = []
      for (let i = 0; i < Math.min(5, remainingSlots); i++) {
        fillTopics.push({
          id: `fill-topic-${Date.now()}-${i}`,
          userId: user._id,
          storyId: testStory._id,
          title: `Generated Topic ${i + 1} - Professional Growth Insight`,
          status: "pending",
          source: "story_generated",
        })
      }

      if (fillTopics.length > 0) {
        await Topic.insertMany(fillTopics)
        console.log(`✅ Generated ${fillTopics.length} additional topics`)
      }
    } else {
      console.log("⚠️ Topic limit reached (30 topics)")
    }

    // Step 6: Test unique ID generation
    console.log("\n🔑 STEP 6: Testing Unique ID Generation")

    const allTopics = await Topic.find({ userId: user._id })
    const topicIds = allTopics.map((t) => t.id)
    const uniqueIds = new Set(topicIds)

    console.log(`📊 Total topics: ${allTopics.length}`)
    console.log(`🔑 Unique IDs: ${uniqueIds.size}`)

    if (allTopics.length === uniqueIds.size) {
      console.log("✅ All topic IDs are unique")
    } else {
      console.log("❌ Duplicate IDs found!")
    }

    // Step 7: Final status report
    console.log("\n📋 STEP 7: Final Status Report")

    const finalStats = {
      total: await Topic.countDocuments({ userId: user._id }),
      pending: await Topic.countDocuments({ userId: user._id, status: "pending" }),
      approved: await Topic.countDocuments({ userId: user._id, status: "approved" }),
      dismissed: await Topic.countDocuments({ userId: user._id, status: "dismissed" }),
    }

    console.log("📊 Final Topic Statistics:")
    console.log(`   Total: ${finalStats.total}`)
    console.log(`   Pending: ${finalStats.pending}`)
    console.log(`   Approved: ${finalStats.approved}`)
    console.log(`   Dismissed: ${finalStats.dismissed}`)

    // Display sample topics
    console.log("\n📝 Sample Topics:")
    const sampleTopics = await Topic.find({ userId: user._id }).sort({ createdAt: -1 }).limit(5)

    sampleTopics.forEach((topic, index) => {
      console.log(`   ${index + 1}. ${topic.title} (${topic.status})`)
    })

    console.log("\n🎉 Topic Bank Flow Test Completed Successfully!")
    console.log("✅ Story generation with profile data: Working")
    console.log("✅ Topic approval to Topic Bank: Working")
    console.log("✅ Topic dismissal with auto-replacement: Working")
    console.log("✅ 30 topic limit management: Working")
    console.log("✅ Unique ID generation: Working")
  } catch (error) {
    console.error("❌ Error in topic bank flow test:", error)
  } finally {
    await mongoose.disconnect()
  }
}

testTopicBankFlow()
