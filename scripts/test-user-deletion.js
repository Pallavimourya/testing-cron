const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../models/User').default;
const ApprovedContent = require('../models/ApprovedContent').default;
const Topic = require('../models/Topic').default;
const ScheduledPost = require('../models/ScheduledPost').default;
const GeneratedStory = require('../models/GeneratedStory').default;
const GeneratedContent = require('../models/GeneratedContent').default;
const Content = require('../models/Content').default;
const UserProfile = require('../models/UserProfile').default;
const Payment = require('../models/Payment').default;
const Order = require('../models/Order').default;
const CouponUsage = require('../models/CouponUsage').default;
const LinkedInDetails = require('../models/LinkedInDetails').default;
const VoiceNote = require('../models/VoiceNote').default;
const Post = require('../models/Post').default;

async function testUserDeletion() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find a test user (you can modify this to use a specific user)
    const testUser = await User.findOne({ email: { $regex: /test/i } });
    
    if (!testUser) {
      console.log('❌ No test user found. Please create a test user first or modify the query.');
      return;
    }

    const userId = testUser._id;
    const userEmail = testUser.email;

    console.log(`🧪 Testing user deletion for: ${userEmail} (${userId})`);

    // Count records before deletion
    const beforeCounts = await Promise.all([
      User.countDocuments({ _id: userId }),
      ApprovedContent.countDocuments({ userId }),
      Topic.countDocuments({ userId }),
      ScheduledPost.countDocuments({ userId }),
      GeneratedStory.countDocuments({ userId }),
      GeneratedContent.countDocuments({ userId }),
      Content.countDocuments({ userId }),
      UserProfile.countDocuments({ userId }),
      Payment.countDocuments({ userId: userId.toString() }),
      Order.countDocuments({ userId }),
      CouponUsage.countDocuments({ userId }),
      LinkedInDetails.countDocuments({ userId: userId.toString() }),
      VoiceNote.countDocuments({ userId }),
      Post.countDocuments({ userId }),
    ]);

    const collectionNames = [
      'User', 'ApprovedContent', 'Topic', 'ScheduledPost', 'GeneratedStory',
      'GeneratedContent', 'Content', 'UserProfile', 'Payment',
      'Order', 'CouponUsage', 'LinkedInDetails', 'VoiceNote', 'Post'
    ];

    console.log('\n📊 Records before deletion:');
    beforeCounts.forEach((count, index) => {
      console.log(`  ${collectionNames[index]}: ${count}`);
    });

    // Simulate the deletion process (same as in the API)
    console.log('\n🗑️ Starting deletion process...');

    const deletionResults = await Promise.allSettled([
      ApprovedContent.deleteMany({ userId }),
      Topic.deleteMany({ userId }),
      ScheduledPost.deleteMany({ userId }),
      GeneratedStory.deleteMany({ userId }),
      GeneratedContent.deleteMany({ userId }),
      Content.deleteMany({ userId }),
      UserProfile.deleteMany({ userId }),
      Payment.deleteMany({ userId: userId.toString() }),
      Order.deleteMany({ userId }),
      CouponUsage.deleteMany({ userId }),
      LinkedInDetails.deleteMany({ userId: userId.toString() }),
      VoiceNote.deleteMany({ userId }),
      Post.deleteMany({ userId }),
    ]);

    // Log deletion results
    console.log('\n🗑️ Deletion results:');
    deletionResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`  ✅ ${collectionNames[index + 1]}: Deleted ${result.value.deletedCount} records`);
      } else {
        console.log(`  ❌ ${collectionNames[index + 1]}: Error - ${result.reason.message}`);
      }
    });

    // Finally delete the user
    const userDeletionResult = await User.findByIdAndDelete(userId);
    console.log(`  ✅ User: Deleted ${userDeletionResult ? 1 : 0} record`);

    // Count records after deletion
    const afterCounts = await Promise.all([
      User.countDocuments({ _id: userId }),
      ApprovedContent.countDocuments({ userId }),
      Topic.countDocuments({ userId }),
      ScheduledPost.countDocuments({ userId }),
      GeneratedStory.countDocuments({ userId }),
      GeneratedContent.countDocuments({ userId }),
      Content.countDocuments({ userId }),
      UserProfile.countDocuments({ userId }),
      Payment.countDocuments({ userId: userId.toString() }),
      Order.countDocuments({ userId }),
      CouponUsage.countDocuments({ userId }),
      LinkedInDetails.countDocuments({ userId: userId.toString() }),
      VoiceNote.countDocuments({ userId }),
      Post.countDocuments({ userId }),
    ]);

    console.log('\n📊 Records after deletion:');
    afterCounts.forEach((count, index) => {
      console.log(`  ${collectionNames[index]}: ${count}`);
    });

    // Verify all data is deleted
    const totalRemaining = afterCounts.reduce((sum, count) => sum + count, 0);
    
    if (totalRemaining === 0) {
      console.log('\n✅ SUCCESS: All user data has been completely deleted!');
    } else {
      console.log('\n⚠️ WARNING: Some user data may still exist in the database.');
      console.log(`   Total remaining records: ${totalRemaining}`);
    }

  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testUserDeletion();
