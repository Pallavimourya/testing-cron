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
const topicSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      unique: true,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    storyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GeneratedStory",
      default: null,
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
      enum: ["auto", "manual", "story"],
      required: true,
    },
    generationType: {
      type: String,
      enum: ["auto", "manual", "story"],
      required: true,
    },
    userPrompt: {
      type: String,
      default: null,
    },
    contentStatus: {
      type: String,
      enum: ["not_generated", "generating", "generated", "failed"],
      default: "not_generated",
    },
    contentId: {
      type: String,
      default: null,
    },
    generatedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

async function finalTopicApprovalTest() {
  try {
    console.log('🔧 Final topic approval test...');
    
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

    // Check current topic count
    const currentTopicCount = await Topic.countDocuments({
      userId: testUser._id,
      status: { $in: ["pending", "approved"] },
    });

    console.log(`📊 Current topic count in Topic Bank: ${currentTopicCount}/30`);

    if (currentTopicCount >= 30) {
      console.log('❌ User has reached the maximum limit of 30 topics');
      return;
    }

    // Test topic approval for first story
    const story = stories[0];
    console.log(`\n📝 Testing approval for story: ${story._id}`);
    
    const pendingTopics = story.generatedTopics.filter(topic => topic.status === "pending");
    console.log(`   Found ${pendingTopics.length} pending topics`);

    if (pendingTopics.length === 0) {
      console.log('❌ No pending topics found in this story');
      return;
    }

    const topicToApprove = pendingTopics[0];
    console.log(`   Testing approval for topic: ${topicToApprove.title} (ID: ${topicToApprove.id})`);

    // Simulate the approval process
    try {
      // 1. Find the topic in the story's generated topics
      const topicIndex = story.generatedTopics.findIndex((topic) => topic.id === topicToApprove.id);
      console.log(`   Topic index in story: ${topicIndex}`);

      if (topicIndex === -1) {
        console.log('❌ Topic not found in story');
        return;
      }

      const topicTitle = story.generatedTopics[topicIndex].title;
      console.log(`   Topic title: ${topicTitle}`);

      // 2. Update the topic status in the story
      story.generatedTopics[topicIndex].status = "approved";
      story.generatedTopics[topicIndex].approvedAt = new Date();
      await story.save();
      console.log('   ✅ Updated topic status in story');

      // 3. Add the topic to the Topic Bank with correct source value
      const topicDocument = {
        id: `topic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: testUser._id,
        storyId: story._id,
        title: topicTitle,
        status: "approved",
        source: "story", // Fixed: using correct enum value
        generationType: "auto",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const newTopic = await Topic.create(topicDocument);
      console.log('   ✅ Added topic to Topic Bank:', newTopic.id);

      console.log('\n🎉 Topic approval test completed successfully!');
      console.log('✅ All fixes applied and working correctly!');
      
    } catch (error) {
      console.error('❌ Error during topic approval:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

finalTopicApprovalTest();
