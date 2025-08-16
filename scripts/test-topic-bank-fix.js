const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

// Import models
const User = require('../models/User.js');
const Topic = require('../models/Topic.js');
const GeneratedStory = require('../models/GeneratedStory.js');

async function testTopicBankFunctionality() {
  try {
    console.log('🧪 Testing Topic Bank Functionality...\n');

    // Find a test user
    const user = await User.findOne({});
    if (!user) {
      console.log('❌ No user found for testing');
      return;
    }

    console.log(`👤 Testing with user: ${user.email}`);

    // 1. Check current topic count
    const currentTopics = await Topic.find({
      userId: user._id,
      status: { $in: ['pending', 'approved'] }
    });

    console.log(`📊 Current topics: ${currentTopics.length}/30`);

    // 2. Test topic approval
    if (currentTopics.length > 0) {
      const testTopic = currentTopics[0];
      console.log(`\n✅ Testing topic approval for: "${testTopic.title}"`);
      
      // Simulate approval
      testTopic.status = 'approved';
      testTopic.approvedAt = new Date();
      await testTopic.save();
      
      console.log('✅ Topic approved successfully');
    }

    // 3. Test topic dismissal with replacement
    if (currentTopics.length > 1) {
      const testTopic = currentTopics[1];
      console.log(`\n🗑️ Testing topic dismissal for: "${testTopic.title}"`);
      
      // Delete the topic
      await Topic.findByIdAndDelete(testTopic._id);
      console.log('✅ Topic dismissed and deleted');
      
      // Check if replacement was generated
      const replacementTopics = await Topic.find({
        userId: user._id,
        source: 'auto_replacement'
      });
      
      if (replacementTopics.length > 0) {
        console.log('✅ Replacement topic generated:', replacementTopics[0].title);
      }
    }

    // 4. Test 30 topic limit
    console.log('\n📈 Testing 30 topic limit...');
    
    const allTopics = await Topic.find({
      userId: user._id,
      status: { $in: ['pending', 'approved'] }
    });
    
    console.log(`📊 Total topics: ${allTopics.length}/30`);
    
    if (allTopics.length >= 30) {
      console.log('⚠️ Topic limit reached - should not allow more topics');
    } else {
      console.log(`✅ Can generate ${30 - allTopics.length} more topics`);
    }

    // 5. Test unique ID generation
    console.log('\n🆔 Testing unique ID generation...');
    
    const uniqueIds = new Set();
    const duplicateIds = [];
    
    allTopics.forEach(topic => {
      if (uniqueIds.has(topic.id)) {
        duplicateIds.push(topic.id);
      } else {
        uniqueIds.add(topic.id);
      }
    });
    
    if (duplicateIds.length > 0) {
      console.log('❌ Found duplicate IDs:', duplicateIds);
    } else {
      console.log('✅ All topic IDs are unique');
    }

    // 6. Test topic statistics
    console.log('\n📊 Topic Statistics:');
    const stats = {
      total: allTopics.length,
      pending: allTopics.filter(t => t.status === 'pending').length,
      approved: allTopics.filter(t => t.status === 'approved').length,
      dismissed: await Topic.countDocuments({
        userId: user._id,
        status: 'dismissed'
      }),
      limit: 30,
      remaining: 30 - allTopics.length
    };
    
    console.log(`📈 Total: ${stats.total}/${stats.limit}`);
    console.log(`⏳ Pending: ${stats.pending}`);
    console.log(`✅ Approved: ${stats.approved}`);
    console.log(`🗑️ Dismissed: ${stats.dismissed}`);
    console.log(`📊 Remaining: ${stats.remaining}`);

    console.log('\n✅ Topic Bank functionality test completed!');

  } catch (error) {
    console.error('❌ Error testing topic bank:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the test
testTopicBankFunctionality();
