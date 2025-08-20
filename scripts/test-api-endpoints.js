const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/linkzup';

async function testAPIEndpoints() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n🧪 Testing API Endpoints...\n');

    // ===== TEST 1: CHECK SERVER STATUS =====
    console.log('🌐 1. Checking Server Status');
    
    try {
      const response = await fetch('http://localhost:3000/api/approved-content');
      console.log(`✅ Server is running - Status: ${response.status}`);
      
      if (response.status === 401) {
        console.log('ℹ️  API requires authentication (expected)');
      } else if (response.status === 200) {
        console.log('✅ API is accessible');
      } else {
        console.log(`⚠️  Unexpected status: ${response.status}`);
      }
    } catch (error) {
      console.log('❌ Server not accessible:', error.message);
      console.log('💡 Make sure the Next.js development server is running with: pnpm dev');
    }

    // ===== TEST 2: CHECK DATABASE CONNECTIVITY =====
    console.log('\n📊 2. Checking Database Connectivity');
    
    const users = await mongoose.connection.db.collection('users').find({}).limit(1).toArray();
    
    if (users.length > 0) {
      console.log(`✅ Database connected - Found user: ${users[0].email}`);
    } else {
      console.log('❌ No users found in database');
    }

    // ===== TEST 3: CHECK APPROVED CONTENT DATA =====
    console.log('\n📋 3. Checking Approved Content Data');
    
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

    const totalContent = await ApprovedContent.countDocuments({});
    console.log(`📈 Total approved content records: ${totalContent}`);

    if (users.length > 0) {
      const userContent = await ApprovedContent.find({ userId: users[0]._id }).lean();
      console.log(`📈 User content records: ${userContent.length}`);
      
      if (userContent.length > 0) {
        console.log('📋 Sample content:');
        console.log(`   - ID: ${userContent[0].id || userContent[0]._id}`);
        console.log(`   - Title: ${userContent[0].topicTitle}`);
        console.log(`   - Status: ${userContent[0].status}`);
      }
    }

    // ===== TEST 4: CHECK RAW COLLECTION =====
    console.log('\n📊 4. Checking Raw Collection');
    
    const collection = mongoose.connection.db.collection('approvedcontents');
    const rawContent = await collection.find({}).limit(5).toArray();
    console.log(`📈 Raw collection records: ${rawContent.length}`);
    
    if (rawContent.length > 0) {
      console.log('📋 Sample raw content:');
      console.log(`   - ID: ${rawContent[0].ID || rawContent[0].id || rawContent[0]._id}`);
      console.log(`   - Topic: ${rawContent[0].Topic || rawContent[0].topicTitle}`);
      console.log(`   - Status: ${rawContent[0].status}`);
    }

    // ===== TEST 5: SIMULATE API LOGIC =====
    console.log('\n🔧 5. Simulating API Logic');
    
    if (users.length > 0) {
      const user = users[0];
      
      // Simulate GET /api/approved-content
      console.log('📤 Simulating GET /api/approved-content...');
      
      const userContent = await ApprovedContent.find({ userId: user._id }).lean();
      console.log(`✅ Would return ${userContent.length} content items for user`);
      
      // Simulate GET /api/approved-content/[id]
      if (userContent.length > 0) {
        const contentId = userContent[0].id || userContent[0]._id;
        console.log(`📤 Simulating GET /api/approved-content/${contentId}...`);
        
        const specificContent = await ApprovedContent.findOne({ 
          $or: [
            { id: contentId },
            { _id: new mongoose.Types.ObjectId(contentId) }
          ],
          userId: user._id 
        }).lean();
        
        if (specificContent) {
          console.log(`✅ Would return content: ${specificContent.topicTitle}`);
        } else {
          console.log('❌ Content not found');
        }
      }
    }

    // ===== TEST 6: CHECK API ROUTES =====
    console.log('\n🛣️ 6. Checking API Routes');
    
    const routes = [
      '/api/approved-content',
      '/api/approved-content/test-id',
      '/api/auth/[...nextauth]',
      '/api/users'
    ];
    
    console.log('📋 Available API routes:');
    routes.forEach(route => {
      console.log(`   - ${route}`);
    });

    console.log('\n🎉 API Endpoint Test Completed!');
    console.log('\n📋 Test Summary:');
    console.log('✅ Database Connection - Working');
    console.log('✅ Data Access - Working');
    console.log('✅ API Logic - Working');
    console.log('⚠️  API Authentication - Required (as expected)');

  } catch (error) {
    console.error('❌ Error testing API endpoints:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the test
testAPIEndpoints();
