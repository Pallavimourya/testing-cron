const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/linkzup';

async function updateUserToMatchBilling() {
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

    // Update the user's subscription to match billing page data exactly
    // Billing shows: Image Generations: 0 / 2, Content Generations: 1 / 10
    const result = await mongoose.connection.db.collection('users').updateOne(
      { _id: user._id },
      {
        $set: {
          subscriptionStatus: 'active',
          subscriptionPlan: 'starter', // Use the new starter plan
          subscriptionExpiry: newExpiryDate,
          contentGenerated: 1, // Match billing page: 1 / 10
          imagesGenerated: 0   // Match billing page: 0 / 2
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

    // Get plan details from database
    const plan = await mongoose.connection.db.collection('plans').findOne({ slug: 'starter' });
    
    if (plan) {
      console.log('\n📊 Plan Details:');
      console.log(`Plan: ${plan.name} (${plan.slug})`);
      console.log(`Image Limit: ${plan.imageLimit}`);
      console.log(`Content Limit: ${plan.contentLimit}`);

      // Calculate usage
      const imagesGenerated = updatedUser.imagesGenerated || 0;
      const contentGenerated = updatedUser.contentGenerated || 0;
      
      console.log('\n📊 Usage Calculation:');
      console.log(`Image Generations: ${imagesGenerated} / ${plan.imageLimit} (${Math.max(0, plan.imageLimit - imagesGenerated)} remaining)`);
      console.log(`Content Generations: ${contentGenerated} / ${plan.contentLimit} (${Math.max(0, plan.contentLimit - contentGenerated)} remaining)`);
    } else {
      console.log('\n❌ Plan not found in database');
    }

  } catch (error) {
    console.error('❌ Error updating user subscription:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
updateUserToMatchBilling();
