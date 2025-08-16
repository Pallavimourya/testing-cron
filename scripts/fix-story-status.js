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

async function fixStoryStatus() {
  try {
    console.log('🔧 Fixing story status...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const GeneratedStory = mongoose.models.GeneratedStory || mongoose.model('GeneratedStory', generatedStorySchema);

    // Find all stories with "generating" status
    const stories = await GeneratedStory.find({ status: "generating" });
    console.log(`📝 Found ${stories.length} stories with "generating" status`);

    if (stories.length === 0) {
      console.log('✅ No stories need fixing');
      return;
    }

    // Update all stories to "generated" status
    for (const story of stories) {
      await GeneratedStory.findByIdAndUpdate(story._id, {
        status: "generated",
        updatedAt: new Date()
      });
      console.log(`✅ Updated story ${story._id} to "generated" status`);
    }

    console.log('🎉 All stories fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixStoryStatus();
