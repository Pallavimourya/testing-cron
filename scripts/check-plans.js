const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/linkzup';

async function checkPlans() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check plans in database
    const plans = await mongoose.connection.db.collection('plans').find({}).toArray();
    
    console.log('\n📊 Plans in Database:');
    if (plans.length === 0) {
      console.log('No plans found in database');
    } else {
      plans.forEach((plan, index) => {
        console.log(`\n${index + 1}. ${plan.name} (${plan.slug})`);
        console.log(`   Price: ₹${plan.price}`);
        console.log(`   Duration: ${plan.durationDays} days`);
        console.log(`   Image Limit: ${plan.imageLimit}`);
        console.log(`   Content Limit: ${plan.contentLimit === -1 ? 'Unlimited' : plan.contentLimit}`);
        console.log(`   Active: ${plan.isActive}`);
      });
    }

    // Check if there's a plan with imageLimit: 2 and contentLimit: 10
    const matchingPlan = plans.find(plan => plan.imageLimit === 2 && plan.contentLimit === 10);
    if (matchingPlan) {
      console.log(`\n✅ Found matching plan: ${matchingPlan.name} (${matchingPlan.slug})`);
    } else {
      console.log('\n❌ No plan found with imageLimit: 2 and contentLimit: 10');
      console.log('Available image limits:', [...new Set(plans.map(p => p.imageLimit))]);
      console.log('Available content limits:', [...new Set(plans.map(p => p.contentLimit))]);
    }

  } catch (error) {
    console.error('❌ Error checking plans:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
checkPlans();
