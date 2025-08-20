const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection
const MONGODB_URI = 'mongodb://localhost:27017/linkzup';

// User Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  baseStoryData: {
    earlyLife: String,
    firstDream: String,
    firstJob: String,
    careerRealization: String,
    biggestChallenge: String,
    almostGaveUp: String,
    turningPoint: String,
    mentor: String,
    currentWork: String,
    uniqueApproach: String,
    proudAchievement: String,
    industryMisconception: String,
    powerfulLesson: String,
    coreValues: String,
    desiredImpact: String,
  },
  customizationData: {
    target_audience: String,
    content_goal: String,
    content_tone: String,
    writing_style: String,
    keywords: [String],
  },
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
  baseStoryData: {
    earlyLife: String,
    firstDream: String,
    firstJob: String,
    careerRealization: String,
    biggestChallenge: String,
    almostGaveUp: String,
    turningPoint: String,
    mentor: String,
    currentWork: String,
    uniqueApproach: String,
    proudAchievement: String,
    industryMisconception: String,
    powerfulLesson: String,
    coreValues: String,
    desiredImpact: String,
  },
  customizationData: {
    target_audience: String,
    content_goal: String,
    content_tone: String,
    writing_style: String,
    keywords: [String],
  },
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

async function createSimpleStory() {
  try {
    console.log('🚀 Creating simple story...');
    
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
        password: hashedPassword,
        baseStoryData: {
          earlyLife: "I started my journey in technology",
          firstDream: "to build innovative solutions",
          firstJob: "as a junior developer",
          careerRealization: "I realized my passion for creating impactful software",
          biggestChallenge: "learning complex systems",
          almostGaveUp: "thought about switching careers",
          turningPoint: "landed my first major project",
          mentor: "my senior developer",
          currentWork: "leading development teams",
          uniqueApproach: "focusing on user experience first",
          proudAchievement: "launching a product that helped thousands",
          industryMisconception: "that coding is just about writing code",
          powerfulLesson: "the importance of understanding user needs",
          coreValues: "innovation, empathy, and continuous learning",
          desiredImpact: "empower others through technology"
        },
        customizationData: {
          target_audience: "tech professionals and entrepreneurs",
          content_goal: "inspire and educate",
          content_tone: "professional yet personal",
          writing_style: "conversational",
          keywords: ["technology", "leadership", "innovation", "career growth"]
        }
      });
      
      await user.save();
      console.log('✅ Test user created');
    } else {
      console.log('✅ Test user found');
    }

    // Generate story
    console.log('📝 Generating story...');
    
    const story = generateSimpleStory(user.baseStoryData, user.customizationData, user);
    
    // Save story
    const storyRecord = new GeneratedStory({
      userId: user._id,
      status: "generated",
      generatedStory: story,
      baseStoryData: user.baseStoryData,
      customizationData: user.customizationData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await storyRecord.save();
    
    console.log('✅ Story created successfully!');
    console.log('📄 Story ID:', storyRecord._id.toString());
    console.log('📄 Story Status:', storyRecord.status);
    console.log('\n📖 Story Preview:');
    console.log(story.substring(0, 500) + '...');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

function generateSimpleStory(baseStoryData, customizationData, user) {
  const {
    earlyLife = "I started my journey",
    firstDream = "my first dream",
    firstJob = "my first job",
    careerRealization = "I realized my passion",
    biggestChallenge = "facing challenges",
    almostGaveUp = "almost giving up",
    turningPoint = "the turning point",
    mentor = "my mentor",
    currentWork = "my current work",
    uniqueApproach = "my unique approach",
    proudAchievement = "my proudest achievement",
    industryMisconception = "industry misconceptions",
    powerfulLesson = "powerful lessons learned",
    coreValues = "my core values",
    desiredImpact = "the impact I want to make"
  } = baseStoryData

  const {
    target_audience = "professionals",
    content_goal = "inspire and educate",
    content_tone = "professional yet personal",
    writing_style = "conversational",
    keywords = []
  } = customizationData

  const story = `
# My Professional Journey: From ${firstDream} to ${currentWork}

## Early Beginnings
${earlyLife} with a dream to ${firstDream}. My first job was ${firstJob}, where I learned the fundamentals of my industry.

## The Realization
${careerRealization} when I faced ${biggestChallenge}. There were moments when I ${almostGaveUp}, but ${turningPoint} changed everything.

## The Mentor
${mentor} played a crucial role in my development, teaching me ${powerfulLesson} that I carry with me today.

## My Unique Approach
${uniqueApproach} has been my differentiator. I believe in ${coreValues} and strive to ${desiredImpact}.

## Industry Insights
Through my experience, I've learned that ${industryMisconception}. This understanding has shaped my approach to ${currentWork}.

## My Proudest Moment
${proudAchievement} stands out as my most significant accomplishment, demonstrating what's possible when you stay true to your ${coreValues}.

## Looking Forward
My mission is to ${desiredImpact} by sharing insights and experiences that can help ${target_audience} navigate their own professional journeys.

---

*This story is crafted to ${content_goal} with a ${content_tone} tone, written in a ${writing_style} style. ${keywords.length > 0 ? `Key themes: ${keywords.join(', ')}` : ''}*
  `.trim()

  return story
}

createSimpleStory();
