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
    index: true,
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

async function debugDuplicates() {
  try {
    console.log('🔍 Debugging Duplicate Topics...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const User = mongoose.models.User || mongoose.model('User', userSchema);
    const GeneratedStory = mongoose.models.GeneratedStory || mongoose.model('GeneratedStory', generatedStorySchema);
    const Topic = mongoose.models.Topic || mongoose.model('Topic', topicSchema);

    // Find test user
    const testUser = await User.findOne({ email: 'test@example.com' });
    if (!testUser) {
      console.log('❌ Test user not found');
      return;
    }

    console.log('👤 Found test user:', testUser._id.toString());

    // 1. Check database topics
    console.log('\n📊 STEP 1: Database Topics Analysis');
    const dbTopics = await Topic.find({ userId: testUser._id }).lean();
    console.log(`   📝 Found ${dbTopics.length} topics in database:`);
    
    dbTopics.forEach((topic, index) => {
      console.log(`     ${index + 1}. "${topic.title}" (${topic.status}) - ID: ${topic.id}`);
    });

    // 2. Check story topics
    console.log('\n📚 STEP 2: Story Topics Analysis');
    const stories = await GeneratedStory.find({ userId: testUser._id }).lean();
    console.log(`   📖 Found ${stories.length} stories:`);
    
    let totalStoryTopics = 0;
    let approvedStoryTopics = 0;
    
    stories.forEach((story, storyIndex) => {
      console.log(`\n   📖 Story ${storyIndex + 1} (${story._id.toString()}):`);
      console.log(`     - Status: ${story.status}`);
      console.log(`     - Generated Topics: ${story.generatedTopics.length}`);
      
      story.generatedTopics.forEach((topic, topicIndex) => {
        console.log(`       ${topicIndex + 1}. "${topic.title}" (${topic.status}) - ID: ${topic.id}`);
        totalStoryTopics++;
        if (topic.status === 'approved') {
          approvedStoryTopics++;
        }
      });
    });

    console.log(`\n   📊 Total story topics: ${totalStoryTopics}`);
    console.log(`   📊 Approved story topics: ${approvedStoryTopics}`);

    // 3. Simulate API response
    console.log('\n🌐 STEP 3: Simulating API Response');
    
    // Get approved topics from stories
    const approvedStoryTopicsList = stories.flatMap((story) => 
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

    console.log(`   📝 Approved story topics: ${approvedStoryTopicsList.length}`);
    approvedStoryTopicsList.forEach((topic, index) => {
      console.log(`     ${index + 1}. "${topic.title}" (${topic.status})`);
    });

    // 4. Check for duplicates
    console.log('\n🔍 STEP 4: Duplicate Analysis');
    
    const allTitles = [];
    
    // Add database topic titles
    dbTopics.forEach(topic => {
      allTitles.push({ title: topic.title, source: 'database', id: topic.id });
    });
    
    // Add story topic titles
    approvedStoryTopicsList.forEach(topic => {
      allTitles.push({ title: topic.title, source: 'story', id: topic.id });
    });

    console.log(`   📊 Total titles: ${allTitles.length}`);
    
    // Find duplicates
    const titleCounts = {};
    allTitles.forEach(item => {
      titleCounts[item.title] = (titleCounts[item.title] || 0) + 1;
    });

    const duplicates = Object.entries(titleCounts).filter(([title, count]) => count > 1);
    
    if (duplicates.length > 0) {
      console.log(`   ❌ Found ${duplicates.length} duplicate titles:`);
      duplicates.forEach(([title, count]) => {
        console.log(`     - "${title}" (${count} times)`);
        const items = allTitles.filter(item => item.title === title);
        items.forEach(item => {
          console.log(`       * ${item.source} - ID: ${item.id}`);
        });
      });
    } else {
      console.log('   ✅ No duplicate titles found');
    }

    // 5. Simulate the fixed API logic
    console.log('\n🔧 STEP 5: Testing Fixed API Logic');
    
    // Remove duplicate topics by title from story topics
    const uniqueStoryTopics = approvedStoryTopicsList.filter((topic, index, self) => 
      index === self.findIndex((t) => t.title === topic.title)
    );

    console.log(`   📝 Before deduplication: ${approvedStoryTopicsList.length} topics`);
    console.log(`   📝 After deduplication: ${uniqueStoryTopics.length} topics`);
    console.log(`   📝 Removed: ${approvedStoryTopicsList.length - uniqueStoryTopics.length} duplicates`);

    // Create a set of all titles to avoid duplicates
    const allTitlesSet = new Set();
    const finalTopics = [];

    // Add database topics first
    for (const topic of dbTopics) {
      if (!allTitlesSet.has(topic.title)) {
        allTitlesSet.add(topic.title);
        finalTopics.push({
          id: topic.id,
          title: topic.title,
          status: topic.status,
          createdAt: topic.createdAt,
          source: topic.source === "story_generated" ? "auto" : "manual",
          approvedAt: topic.approvedAt
        });
      }
    }

    // Add story topics (avoiding duplicates)
    for (const topic of uniqueStoryTopics) {
      if (!allTitlesSet.has(topic.title)) {
        allTitlesSet.add(topic.title);
        finalTopics.push(topic);
      }
    }

    console.log(`\n   📊 Final API Response:`);
    console.log(`   - Database topics: ${dbTopics.length}`);
    console.log(`   - Unique story topics: ${uniqueStoryTopics.length}`);
    console.log(`   - Final topics: ${finalTopics.length}`);
    
    finalTopics.forEach((topic, index) => {
      console.log(`     ${index + 1}. "${topic.title}" (${topic.status}) - ${topic.source}`);
    });

    console.log('\n🎉 Duplicate Debug Complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

debugDuplicates();
