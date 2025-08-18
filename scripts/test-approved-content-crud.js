const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

// Define schemas inline (since models are TypeScript)
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

// Pre-save middleware to ensure unique ID generation
approvedContentSchema.pre("save", function (next) {
  // Always generate a unique ID if not present or if it's null
  if (!this.id || this.id === null || this.id === undefined) {
    this.id = `content-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${this._id?.toString().substr(-4) || Math.random().toString(36).substr(2, 4)}`
  }

  // Ensure topicId is present
  if (!this.topicId || this.topicId === null) {
    this.topicId = `topic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // Update timestamps based on status
  if (this.status === "approved" && !this.approvedAt) {
    this.approvedAt = new Date()
  }
  if (this.status === "posted" && !this.postedAt) {
    this.postedAt = new Date()
  }

  this.updatedAt = new Date()
  next()
});

// Pre-validate middleware to ensure ID is never null
approvedContentSchema.pre("validate", function (next) {
  if (!this.id || this.id === null || this.id === undefined) {
    this.id = `content-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${this._id?.toString().substr(-4) || Math.random().toString(36).substr(2, 4)}`
  }
  next()
});

// Indexes for better performance
approvedContentSchema.index({ userId: 1, status: 1 });
approvedContentSchema.index({ topicId: 1 });
approvedContentSchema.index({ createdAt: -1 });
approvedContentSchema.index({ id: 1 }, { unique: true, sparse: false });
approvedContentSchema.index({ userId: 1, createdAt: -1 });

// Create models
const User = mongoose.model('User', userSchema);
const ApprovedContent = mongoose.model('ApprovedContent', approvedContentSchema);

async function testApprovedContentCRUD() {
  try {
    console.log('🧪 Testing Approved Content CRUD Operations...\n');

    // Find a test user
    const user = await User.findOne({});
    if (!user) {
      console.log('❌ No user found for testing');
      return;
    }

    console.log(`👤 Testing with user: ${user.email}`);

    // 1. CREATE - Test creating new approved content
    console.log('\n📝 Testing CREATE operation...');
    
    const testContent = {
      topicId: `topic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      topicTitle: `Test Topic ${Date.now()}`,
      content: `This is a test content created at ${new Date().toISOString()}. It contains some sample text to verify the CRUD operations are working properly.`,
      hashtags: ['#test', '#crud', '#approved-content'],
      keyPoints: ['Point 1: Testing create operation', 'Point 2: Verifying data structure', 'Point 3: Ensuring proper validation'],
      contentType: 'storytelling',
      platform: 'linkedin',
      status: 'generated'
    };

    const newContent = new ApprovedContent({
      ...testContent,
      userId: user._id
    });

    await newContent.save();
    console.log('✅ Created new approved content:', {
      id: newContent.id,
      topicTitle: newContent.topicTitle,
      status: newContent.status
    });

    // 2. READ - Test reading approved content
    console.log('\n📖 Testing READ operations...');
    
    // Read single content by ID
    const readContent = await ApprovedContent.findOne({ 
      id: newContent.id,
      userId: user._id 
    });
    
    if (readContent) {
      console.log('✅ Successfully read content by ID:', {
        id: readContent.id,
        topicTitle: readContent.topicTitle,
        contentLength: readContent.content.length
      });
    } else {
      console.log('❌ Failed to read content by ID');
    }

    // Read all content for user
    const allContent = await ApprovedContent.find({ 
      userId: user._id 
    }).sort({ createdAt: -1 });
    
    console.log(`✅ Found ${allContent.length} total content items for user`);

    // Read content with filters
    const generatedContent = await ApprovedContent.find({ 
      userId: user._id,
      status: 'generated'
    });
    
    console.log(`✅ Found ${generatedContent.length} generated content items`);

    // 3. UPDATE - Test updating approved content
    console.log('\n🔄 Testing UPDATE operations...');
    
    const updateData = {
      topicTitle: `Updated Topic ${Date.now()}`,
      content: `This content has been updated at ${new Date().toISOString()}. The update operation is working correctly.`,
      status: 'approved',
      hashtags: ['#updated', '#test', '#approved'],
      keyPoints: ['Updated Point 1: Testing update operation', 'Updated Point 2: Verifying changes', 'Updated Point 3: Status change to approved']
    };

    const updatedContent = await ApprovedContent.findOneAndUpdate(
      { id: newContent.id, userId: user._id },
      updateData,
      { new: true, runValidators: true }
    );

    if (updatedContent) {
      console.log('✅ Successfully updated content:', {
        id: updatedContent.id,
        topicTitle: updatedContent.topicTitle,
        status: updatedContent.status,
        updatedAt: updatedContent.updatedAt
      });
    } else {
      console.log('❌ Failed to update content');
    }

    // 4. DELETE - Test deleting approved content
    console.log('\n🗑️ Testing DELETE operations...');
    
    const deletedContent = await ApprovedContent.findOneAndDelete({
      id: newContent.id,
      userId: user._id
    });

    if (deletedContent) {
      console.log('✅ Successfully deleted content:', {
        id: deletedContent.id,
        topicTitle: deletedContent.topicTitle
      });
    } else {
      console.log('❌ Failed to delete content');
    }

    // 5. Verify deletion
    const verifyDeleted = await ApprovedContent.findOne({
      id: newContent.id,
      userId: user._id
    });

    if (!verifyDeleted) {
      console.log('✅ Confirmed content was deleted (not found in database)');
    } else {
      console.log('❌ Content still exists after deletion');
    }

    // 6. Test bulk operations
    console.log('\n📦 Testing BULK operations...');
    
    // Create multiple test content items
    const bulkContent = [];
    for (let i = 1; i <= 3; i++) {
      bulkContent.push({
        topicId: `bulk-topic-${Date.now()}-${i}`,
        topicTitle: `Bulk Test Topic ${i}`,
        content: `Bulk test content ${i} created at ${new Date().toISOString()}`,
        hashtags: [`#bulk-${i}`, '#test'],
        keyPoints: [`Bulk point ${i}: Testing bulk operations`],
        contentType: 'storytelling',
        platform: 'linkedin',
        status: 'generated',
        userId: user._id
      });
    }

    const createdBulk = await ApprovedContent.insertMany(bulkContent);
    console.log(`✅ Created ${createdBulk.length} bulk content items`);

    // Bulk update
    const bulkUpdateResult = await ApprovedContent.updateMany(
      { 
        userId: user._id,
        topicId: { $regex: /^bulk-topic-/ }
      },
      { 
        status: 'approved',
        approvedAt: new Date()
      }
    );

    console.log(`✅ Bulk updated ${bulkUpdateResult.modifiedCount} content items`);

    // Bulk delete
    const bulkDeleteResult = await ApprovedContent.deleteMany({
      userId: user._id,
      topicId: { $regex: /^bulk-topic-/ }
    });

    console.log(`✅ Bulk deleted ${bulkDeleteResult.deletedCount} content items`);

    // 7. Test error handling
    console.log('\n⚠️ Testing ERROR handling...');
    
    // Test creating content with missing required fields
    try {
      const invalidContent = new ApprovedContent({
        userId: user._id
        // Missing required fields
      });
      await invalidContent.save();
      console.log('❌ Should have failed - missing required fields');
    } catch (error) {
      console.log('✅ Properly caught validation error for missing fields');
    }

    // Test updating non-existent content
    const nonExistentUpdate = await ApprovedContent.findOneAndUpdate(
      { id: 'non-existent-id', userId: user._id },
      { topicTitle: 'This should not work' },
      { new: true }
    );

    if (!nonExistentUpdate) {
      console.log('✅ Properly handled update of non-existent content');
    } else {
      console.log('❌ Unexpectedly updated non-existent content');
    }

    // Test deleting non-existent content
    const nonExistentDelete = await ApprovedContent.findOneAndDelete({
      id: 'non-existent-id',
      userId: user._id
    });

    if (!nonExistentDelete) {
      console.log('✅ Properly handled deletion of non-existent content');
    } else {
      console.log('❌ Unexpectedly deleted non-existent content');
    }

    // 8. Test data integrity
    console.log('\n🔍 Testing DATA INTEGRITY...');
    
    // Check for duplicate IDs
    const allContentIds = await ApprovedContent.find({ userId: user._id }).distinct('id');
    const uniqueIds = new Set(allContentIds);
    
    if (allContentIds.length === uniqueIds.size) {
      console.log('✅ All content IDs are unique');
    } else {
      console.log('❌ Found duplicate content IDs');
    }

    // Check for orphaned content (content without valid user)
    const orphanedContent = await ApprovedContent.find({
      userId: { $exists: false }
    });
    
    if (orphanedContent.length === 0) {
      console.log('✅ No orphaned content found');
    } else {
      console.log(`⚠️ Found ${orphanedContent.length} orphaned content items`);
    }

    // 9. Performance test
    console.log('\n⚡ Testing PERFORMANCE...');
    
    const startTime = Date.now();
    const performanceContent = await ApprovedContent.find({ 
      userId: user._id 
    }).limit(100);
    const endTime = Date.now();
    
    console.log(`✅ Queried ${performanceContent.length} items in ${endTime - startTime}ms`);

    // 10. Final statistics
    console.log('\n📊 FINAL STATISTICS:');
    
    const finalStats = {
      totalContent: await ApprovedContent.countDocuments({ userId: user._id }),
      byStatus: {
        generated: await ApprovedContent.countDocuments({ userId: user._id, status: 'generated' }),
        approved: await ApprovedContent.countDocuments({ userId: user._id, status: 'approved' }),
        posted: await ApprovedContent.countDocuments({ userId: user._id, status: 'posted' }),
        failed: await ApprovedContent.countDocuments({ userId: user._id, status: 'failed' })
      },
      byContentType: {
        storytelling: await ApprovedContent.countDocuments({ userId: user._id, contentType: 'storytelling' }),
        listicle: await ApprovedContent.countDocuments({ userId: user._id, contentType: 'listicle' }),
        quote_based: await ApprovedContent.countDocuments({ userId: user._id, contentType: 'quote_based' }),
        before_after: await ApprovedContent.countDocuments({ userId: user._id, contentType: 'before_after' }),
        question_driven: await ApprovedContent.countDocuments({ userId: user._id, contentType: 'question_driven' })
      }
    };
    
    console.log(`📈 Total content: ${finalStats.totalContent}`);
    console.log(`📊 By status:`, finalStats.byStatus);
    console.log(`📝 By content type:`, finalStats.byContentType);

    console.log('\n✅ Approved Content CRUD operations test completed successfully!');

  } catch (error) {
    console.error('❌ Error testing approved content CRUD:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the test
testApprovedContentCRUD();
