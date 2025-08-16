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

async function testAIStoryGeneration() {
  try {
    console.log('🧪 Testing AI Story Generation...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const User = mongoose.models.User || mongoose.model('User', userSchema);
    const GeneratedStory = mongoose.models.GeneratedStory || mongoose.model('GeneratedStory', generatedStorySchema);

    // Find or create test user
    let testUser = await User.findOne({ email: 'test@example.com' });
    if (!testUser) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      testUser = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword
      });
      console.log('👤 Created test user:', testUser._id.toString());
    } else {
      console.log('👤 Found test user:', testUser._id.toString());
    }

    // Test case 1: Professional story
    console.log('\n📝 Test Case 1: Professional Story');
    const baseStoryData1 = {
      name: "Sarah Johnson",
      industry: "Technology",
      experience: "8 years",
      achievement: "Led a team of 15 developers to deliver a major software project that increased company revenue by 40%",
      challenge: "Managing a diverse team with conflicting priorities and tight deadlines",
      learning: "Effective communication and clear goal-setting are crucial for team success",
      goal: "Become a technology leader who mentors others and drives innovation"
    };

    const customizationData1 = {
      tone: "professional",
      length: "medium",
      audience: "professionals",
      focus: "leadership"
    };

    await testStoryGeneration(testUser._id, baseStoryData1, customizationData1, "Professional");

    // Test case 2: Personal story
    console.log('\n📝 Test Case 2: Personal Story');
    const baseStoryData2 = {
      name: "Mike Chen",
      industry: "Healthcare",
      experience: "12 years",
      achievement: "Developed a patient care protocol that reduced recovery time by 30%",
      challenge: "Balancing patient care with administrative responsibilities",
      learning: "Empathy and patient-centered care lead to better health outcomes",
      goal: "Improve healthcare accessibility for underserved communities"
    };

    const customizationData2 = {
      tone: "personal",
      length: "long",
      audience: "peers",
      focus: "career journey"
    };

    await testStoryGeneration(testUser._id, baseStoryData2, customizationData2, "Personal");

    // Test case 3: Casual story
    console.log('\n📝 Test Case 3: Casual Story');
    const baseStoryData3 = {
      name: "Alex Rivera",
      industry: "Marketing",
      experience: "5 years",
      achievement: "Increased social media engagement by 200% for a major brand",
      challenge: "Adapting to rapidly changing digital marketing trends",
      learning: "Creativity and data-driven decisions work best together",
      goal: "Build a creative agency that helps small businesses grow"
    };

    const customizationData3 = {
      tone: "casual",
      length: "short",
      audience: "clients",
      focus: "innovation"
    };

    await testStoryGeneration(testUser._id, baseStoryData3, customizationData3, "Casual");

    console.log('\n🎉 All AI story generation tests completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

async function testStoryGeneration(userId, baseStoryData, customizationData, testName) {
  try {
    console.log(`🔍 Testing ${testName} story generation...`);

    // Create the prompt for ChatGPT
    const prompt = createStoryPrompt(baseStoryData, customizationData);
    console.log('📋 Generated prompt for ChatGPT');
    
    // For testing, we'll use a fallback story since we don't have OpenAI API key
    const story = generateFallbackStory(baseStoryData, customizationData);
    console.log('✅ Generated story using fallback method');

    // Find existing story or create new one
    let existingStory = await mongoose.models.GeneratedStory.findOne({ userId });
    
    if (existingStory) {
      // Update existing story
      existingStory = await mongoose.models.GeneratedStory.findOneAndUpdate(
        { userId },
        {
          baseStoryData,
          customizationData,
          generatedStory: story,
          status: "generated",
          updatedAt: new Date()
        },
        { new: true }
      );
      console.log(`✅ Updated existing story for ${testName}:`, existingStory._id.toString());
    } else {
      // Create new story
      existingStory = await mongoose.models.GeneratedStory.create({
        userId,
        baseStoryData,
        customizationData,
        generatedStory: story,
        status: "generated"
      });
      console.log(`✅ Created new story for ${testName}:`, existingStory._id.toString());
    }

    console.log(`📊 Story Details for ${testName}:`);
    console.log(`   - Length: ${story.length} characters`);
    console.log(`   - Tone: ${customizationData.tone}`);
    console.log(`   - Focus: ${customizationData.focus}`);
    console.log(`   - Status: ${existingStory.status}`);

  } catch (error) {
    console.error(`❌ Error in ${testName} test:`, error);
  }
}

function createStoryPrompt(baseStoryData, customizationData) {
  const { name, industry, experience, achievement, challenge, learning, goal } = baseStoryData;
  const { tone, length, audience, focus } = customizationData;

  return `Create a professional story based on the following details:

**Base Story Data:**
- Name: ${name}
- Industry: ${industry}
- Experience: ${experience}
- Achievement: ${achievement}
- Challenge: ${challenge}
- Learning: ${learning}
- Goal: ${goal}

**Customization Preferences:**
- Tone: ${tone}
- Length: ${length}
- Target Audience: ${audience}
- Focus Area: ${focus}

Please create a compelling professional story that:
1. Uses a ${tone} tone
2. Is ${length} in length
3. Targets ${audience} audience
4. Focuses on ${focus}
5. Incorporates all the base story elements naturally
6. Sounds authentic and personal
7. Is suitable for LinkedIn or professional networking

Make it engaging and memorable while maintaining professionalism.`;
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

testAIStoryGeneration();
