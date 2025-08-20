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
    enum: ["generated", "approved", "posted", "failed"],
    default: "generated",
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

// Pre-save middleware
approvedContentSchema.pre("save", function (next) {
  if (!this.id || this.id === null || this.id === undefined) {
    this.id = `content-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${this._id?.toString().substr(-4) || Math.random().toString(36).substr(2, 4)}`
  }
  if (!this.topicId || this.topicId === null) {
    this.topicId = `topic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
  if (this.status === "approved" && !this.approvedAt) {
    this.approvedAt = new Date()
  }
  if (this.status === "posted" && !this.postedAt) {
    this.postedAt = new Date()
  }
  this.updatedAt = new Date()
  next()
});

// Indexes
approvedContentSchema.index({ userId: 1, status: 1 });
approvedContentSchema.index({ topicId: 1 });
approvedContentSchema.index({ createdAt: -1 });
approvedContentSchema.index({ id: 1 }, { unique: true, sparse: false });
approvedContentSchema.index({ userId: 1, createdAt: -1 });

// Create models
const User = mongoose.model('User', userSchema);
const ApprovedContent = mongoose.model('ApprovedContent', approvedContentSchema);

// Mock API functions to simulate the actual API behavior
async function mockApiGET(userId, queryParams = {}) {
  try {
    const filter = { userId };
    
    if (queryParams.status && queryParams.status !== 'all') {
      filter.status = queryParams.status;
    }
    if (queryParams.contentType && queryParams.contentType !== 'all') {
      filter.contentType = queryParams.contentType;
    }

    const page = parseInt(queryParams.page) || 1;
    const limit = parseInt(queryParams.limit) || 20;
    const skip = (page - 1) * limit;

    const content = await ApprovedContent.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalCount = await ApprovedContent.countDocuments(filter);

    return {
      success: true,
      content: content,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function mockApiPOST(userId, data) {
  try {
    if (!data.topicTitle || !data.content) {
      return {
        success: false,
        error: "Topic title and content are required"
      };
    }

    const newContent = new ApprovedContent({
      ...data,
      userId
    });

    await newContent.save();

    return {
      success: true,
      content: newContent
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function mockApiPUT(userId, id, updates) {
  try {
    if (!id) {
      return {
        success: false,
        error: "Content ID is required"
      };
    }

    const updatedContent = await ApprovedContent.findOneAndUpdate(
      { id, userId },
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!updatedContent) {
      return {
        success: false,
        error: "Content not found"
      };
    }

    return {
      success: true,
      content: updatedContent
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function mockApiDELETE(userId, id) {
  try {
    if (!id) {
      return {
        success: false,
        error: "Content ID is required"
      };
    }

    const deletedContent = await ApprovedContent.findOneAndDelete({
      id,
      userId
    });

    if (!deletedContent) {
      return {
        success: false,
        error: "Content not found"
      };
    }

    return {
      success: true,
      message: "Content deleted successfully"
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function testApprovedContentAPI() {
  try {
    console.log('🧪 Testing Approved Content API Operations...\n');

    // Find a test user
    const user = await User.findOne({});
    if (!user) {
      console.log('❌ No user found for testing');
      return;
    }

    console.log(`👤 Testing with user: ${user.email}`);

    // 1. Test GET API - List all content
    console.log('\n📖 Testing GET API - List all content...');
    
    const getResult = await mockApiGET(user._id);
    if (getResult.success) {
      console.log('✅ GET API successful:', {
        contentCount: getResult.content.length,
        totalPages: getResult.pagination.pages,
        totalItems: getResult.pagination.total
      });
    } else {
      console.log('❌ GET API failed:', getResult.error);
    }

    // 2. Test GET API - With filters
    console.log('\n🔍 Testing GET API - With filters...');
    
    const getFilteredResult = await mockApiGET(user._id, {
      status: 'generated',
      contentType: 'storytelling',
      page: 1,
      limit: 10
    });
    
    if (getFilteredResult.success) {
      console.log('✅ GET API with filters successful:', {
        contentCount: getFilteredResult.content.length,
        appliedFilters: 'status=generated, contentType=storytelling'
      });
    } else {
      console.log('❌ GET API with filters failed:', getFilteredResult.error);
    }

    // 3. Test POST API - Create new content
    console.log('\n📝 Testing POST API - Create content...');
    
    const createData = {
      topicId: `api-topic-${Date.now()}`,
      topicTitle: `API Test Topic ${Date.now()}`,
      content: `This is test content created via API at ${new Date().toISOString()}. Testing the POST endpoint functionality.`,
      hashtags: ['#api-test', '#post-endpoint', '#approved-content'],
      keyPoints: ['API Point 1: Testing POST operation', 'API Point 2: Verifying data creation', 'API Point 3: Ensuring proper validation'],
      contentType: 'storytelling',
      platform: 'linkedin',
      status: 'generated'
    };

    const postResult = await mockApiPOST(user._id, createData);
    if (postResult.success) {
      console.log('✅ POST API successful:', {
        id: postResult.content.id,
        topicTitle: postResult.content.topicTitle,
        status: postResult.content.status
      });
      
      // Store the created content ID for later tests
      const createdContentId = postResult.content.id;
      
      // 4. Test PUT API - Update content
      console.log('\n🔄 Testing PUT API - Update content...');
      
      const updateData = {
        topicTitle: `Updated API Topic ${Date.now()}`,
        content: `This content has been updated via API at ${new Date().toISOString()}. The PUT endpoint is working correctly.`,
        status: 'approved',
        hashtags: ['#updated', '#api-test', '#approved'],
        keyPoints: ['Updated API Point 1: Testing PUT operation', 'Updated API Point 2: Verifying changes', 'Updated API Point 3: Status change to approved']
      };

      const putResult = await mockApiPUT(user._id, createdContentId, updateData);
      if (putResult.success) {
        console.log('✅ PUT API successful:', {
          id: putResult.content.id,
          topicTitle: putResult.content.topicTitle,
          status: putResult.content.status,
          updatedAt: putResult.content.updatedAt
        });
      } else {
        console.log('❌ PUT API failed:', putResult.error);
      }

      // 5. Test DELETE API - Delete content
      console.log('\n🗑️ Testing DELETE API - Delete content...');
      
      const deleteResult = await mockApiDELETE(user._id, createdContentId);
      if (deleteResult.success) {
        console.log('✅ DELETE API successful:', deleteResult.message);
      } else {
        console.log('❌ DELETE API failed:', deleteResult.error);
      }

      // 6. Verify deletion
      const verifyDeleted = await ApprovedContent.findOne({
        id: createdContentId,
        userId: user._id
      });

      if (!verifyDeleted) {
        console.log('✅ Confirmed content was deleted via API');
      } else {
        console.log('❌ Content still exists after API deletion');
      }
    } else {
      console.log('❌ POST API failed:', postResult.error);
    }

    // 7. Test error handling
    console.log('\n⚠️ Testing API ERROR handling...');
    
    // Test POST with missing required fields
    const invalidPostResult = await mockApiPOST(user._id, {
      topicId: 'test-topic',
      // Missing topicTitle and content
    });
    
    if (!invalidPostResult.success) {
      console.log('✅ POST API properly handled missing required fields');
    } else {
      console.log('❌ POST API should have failed for missing fields');
    }

    // Test PUT with non-existent ID
    const invalidPutResult = await mockApiPUT(user._id, 'non-existent-id', {
      topicTitle: 'This should not work'
    });
    
    if (!invalidPutResult.success) {
      console.log('✅ PUT API properly handled non-existent content');
    } else {
      console.log('❌ PUT API should have failed for non-existent content');
    }

    // Test DELETE with non-existent ID
    const invalidDeleteResult = await mockApiDELETE(user._id, 'non-existent-id');
    
    if (!invalidDeleteResult.success) {
      console.log('✅ DELETE API properly handled non-existent content');
    } else {
      console.log('❌ DELETE API should have failed for non-existent content');
    }

    // 8. Test pagination
    console.log('\n📄 Testing API PAGINATION...');
    
    // Create multiple test items for pagination
    const paginationItems = [];
    for (let i = 1; i <= 5; i++) {
      paginationItems.push({
        topicId: `pagination-topic-${i}`,
        topicTitle: `Pagination Test Topic ${i}`,
        content: `Pagination test content ${i} created at ${new Date().toISOString()}`,
        hashtags: [`#pagination-${i}`, '#test'],
        keyPoints: [`Pagination point ${i}: Testing pagination`],
        contentType: 'storytelling',
        platform: 'linkedin',
        status: 'generated',
        userId: user._id
      });
    }

    await ApprovedContent.insertMany(paginationItems);
    console.log('✅ Created pagination test items');

    // Test pagination
    const page1Result = await mockApiGET(user._id, { page: 1, limit: 2 });
    const page2Result = await mockApiGET(user._id, { page: 2, limit: 2 });
    
    if (page1Result.success && page2Result.success) {
      console.log('✅ Pagination working correctly:', {
        page1Count: page1Result.content.length,
        page2Count: page2Result.content.length,
        totalPages: page1Result.pagination.pages
      });
    } else {
      console.log('❌ Pagination failed');
    }

    // Clean up pagination test items
    await ApprovedContent.deleteMany({
      userId: user._id,
      topicId: { $regex: /^pagination-topic-/ }
    });
    console.log('✅ Cleaned up pagination test items');

    // 9. Test bulk operations via API
    console.log('\n📦 Testing API BULK operations...');
    
    // Create multiple items via API
    const bulkCreatePromises = [];
    for (let i = 1; i <= 3; i++) {
      bulkCreatePromises.push(mockApiPOST(user._id, {
        topicId: `bulk-api-topic-${i}`,
        topicTitle: `Bulk API Test Topic ${i}`,
        content: `Bulk API test content ${i} created at ${new Date().toISOString()}`,
        hashtags: [`#bulk-api-${i}`, '#test'],
        keyPoints: [`Bulk API point ${i}: Testing bulk operations`],
        contentType: 'storytelling',
        platform: 'linkedin',
        status: 'generated'
      }));
    }

    const bulkCreateResults = await Promise.all(bulkCreatePromises);
    const successfulCreates = bulkCreateResults.filter(result => result.success);
    
    console.log(`✅ Successfully created ${successfulCreates.length} items via API`);

    // Bulk update via API
    const bulkUpdatePromises = successfulCreates.map(result => 
      mockApiPUT(user._id, result.content.id, {
        status: 'approved',
        approvedAt: new Date()
      })
    );

    const bulkUpdateResults = await Promise.all(bulkUpdatePromises);
    const successfulUpdates = bulkUpdateResults.filter(result => result.success);
    
    console.log(`✅ Successfully updated ${successfulUpdates.length} items via API`);

    // Bulk delete via API
    const bulkDeletePromises = successfulCreates.map(result => 
      mockApiDELETE(user._id, result.content.id)
    );

    const bulkDeleteResults = await Promise.all(bulkDeletePromises);
    const successfulDeletes = bulkDeleteResults.filter(result => result.success);
    
    console.log(`✅ Successfully deleted ${successfulDeletes.length} items via API`);

    // 10. Final API statistics
    console.log('\n📊 API TEST STATISTICS:');
    
    const finalApiStats = {
      totalContent: await ApprovedContent.countDocuments({ userId: user._id }),
      byStatus: {
        generated: await ApprovedContent.countDocuments({ userId: user._id, status: 'generated' }),
        approved: await ApprovedContent.countDocuments({ userId: user._id, status: 'approved' }),
        posted: await ApprovedContent.countDocuments({ userId: user._id, status: 'posted' }),
        failed: await ApprovedContent.countDocuments({ userId: user._id, status: 'failed' })
      }
    };
    
    console.log(`📈 Total content via API: ${finalApiStats.totalContent}`);
    console.log(`📊 By status:`, finalApiStats.byStatus);

    console.log('\n✅ Approved Content API operations test completed successfully!');

  } catch (error) {
    console.error('❌ Error testing approved content API:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the test
testApprovedContentAPI();
