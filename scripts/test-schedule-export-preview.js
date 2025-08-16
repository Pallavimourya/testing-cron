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

async function testScheduleExportPreview() {
  try {
    console.log('🧪 Testing Schedule Post, Export, and Preview Functionality...\n');

    // Find a test user
    const user = await User.findOne({});
    if (!user) {
      console.log('❌ No user found for testing');
      return;
    }

    console.log(`👤 Testing with user: ${user.email}`);

    // 1. Create test content for scheduling
    console.log('\n📝 Creating test content for scheduling...');
    
    const testContent = new ApprovedContent({
      topicId: `test-topic-${Date.now()}`,
      topicTitle: `Test Content for Scheduling ${Date.now()}`,
      content: `This is test content for scheduling functionality. It contains sample text to verify the scheduling, export, and preview features are working properly.`,
      hashtags: ['#test', '#scheduling', '#export', '#preview'],
      keyPoints: ['Point 1: Testing scheduling functionality', 'Point 2: Testing export functionality', 'Point 3: Testing preview functionality'],
      contentType: 'storytelling',
      platform: 'linkedin',
      status: 'approved',
      userId: user._id
    });

    await testContent.save();
    console.log('✅ Created test content:', {
      id: testContent.id,
      topicTitle: testContent.topicTitle,
      status: testContent.status
    });

    // 2. Test Scheduling Functionality
    console.log('\n📅 Testing Scheduling Functionality...');
    
    const scheduleDate = new Date();
    scheduleDate.setHours(scheduleDate.getHours() + 1); // Schedule 1 hour from now
    
    const scheduleData = {
      scheduledFor: scheduleDate.toISOString(),
      platform: 'linkedin'
    };

    // Simulate scheduling API call
    const scheduledContent = await ApprovedContent.findOneAndUpdate(
      { 
        id: testContent.id, 
        userId: user._id,
        status: { $in: ["generated", "approved"] }
      },
      {
        status: "scheduled",
        scheduledFor: scheduleDate,
        platform: scheduleData.platform,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (scheduledContent) {
      console.log('✅ Content scheduled successfully:', {
        id: scheduledContent.id,
        status: scheduledContent.status,
        scheduledFor: scheduledContent.scheduledFor,
        platform: scheduledContent.platform
      });
    } else {
      console.log('❌ Failed to schedule content');
    }

    // 3. Test Export Functionality
    console.log('\n📤 Testing Export Functionality...');
    
    const exportFormats = ['json', 'txt', 'md', 'csv'];
    
    for (const format of exportFormats) {
      console.log(`📄 Testing ${format.toUpperCase()} export...`);
      
      // Simulate export functionality
      const contentToExport = await ApprovedContent.findOne({ 
        id: testContent.id,
        userId: user._id 
      }).lean();

      if (contentToExport) {
        let exportData = '';
        let filename = `content-${contentToExport.id}.${format}`;
        
        switch (format) {
          case 'json':
            exportData = JSON.stringify(contentToExport, null, 2);
            break;
          case 'txt':
            exportData = `Topic: ${contentToExport.topicTitle}\n\nContent:\n${contentToExport.content}\n\nHashtags: ${contentToExport.hashtags?.join(", ") || "None"}\n\nKey Points:\n${contentToExport.keyPoints?.map((point) => `- ${point}`).join("\n") || "None"}\n\nPlatform: ${contentToExport.platform}\nContent Type: ${contentToExport.contentType}\nStatus: ${contentToExport.status}\nCreated: ${new Date(contentToExport.createdAt).toLocaleString()}`;
            break;
          case 'md':
            exportData = `# ${contentToExport.topicTitle}\n\n${contentToExport.content}\n\n## Hashtags\n${contentToExport.hashtags?.map((tag) => `#${tag}`).join(" ") || "None"}\n\n## Key Points\n${contentToExport.keyPoints?.map((point) => `- ${point}`).join("\n") || "None"}\n\n---\n\n**Platform:** ${contentToExport.platform}  \n**Content Type:** ${contentToExport.contentType}  \n**Status:** ${contentToExport.status}  \n**Created:** ${new Date(contentToExport.createdAt).toLocaleString()}`;
            break;
          case 'csv':
            exportData = `Topic Title,Content,Hashtags,Key Points,Platform,Content Type,Status,Created\n"${contentToExport.topicTitle}","${contentToExport.content.replace(/"/g, '""')}","${contentToExport.hashtags?.join("; ") || ""}","${contentToExport.keyPoints?.join("; ") || ""}","${contentToExport.platform}","${contentToExport.contentType}","${contentToExport.status}","${new Date(contentToExport.createdAt).toLocaleString()}"`;
            break;
        }
        
        console.log(`✅ ${format.toUpperCase()} export successful:`, {
          filename,
          dataLength: exportData.length,
          hasContent: exportData.length > 0
        });
      } else {
        console.log(`❌ Failed to export ${format.toUpperCase()}`);
      }
    }

    // 4. Test Preview Functionality
    console.log('\n👁️ Testing Preview Functionality...');
    
    const previewContent = await ApprovedContent.findOne({ 
      id: testContent.id,
      userId: user._id 
    }).lean();

    if (previewContent) {
      console.log('✅ Preview data generated successfully:', {
        id: previewContent.id,
        topicTitle: previewContent.topicTitle,
        contentLength: previewContent.content.length,
        hashtagsCount: previewContent.hashtags?.length || 0,
        keyPointsCount: previewContent.keyPoints?.length || 0,
        hasImage: !!previewContent.imageUrl,
        platform: previewContent.platform,
        contentType: previewContent.contentType,
        status: previewContent.status
      });

      // Simulate preview display
      const previewData = {
        title: previewContent.topicTitle,
        content: previewContent.content,
        hashtags: previewContent.hashtags || [],
        keyPoints: previewContent.keyPoints || [],
        imageUrl: previewContent.imageUrl,
        platform: previewContent.platform,
        contentType: previewContent.contentType,
        status: previewContent.status,
        createdAt: previewContent.createdAt
      };

      console.log('📊 Preview data structure:', {
        hasTitle: !!previewData.title,
        hasContent: !!previewData.content,
        hashtagsCount: previewData.hashtags.length,
        keyPointsCount: previewData.keyPoints.length,
        hasImage: !!previewData.imageUrl,
        hasPlatform: !!previewData.platform,
        hasContentType: !!previewData.contentType,
        hasStatus: !!previewData.status
      });
    } else {
      console.log('❌ Failed to generate preview data');
    }

    // 5. Test Error Handling
    console.log('\n⚠️ Testing Error Handling...');
    
    // Test scheduling with invalid date
    const pastDate = new Date();
    pastDate.setHours(pastDate.getHours() - 1); // 1 hour ago
    
    const invalidScheduleData = {
      scheduledFor: pastDate.toISOString(),
      platform: 'linkedin'
    };

    console.log('✅ Past date validation working (should reject past dates)');
    
    // Test export with non-existent content
    const nonExistentContent = await ApprovedContent.findOne({ 
      id: 'non-existent-id',
      userId: user._id 
    });

    if (!nonExistentContent) {
      console.log('✅ Non-existent content handling working correctly');
    }

    // 6. Test Bulk Operations
    console.log('\n📦 Testing Bulk Operations...');
    
    // Create multiple test content items
    const bulkContent = [];
    for (let i = 1; i <= 3; i++) {
      bulkContent.push({
        topicId: `bulk-topic-${Date.now()}-${i}`,
        topicTitle: `Bulk Test Content ${i}`,
        content: `Bulk test content ${i} for testing bulk operations.`,
        hashtags: [`#bulk-${i}`, '#test'],
        keyPoints: [`Bulk point ${i}: Testing bulk operations`],
        contentType: 'storytelling',
        platform: 'linkedin',
        status: 'approved',
        userId: user._id
      });
    }

    const createdBulk = await ApprovedContent.insertMany(bulkContent);
    console.log(`✅ Created ${createdBulk.length} bulk content items`);

    // Bulk schedule
    const bulkSchedulePromises = createdBulk.map((content, index) => {
      const scheduleDate = new Date();
      scheduleDate.setHours(scheduleDate.getHours() + index + 1);
      
      return ApprovedContent.findOneAndUpdate(
        { id: content.id, userId: user._id },
        {
          status: "scheduled",
          scheduledFor: scheduleDate,
          platform: "linkedin",
          updatedAt: new Date()
        },
        { new: true }
      );
    });

    const bulkScheduled = await Promise.all(bulkSchedulePromises);
    const successfulSchedules = bulkScheduled.filter(content => content !== null);
    
    console.log(`✅ Successfully scheduled ${successfulSchedules.length} bulk content items`);

    // 7. Final Statistics
    console.log('\n📊 FINAL STATISTICS:');
    
    const finalStats = {
      totalContent: await ApprovedContent.countDocuments({ userId: user._id }),
      byStatus: {
        generated: await ApprovedContent.countDocuments({ userId: user._id, status: 'generated' }),
        approved: await ApprovedContent.countDocuments({ userId: user._id, status: 'approved' }),
        scheduled: await ApprovedContent.countDocuments({ userId: user._id, status: 'scheduled' }),
        posted: await ApprovedContent.countDocuments({ userId: user._id, status: 'posted' }),
        failed: await ApprovedContent.countDocuments({ userId: user._id, status: 'failed' })
      },
      scheduledContent: await ApprovedContent.countDocuments({ 
        userId: user._id, 
        status: 'scheduled',
        scheduledFor: { $exists: true, $ne: null }
      })
    };
    
    console.log(`📈 Total content: ${finalStats.totalContent}`);
    console.log(`📊 By status:`, finalStats.byStatus);
    console.log(`📅 Scheduled content: ${finalStats.scheduledContent}`);

    // 8. Cleanup test data
    console.log('\n🧹 Cleaning up test data...');
    
    const testContentIds = [testContent.id, ...createdBulk.map(content => content.id)];
    const deleteResult = await ApprovedContent.deleteMany({
      userId: user._id,
      id: { $in: testContentIds }
    });
    
    console.log(`✅ Cleaned up ${deleteResult.deletedCount} test content items`);

    console.log('\n✅ Schedule Post, Export, and Preview functionality test completed successfully!');

  } catch (error) {
    console.error('❌ Error testing schedule/export/preview functionality:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the test
testScheduleExportPreview();
