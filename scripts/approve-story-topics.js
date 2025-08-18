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

async function approveStoryTopics() {
  try {
    console.log('🔧 Approving story topics...');
    
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

    // Approve some topics from each story
    for (const story of stories) {
      console.log(`\n📝 Processing story: ${story._id}`);
      
      const pendingTopics = story.generatedTopics.filter(topic => topic.status === "pending");
      console.log(`   Found ${pendingTopics.length} pending topics`);

      // Approve first 2 topics from each story
      let approvedCount = 0;
      for (let i = 0; i < Math.min(2, pendingTopics.length); i++) {
        const topicIndex = story.generatedTopics.findIndex(t => t.id === pendingTopics[i].id);
        if (topicIndex !== -1) {
          story.generatedTopics[topicIndex].status = "approved";
          story.generatedTopics[topicIndex].approvedAt = new Date();
          approvedCount++;
          console.log(`   ✅ Approved: ${pendingTopics[i].title}`);
        }
      }

      if (approvedCount > 0) {
        await story.save();
        console.log(`   💾 Saved ${approvedCount} approved topics`);
      }
    }

    console.log('\n🎉 Story topics approval completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

approveStoryTopics();
