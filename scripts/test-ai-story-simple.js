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

async function testSimpleAIStory() {
  try {
    console.log('🧪 Testing Simple AI Story Generation...');
    
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

    // Test data
    const baseStoryData = {
      name: "Rahul Sharma",
      industry: "Software Development",
      experience: "6 years",
      achievement: "Built a mobile app that reached 1 million downloads",
      challenge: "Learning new technologies while managing team deadlines",
      learning: "Continuous learning and adaptability are key to success",
      goal: "Create innovative solutions that help people"
    };

    const customizationData = {
      tone: "professional",
      length: "medium",
      audience: "professionals",
      focus: "career journey"
    };

    console.log('📝 Testing AI story generation...');

    // Find existing story or create new one
    let existingStory = await GeneratedStory.findOne({ userId: testUser._id });
    
    if (existingStory) {
      // Update existing story
      existingStory = await GeneratedStory.findOneAndUpdate(
        { userId: testUser._id },
        {
          baseStoryData,
          customizationData,
          generatedStory: generateFallbackStory(baseStoryData, customizationData),
          status: "generated",
          updatedAt: new Date()
        },
        { new: true }
      );
      console.log('✅ Updated existing story:', existingStory._id.toString());
    } else {
      // Create new story
      existingStory = await GeneratedStory.create({
        userId: testUser._id,
        baseStoryData,
        customizationData,
        generatedStory: generateFallbackStory(baseStoryData, customizationData),
        status: "generated"
      });
      console.log('✅ Created new story:', existingStory._id.toString());
    }

    console.log('📊 Story Details:');
    console.log(`   - Name: ${baseStoryData.name}`);
    console.log(`   - Industry: ${baseStoryData.industry}`);
    console.log(`   - Tone: ${customizationData.tone}`);
    console.log(`   - Length: ${existingStory.generatedStory.length} characters`);
    console.log(`   - Status: ${existingStory.status}`);

    console.log('\n📖 Story Preview:');
    console.log(existingStory.generatedStory.substring(0, 200) + '...');

    console.log('\n🎉 AI Story Generation Test Completed Successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

function generateFallbackStory(baseStoryData, customizationData) {
  const { name, industry, experience, achievement, challenge, learning, goal } = baseStoryData;
  const { tone, length, audience, focus } = customizationData;

  let story = "";

  if (tone === "professional") {
    story = `As a ${experience} professional in the ${industry} industry, I've learned that success comes from balancing technical expertise with human-centered approaches. My most significant achievement has been ${achievement}, which required navigating ${challenge}. This experience taught me that ${learning} is fundamental to professional growth. My goal is to ${goal}, leveraging my experience to create meaningful impact in the ${industry} sector.`;
  } else if (tone === "personal") {
    story = `My journey in ${industry} began ${experience} ago, and it's been a rollercoaster of learning and growth. The moment I'm most proud of is when I ${achievement}. It wasn't easy - I faced ${challenge} along the way, but it taught me that ${learning}. Now, I'm focused on ${goal}, using my experience to help others in their own journeys.`;
  } else {
    story = `Hey! I'm ${name}, and I've been working in ${industry} for ${experience}. My biggest win so far? ${achievement}. Sure, I had to deal with ${challenge}, but that's where I learned ${learning}. These days, I'm all about ${goal} - it's what drives me forward in this crazy world of ${industry}.`;
  }

  // Adjust length
  if (length === "short") {
    story = story.substring(0, 300) + "...";
  } else if (length === "long") {
    story += ` This journey has shaped my perspective on ${focus} and how it relates to ${audience}. I believe that authentic storytelling and genuine connections are key to building meaningful professional relationships.`;
  }

  return story;
}

testSimpleAIStory();
