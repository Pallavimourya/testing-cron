const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = 'mongodb://localhost:27017/linkzup';

// GeneratedStory Schema
const generatedStorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

async function checkStories() {
  try {
    console.log('🔍 Checking stories in database...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const GeneratedStory = mongoose.models.GeneratedStory || mongoose.model('GeneratedStory', generatedStorySchema);

    // Find all stories
    const stories = await GeneratedStory.find({}).sort({ createdAt: -1 });
    console.log(`📝 Found ${stories.length} total stories`);

    if (stories.length === 0) {
      console.log('❌ No stories found in database');
      return;
    }

    console.log('\n📊 Story Details:');
    stories.forEach((story, index) => {
      console.log(`\n${index + 1}. Story ID: ${story._id}`);
      console.log(`   Status: ${story.status}`);
      console.log(`   User ID: ${story.userId}`);
      console.log(`   Created: ${story.createdAt}`);
      console.log(`   Updated: ${story.updatedAt}`);
      console.log(`   Has Story: ${!!story.generatedStory}`);
      console.log(`   Story Length: ${story.generatedStory?.length || 0} characters`);
      console.log(`   Has Base Data: ${!!story.baseStoryData}`);
      console.log(`   Has Customization: ${!!story.customizationData}`);
    });

    // Group by status
    const statusCounts = {};
    stories.forEach(story => {
      statusCounts[story.status] = (statusCounts[story.status] || 0) + 1;
    });

    console.log('\n📈 Status Summary:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkStories();
