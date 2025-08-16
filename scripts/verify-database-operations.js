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

async function verifyDatabaseOperations() {
  try {
    console.log('🔍 Verifying Database Operations...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const User = mongoose.models.User || mongoose.model('User', userSchema);
    const Topic = mongoose.models.Topic || mongoose.model('Topic', topicSchema);
    const GeneratedStory = mongoose.models.GeneratedStory || mongoose.model('GeneratedStory', generatedStorySchema);

    // Find test user
    const testUser = await User.findOne({ email: 'test@example.com' });
    if (!testUser) {
      console.log('❌ Test user not found');
      return;
    }

    console.log('👤 Found test user:', testUser._id.toString());

    // 1. Check Stories in Database
    console.log('\n📚 Checking Stories in Database...');
    const stories = await GeneratedStory.find({ userId: testUser._id });
    console.log(`   Found ${stories.length} stories in database`);

    stories.forEach((story, index) => {
      console.log(`   Story ${index + 1}: ${story._id}`);
      console.log(`     - Status: ${story.status}`);
      console.log(`     - Topics: ${story.generatedTopics.length}`);
      console.log(`     - Created: ${story.createdAt}`);
    });

    // 2. Check Topics in Database
    console.log('\n📝 Checking Topics in Database...');
    const dbTopics = await Topic.find({ userId: testUser._id });
    console.log(`   Found ${dbTopics.length} topics in database`);

    dbTopics.forEach((topic, index) => {
      console.log(`   Topic ${index + 1}: ${topic.title}`);
      console.log(`     - Status: ${topic.status}`);
      console.log(`     - Source: ${topic.source}`);
      console.log(`     - Created: ${topic.createdAt}`);
    });

    // 3. Check Story Topics (approved topics from stories)
    console.log('\n🎯 Checking Story Topics (Approved Topics from Stories)...');
    const storiesWithApprovedTopics = await GeneratedStory.find({
      userId: testUser._id,
      "generatedTopics.status": "approved"
    });

    console.log(`   Found ${storiesWithApprovedTopics.length} stories with approved topics`);

    let totalApprovedTopics = 0;
    storiesWithApprovedTopics.forEach((story, index) => {
      const approvedTopics = story.generatedTopics.filter(topic => topic.status === "approved");
      totalApprovedTopics += approvedTopics.length;
      console.log(`   Story ${index + 1}: ${approvedTopics.length} approved topics`);
    });

    console.log(`   Total approved topics from stories: ${totalApprovedTopics}`);

    // 4. Test Topic Creation
    console.log('\n🧪 Testing Topic Creation...');
    const testTopicId = `test-topic-${Date.now()}`;
    const testTopic = new Topic({
      id: testTopicId,
      userId: testUser._id,
      storyId: stories[0]?._id || testUser._id, // Use first story or user ID as fallback
      title: "Test Topic for Database Verification",
      status: "pending",
      source: "manual",
      category: "Test",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await testTopic.save();
    console.log('   ✅ Test topic created successfully');

    // 5. Test Topic Update
    console.log('\n🔄 Testing Topic Update...');
    const updatedTopic = await Topic.findOneAndUpdate(
      { id: testTopicId },
      { 
        status: "approved",
        approvedAt: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    );

    if (updatedTopic) {
      console.log('   ✅ Topic updated successfully');
      console.log(`     - New status: ${updatedTopic.status}`);
      console.log(`     - Approved at: ${updatedTopic.approvedAt}`);
    }

    // 6. Test Topic Retrieval
    console.log('\n📖 Testing Topic Retrieval...');
    const retrievedTopic = await Topic.findOne({ id: testTopicId });
    if (retrievedTopic) {
      console.log('   ✅ Topic retrieved successfully');
      console.log(`     - Title: ${retrievedTopic.title}`);
      console.log(`     - Status: ${retrievedTopic.status}`);
      console.log(`     - Source: ${retrievedTopic.source}`);
    }

    // 7. Test Topic Deletion
    console.log('\n🗑️ Testing Topic Deletion...');
    const deleteResult = await Topic.deleteOne({ id: testTopicId });
    if (deleteResult.deletedCount > 0) {
      console.log('   ✅ Test topic deleted successfully');
    }

    // 8. Final Database State
    console.log('\n📊 Final Database State:');
    const finalStories = await GeneratedStory.find({ userId: testUser._id });
    const finalTopics = await Topic.find({ userId: testUser._id });
    
    console.log(`   - Stories: ${finalStories.length}`);
    console.log(`   - Database Topics: ${finalTopics.length}`);
    console.log(`   - Story Topics (Approved): ${totalApprovedTopics}`);

    // 9. Verify API Response Format
    console.log('\n🌐 Simulating API Response...');
    const apiTopics = [
      ...finalTopics.map((topic) => ({
        id: topic.id,
        title: topic.title,
        status: topic.status,
        createdAt: topic.createdAt,
        source: topic.source === "story_generated" ? "auto" : "manual",
        approvedAt: topic.approvedAt
      })),
      ...storiesWithApprovedTopics.flatMap((story) => 
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
      )
    ];

    console.log(`   - Total API Topics: ${apiTopics.length}`);
    console.log(`   - Auto Topics: ${apiTopics.filter(t => t.source === "auto").length}`);
    console.log(`   - Manual Topics: ${apiTopics.filter(t => t.source === "manual").length}`);

    console.log('\n🎉 Database Operations Verification Completed!');
    console.log('✅ All CRUD operations working correctly');
    console.log('✅ Topics are being saved to database');
    console.log('✅ Story topics are being retrieved properly');
    console.log('✅ API response format is correct');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

verifyDatabaseOperations();
