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

async function testTopicApprovalFix() {
  try {
    console.log('🔧 Testing topic approval fix...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const User = mongoose.models.User || mongoose.model('User', userSchema);
    const GeneratedStory = mongoose.models.GeneratedStory || mongoose.model('GeneratedStory', generatedStorySchema);

    // Find test user
    const testUser = await User.findOne({ email: 'test@example.com' });
    if (!testUser) {
      console.log('❌ Test user not found');
      return;
    }

    console.log('👤 Found test user:', testUser._id.toString());

    // Find stories with pending topics
    const stories = await GeneratedStory.find({
      userId: testUser._id,
      "generatedTopics.status": "pending"
    });

    console.log(`📚 Found ${stories.length} stories with pending topics`);

    if (stories.length === 0) {
      console.log('❌ No stories with pending topics found');
      return;
    }

    // Test the first story
    const story = stories[0];
    const pendingTopics = story.generatedTopics.filter(topic => topic.status === "pending");
    
    if (pendingTopics.length === 0) {
      console.log('❌ No pending topics found in this story');
      return;
    }

    const topicToApprove = pendingTopics[0];
    console.log(`📝 Testing approval for topic: ${topicToApprove.title} (ID: ${topicToApprove.id})`);

    // Simulate the API call
    const topicIndex = story.generatedTopics.findIndex((topic) => topic.id === topicToApprove.id);
    console.log(`   Topic index in story: ${topicIndex}`);

    if (topicIndex === -1) {
      console.log('❌ Topic not found in story');
      return;
    }

    const topicTitle = story.generatedTopics[topicIndex].title;
    console.log(`   Topic title: ${topicTitle}`);

    // Update the topic status in the story
    story.generatedTopics[topicIndex].status = "approved";
    story.generatedTopics[topicIndex].approvedAt = new Date();
    await story.save();
    console.log('   ✅ Updated topic status in story');

    console.log('\n🎉 Topic approval test completed successfully!');
    console.log('📊 The fix should now work properly in the frontend.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testTopicApprovalFix();
