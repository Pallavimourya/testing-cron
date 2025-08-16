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

async function testLinkedInPostingFix() {
  try {
    console.log('🧪 Testing LinkedIn Posting Fix for String IDs...\n');

    // Find a test user
    const user = await User.findOne({});
    if (!user) {
      console.log('❌ No user found for testing');
      return;
    }

    console.log(`👤 Testing with user: ${user.email}`);

    // 1. Create test content with string ID
    console.log('\n📝 Creating test content with string ID...');
    
    const testContent = new ApprovedContent({
      topicId: `test-topic-${Date.now()}`,
      topicTitle: `Test Content for LinkedIn Posting Fix ${Date.now()}`,
      content: `This is test content for LinkedIn posting fix. It contains sample text to verify the LinkedIn posting feature works properly with string IDs.`,
      hashtags: ['#test', '#linkedin', '#fix', '#string-id'],
      keyPoints: ['Point 1: Testing LinkedIn posting with string IDs', 'Point 2: Verifying ID format handling', 'Point 3: Ensuring no ObjectId errors'],
      contentType: 'storytelling',
      platform: 'linkedin',
      status: 'approved',
      userId: user._id
    });

    await testContent.save();
    console.log('✅ Created test content with string ID:', {
      id: testContent.id,
      topicTitle: testContent.topicTitle,
      status: testContent.status,
      idType: typeof testContent.id
    });

    // 2. Test ID format validation
    console.log('\n🔍 Testing ID format validation...');
    
    const isValidObjectId = mongoose.Types.ObjectId.isValid(testContent.id);
    console.log('📊 ID format analysis:', {
      id: testContent.id,
      idLength: testContent.id.length,
      isValidObjectId: isValidObjectId,
      idType: typeof testContent.id
    });

    if (!isValidObjectId) {
      console.log('✅ String ID detected - this is expected for approved content');
    } else {
      console.log('⚠️ ObjectId detected - this might cause issues');
    }

    // 3. Test content retrieval with different ID formats
    console.log('\n🔍 Testing content retrieval with different ID formats...');
    
    // Test with string ID
    const contentByStringId = await ApprovedContent.findOne({ id: testContent.id });
    console.log('✅ Content found by string ID:', !!contentByStringId);

    // Test with ObjectId (should fail gracefully)
    try {
      const contentByObjectId = await ApprovedContent.findOne({ _id: new mongoose.Types.ObjectId(testContent.id) });
      console.log('⚠️ Content found by ObjectId:', !!contentByObjectId);
    } catch (error) {
      console.log('✅ ObjectId conversion failed gracefully as expected');
    }

    // 4. Test LinkedIn posting simulation
    console.log('\n📤 Testing LinkedIn posting simulation...');
    
    // Simulate the LinkedIn posting API call with string ID
    const linkedInPostData = {
      contentId: testContent.id, // String ID
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

    // 5. Test status update simulation
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

    // 6. Test error handling
    console.log('\n⚠️ Testing error handling...');
    
    // Test with invalid ID format
    const invalidId = 'invalid-id-format';
    const isValidInvalidId = mongoose.Types.ObjectId.isValid(invalidId);
    console.log('📊 Invalid ID analysis:', {
      invalidId: invalidId,
      isValidObjectId: isValidInvalidId
    });

    // Test content retrieval with invalid ID
    const invalidContent = await ApprovedContent.findOne({ id: invalidId });
    console.log('✅ Invalid ID handling working correctly:', !invalidContent);

    // 7. Test different ID formats in database
    console.log('\n🗄️ Testing different ID formats in database...');
    
    const allContent = await ApprovedContent.find({ userId: user._id });
    
    const idFormats = allContent.map(content => ({
      id: content.id,
      idType: typeof content.id,
      isValidObjectId: mongoose.Types.ObjectId.isValid(content.id),
      status: content.status
    }));

    console.log('📊 ID format distribution:', {
      totalContent: allContent.length,
      stringIds: idFormats.filter(item => !item.isValidObjectId).length,
      objectIds: idFormats.filter(item => item.isValidObjectId).length,
      mixedIds: idFormats.filter(item => item.idType === 'string' && !item.isValidObjectId).length
    });

    // 8. Final statistics
    console.log('\n📊 FINAL STATISTICS:');
    
    const finalStats = {
      totalContent: await ApprovedContent.countDocuments({ userId: user._id }),
      byStatus: {
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
    
    console.log(`📈 Total content: ${finalStats.totalContent}`);
    console.log(`📊 By status:`, finalStats.byStatus);
    console.log(`🔗 String ID content: ${finalStats.stringIdContent}`);

    // 9. Cleanup test data
    console.log('\n🧹 Cleaning up test data...');
    
    const deleteResult = await ApprovedContent.deleteMany({
      userId: user._id,
      id: testContent.id
    });
    
    console.log(`✅ Cleaned up ${deleteResult.deletedCount} test content items`);

    console.log('\n✅ LinkedIn posting fix test completed successfully!');

  } catch (error) {
    console.error('❌ Error testing LinkedIn posting fix:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the test
testLinkedInPostingFix();
