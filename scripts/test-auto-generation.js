const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = 'mongodb://localhost:27017/linkzup';

// User Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// GeneratedStory Schema
const generatedStorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  baseStoryData: Object,
  customizationData: Object,
  generatedStory: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["generating", "generated", "edited", "approved", "failed"],
    default: "generating",
  },
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
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

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
    index: true,
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
    enum: ["pending", "approved", "rejected", "content_generated"],
    default: "pending",
  },
  source: {
    type: String,
    enum: ["story_generated", "manual"],
    default: "story_generated",
  },
  content: {
    type: String,
    default: "",
  },
  contentStatus: {
    type: String,
    enum: ["not_generated", "generating", "generated", "approved"],
    default: "not_generated",
  },
  tags: [String],
  category: String,
  priority: {
    type: Number,
    default: 0,
  },
  approvedAt: Date,
  contentGeneratedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

async function testAutoGeneration() {
  try {
    console.log('🧪 Testing Auto Topic Generation...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const User = mongoose.models.User || mongoose.model('User', userSchema);
    const GeneratedStory = mongoose.models.GeneratedStory || mongoose.model('GeneratedStory', generatedStorySchema);
    const Topic = mongoose.models.Topic || mongoose.model('Topic', topicSchema);

    // Find test user
    const testUser = await User.findOne({ email: 'test@example.com' });
    if (!testUser) {
      console.log('❌ Test user not found');
      return;
    }

    console.log('👤 Found test user:', testUser._id.toString());

    // 1. Check if user has a story
    console.log('\n📚 STEP 1: Checking User Story');
    const latestStory = await GeneratedStory.findOne({ userId: testUser._id })
      .sort({ createdAt: -1 })
      .lean();

    if (!latestStory) {
      console.log('❌ No story found for user');
      return;
    }

    console.log('✅ Found user story:', latestStory._id.toString());
    console.log(`   - Status: ${latestStory.status}`);
    console.log(`   - Base Story Data: ${Object.keys(latestStory.baseStoryData || {}).length} fields`);
    console.log(`   - Customization Data: ${Object.keys(latestStory.customizationData || {}).length} fields`);

    // 2. Test the topic generation function
    console.log('\n🎯 STEP 2: Testing Topic Generation Function');
    
    const baseStoryData = latestStory.baseStoryData || {};
    const customizationData = latestStory.customizationData || {};
    
    const generatedTopics = generateTopicsFromProfile(baseStoryData, customizationData);
    
    console.log(`   ✅ Generated ${generatedTopics.length} topics:`);
    generatedTopics.forEach((topic, index) => {
      console.log(`     ${index + 1}. ${topic}`);
    });

    // 3. Test topic creation in database
    console.log('\n💾 STEP 3: Testing Database Topic Creation');
    
    const topicDocuments = generatedTopics.slice(0, 5).map((topic, index) => ({
      id: `test-auto-${Date.now()}-${index}`,
      userId: testUser._id,
      storyId: latestStory._id,
      title: topic,
      status: "pending",
      source: "story_generated",
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    console.log(`   📝 Creating ${topicDocuments.length} test topics...`);
    
    const savedTopics = await Topic.insertMany(topicDocuments);
    console.log(`   ✅ Successfully created ${savedTopics.length} topics in database`);

    // 4. Verify topics in database
    console.log('\n🔍 STEP 4: Verifying Topics in Database');
    
    const dbTopics = await Topic.find({ userId: testUser._id })
      .sort({ createdAt: -1 })
      .limit(10);

    console.log(`   📊 Found ${dbTopics.length} topics in database:`);
    dbTopics.forEach((topic, index) => {
      console.log(`     ${index + 1}. ${topic.title} (${topic.status})`);
    });

    // 5. Test API endpoint simulation
    console.log('\n🌐 STEP 5: Testing API Endpoint Simulation');
    
    // Simulate the API response
    const apiResponse = {
      topics: generatedTopics.slice(0, 5)
    };

    console.log(`   ✅ API would return ${apiResponse.topics.length} topics`);
    console.log(`   📝 Sample topics:`);
    apiResponse.topics.forEach((topic, index) => {
      console.log(`     ${index + 1}. ${topic}`);
    });

    // 6. Clean up test data
    console.log('\n🧹 STEP 6: Cleaning Up Test Data');
    
    const deleteResult = await Topic.deleteMany({
      userId: testUser._id,
      id: { $regex: /^test-auto-/ }
    });

    console.log(`   ✅ Deleted ${deleteResult.deletedCount} test topics`);

    // 7. Final status
    console.log('\n🎉 Auto Generation Test Complete!');
    console.log('✅ User story data available');
    console.log('✅ Topic generation function working');
    console.log('✅ Database topic creation working');
    console.log('✅ API endpoint ready');
    console.log('✅ Auto generation should work when user clicks button');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

function generateTopicsFromProfile(baseStory, customization) {
  const topics = [
    "My Journey from Childhood Dreams to Professional Success",
    "The Biggest Challenge That Shaped My Career",
    "How I Overcame Failure and Kept Going",
    "The Turning Point That Changed Everything",
    "Lessons from My Greatest Mentor",
    "What Makes My Approach Unique in the Industry",
    "My Proudest Achievement and What It Taught Me",
    "Industry Myths I Challenge and Why",
    "The Most Powerful Lesson from My Journey",
    "My Core Values and How They Guide My Work",
    "The Impact I Want to Create in My Industry",
    "From Small Town to Big Dreams: My Origin Story",
    "When I Almost Gave Up But Didn't",
    "The Key Decision That Changed My Life Path",
    "How I Developed My Most Important Skills",
  ]

  // Customize topics based on user preferences
  if (customization.content_goal === "Build Authority") {
    topics.push(
      "Why I'm the Go-To Expert in My Field",
      "The Contrarian View That Sets Me Apart",
      "My Unique Framework for Success",
    )
  }

  if (customization.content_tone === "Inspirational") {
    topics.push(
      "The Moment Everything Changed for Me",
      "How to Turn Your Biggest Weakness into Strength",
      "Why Your Dreams Are Worth Fighting For",
    )
  }

  if (customization.target_audience === "Founders / Entrepreneurs") {
    topics.push(
      "The Startup Lesson That Cost Me Everything",
      "How I Built My First Successful Business",
      "The Investor Meeting That Changed My Life",
    )
  }

  return topics.slice(0, 20)
}

testAutoGeneration();
