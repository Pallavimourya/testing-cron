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

async function addSampleTopics() {
  try {
    console.log('🔧 Adding sample topics to stories...');
    
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

    // Find stories
    const stories = await GeneratedStory.find({ userId: testUser._id });
    console.log(`📚 Found ${stories.length} stories`);

    if (stories.length === 0) {
      console.log('❌ No stories found');
      return;
    }

    // Sample topics for different industries
    const sampleTopics = [
      "5 Lessons I Learned from My Biggest Career Challenge",
      "Why Your First Job Teaches You More Than Any Degree",
      "The Mentor Who Changed My Perspective on Success",
      "How I Turned My Biggest Failure into My Greatest Strength",
      "The Industry Myth That's Holding You Back",
      "Building a Team That Actually Works Together",
      "The Power of Continuous Learning in Tech",
      "From Developer to Leader: My Journey",
      "Why Soft Skills Matter More Than Technical Skills",
      "The Art of Problem Solving in Software Development"
    ];

    // Add topics to each story
    for (const story of stories) {
      console.log(`\n📝 Adding topics to story: ${story._id}`);
      
      // Add 5 sample topics to each story
      for (let i = 0; i < 5; i++) {
        const topicId = `topic-${story._id}-${i}-${Date.now()}`;
        const topicTitle = sampleTopics[i % sampleTopics.length];
        
        story.generatedTopics.push({
          id: topicId,
          title: topicTitle,
          status: "pending",
          approvedAt: null
        });
        
        console.log(`   ➕ Added: ${topicTitle}`);
      }

      await story.save();
      console.log(`   💾 Saved ${story.generatedTopics.length} topics to story`);
    }

    console.log('\n🎉 Sample topics added successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

addSampleTopics();
