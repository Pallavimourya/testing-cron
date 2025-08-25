const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/linkzup';

async function testWeeklyActivity() {
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

    // Test weekly data calculation (same logic as dashboard stats API)
    const userFilter = { userId: user._id };
    const weeklyData = [];

    console.log('\n📊 Calculating weekly activity...');
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

      let dayContent = await mongoose.connection.db.collection('approvedcontents').countDocuments({
        ...userFilter,
        createdAt: { $gte: startOfDay, $lt: endOfDay },
      });

      // Check other collections
      const collections = ["approvedcontents", "linkdin-content-generation", "generatedcontents"];
      for (const collectionName of collections) {
        try {
          const collection = mongoose.connection.db.collection(collectionName);
          const rawDayContent = await collection.countDocuments({
            $and: [
              {
                $or: [
                  { userId: user._id },
                  { userId: user._id.toString() },
                  { "user id": user._id },
                  { "user id": user._id.toString() },
                ],
              },
              {
                $or: [
                  { createdAt: { $gte: startOfDay, $lt: endOfDay } },
                  { timestamp: { $gte: startOfDay, $lt: endOfDay } },
                  { created_at: { $gte: startOfDay, $lt: endOfDay } },
                ],
              },
            ],
          });
          dayContent += rawDayContent;
        } catch (error) {
          console.error(`Error getting daily content from ${collectionName}:`, error.message);
        }
      }

      const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
      weeklyData.push({
        name: dayName,
        content: dayContent,
        date: date.toLocaleDateString()
      });

      console.log(`   ${dayName} (${date.toLocaleDateString()}): ${dayContent} content items`);
    }

    console.log('\n📊 Weekly Summary:');
    const totalContent = weeklyData.reduce((sum, day) => sum + day.content, 0);
    const mostActiveDay = weeklyData.reduce((max, day) => day.content > max.content ? day : max, weeklyData[0]);
    
    console.log(`   Total content this week: ${totalContent}`);
    console.log(`   Most active day: ${mostActiveDay.name} (${mostActiveDay.content} items)`);
    console.log(`   Average per day: ${Math.round(totalContent / 7)}`);

    // Show the data structure that would be sent to the frontend
    console.log('\n📊 Data for frontend:');
    console.log(JSON.stringify(weeklyData, null, 2));

  } catch (error) {
    console.error('❌ Error testing weekly activity:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
testWeeklyActivity();
