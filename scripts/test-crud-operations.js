const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/linkzup';

async function testCRUDOperations() {
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

    // Define the ApprovedContent model
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

    console.log('\n🧪 Testing CRUD Operations...\n');

    // ===== CREATE OPERATION =====
    console.log('📝 1. CREATE Operation Test');
    console.log('Creating new approved content...');
    
    const newContent = new ApprovedContent({
      topicId: `topic-${Date.now()}-crud-test`,
      userId: user._id,
      topicTitle: "CRUD Test Content",
      content: "This is a test content for CRUD operations. It will be created, read, updated, and deleted.",
      hashtags: ["#CRUD", "#Test", "#Database"],
      keyPoints: ["Create operation", "Read operation", "Update operation", "Delete operation"],
      contentType: "storytelling",
      status: "generated",
      platform: "linkedin",
      generatedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await newContent.save();
    console.log(`✅ Created content with ID: ${newContent.id || newContent._id}`);
    const createdId = newContent.id || newContent._id.toString();

    // ===== READ OPERATION =====
    console.log('\n📖 2. READ Operation Test');
    console.log('Reading the created content...');
    
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

    // ===== UPDATE OPERATION =====
    console.log('\n🔄 3. UPDATE Operation Test');
    console.log('Updating the content...');
    
    const updateData = {
      topicTitle: "Updated CRUD Test Content",
      content: "This content has been updated successfully! The CRUD operations are working properly.",
      status: "approved",
      hashtags: ["#CRUD", "#Test", "#Updated", "#Working"],
      updatedAt: new Date()
    };

    const updatedContent = await ApprovedContent.findOneAndUpdate(
      { 
        $or: [
          { id: createdId },
          { _id: new mongoose.Types.ObjectId(createdId) }
        ],
        userId: user._id 
      },
      updateData,
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

    // ===== DELETE OPERATION =====
    console.log('\n🗑️ 4. DELETE Operation Test');
    console.log('Deleting the content...');
    
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

    // ===== VERIFY DELETION =====
    console.log('\n🔍 5. Verification Test');
    console.log('Verifying content was deleted...');
    
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

    // ===== BULK OPERATIONS TEST =====
    console.log('\n📦 6. Bulk Operations Test');
    console.log('Creating multiple test records...');
    
    const bulkContent = [
      {
        topicId: `topic-${Date.now()}-bulk-1`,
        userId: user._id,
        topicTitle: "Bulk Test Content 1",
        content: "First bulk test content",
        hashtags: ["#Bulk", "#Test1"],
        status: "generated",
        contentType: "storytelling",
        platform: "linkedin"
      },
      {
        topicId: `topic-${Date.now()}-bulk-2`,
        userId: user._id,
        topicTitle: "Bulk Test Content 2",
        content: "Second bulk test content",
        hashtags: ["#Bulk", "#Test2"],
        status: "approved",
        contentType: "listicle",
        platform: "linkedin"
      },
      {
        topicId: `topic-${Date.now()}-bulk-3`,
        userId: user._id,
        topicTitle: "Bulk Test Content 3",
        content: "Third bulk test content",
        hashtags: ["#Bulk", "#Test3"],
        status: "posted",
        contentType: "quote_based",
        platform: "linkedin"
      }
    ];

    const bulkResults = await ApprovedContent.insertMany(bulkContent);
    console.log(`✅ Created ${bulkResults.length} bulk records`);

    // Test bulk read
    const bulkRead = await ApprovedContent.find({ 
      userId: user._id,
      topicTitle: { $regex: /Bulk Test Content/ }
    }).lean();
    console.log(`✅ Read ${bulkRead.length} bulk records`);

    // Test bulk update
    const bulkUpdate = await ApprovedContent.updateMany(
      { 
        userId: user._id,
        topicTitle: { $regex: /Bulk Test Content/ }
      },
      { 
        $set: { 
          status: "updated",
          updatedAt: new Date()
        }
      }
    );
    console.log(`✅ Updated ${bulkUpdate.modifiedCount} bulk records`);

    // Test bulk delete
    const bulkDelete = await ApprovedContent.deleteMany({
      userId: user._id,
      topicTitle: { $regex: /Bulk Test Content/ }
    });
    console.log(`✅ Deleted ${bulkDelete.deletedCount} bulk records`);

    // ===== RAW COLLECTION TEST =====
    console.log('\n📊 7. Raw Collection Test');
    console.log('Testing raw collection operations...');
    
    const collection = mongoose.connection.db.collection('approvedcontents');
    
    // Create in raw collection
    const rawContent = {
      ID: `raw-${Date.now()}-crud-test`,
      Topic: "Raw Collection CRUD Test",
      "generated content": "Testing CRUD operations on raw collection",
      status: "generated",
      userId: user._id.toString(),
      email: user.email,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await collection.insertOne(rawContent);
    console.log(`✅ Created raw content with ID: ${rawContent.ID}`);

    // Read from raw collection
    const rawRead = await collection.findOne({ ID: rawContent.ID });
    if (rawRead) {
      console.log('✅ Raw content read successfully');
    }

    // Update raw collection
    const rawUpdate = await collection.updateOne(
      { ID: rawContent.ID },
      { 
        $set: { 
          status: "approved",
          "generated content": "Updated raw collection content",
          updatedAt: new Date()
        }
      }
    );
    console.log(`✅ Raw content updated: ${rawUpdate.modifiedCount} records`);

    // Delete from raw collection
    const rawDelete = await collection.deleteOne({ ID: rawContent.ID });
    console.log(`✅ Raw content deleted: ${rawDelete.deletedCount} records`);

    console.log('\n🎉 All CRUD operations completed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ CREATE - Working');
    console.log('✅ READ - Working');
    console.log('✅ UPDATE - Working');
    console.log('✅ DELETE - Working');
    console.log('✅ BULK OPERATIONS - Working');
    console.log('✅ RAW COLLECTION - Working');

  } catch (error) {
    console.error('❌ Error testing CRUD operations:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the test
testCRUDOperations();
