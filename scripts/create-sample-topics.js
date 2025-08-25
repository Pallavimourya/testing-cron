const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/linkzup';

async function createSampleTopics() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get a user to associate topics with
    const users = await mongoose.connection.db.collection('users').find({}).limit(1).toArray();
    
    if (users.length === 0) {
      console.log('❌ No users found. Please create a user first.');
      return;
    }

    const user = users[0];
    console.log(`👤 Using user: ${user.email} (${user._id})`);

    // Create sample topics using the Topic model
    const Topic = mongoose.model('Topic', new mongoose.Schema({
      id: String,
      userId: mongoose.Schema.Types.ObjectId,
      storyId: mongoose.Schema.Types.ObjectId,
      title: String,
      status: String,
      source: String,
      generationType: String,
      userPrompt: String,
      contentStatus: String,
      contentId: String,
      generatedAt: Date,
      createdAt: Date,
      updatedAt: Date
    }));

    const sampleTopics = [
      {
        title: "5 Lessons I Learned from My Biggest Career Challenge",
        status: "approved",
        source: "manual",
        generationType: "manual",
        contentStatus: "generated",
        contentId: `content-${Date.now()}-1`
      },
      {
        title: "Why Your First Job Teaches You More Than Any Degree",
        status: "pending",
        source: "auto",
        generationType: "auto",
        contentStatus: "not_generated"
      },
      {
        title: "The Mentor Who Changed My Perspective on Success",
        status: "approved",
        source: "manual",
        generationType: "manual",
        contentStatus: "generated",
        contentId: `content-${Date.now()}-2`
      },
      {
        title: "How I Turned My Biggest Failure into My Greatest Strength",
        status: "pending",
        source: "auto",
        generationType: "auto",
        contentStatus: "not_generated"
      },
      {
        title: "The Industry Myth That's Holding You Back",
        status: "approved",
        source: "manual",
        generationType: "manual",
        contentStatus: "generated",
        contentId: `content-${Date.now()}-3`
      },
      {
        title: "Building a Team That Actually Works Together",
        status: "dismissed",
        source: "auto",
        generationType: "auto",
        contentStatus: "not_generated"
      },
      {
        title: "The Power of Continuous Learning in Tech",
        status: "approved",
        source: "manual",
        generationType: "manual",
        contentStatus: "generated",
        contentId: `content-${Date.now()}-4`
      },
      {
        title: "From Developer to Leader: My Journey",
        status: "pending",
        source: "auto",
        generationType: "auto",
        contentStatus: "not_generated"
      }
    ];

    console.log('📝 Creating sample topics...');
    
    for (const topic of sampleTopics) {
      const newTopic = new Topic({
        ...topic,
        userId: user._id,
        id: `topic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await newTopic.save();
      console.log(`✅ Created topic: ${newTopic.title} (${newTopic.status})`);
    }

    console.log('\n✅ Sample topics created successfully!');
    
    // Verify the data was created
    const topicCount = await Topic.countDocuments({ userId: user._id });
    console.log(`📊 Verification: ${topicCount} topics created for user`);

  } catch (error) {
    console.error('❌ Error creating sample topics:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
createSampleTopics();
