const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/linkzup';

async function testUserSubscription() {
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

    // Check user subscription data
    console.log('\n📊 User Subscription Data:');
    console.log(`Subscription Status: ${user.subscriptionStatus || 'free'}`);
    console.log(`Subscription Plan: ${user.subscriptionPlan || 'free'}`);
    console.log(`Subscription Expiry: ${user.subscriptionExpiry || 'N/A'}`);
    console.log(`Content Generated: ${user.contentGenerated || 0}`);
    console.log(`Images Generated: ${user.imagesGenerated || 0}`);

    // Get plan from database
    let planLimits = { imageLimit: 0, contentLimit: 0, duration: 0 }; // fallback
    const userPlan = user.subscriptionPlan || "free";
    
    if (userPlan !== "free") {
      const plan = await mongoose.connection.db.collection('plans').findOne({ slug: userPlan, isActive: true });
      if (plan) {
        planLimits = {
          imageLimit: plan.imageLimit,
          contentLimit: plan.contentLimit,
          duration: plan.durationDays,
        };
      }
    }
    
    console.log('\n📊 Plan Limits:');
    console.log(`Plan: ${userPlan}`);
    console.log(`Image Limit: ${planLimits.imageLimit}`);
    console.log(`Content Limit: ${planLimits.contentLimit}`);
    console.log(`Duration: ${planLimits.duration} days`);

    // Calculate usage
    const imagesGenerated = user.imagesGenerated || 0;
    const contentGenerated = user.contentGenerated || 0;
    
    console.log('\n📊 Usage Calculation:');
    console.log(`Image Generations: ${imagesGenerated} / ${planLimits.imageLimit} (${Math.max(0, planLimits.imageLimit - imagesGenerated)} remaining)`);
    console.log(`Content Generations: ${contentGenerated} / ${planLimits.contentLimit} (${Math.max(0, planLimits.contentLimit - contentGenerated)} remaining)`);

    // Test subscription check API logic
    console.log('\n📊 Subscription Check API Logic:');
    const hasActiveSubscription = user.subscriptionStatus === "active" && 
      user.subscriptionExpiry && 
      new Date(user.subscriptionExpiry) > new Date();
    
    console.log(`Has Active Subscription: ${hasActiveSubscription}`);
    console.log(`Can Generate Images: ${hasActiveSubscription && (planLimits.imageLimit - imagesGenerated) > 0}`);
    console.log(`Can Generate Content: ${hasActiveSubscription}`);

  } catch (error) {
    console.error('❌ Error testing user subscription:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
testUserSubscription();
