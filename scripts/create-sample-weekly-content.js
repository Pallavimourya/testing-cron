const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/linkzup';

async function createSampleWeeklyContent() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get a user to associate content with
    const users = await mongoose.connection.db.collection('users').find({}).limit(1).toArray();
    
    if (users.length === 0) {
      console.log('❌ No users found. Please create a user first.');
      return;
    }

    const user = users[0];
    console.log(`👤 Using user: ${user.email} (${user._id})`);

    // Create sample content with different dates over the past week
    const sampleContent = [
      // Today (Sunday)
      {
        topicId: `topic_${Date.now()}_1`,
        userId: user._id,
        topicTitle: "Today's Content - Sunday",
        content: "This is content created today.",
        hashtags: ["#today", "#sunday"],
        keyPoints: ["Point 1", "Point 2"],
        contentType: "storytelling",
        status: "approved",
        platform: "linkedin",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Yesterday (Saturday)
      {
        topicId: `topic_${Date.now()}_2`,
        userId: user._id,
        topicTitle: "Yesterday's Content - Saturday",
        content: "This is content created yesterday.",
        hashtags: ["#yesterday", "#saturday"],
        keyPoints: ["Point 1", "Point 2"],
        contentType: "tips",
        status: "posted",
        platform: "linkedin",
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
      },
      // 2 days ago (Friday)
      {
        topicId: `topic_${Date.now()}_3`,
        userId: user._id,
        topicTitle: "Friday's Content",
        content: "This is content created on Friday.",
        hashtags: ["#friday"],
        keyPoints: ["Point 1"],
        contentType: "insight",
        status: "generated",
        platform: "linkedin",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        topicId: `topic_${Date.now()}_4`,
        userId: user._id,
        topicTitle: "Friday's Second Content",
        content: "This is second content created on Friday.",
        hashtags: ["#friday", "#second"],
        keyPoints: ["Point 1", "Point 2"],
        contentType: "question",
        status: "approved",
        platform: "linkedin",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      // 3 days ago (Thursday)
      {
        topicId: `topic_${Date.now()}_5`,
        userId: user._id,
        topicTitle: "Thursday's Content",
        content: "This is content created on Thursday.",
        hashtags: ["#thursday"],
        keyPoints: ["Point 1"],
        contentType: "list",
        status: "posted",
        platform: "linkedin",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      // 4 days ago (Wednesday)
      {
        topicId: `topic_${Date.now()}_6`,
        userId: user._id,
        topicTitle: "Wednesday's Content",
        content: "This is content created on Wednesday.",
        hashtags: ["#wednesday"],
        keyPoints: ["Point 1"],
        contentType: "storytelling",
        status: "generated",
        platform: "linkedin",
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
      },
      // 5 days ago (Tuesday)
      {
        topicId: `topic_${Date.now()}_7`,
        userId: user._id,
        topicTitle: "Tuesday's Content",
        content: "This is content created on Tuesday.",
        hashtags: ["#tuesday"],
        keyPoints: ["Point 1"],
        contentType: "tips",
        status: "approved",
        platform: "linkedin",
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },
      // 6 days ago (Monday)
      {
        topicId: `topic_${Date.now()}_8`,
        userId: user._id,
        topicTitle: "Monday's Content",
        content: "This is content created on Monday.",
        hashtags: ["#monday"],
        keyPoints: ["Point 1"],
        contentType: "insight",
        status: "posted",
        platform: "linkedin",
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
      }
    ];

    console.log('📝 Creating sample weekly content...');
    
    // Create content in ApprovedContent collection
    const ApprovedContent = mongoose.model('ApprovedContent', new mongoose.Schema({
      topicId: String,
      userId: mongoose.Schema.Types.ObjectId,
      topicTitle: String,
      content: String,
      hashtags: [String],
      keyPoints: [String],
      contentType: String,
      status: String,
      platform: String,
      createdAt: Date,
      updatedAt: Date
    }));

    for (const content of sampleContent) {
      const newContent = new ApprovedContent(content);
      await newContent.save();
      console.log(`✅ Created content: ${newContent.topicTitle} (${newContent.status}) - ${newContent.createdAt.toLocaleDateString()}`);
    }

    // Also create some content in raw collections
    console.log('\n📝 Creating sample content in raw collections...');
    const collections = ["approvedcontents", "linkdin-content-generation", "generatedcontents"];
    
    for (const collectionName of collections) {
      try {
        const collection = mongoose.connection.db.collection(collectionName);
        
        // Create 2-3 sample records for each collection
        for (let i = 0; i < 3; i++) {
          const daysAgo = Math.floor(Math.random() * 7); // Random day in past week
          const content = {
            Topic: `Raw Content ${i + 1} from ${collectionName}`,
            "generated content": `This is raw content ${i + 1} from ${collectionName}`,
            status: "generated",
            userId: user._id.toString(),
            email: user.email,
            createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
            updatedAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
          };
          
          await collection.insertOne(content);
          console.log(`✅ Created raw content in ${collectionName}: ${content.Topic} - ${content.createdAt.toLocaleDateString()}`);
        }
      } catch (error) {
        console.error(`Error creating content in ${collectionName}:`, error.message);
      }
    }

    console.log('\n✅ Sample weekly content created successfully!');
    
    // Verify the data was created
    const totalContent = await ApprovedContent.countDocuments({ userId: user._id });
    console.log(`📊 Verification: ${totalContent} content items created`);

  } catch (error) {
    console.error('❌ Error creating sample weekly content:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
createSampleWeeklyContent();
