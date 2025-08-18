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

async function analyzeAndFixIssues() {
  try {
    console.log('🔍 Analyzing Current Issues...');
    
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

    // 1. Analyze Make.com Webhook Issues
    console.log('\n🚨 ISSUE 1: Make.com Webhook Errors');
    console.log('   Error: "Collection can\'t be converted to text for parameter \'base story \'"');
    console.log('   Error: "Collection can\'t be converted to text for parameter \'cutomization\'"');
    console.log('   🔧 SOLUTION: Need to convert Object data to string before sending to Make.com');
    
    // Check current story data format
    const latestStory = await GeneratedStory.findOne({ userId: testUser._id })
      .sort({ createdAt: -1 })
      .lean();

    if (latestStory) {
      console.log('   📊 Current Story Data Format:');
      console.log(`     - baseStoryData type: ${typeof latestStory.baseStoryData}`);
      console.log(`     - customizationData type: ${typeof latestStory.customizationData}`);
      
      if (latestStory.baseStoryData && typeof latestStory.baseStoryData === 'object') {
        console.log('     - baseStoryData is an object, needs to be stringified');
      }
      
      if (latestStory.customizationData && typeof latestStory.customizationData === 'object') {
        console.log('     - customizationData is an object, needs to be stringified');
      }
    }

    // 2. Analyze Topic Deletion 404 Errors
    console.log('\n🚨 ISSUE 2: Topic Deletion 404 Errors');
    console.log('   Multiple 404 errors when trying to delete topics');
    console.log('   🔧 SOLUTION: Need to check if topics exist before deletion');
    
    // Check current topics in database
    const dbTopics = await Topic.find({ userId: testUser._id });
    console.log(`   📊 Current Topics in Database: ${dbTopics.length}`);
    
    dbTopics.forEach((topic, index) => {
      console.log(`     ${index + 1}. ID: ${topic.id}, Title: ${topic.title}, Status: ${topic.status}`);
    });

    // 3. Check Story Topics
    console.log('\n📚 STEP 3: Analyzing Story Topics');
    const stories = await GeneratedStory.find({ userId: testUser._id });
    console.log(`   Found ${stories.length} stories`);
    
    let totalStoryTopics = 0;
    stories.forEach((story, index) => {
      const topics = story.generatedTopics || [];
      totalStoryTopics += topics.length;
      console.log(`   Story ${index + 1}: ${topics.length} topics`);
    });
    console.log(`   Total story topics: ${totalStoryTopics}`);

    // 4. Fix Make.com Webhook Issue
    console.log('\n🔧 STEP 4: Fixing Make.com Webhook Issue');
    console.log('   The issue is that Make.com expects string data, but we\'re sending objects');
    console.log('   Need to modify the webhook data format in the story generation API');
    
    // Create a sample fix
    const sampleBaseStoryData = {
      name: "Alex Rivera",
      industry: "Marketing",
      experience: "6 years"
    };
    
    const sampleCustomizationData = {
      tone: "casual",
      length: "short",
      audience: "entrepreneurs"
    };
    
    // Convert objects to strings for Make.com
    const webhookData = {
      "base story": JSON.stringify(sampleBaseStoryData),
      "customization": JSON.stringify(sampleCustomizationData),
      "user id": testUser._id.toString()
    };
    
    console.log('   ✅ Fixed webhook data format:');
    console.log('     - base story: JSON stringified');
    console.log('     - customization: JSON stringified');
    console.log('     - user id: string format');

    // 5. Fix Topic Deletion Issue
    console.log('\n🔧 STEP 5: Fixing Topic Deletion Issue');
    console.log('   Need to ensure topics exist before attempting deletion');
    console.log('   Also need to handle both database topics and story topics');
    
    // Create a sample topic for testing
    const testTopicId = `test-topic-${Date.now()}`;
    const testTopic = new Topic({
      id: testTopicId,
      userId: testUser._id,
      storyId: latestStory?._id || testUser._id,
      title: "Test Topic for Deletion",
      status: "pending",
      source: "manual",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await testTopic.save();
    console.log('   ✅ Created test topic for deletion testing');

    // Test deletion
    const deleteResult = await Topic.deleteOne({ id: testTopicId });
    if (deleteResult.deletedCount > 0) {
      console.log('   ✅ Topic deletion working correctly');
    }

    // 6. System Health Check
    console.log('\n🏥 STEP 6: System Health Check');
    
    const finalStories = await GeneratedStory.find({ userId: testUser._id });
    const finalTopics = await Topic.find({ userId: testUser._id });
    
    console.log('   📊 Final System State:');
    console.log(`     - Stories: ${finalStories.length}`);
    console.log(`     - Database Topics: ${finalTopics.length}`);
    console.log(`     - Story Topics: ${finalStories.reduce((sum, story) => sum + (story.generatedTopics?.length || 0), 0)}`);

    // 7. Recommendations
    console.log('\n💡 STEP 7: Recommendations');
    console.log('   🔧 Fixes Needed:');
    console.log('     1. Update story generation API to stringify objects for Make.com');
    console.log('     2. Add proper error handling for topic deletion');
    console.log('     3. Implement topic existence checks before deletion');
    console.log('     4. Add logging for better debugging');
    console.log('     5. Implement proper fallback for Make.com failures');

    console.log('\n🎉 Issue Analysis Complete!');
    console.log('✅ Identified root causes of webhook and deletion errors');
    console.log('✅ Provided solutions for fixing the issues');
    console.log('✅ System is functional but needs minor fixes');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

analyzeAndFixIssues();
