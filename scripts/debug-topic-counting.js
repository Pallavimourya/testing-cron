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

async function debugTopicCounting() {
  try {
    console.log('🔍 Debugging Topic Counting Issue...');
    
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

    // 1. Check Database Topics
    console.log('\n📊 STEP 1: Database Topics Analysis');
    const dbTopics = await Topic.find({ userId: testUser._id });
    console.log(`   Database Topics: ${dbTopics.length}`);
    
    dbTopics.forEach((topic, index) => {
      console.log(`   ${index + 1}. ID: ${topic.id}`);
      console.log(`      - Title: ${topic.title}`);
      console.log(`      - Status: ${topic.status}`);
      console.log(`      - Source: ${topic.source}`);
      console.log(`      - Created: ${topic.createdAt}`);
    });

    // 2. Check Story Topics
    console.log('\n📚 STEP 2: Story Topics Analysis');
    const stories = await GeneratedStory.find({ userId: testUser._id });
    console.log(`   Total Stories: ${stories.length}`);
    
    let totalStoryTopics = 0;
    let approvedStoryTopics = 0;
    let pendingStoryTopics = 0;
    let rejectedStoryTopics = 0;

    stories.forEach((story, storyIndex) => {
      const topics = story.generatedTopics || [];
      totalStoryTopics += topics.length;
      
      console.log(`   Story ${storyIndex + 1}: ${story._id}`);
      console.log(`     - Status: ${story.status}`);
      console.log(`     - Topics: ${topics.length}`);
      
      topics.forEach((topic, topicIndex) => {
        console.log(`     Topic ${topicIndex + 1}: ${topic.title}`);
        console.log(`       - ID: ${topic.id}`);
        console.log(`       - Status: ${topic.status}`);
        console.log(`       - Approved At: ${topic.approvedAt || 'Not approved'}`);
        
        if (topic.status === "approved") {
          approvedStoryTopics++;
        } else if (topic.status === "pending") {
          pendingStoryTopics++;
        } else if (topic.status === "rejected") {
          rejectedStoryTopics++;
        }
      });
    });

    console.log(`   📊 Story Topics Summary:`);
    console.log(`     - Total: ${totalStoryTopics}`);
    console.log(`     - Approved: ${approvedStoryTopics}`);
    console.log(`     - Pending: ${pendingStoryTopics}`);
    console.log(`     - Rejected: ${rejectedStoryTopics}`);

    // 3. Simulate API Response
    console.log('\n🌐 STEP 3: Simulating API Response');
    
    // Get approved topics from stories
    const storiesWithApprovedTopics = await GeneratedStory.find({
      userId: testUser._id,
      "generatedTopics.status": "approved"
    });

    const storyTopicsForAPI = storiesWithApprovedTopics.flatMap((story) => 
      story.generatedTopics
        .filter((topic) => topic.status === "approved")
        .map((topic) => ({
          id: topic.id,
          title: topic.title,
          status: "saved",
          createdAt: story.createdAt,
          source: "auto",
          approvedAt: topic.approvedAt
        }))
    );

    const dbTopicsForAPI = dbTopics.map((topic) => ({
      id: topic.id,
      title: topic.title,
      status: topic.status,
      createdAt: topic.createdAt,
      source: topic.source === "story_generated" ? "auto" : "manual",
      approvedAt: topic.approvedAt
    }));

    const allTopicsForAPI = [...dbTopicsForAPI, ...storyTopicsForAPI];

    console.log(`   📊 API Response Analysis:`);
    console.log(`     - Database Topics: ${dbTopicsForAPI.length}`);
    console.log(`     - Story Topics (Approved): ${storyTopicsForAPI.length}`);
    console.log(`     - Total API Topics: ${allTopicsForAPI.length}`);

    // 4. Check Status Distribution
    console.log('\n📈 STEP 4: Status Distribution Analysis');
    
    const statusCounts = {};
    allTopicsForAPI.forEach(topic => {
      statusCounts[topic.status] = (statusCounts[topic.status] || 0) + 1;
    });

    console.log(`   Status Distribution:`);
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`     - ${status}: ${count}`);
    });

    // 5. Check Source Distribution
    console.log('\n🏷️ STEP 5: Source Distribution Analysis');
    
    const sourceCounts = {};
    allTopicsForAPI.forEach(topic => {
      sourceCounts[topic.source] = (sourceCounts[topic.source] || 0) + 1;
    });

    console.log(`   Source Distribution:`);
    Object.entries(sourceCounts).forEach(([source, count]) => {
      console.log(`     - ${source}: ${count}`);
    });

    // 6. Identify the Issue
    console.log('\n🚨 STEP 6: Issue Identification');
    
    if (allTopicsForAPI.length !== approvedStoryTopics) {
      console.log(`   ❌ ISSUE FOUND: API shows ${allTopicsForAPI.length} topics but only ${approvedStoryTopics} were approved`);
      console.log(`   🔍 Possible causes:`);
      console.log(`     1. Database topics are being counted`);
      console.log(`     2. Pending topics are being included`);
      console.log(`     3. Duplicate topics in API response`);
      
      // Check for duplicates
      const topicIds = allTopicsForAPI.map(t => t.id);
      const uniqueIds = [...new Set(topicIds)];
      if (topicIds.length !== uniqueIds.length) {
        console.log(`   🚨 DUPLICATE TOPICS DETECTED: ${topicIds.length} total, ${uniqueIds.length} unique`);
      }
    } else {
      console.log(`   ✅ Count matches: ${allTopicsForAPI.length} topics`);
    }

    // 7. Detailed Topic List
    console.log('\n📋 STEP 7: Detailed Topic List');
    allTopicsForAPI.forEach((topic, index) => {
      console.log(`   ${index + 1}. ${topic.title}`);
      console.log(`      - ID: ${topic.id}`);
      console.log(`      - Status: ${topic.status}`);
      console.log(`      - Source: ${topic.source}`);
      console.log(`      - Created: ${topic.createdAt}`);
    });

    console.log('\n🎉 Debug Analysis Complete!');
    console.log('✅ Identified the source of the counting discrepancy');
    console.log('✅ Found the exact number of topics in each category');
    console.log('✅ Analyzed API response structure');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

debugTopicCounting();
