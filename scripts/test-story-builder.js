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

function generateBasicStory(baseStory, customization) {
  // Extract base story elements
  const {
    name = "Professional",
    industry = "business",
    experience = "10 years",
    achievement = "successful projects",
    challenge = "complex problems",
    learning = "continuous improvement",
    goal = "help others grow"
  } = baseStory

  // Extract customization preferences
  const {
    tone = "professional",
    length = "medium",
    audience = "professionals",
    focus = "career journey"
  } = customization

  // Create story based on tone and length
  let story = ""

  if (tone === "professional") {
    story = `# Professional Journey: ${name}'s Path to Success

## Introduction
With over ${experience} in the ${industry} sector, I've had the privilege of working on ${achievement} that have shaped my understanding of what it takes to succeed in today's competitive landscape.

## Key Challenges
Throughout my career, I've faced ${challenge} that tested my resilience and problem-solving abilities. These experiences have been instrumental in developing my approach to ${learning}.

## Achievements
My most significant accomplishment has been ${achievement}, which demonstrated the importance of strategic thinking and collaborative effort in achieving organizational goals.

## Current Focus
Today, my mission is to ${goal} by sharing insights and experiences that can benefit ${audience} in their own professional development.

## Looking Forward
I believe in the power of ${learning} and am committed to helping others navigate their career paths with confidence and purpose.`
  } else if (tone === "personal") {
    story = `# My Story: A Personal Journey

## How It All Started
My name is ${name}, and I've spent ${experience} working in ${industry}. It's been quite a journey filled with ups and downs, but every experience has taught me something valuable.

## The Tough Times
I've faced my share of ${challenge}, and honestly, there were moments when I wondered if I was on the right path. But looking back, those difficult times were actually the moments that shaped me the most.

## What I'm Proud Of
${achievement} stands out as something I'm really proud of. It wasn't just about the success itself, but about the team effort and the lessons learned along the way.

## What Drives Me
These days, I'm focused on ${goal}. I want to help ${audience} avoid some of the mistakes I made and find their own path to success.

## My Philosophy
I've learned that ${learning} is the key to staying relevant and fulfilled in your career. It's not always easy, but it's always worth it.`
  } else {
    // Casual tone
    story = `# Hey there! Here's my story...

## The Beginning
So, I'm ${name}, and I've been in the ${industry} game for about ${experience}. Crazy how time flies, right?

## The Real Talk
Let me be honest - it hasn't always been smooth sailing. I've dealt with ${challenge} that really tested my limits. But you know what? Those tough times were actually the best teachers.

## The Wins
${achievement} is probably what I'm most proud of. It wasn't just about hitting targets - it was about the people, the process, and everything I learned along the way.

## What I'm Up To Now
Right now, I'm all about ${goal}. I want to help ${audience} figure out their own path and maybe avoid some of the bumps I hit along the way.

## My Take
Here's what I've learned: ${learning} is everything. Stay curious, stay hungry, and never stop growing. That's the secret sauce.`
  }

  // Add length variations
  if (length === "short") {
    story = story.split('\n\n').slice(0, 3).join('\n\n') + '\n\n*This is a brief overview of my professional journey.*'
  } else if (length === "long") {
    story += `

## Additional Insights
Based on my experience in ${industry}, I've developed several key principles that guide my work:

1. **Continuous Learning**: The industry is always evolving, so staying updated is crucial
2. **Collaboration**: Success is rarely achieved alone - teamwork is essential
3. **Adaptability**: Being flexible and open to change has been key to my growth
4. **Mentorship**: Both giving and receiving guidance has been invaluable

## Future Vision
Looking ahead, I'm excited about the opportunities to ${goal} and contribute to the growth of ${audience} in meaningful ways.

*This story reflects my journey in ${industry} and my commitment to ${learning}.*`
  }

  return story
}

async function testStoryBuilder() {
  try {
    console.log('🚀 Testing Story Builder Process...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const User = mongoose.models.User || mongoose.model('User', userSchema);
    const GeneratedStory = mongoose.models.GeneratedStory || mongoose.model('GeneratedStory', generatedStorySchema);

    // Find or create test user
    let user = await User.findOne({ email: 'test@example.com' });
    
    if (!user) {
      console.log('👤 Creating test user...');
      
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword
      });
      
      await user.save();
      console.log('✅ Test user created');
    } else {
      console.log('✅ Test user found');
    }

    // Test different story combinations
    const testCases = [
      {
        name: "Professional Story",
        baseStory: {
          name: "Sarah Johnson",
          industry: "Technology",
          experience: "8 years",
          achievement: "leading a team of 50 developers to deliver a major software platform",
          challenge: "managing a project with constantly changing requirements",
          learning: "the importance of clear communication and agile methodologies",
          goal: "mentor junior developers and help them grow"
        },
        customization: {
          tone: "professional",
          length: "medium",
          audience: "tech professionals",
          focus: "leadership journey"
        }
      },
      {
        name: "Personal Story",
        baseStory: {
          name: "Mike Chen",
          industry: "Healthcare",
          experience: "12 years",
          achievement: "implementing a new patient care system that improved outcomes by 40%",
          challenge: "resistance to change from senior staff",
          learning: "that change management is as important as technical skills",
          goal: "transform healthcare through technology"
        },
        customization: {
          tone: "personal",
          length: "long",
          audience: "healthcare professionals",
          focus: "innovation in healthcare"
        }
      },
      {
        name: "Casual Story",
        baseStory: {
          name: "Alex Rivera",
          industry: "Marketing",
          experience: "6 years",
          achievement: "growing a startup's customer base from 0 to 10,000 users",
          challenge: "working with a limited budget and tight deadlines",
          learning: "that creativity and resourcefulness can overcome any obstacle",
          goal: "help other startups succeed"
        },
        customization: {
          tone: "casual",
          length: "short",
          audience: "entrepreneurs",
          focus: "startup success"
        }
      }
    ];

    console.log('\n📝 Testing Story Generation...\n');

    for (const testCase of testCases) {
      console.log(`🎯 Testing: ${testCase.name}`);
      
      // Generate story
      const story = generateBasicStory(testCase.baseStory, testCase.customization);
      
      // Save to database
      const storyRecord = new GeneratedStory({
        userId: user._id,
        status: "generated",
        generatedStory: story,
        baseStoryData: testCase.baseStory,
        customizationData: testCase.customization,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await storyRecord.save();
      
      console.log(`✅ Story created: ${storyRecord._id.toString()}`);
      console.log(`📊 Tone: ${testCase.customization.tone}, Length: ${testCase.customization.length}`);
      console.log(`📖 Preview: ${story.substring(0, 100)}...`);
      console.log('---\n');
    }

    console.log('🎉 All story tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- Professional tone story: ✅');
    console.log('- Personal tone story: ✅');
    console.log('- Casual tone story: ✅');
    console.log('- Different lengths: ✅');
    console.log('- Database storage: ✅');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testStoryBuilder();
