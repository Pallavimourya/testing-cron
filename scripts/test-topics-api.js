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

async function testTopicsAPI() {
  try {
    console.log('🧪 Testing Topics API...');
    
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

    // Check existing topics in database
    const dbTopics = await Topic.find({ userId: testUser._id });
    console.log(`📝 Found ${dbTopics.length} topics in database`);

    // Check stories with approved topics
    const stories = await GeneratedStory.find({
      userId: testUser._id,
      "generatedTopics.status": "approved"
    });
    console.log(`📚 Found ${stories.length} stories with approved topics`);

    // Extract approved topics from stories
    const storyTopics = stories.flatMap((story) => 
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

    console.log(`✅ Found ${storyTopics.length} approved topics from stories`);

    // Combine all topics
    const allTopics = [
      ...dbTopics.map((topic) => ({
        id: topic.id,
        title: topic.title,
        status: topic.status,
        createdAt: topic.createdAt,
        source: topic.source === "story_generated" ? "auto" : "manual",
        approvedAt: topic.approvedAt
      })),
      ...storyTopics
    ];

    console.log(`🎯 Total topics available: ${allTopics.length}`);

    if (allTopics.length > 0) {
      console.log('\n📋 Sample Topics:');
      allTopics.slice(0, 3).forEach((topic, index) => {
        console.log(`${index + 1}. ${topic.title} (${topic.source})`);
      });
    }

    // Create a test approved topic in a story if none exist
    if (storyTopics.length === 0) {
      console.log('\n🔧 Creating test approved topic...');
      
      const testStory = await GeneratedStory.findOne({ userId: testUser._id });
      if (testStory) {
        testStory.generatedTopics.push({
          id: `test-topic-${Date.now()}`,
          title: "Test Approved Topic from Story",
          status: "approved",
          approvedAt: new Date()
        });
        await testStory.save();
        console.log('✅ Added test approved topic to story');
      }
    }

    console.log('\n🎉 Topics API Test Completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testTopicsAPI();
