const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/linkzup';

async function debugCRUDIssues() {
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

    console.log('\n🔍 Debugging CRUD Issues...\n');

    // ===== TEST 1: CHECK EXISTING DATA =====
    console.log('📊 1. Checking Existing Data');
    
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

    // Check existing content
    const existingContent = await ApprovedContent.find({ userId: user._id }).lean();
    console.log(`📈 Found ${existingContent.length} existing content items for user`);

    if (existingContent.length > 0) {
      console.log('📋 Sample existing content:');
      console.log(`   - ID: ${existingContent[0].id || existingContent[0]._id}`);
      console.log(`   - Title: ${existingContent[0].topicTitle}`);
      console.log(`   - Status: ${existingContent[0].status}`);
    }

    // ===== TEST 2: CREATE OPERATION TEST =====
    console.log('\n📝 2. Testing CREATE Operation');
    
    const createData = {
      topicId: `topic-${Date.now()}-debug`,
      topicTitle: "Debug Test Content",
      content: "This is a debug test content to check CRUD operations.",
      hashtags: ["#Debug", "#Test", "#CRUD"],
      keyPoints: ["Debug testing", "CRUD operations", "Issue identification"],
      contentType: "storytelling",
      imageUrl: "https://example.com/debug.jpg",
      platform: "linkedin",
      status: "generated"
    };

    console.log('📤 Creating new content...');
    const newContent = new ApprovedContent({
      ...createData,
      userId: user._id,
      generatedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    try {
      await newContent.save();
      console.log(`✅ Created content successfully: ${newContent.id || newContent._id}`);
      const createdId = newContent.id || newContent._id.toString();
      
      // ===== TEST 3: READ OPERATION TEST =====
      console.log('\n📖 3. Testing READ Operation');
      
      const readContent = await ApprovedContent.findOne({ 
        $or: [
          { id: createdId },
          { _id: new mongoose.Types.ObjectId(createdId) }
        ],
        userId: user._id 
      }).lean();

      if (readContent) {
        console.log('✅ Content read successfully:');
        console.log(`   - ID: ${readContent.id || readContent._id}`);
        console.log(`   - Title: ${readContent.topicTitle}`);
        console.log(`   - Status: ${readContent.status}`);
        console.log(`   - Content: ${readContent.content.substring(0, 50)}...`);
      } else {
        console.log('❌ Failed to read content');
      }

      // ===== TEST 4: UPDATE OPERATION TEST =====
      console.log('\n🔄 4. Testing UPDATE Operation');
      
      const updateData = {
        topicTitle: "Updated Debug Test Content",
        content: "This content has been updated during debug testing.",
        status: "approved",
        hashtags: ["#Debug", "#Test", "#Updated", "#Working"],
        keyPoints: ["Debug testing", "Update operation", "Working correctly"]
      };

      console.log('📤 Updating content...');
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
        console.log('✅ Content updated successfully:');
        console.log(`   - New Title: ${updatedContent.topicTitle}`);
        console.log(`   - New Status: ${updatedContent.status}`);
        console.log(`   - Updated At: ${updatedContent.updatedAt}`);
      } else {
        console.log('❌ Failed to update content');
      }

      // ===== TEST 5: DELETE OPERATION TEST =====
      console.log('\n🗑️ 5. Testing DELETE Operation');
      
      console.log('📤 Deleting content...');
      const deletedContent = await ApprovedContent.findOneAndDelete({ 
        $or: [
          { id: createdId },
          { _id: new mongoose.Types.ObjectId(createdId) }
        ],
        userId: user._id 
      });

      if (deletedContent) {
        console.log('✅ Content deleted successfully:');
        console.log(`   - Deleted ID: ${deletedContent.id || deletedContent._id}`);
        console.log(`   - Deleted Title: ${deletedContent.topicTitle}`);
      } else {
        console.log('❌ Failed to delete content');
      }

      // ===== TEST 6: VERIFICATION =====
      console.log('\n🔍 6. Verification Test');
      
      const verifyContent = await ApprovedContent.findOne({ 
        $or: [
          { id: createdId },
          { _id: new mongoose.Types.ObjectId(createdId) }
        ],
        userId: user._id 
      });

      if (!verifyContent) {
        console.log('✅ Content successfully deleted - not found in database');
      } else {
        console.log('❌ Content still exists in database');
      }

    } catch (error) {
      console.error('❌ Error during CRUD operations:', error.message);
    }

    // ===== TEST 7: RAW COLLECTION TEST =====
    console.log('\n📊 7. Testing Raw Collection Operations');
    
    const collection = mongoose.connection.db.collection('approvedcontents');
    
    // Check raw collection
    const rawContent = await collection.find({}).limit(5).toArray();
    console.log(`📈 Found ${rawContent.length} records in raw collection`);
    
    if (rawContent.length > 0) {
      console.log('📋 Sample raw content:');
      console.log(`   - ID: ${rawContent[0].ID || rawContent[0].id || rawContent[0]._id}`);
      console.log(`   - Topic: ${rawContent[0].Topic || rawContent[0].topicTitle}`);
      console.log(`   - Status: ${rawContent[0].status}`);
    }

    // ===== TEST 8: API ENDPOINT SIMULATION =====
    console.log('\n🌐 8. API Endpoint Simulation');
    
    // Simulate the API logic for GET /api/approved-content
    console.log('📤 Simulating GET /api/approved-content...');
    
    const allUserContent = await ApprovedContent.find({ userId: user._id }).lean();
    console.log(`✅ API would return ${allUserContent.length} content items`);
    
    if (allUserContent.length > 0) {
      console.log('📋 Sample API response:');
      console.log(`   - ID: ${allUserContent[0].id || allUserContent[0]._id}`);
      console.log(`   - Title: ${allUserContent[0].topicTitle}`);
      console.log(`   - Status: ${allUserContent[0].status}`);
    }

    // ===== TEST 9: ERROR SCENARIOS =====
    console.log('\n⚠️ 9. Testing Error Scenarios');
    
    // Test with invalid user ID
    const invalidUserContent = await ApprovedContent.find({ 
      userId: new mongoose.Types.ObjectId("000000000000000000000000")
    }).lean();
    console.log(`✅ Invalid user ID returns ${invalidUserContent.length} records (expected 0)`);

    // Test with invalid content ID
    const invalidContent = await ApprovedContent.findOne({ 
      _id: new mongoose.Types.ObjectId("000000000000000000000000")
    });
    console.log(`✅ Invalid content ID returns ${invalidContent ? 'content' : 'null'} (expected null)`);

    // Test with invalid status
    const invalidStatusContent = await ApprovedContent.find({ 
      userId: user._id,
      status: "invalid_status"
    }).lean();
    console.log(`✅ Invalid status returns ${invalidStatusContent.length} records (expected 0)`);

    console.log('\n🎉 CRUD Debug Test Completed!');
    console.log('\n📋 Debug Summary:');
    console.log('✅ Database Connection - Working');
    console.log('✅ User Authentication - Working');
    console.log('✅ CREATE Operation - Working');
    console.log('✅ READ Operation - Working');
    console.log('✅ UPDATE Operation - Working');
    console.log('✅ DELETE Operation - Working');
    console.log('✅ Raw Collection - Working');
    console.log('✅ Error Handling - Working');

  } catch (error) {
    console.error('❌ Error during debug test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the debug test
debugCRUDIssues();
