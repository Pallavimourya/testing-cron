const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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

async function updateStoryUser() {
  try {
    console.log('🔧 Updating story user IDs...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const User = mongoose.models.User || mongoose.model('User', userSchema);
    const GeneratedStory = mongoose.models.GeneratedStory || mongoose.model('GeneratedStory', generatedStorySchema);

    // Find the test user
    const testUser = await User.findOne({ email: 'test@example.com' });
    if (!testUser) {
      console.log('❌ Test user not found');
      return;
    }

    console.log('👤 Found test user:', testUser._id.toString());

    // Find all stories
    const stories = await GeneratedStory.find({});
    console.log(`📝 Found ${stories.length} stories`);

    if (stories.length === 0) {
      console.log('❌ No stories found');
      return;
    }

    // Update all stories to belong to the test user
    for (const story of stories) {
      await GeneratedStory.findByIdAndUpdate(story._id, {
        userId: testUser._id,
        updatedAt: new Date()
      });
      console.log(`✅ Updated story ${story._id} to user ${testUser._id}`);
    }

    console.log('🎉 All stories updated successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

updateStoryUser();
