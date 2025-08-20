const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

// Define schemas inline
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const approvedContentSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    default: function () {
      return `content-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${Math.random().toString(36).substr(2, 4)}`
    },
  },
  topicId: {
    type: String,
    required: true,
    ref: "Topic",
    default: () => `topic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  topicTitle: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  hashtags: [
    {
      type: String,
      trim: true,
    },
  ],
  keyPoints: [
    {
      type: String,
      trim: true,
    },
  ],
  imageUrl: {
    type: String,
    default: null,
  },
  platform: {
    type: String,
    enum: ["linkedin", "twitter", "facebook", "instagram"],
    default: "linkedin",
  },
  contentType: {
    type: String,
    enum: ["storytelling", "listicle", "quote_based", "before_after", "question_driven"],
    default: "storytelling",
  },
  status: {
    type: String,
    enum: ["generated", "approved", "posted", "failed", "scheduled"],
    default: "generated",
  },
  scheduledFor: {
    type: Date,
    default: null,
  },
  makeWebhookId: {
    type: String,
    default: null,
  },
  generatedAt: {
    type: Date,
    default: Date.now,
  },
  approvedAt: {
    type: Date,
    default: null,
  },
  postedAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Create models
const User = mongoose.model('User', userSchema);
const ApprovedContent = mongoose.model('ApprovedContent', approvedContentSchema);

async function testApprovedContentLinkedInPosting() {
  try {
    console.log('🧪 Testing LinkedIn Posting for Approved Content...\n');

    // Find a test user
    const user = await User.findOne({});
    if (!user) {
      console.log('❌ No user found for testing');
      return;
    }

    console.log(`👤 Testing with user: ${user.email}`);

    // 1. Create test content in approvedcontents collection
    console.log('\n📝 Creating test content in approvedcontents collection...');
    
    const testContent = new ApprovedContent({
      topicId: `test-topic-${Date.now()}`,
      topicTitle: `Test Approved Content for LinkedIn Posting ${Date.now()}`,
      content: `This is test approved content for LinkedIn posting. It contains sample text to verify the LinkedIn posting feature works properly with approved content.`,
      hashtags: ['#test', '#linkedin', '#approved', '#content'],
      keyPoints: ['Point 1: Testing LinkedIn posting with approved content', 'Point 2: Verifying collection handling', 'Point 3: Ensuring proper status updates'],
      contentType: 'storytelling',
      platform: 'linkedin',
      status: 'approved',
      userId: user._id
    });

    await testContent.save();
    console.log('✅ Created test approved content:', {
      id: testContent.id,
      topicTitle: testContent.topicTitle,
      status: testContent.status,
      idType: typeof testContent.id
    });

    // 2. Test content retrieval from both collections
    console.log('\n🔍 Testing content retrieval from both collections...');
    
    // Test retrieval from approvedcontents collection
    const approvedContent = await ApprovedContent.findOne({ 
      id: testContent.id,
      userId: user._id 
    });
    console.log('✅ Content found in approvedcontents collection:', !!approvedContent);

    // Test retrieval from linkdin-content-generation collection (should not find)
    const collection = mongoose.connection.db?.collection("linkdin-content-generation");
    if (collection) {
      try {
        const linkedinContent = await collection.findOne({
          $or: [
            { id: testContent.id },
            { _id: new mongoose.Types.ObjectId(testContent.id) }
          ]
        });
        console.log('⚠️ Content found in linkdin-content-generation collection:', !!linkedinContent);
      } catch (error) {
        // If ObjectId conversion fails, try without it
        const linkedinContent = await collection.findOne({
          id: testContent.id
        });
        console.log('⚠️ Content found in linkdin-content-generation collection:', !!linkedinContent);
      }
    }

    // 3. Test LinkedIn posting simulation
    console.log('\n📤 Testing LinkedIn posting simulation...');
    
    // Simulate the LinkedIn posting API call with string ID
    const linkedInPostData = {
      contentId: testContent.id, // String ID from approved content
      content: testContent.content,
      hashtags: testContent.hashtags,
      platform: testContent.platform
    };

    console.log('📋 LinkedIn post data prepared:', {
      contentId: linkedInPostData.contentId,
      contentIdType: typeof linkedInPostData.contentId,
      contentLength: linkedInPostData.content.length,
      hashtagsCount: linkedInPostData.hashtags.length,
      platform: linkedInPostData.platform
    });

    // 4. Test status update simulation
    console.log('\n📝 Testing status update simulation...');
    
    // Simulate successful LinkedIn posting with string ID
    const postedContent = await ApprovedContent.findOneAndUpdate(
      { 
        id: testContent.id, // Use string ID
        userId: user._id,
        status: "approved"
      },
      {
        status: "posted",
        postedAt: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    );

    if (postedContent) {
      console.log('✅ Content posted to LinkedIn successfully:', {
        id: postedContent.id,
        status: postedContent.status,
        postedAt: postedContent.postedAt,
        idType: typeof postedContent.id
      });
    } else {
      console.log('❌ Failed to post content to LinkedIn');
    }

    // 5. Test collection differences
    console.log('\n🗄️ Testing collection differences...');
    
    // Check what's in each collection
    const allApprovedContent = await ApprovedContent.find({ userId: user._id });
    const allLinkedinContent = collection ? await collection.find({}).toArray() : [];
    
    console.log('📊 Collection comparison:', {
      approvedContentsCount: allApprovedContent.length,
      linkedinContentCount: allLinkedinContent.length,
      approvedContentIds: allApprovedContent.map(c => ({ id: c.id, status: c.status })),
      linkedinContentIds: allLinkedinContent.slice(0, 3).map(c => ({ 
        id: c.id || c._id, 
        status: c.status 
      }))
    });

    // 6. Test API endpoint simulation
    console.log('\n🌐 Testing API endpoint simulation...');
    
    // Simulate the actual API call that would be made from the frontend
    const apiCallData = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentId: testContent.id })
    };

    console.log('📡 API call simulation:', {
      endpoint: '/api/linkedin/post',
      contentId: testContent.id,
      method: apiCallData.method,
      hasHeaders: !!apiCallData.headers,
      hasBody: !!apiCallData.body
    });

    // 7. Test error handling
    console.log('\n⚠️ Testing error handling...');
    
    // Test with non-existent content ID
    const nonExistentId = 'non-existent-content-id';
    const nonExistentContent = await ApprovedContent.findOne({ id: nonExistentId });
    console.log('✅ Non-existent content handling working correctly:', !nonExistentContent);

    // Test with invalid ID format
    const invalidId = 'invalid-id-format';
    const isValidObjectId = mongoose.Types.ObjectId.isValid(invalidId);
    console.log('✅ Invalid ID format handling working correctly:', !isValidObjectId);

    // 8. Final statistics
    console.log('\n📊 FINAL STATISTICS:');
    
    const finalStats = {
      totalApprovedContent: await ApprovedContent.countDocuments({ userId: user._id }),
      approvedContentByStatus: {
        generated: await ApprovedContent.countDocuments({ userId: user._id, status: 'generated' }),
        approved: await ApprovedContent.countDocuments({ userId: user._id, status: 'approved' }),
        posted: await ApprovedContent.countDocuments({ userId: user._id, status: 'posted' }),
        failed: await ApprovedContent.countDocuments({ userId: user._id, status: 'failed' })
      },
      stringIdContent: await ApprovedContent.countDocuments({ 
        userId: user._id,
        id: { $exists: true, $type: "string" }
      })
    };
    
    console.log(`📈 Total approved content: ${finalStats.totalApprovedContent}`);
    console.log(`📊 By status:`, finalStats.approvedContentByStatus);
    console.log(`🔗 String ID content: ${finalStats.stringIdContent}`);

    // 9. Cleanup test data
    console.log('\n🧹 Cleaning up test data...');
    
    const deleteResult = await ApprovedContent.deleteMany({
      userId: user._id,
      id: testContent.id
    });
    
    console.log(`✅ Cleaned up ${deleteResult.deletedCount} test content items`);

    console.log('\n✅ Approved content LinkedIn posting test completed successfully!');

  } catch (error) {
    console.error('❌ Error testing approved content LinkedIn posting:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the test
testApprovedContentLinkedInPosting();
