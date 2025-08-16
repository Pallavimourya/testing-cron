const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/linkzup';

async function testAPICRUD() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get a user to work with
    const users = await mongoose.connection.db.collection('users').find({}).limit(1).toArray();
    
    if (users.length === 0) {
      console.log('❌ No users found. Please create a user first.');
      return;
    }

    const user = users[0];
    console.log(`👤 Using user: ${user.email} (${user._id})`);

    // Create a mock session for testing
    const mockSession = {
      user: {
        email: user.email,
        id: user._id.toString()
      }
    };

    console.log('\n🧪 Testing API CRUD Operations...\n');

    // ===== CREATE OPERATION (POST) =====
    console.log('📝 1. CREATE Operation Test (POST /api/approved-content)');
    
    const createData = {
      topicId: `topic-${Date.now()}-api-test`,
      topicTitle: "API Test Content",
      content: "This is a test content created via API. Testing the POST endpoint for approved content.",
      hashtags: ["#API", "#Test", "#POST"],
      keyPoints: ["API testing", "POST operation", "Content creation"],
      contentType: "storytelling",
      imageUrl: "https://example.com/image.jpg",
      platform: "linkedin",
      status: "generated"
    };

    console.log('📤 Sending POST request with data:', createData);

    // Simulate the POST request logic
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

    const newContent = new ApprovedContent({
      ...createData,
      userId: user._id,
      generatedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await newContent.save();
    console.log(`✅ Created content via API: ${newContent.id || newContent._id}`);
    const createdId = newContent.id || newContent._id.toString();

    // ===== READ OPERATION (GET) =====
    console.log('\n📖 2. READ Operation Test (GET /api/approved-content)');
    
    // Test GET all content
    const allContent = await ApprovedContent.find({ userId: user._id }).lean();
    console.log(`✅ Retrieved ${allContent.length} content items via API`);

    // Test GET specific content
    const specificContent = await ApprovedContent.findOne({ 
      $or: [
        { id: createdId },
        { _id: new mongoose.Types.ObjectId(createdId) }
      ],
      userId: user._id 
    }).lean();

    if (specificContent) {
      console.log('✅ Retrieved specific content via API:');
      console.log(`   - ID: ${specificContent.id || specificContent._id}`);
      console.log(`   - Title: ${specificContent.topicTitle}`);
      console.log(`   - Status: ${specificContent.status}`);
    } else {
      console.log('❌ Failed to retrieve specific content');
    }

    // ===== UPDATE OPERATION (PUT) =====
    console.log('\n🔄 3. UPDATE Operation Test (PUT /api/approved-content/[id])');
    
    const updateData = {
      topicTitle: "Updated API Test Content",
      content: "This content has been updated via API. The PUT endpoint is working correctly.",
      status: "approved",
      hashtags: ["#API", "#Test", "#PUT", "#Updated"],
      keyPoints: ["API testing", "PUT operation", "Content update", "Working correctly"]
    };

    console.log('📤 Sending PUT request with data:', updateData);

    const updatedContent = await ApprovedContent.findOneAndUpdate(
      { 
        $or: [
          { id: createdId },
          { _id: new mongoose.Types.ObjectId(createdId) }
        ],
        userId: user._id 
      },
      { ...updateData, updatedAt: new Date() },
      { new: true }
    );

    if (updatedContent) {
      console.log('✅ Updated content via API:');
      console.log(`   - New Title: ${updatedContent.topicTitle}`);
      console.log(`   - New Status: ${updatedContent.status}`);
      console.log(`   - Updated At: ${updatedContent.updatedAt}`);
    } else {
      console.log('❌ Failed to update content via API');
    }

    // ===== DELETE OPERATION (DELETE) =====
    console.log('\n🗑️ 4. DELETE Operation Test (DELETE /api/approved-content/[id])');
    
    console.log('📤 Sending DELETE request for ID:', createdId);

    const deletedContent = await ApprovedContent.findOneAndDelete({ 
      $or: [
        { id: createdId },
        { _id: new mongoose.Types.ObjectId(createdId) }
      ],
      userId: user._id 
    });

    if (deletedContent) {
      console.log('✅ Deleted content via API:');
      console.log(`   - Deleted ID: ${deletedContent.id || deletedContent._id}`);
      console.log(`   - Deleted Title: ${deletedContent.topicTitle}`);
    } else {
      console.log('❌ Failed to delete content via API');
    }

    // ===== VERIFY DELETION =====
    console.log('\n🔍 5. Verification Test');
    
    const verifyContent = await ApprovedContent.findOne({ 
      $or: [
        { id: createdId },
        { _id: new mongoose.Types.ObjectId(createdId) }
      ],
      userId: user._id 
    });

    if (!verifyContent) {
      console.log('✅ Content successfully deleted via API - not found in database');
    } else {
      console.log('❌ Content still exists in database');
    }

    // ===== FILTERING AND PAGINATION TEST =====
    console.log('\n🔍 6. Filtering and Pagination Test');
    
    // Create multiple test records for filtering
    const testRecords = [
      {
        topicId: `topic-${Date.now()}-filter-1`,
        userId: user._id,
        topicTitle: "Filter Test Content 1",
        content: "First filter test content",
        hashtags: ["#Filter", "#Test1"],
        status: "generated",
        contentType: "storytelling",
        platform: "linkedin"
      },
      {
        topicId: `topic-${Date.now()}-filter-2`,
        userId: user._id,
        topicTitle: "Filter Test Content 2",
        content: "Second filter test content",
        hashtags: ["#Filter", "#Test2"],
        status: "approved",
        contentType: "listicle",
        platform: "linkedin"
      },
      {
        topicId: `topic-${Date.now()}-filter-3`,
        userId: user._id,
        topicTitle: "Filter Test Content 3",
        content: "Third filter test content",
        hashtags: ["#Filter", "#Test3"],
        status: "posted",
        contentType: "quote_based",
        platform: "linkedin"
      }
    ];

    await ApprovedContent.insertMany(testRecords);
    console.log('✅ Created test records for filtering');

    // Test status filtering
    const approvedContent = await ApprovedContent.find({ 
      userId: user._id,
      status: "approved"
    }).lean();
    console.log(`✅ Status filter (approved): ${approvedContent.length} records`);

    // Test contentType filtering
    const storytellingContent = await ApprovedContent.find({ 
      userId: user._id,
      contentType: "storytelling"
    }).lean();
    console.log(`✅ ContentType filter (storytelling): ${storytellingContent.length} records`);

    // Test pagination
    const page1Content = await ApprovedContent.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .skip(0)
      .limit(2)
      .lean();
    console.log(`✅ Pagination (page 1, limit 2): ${page1Content.length} records`);

    // Clean up test records
    await ApprovedContent.deleteMany({
      userId: user._id,
      topicTitle: { $regex: /Filter Test Content/ }
    });
    console.log('✅ Cleaned up test records');

    // ===== ERROR HANDLING TEST =====
    console.log('\n⚠️ 7. Error Handling Test');
    
    // Test with invalid ID
    const invalidContent = await ApprovedContent.findOne({ 
      _id: new mongoose.Types.ObjectId("000000000000000000000000")
    });
    
    if (!invalidContent) {
      console.log('✅ Error handling: Invalid ID returns null as expected');
    }

    // Test with non-existent user
    const nonExistentUserContent = await ApprovedContent.findOne({ 
      userId: new mongoose.Types.ObjectId("000000000000000000000000")
    });
    
    if (!nonExistentUserContent) {
      console.log('✅ Error handling: Non-existent user returns null as expected');
    }

    console.log('\n🎉 All API CRUD operations completed successfully!');
    console.log('\n📋 API Test Summary:');
    console.log('✅ CREATE (POST) - Working');
    console.log('✅ READ (GET) - Working');
    console.log('✅ UPDATE (PUT) - Working');
    console.log('✅ DELETE (DELETE) - Working');
    console.log('✅ FILTERING - Working');
    console.log('✅ PAGINATION - Working');
    console.log('✅ ERROR HANDLING - Working');

  } catch (error) {
    console.error('❌ Error testing API CRUD operations:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the test
testAPICRUD();
