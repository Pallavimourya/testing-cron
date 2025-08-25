const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/linkzup';

async function updateUserSubscription() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get a user to update
    const users = await mongoose.connection.db.collection('users').find({}).limit(1).toArray();
    
    if (users.length === 0) {
      console.log('❌ No users found.');
      return;
    }

    const user = users[0];
    console.log(`👤 Updating user: ${user.email} (${user._id})`);

    // Set subscription expiry to 30 days from now
    const newExpiryDate = new Date();
    newExpiryDate.setDate(newExpiryDate.getDate() + 30);

    // Update the user's subscription
    const result = await mongoose.connection.db.collection('users').updateOne(
      { _id: user._id },
      {
        $set: {
          subscriptionStatus: 'active',
          subscriptionExpiry: newExpiryDate,
          contentGenerated: 5,
          imagesGenerated: 3
        }
      }
    );

    console.log(`✅ Updated user subscription: ${result.modifiedCount} document(s) modified`);
    console.log(`New expiry date: ${newExpiryDate}`);

    // Verify the update
    const updatedUser = await mongoose.connection.db.collection('users').findOne({ _id: user._id });
    console.log('\n📊 Updated User Data:');
    console.log(`Subscription Status: ${updatedUser.subscriptionStatus}`);
    console.log(`Subscription Plan: ${updatedUser.subscriptionPlan}`);
    console.log(`Subscription Expiry: ${updatedUser.subscriptionExpiry}`);
    console.log(`Content Generated: ${updatedUser.contentGenerated}`);
    console.log(`Images Generated: ${updatedUser.imagesGenerated}`);

  } catch (error) {
    console.error('❌ Error updating user subscription:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
updateUserSubscription();
