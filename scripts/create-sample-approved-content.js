const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/linkzup';

async function createSampleApprovedContent() {
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

    // Create sample approved content using the model
    const ApprovedContent = mongoose.model('ApprovedContent', new mongoose.Schema({
      id: String,
      topicId: String,
      userId: mongoose.Schema.Types.ObjectId,
      topicTitle: String,
      content: String,
      hashtags: [String],
      keyPoints: [String],
      imageUrl: String,
      platform: String,
      contentType: String,
      status: String,
      generatedAt: Date,
      createdAt: Date,
      updatedAt: Date
    }));

    const sampleContent = [
      {
        topicId: `topic-${Date.now()}-1`,
        userId: user._id,
        topicTitle: "How to Build a Successful LinkedIn Strategy",
        content: "Building a successful LinkedIn strategy requires consistency, authenticity, and value-driven content. Start by optimizing your profile, then focus on creating content that resonates with your target audience. Engage actively with your network and measure your results regularly.",
        hashtags: ["#LinkedInStrategy", "#ProfessionalGrowth", "#Networking"],
        keyPoints: ["Profile optimization", "Content consistency", "Network engagement", "Performance tracking"],
        contentType: "storytelling",
        status: "approved",
        platform: "linkedin"
      },
      {
        topicId: `topic-${Date.now()}-2`,
        userId: user._id,
        topicTitle: "5 Ways to Boost Your Professional Brand",
        content: "Your professional brand is your digital reputation. Here are 5 proven ways to boost it: 1) Share valuable insights regularly, 2) Engage with industry leaders, 3) Showcase your expertise through case studies, 4) Maintain consistency across platforms, 5) Measure and optimize your efforts.",
        hashtags: ["#PersonalBranding", "#ProfessionalDevelopment", "#CareerGrowth"],
        keyPoints: ["Regular content sharing", "Industry engagement", "Expertise showcase", "Platform consistency", "Performance measurement"],
        contentType: "listicle",
        status: "generated",
        platform: "linkedin"
      },
      {
        topicId: `topic-${Date.now()}-3`,
        userId: user._id,
        topicTitle: "The Future of Digital Marketing in 2024",
        content: "Digital marketing is evolving rapidly with AI, personalization, and automation taking center stage. Companies that adapt to these changes will thrive. Focus on data-driven decisions, personalized experiences, and authentic storytelling to stay ahead of the curve.",
        hashtags: ["#DigitalMarketing", "#AI", "#MarketingTrends", "#2024"],
        keyPoints: ["AI integration", "Personalization", "Data-driven decisions", "Authentic storytelling"],
        contentType: "thought-leadership",
        status: "posted",
        platform: "linkedin"
      }
    ];

    console.log('📝 Creating sample approved content...');
    
    for (const content of sampleContent) {
      const newContent = new ApprovedContent({
        ...content,
        generatedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await newContent.save();
      console.log(`✅ Created content: ${newContent.topicTitle} (${newContent.id})`);
    }

    // Also create some content in the raw collection for testing
    console.log('\n📝 Creating sample content in raw collection...');
    const collection = mongoose.connection.db.collection('approvedcontents');
    
    const rawSampleContent = [
      {
        ID: `raw-${Date.now()}-1`,
        Topic: "Advanced LinkedIn Automation Techniques",
        "generated content": "Automation can significantly improve your LinkedIn efficiency. Use tools for content scheduling, engagement tracking, and lead generation. But remember, automation should enhance, not replace, genuine human connection.",
        status: "approved",
        userId: user._id.toString(),
        email: user.email,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        ID: `raw-${Date.now()}-2`,
        Topic: "Building Thought Leadership Through Content",
        "generated content": "Thought leadership isn't about being the loudest voice—it's about being the most valuable. Share insights that solve real problems, challenge conventional thinking, and inspire action. Your audience will follow you for the value you provide.",
        status: "generated",
        "user id": user._id.toString(),
        email: user.email,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const content of rawSampleContent) {
      await collection.insertOne(content);
      console.log(`✅ Created raw content: ${content.Topic} (${content.ID})`);
    }

    console.log('\n✅ Sample approved content created successfully!');
    
    // Verify the data was created
    const modelCount = await ApprovedContent.countDocuments({ userId: user._id });
    const rawCount = await collection.countDocuments({ 
      $or: [
        { userId: user._id.toString() },
        { "user id": user._id.toString() },
        { email: user.email }
      ]
    });
    
    console.log(`📊 Verification: Model=${modelCount} records, Raw=${rawCount} records`);

  } catch (error) {
    console.error('❌ Error creating sample approved content:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
createSampleApprovedContent();
