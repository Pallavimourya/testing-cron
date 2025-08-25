const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/linkzup';

async function testDashboardData() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get a user to test with
    const users = await mongoose.connection.db.collection('users').find({}).limit(1).toArray();
    
    if (users.length === 0) {
      console.log('❌ No users found.');
      return;
    }

    const user = users[0];
    console.log(`👤 Testing with user: ${user.email} (${user._id})`);

    // Test Topic collection
    console.log('\n📊 Testing Topic collection...');
    const topics = await mongoose.connection.db.collection('topics').find({ 
      userId: user._id 
    }).sort({ createdAt: -1 }).limit(5).toArray();
    
    console.log(`Found ${topics.length} topics:`);
    topics.forEach((topic, index) => {
      console.log(`  ${index + 1}. ${topic.title} (${topic.status}) - ${topic.createdAt}`);
    });

    // Test ApprovedContent collection
    console.log('\n📊 Testing ApprovedContent collection...');
    const approvedContent = await mongoose.connection.db.collection('approvedcontents').find({ 
      userId: user._id 
    }).sort({ createdAt: -1 }).limit(5).toArray();
    
    console.log(`Found ${approvedContent.length} approved content:`);
    approvedContent.forEach((content, index) => {
      console.log(`  ${index + 1}. ${content.topicTitle || content.Topic} (${content.status}) - ${content.createdAt}`);
    });

    // Test raw collections
    console.log('\n📊 Testing raw collections...');
    const collections = ["approvedcontents", "linkdin-content-generation", "generatedcontents"];
    
    for (const collectionName of collections) {
      try {
        const collection = mongoose.connection.db.collection(collectionName);
        const rawContent = await collection.find({
          $or: [
            { userId: user._id },
            { userId: user._id.toString() },
            { "user id": user._id },
            { "user id": user._id.toString() },
          ],
        }).sort({ timestamp: -1, createdAt: -1, _id: -1 }).limit(5).toArray();
        
        console.log(`Collection ${collectionName}: ${rawContent.length} items`);
        rawContent.forEach((content, index) => {
          const title = content.Topic || content.topicTitle || content.title || content["Topic Title"] || "Untitled";
          const status = content.status || content.Status || "generated";
          const date = content.timestamp || content.createdAt || content.created_at || content["created at"] || "No date";
          console.log(`  ${index + 1}. ${title} (${status}) - ${date}`);
        });
      } catch (error) {
        console.error(`Error accessing collection ${collectionName}:`, error.message);
      }
    }

    // Test the actual dashboard stats logic
    console.log('\n📊 Testing dashboard stats logic...');
    
    const userFilter = { userId: user._id };
    
    // Get recent topics
    const recentTopics = await mongoose.connection.db.collection('topics')
      .find(userFilter)
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();
    
    console.log(`Recent topics: ${recentTopics.length}`);
    
    // Get recent content from ApprovedContent model
    const recentContent = await mongoose.connection.db.collection('approvedcontents')
      .find(userFilter)
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();
    
    console.log(`Recent content from ApprovedContent: ${recentContent.length}`);
    
    // Get recent content from raw collections
    let allRecentContent = [...recentContent];
    
    for (const collectionName of collections) {
      try {
        const collection = mongoose.connection.db.collection(collectionName);
        const rawRecentContent = await collection
          .find({
            $or: [
              { userId: user._id },
              { userId: user._id.toString() },
              { "user id": user._id },
              { "user id": user._id.toString() },
            ],
          })
          .sort({ timestamp: -1, createdAt: -1, _id: -1 })
          .limit(10)
          .toArray();

        const transformedContent = rawRecentContent.map((item) => ({
          topicTitle: item.Topic || item.topicTitle || item.title || item["Topic Title"] || "Untitled",
          status: item.status || item.Status || "generated",
          createdAt: item.timestamp || item.createdAt || item.created_at || item["created at"] || new Date(),
        }));

        allRecentContent.push(...transformedContent);
      } catch (error) {
        console.error(`Error getting recent content from ${collectionName}:`, error.message);
      }
    }

    // Sort all content by date and take the 5 most recent
    allRecentContent.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const finalRecentContent = allRecentContent.slice(0, 5);
    
    console.log(`Final recent content: ${finalRecentContent.length}`);
    finalRecentContent.forEach((content, index) => {
      console.log(`  ${index + 1}. ${content.topicTitle} (${content.status}) - ${content.createdAt}`);
    });

    console.log('\n✅ Dashboard data test completed!');

  } catch (error) {
    console.error('❌ Error testing dashboard data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
testDashboardData();
