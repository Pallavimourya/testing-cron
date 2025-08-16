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
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

async function testManualTopics() {
  try {
    console.log('🧪 Testing Manual Topic Generation...');
    
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

    // Get latest story
    const latestStory = await GeneratedStory.findOne({ userId: testUser._id })
      .sort({ createdAt: -1 })
      .lean();

    if (!latestStory) {
      console.log('❌ No story found for user');
      return;
    }

    console.log('📚 Found latest story:', latestStory._id.toString());
    console.log('📊 Base Story Data:', latestStory.baseStoryData);
    console.log('🎨 Customization Data:', latestStory.customizationData);

    // Test different prompts
    const testPrompts = [
      "I want to share my experience in software development",
      "Help me create content about leadership in tech",
      "I need topics about career growth and learning",
      "Generate content ideas for networking and building connections"
    ];

    for (const prompt of testPrompts) {
      console.log(`\n🔍 Testing prompt: "${prompt}"`);
      
      // Create topic prompt
      const topicPrompt = createTopicPrompt(latestStory.baseStoryData, latestStory.customizationData, prompt);
      console.log('📝 Generated topic prompt for AI');
      
      // Generate topics
      const topics = generateFallbackTopics(prompt);
      console.log(`✅ Generated ${topics.length} topics:`);
      
      topics.forEach((topic, index) => {
        console.log(`   ${index + 1}. ${topic}`);
      });
    }

    console.log('\n🎉 Manual topic generation test completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

function createTopicPrompt(baseStoryData, customizationData, userPrompt) {
  const { name, industry, experience, achievement, challenge, learning, goal } = baseStoryData || {}
  const { tone, length, audience, focus } = customizationData || {}

  return `Based on the following professional profile and user's specific request, generate 5 engaging content topics:

**Professional Profile:**
- Name: ${name || "Professional"}
- Industry: ${industry || "business"}
- Experience: ${experience || "several years"}
- Achievement: ${achievement || "significant accomplishments"}
- Challenge: ${challenge || "overcoming obstacles"}
- Learning: ${learning || "key lessons learned"}
- Goal: ${goal || "professional growth"}

**Content Preferences:**
- Tone: ${tone || "professional"}
- Target Audience: ${audience || "professionals"}
- Focus Area: ${focus || "career journey"}

**User's Specific Request:**
${userPrompt}

Please generate 5 content topics that:
1. Align with the user's specific request
2. Incorporate elements from their professional profile
3. Match their content preferences (tone, audience, focus)
4. Are suitable for LinkedIn or professional networking
5. Are engaging and actionable

Make the topics specific, relevant, and valuable for the target audience.`
}

function generateFallbackTopics(prompt) {
  // Generate topics based on common patterns and the prompt
  const baseTopics = [
    "How to Apply Your Experience to New Challenges",
    "Lessons Learned from Professional Setbacks",
    "Building Authentic Connections in Your Industry",
    "The Power of Continuous Learning in Your Field",
    "Turning Your Unique Story into Content Gold",
    "Navigating Career Transitions with Confidence",
    "Sharing Your Expertise to Help Others Grow",
    "The Art of Storytelling in Professional Settings",
    "Leveraging Your Background for Maximum Impact",
    "Creating Content That Resonates with Your Audience"
  ]

  // Add some prompt-specific topics
  const promptTopics = [
    `Custom Topic Based on: ${prompt.substring(0, 50)}...`,
    `Personalized Content for: ${prompt.substring(0, 40)}...`,
    `Tailored Approach to: ${prompt.substring(0, 45)}...`,
    `Specific Strategy for: ${prompt.substring(0, 42)}...`,
    `Targeted Solution for: ${prompt.substring(0, 44)}...`
  ]

  // Return 5 topics mixing base and prompt-specific
  return [
    baseTopics[0],
    baseTopics[1],
    promptTopics[0],
    baseTopics[2],
    promptTopics[1]
  ]
}

testManualTopics();
