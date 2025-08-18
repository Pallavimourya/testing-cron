const mongoose = require('mongoose');
const fetch = require('node-fetch');
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

// Create models
const User = mongoose.model('User', userSchema);
const ApprovedContent = mongoose.model('ApprovedContent', approvedContentSchema);

// Helper function to make API requests
async function makeApiRequest(endpoint, options = {}) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const url = `${baseUrl}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const finalOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    console.log(`🌐 Making API request to: ${url}`);
    const response = await fetch(url, finalOptions);
    const data = await response.json();
    
    return {
      success: response.ok,
      status: response.status,
      data: data,
      headers: response.headers,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

async function testRealApiCRUD() {
  try {
    console.log('🧪 Testing Real API CRUD Operations...\n');

    // Find a test user
    const user = await User.findOne({});
    if (!user) {
      console.log('❌ No user found for testing');
      return;
    }

    console.log(`👤 Testing with user: ${user.email}`);

    // 1. Test GET API - List all content
    console.log('\n📖 Testing GET /api/approved-content...');
    
    const getResult = await makeApiRequest('/api/approved-content');
    if (getResult.success) {
      console.log('✅ GET API successful:', {
        status: getResult.status,
        contentCount: getResult.data.content?.length || 0,
        totalItems: getResult.data.pagination?.total || 0
      });
    } else {
      console.log('❌ GET API failed:', getResult.error || getResult.data?.error);
    }

    // 2. Test GET API - With filters
    console.log('\n🔍 Testing GET /api/approved-content with filters...');
    
    const getFilteredResult = await makeApiRequest('/api/approved-content?status=generated&contentType=storytelling&page=1&limit=10');
    if (getFilteredResult.success) {
      console.log('✅ GET API with filters successful:', {
        status: getFilteredResult.status,
        contentCount: getFilteredResult.data.content?.length || 0,
        appliedFilters: 'status=generated, contentType=storytelling'
      });
    } else {
      console.log('❌ GET API with filters failed:', getFilteredResult.error || getFilteredResult.data?.error);
    }

    // 3. Test POST API - Create new content
    console.log('\n📝 Testing POST /api/approved-content...');

    const createData = {
      topicId: `api-topic-${Date.now()}`,
      topicTitle: `Real API Test Topic ${Date.now()}`,
      content: `This is test content created via real API at ${new Date().toISOString()}. Testing the actual POST endpoint functionality.`,
      hashtags: ['#real-api-test', '#post-endpoint', '#approved-content'],
      keyPoints: ['Real API Point 1: Testing POST operation', 'Real API Point 2: Verifying data creation', 'Real API Point 3: Ensuring proper validation'],
      contentType: 'storytelling',
      platform: 'linkedin',
      status: 'generated'
    };

    const postResult = await makeApiRequest('/api/approved-content', {
      method: 'POST',
      body: JSON.stringify(createData)
    });

    let createdContentId = null;
    if (postResult.success) {
      console.log('✅ POST API successful:', {
        status: postResult.status,
        id: postResult.data.content?.id,
        topicTitle: postResult.data.content?.topicTitle,
        status: postResult.data.content?.status
      });
      createdContentId = postResult.data.content?.id;
    } else {
      console.log('❌ POST API failed:', postResult.error || postResult.data?.error);
    }

    // 4. Test PUT API - Update content (if creation was successful)
    if (createdContentId) {
      console.log('\n🔄 Testing PUT /api/approved-content...');
    
    const updateData = {
        id: createdContentId,
        topicTitle: `Updated Real API Topic ${Date.now()}`,
        content: `This content has been updated via real API at ${new Date().toISOString()}. The PUT endpoint is working correctly.`,
        status: 'approved',
        hashtags: ['#updated', '#real-api-test', '#approved'],
        keyPoints: ['Updated Real API Point 1: Testing PUT operation', 'Updated Real API Point 2: Verifying changes', 'Updated Real API Point 3: Status change to approved']
      };

      const putResult = await makeApiRequest('/api/approved-content', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

      if (putResult.success) {
        console.log('✅ PUT API successful:', {
          status: putResult.status,
          id: putResult.data.content?.id,
          topicTitle: putResult.data.content?.topicTitle,
          status: putResult.data.content?.status
        });
    } else {
        console.log('❌ PUT API failed:', putResult.error || putResult.data?.error);
      }

      // 5. Test GET single content by ID
      console.log('\n📖 Testing GET /api/approved-content/[id]...');
      
      const getSingleResult = await makeApiRequest(`/api/approved-content/${createdContentId}`);
      if (getSingleResult.success) {
        console.log('✅ GET single content API successful:', {
          status: getSingleResult.status,
          id: getSingleResult.data.content?.id,
          topicTitle: getSingleResult.data.content?.topicTitle
        });
    } else {
        console.log('❌ GET single content API failed:', getSingleResult.error || getSingleResult.data?.error);
      }

      // 6. Test PUT single content by ID
      console.log('\n🔄 Testing PUT /api/approved-content/[id]...');
      
      const updateSingleData = {
        topicTitle: `Updated Single API Topic ${Date.now()}`,
        content: `This content has been updated via single API at ${new Date().toISOString()}.`,
        status: 'posted',
        hashtags: ['#single-update', '#real-api-test', '#posted']
      };

      const putSingleResult = await makeApiRequest(`/api/approved-content/${createdContentId}`, {
        method: 'PUT',
        body: JSON.stringify(updateSingleData)
      });

      if (putSingleResult.success) {
        console.log('✅ PUT single content API successful:', {
          status: putSingleResult.status,
          id: putSingleResult.data.content?.id,
          topicTitle: putSingleResult.data.content?.topicTitle,
          status: putSingleResult.data.content?.status
        });
    } else {
        console.log('❌ PUT single content API failed:', putSingleResult.error || putSingleResult.data?.error);
      }

      // 7. Test DELETE API - Delete content
      console.log('\n🗑️ Testing DELETE /api/approved-content...');
      
      const deleteResult = await makeApiRequest(`/api/approved-content?id=${createdContentId}`, {
        method: 'DELETE'
      });

      if (deleteResult.success) {
        console.log('✅ DELETE API successful:', {
          status: deleteResult.status,
          message: deleteResult.data?.message
        });
      } else {
        console.log('❌ DELETE API failed:', deleteResult.error || deleteResult.data?.error);
      }

      // 8. Test DELETE single content by ID
      console.log('\n🗑️ Testing DELETE /api/approved-content/[id]...');
      
      // First create another content for deletion test
      const createForDeleteData = {
        topicId: `delete-test-topic-${Date.now()}`,
        topicTitle: `Delete Test Topic ${Date.now()}`,
        content: `This content will be deleted via single DELETE API.`,
        hashtags: ['#delete-test'],
        keyPoints: ['Delete test point'],
        contentType: 'storytelling',
        platform: 'linkedin',
        status: 'generated'
      };

      const createForDeleteResult = await makeApiRequest('/api/approved-content', {
        method: 'POST',
        body: JSON.stringify(createForDeleteData)
      });

      if (createForDeleteResult.success) {
        const deleteContentId = createForDeleteResult.data.content?.id;
        
        const deleteSingleResult = await makeApiRequest(`/api/approved-content/${deleteContentId}`, {
          method: 'DELETE'
        });

        if (deleteSingleResult.success) {
          console.log('✅ DELETE single content API successful:', {
            status: deleteSingleResult.status,
            message: deleteSingleResult.data?.message
          });
        } else {
          console.log('❌ DELETE single content API failed:', deleteSingleResult.error || deleteSingleResult.data?.error);
        }
      }
    }

    // 9. Test error handling
    console.log('\n⚠️ Testing API ERROR handling...');
    
    // Test POST with missing required fields
    const invalidPostResult = await makeApiRequest('/api/approved-content', {
      method: 'POST',
      body: JSON.stringify({
        topicId: 'test-topic',
        // Missing topicTitle and content
      })
    });
    
    if (!invalidPostResult.success) {
      console.log('✅ POST API properly handled missing required fields');
    } else {
      console.log('❌ POST API should have failed for missing fields');
    }

    // Test PUT with non-existent ID
    const invalidPutResult = await makeApiRequest('/api/approved-content', {
      method: 'PUT',
      body: JSON.stringify({
        id: 'non-existent-id',
        topicTitle: 'This should not work'
      })
    });
    
    if (!invalidPutResult.success) {
      console.log('✅ PUT API properly handled non-existent content');
    } else {
      console.log('❌ PUT API should have failed for non-existent content');
    }

    // Test DELETE with non-existent ID
    const invalidDeleteResult = await makeApiRequest('/api/approved-content?id=non-existent-id', {
      method: 'DELETE'
    });
    
    if (!invalidDeleteResult.success) {
      console.log('✅ DELETE API properly handled non-existent content');
    } else {
      console.log('❌ DELETE API should have failed for non-existent content');
    }

    // 10. Final API statistics
    console.log('\n📊 REAL API TEST STATISTICS:');
    
    const finalApiStats = {
      totalContent: await ApprovedContent.countDocuments({ userId: user._id }),
      byStatus: {
        generated: await ApprovedContent.countDocuments({ userId: user._id, status: 'generated' }),
        approved: await ApprovedContent.countDocuments({ userId: user._id, status: 'approved' }),
        posted: await ApprovedContent.countDocuments({ userId: user._id, status: 'posted' }),
        failed: await ApprovedContent.countDocuments({ userId: user._id, status: 'failed' })
      }
    };
    
    console.log(`📈 Total content via Real API: ${finalApiStats.totalContent}`);
    console.log(`📊 By status:`, finalApiStats.byStatus);

    console.log('\n✅ Real API CRUD operations test completed!');

  } catch (error) {
    console.error('❌ Error testing real API CRUD:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the test
testRealApiCRUD();
