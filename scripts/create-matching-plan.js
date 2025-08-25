const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/linkzup';

async function createMatchingPlan() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Create a plan that matches the billing page data
    const matchingPlan = {
      name: "Starter Plan",
      slug: "starter",
      description: "Perfect for getting started with content generation",
      price: 299,
      durationDays: 30,
      features: [
        "2 AI-generated images per month",
        "10 content generations per month",
        "Basic content templates",
        "Email support"
      ],
      imageLimit: 2,
      contentLimit: 10,
      displayOrder: 1,
      badge: "Most Popular",
      color: "from-green-500 to-green-600",
      icon: "Star",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Check if plan already exists
    const existingPlan = await mongoose.connection.db.collection('plans').findOne({ slug: 'starter' });
    
    if (existingPlan) {
      console.log('Plan already exists, updating...');
      const result = await mongoose.connection.db.collection('plans').updateOne(
        { slug: 'starter' },
        { $set: matchingPlan }
      );
      console.log(`✅ Updated plan: ${result.modifiedCount} document(s) modified`);
    } else {
      console.log('Creating new plan...');
      const result = await mongoose.connection.db.collection('plans').insertOne(matchingPlan);
      console.log(`✅ Created plan: ${result.insertedId}`);
    }

    // Verify the plan
    const plan = await mongoose.connection.db.collection('plans').findOne({ slug: 'starter' });
    console.log('\n📊 Created/Updated Plan:');
    console.log(`Name: ${plan.name} (${plan.slug})`);
    console.log(`Price: ₹${plan.price}`);
    console.log(`Duration: ${plan.durationDays} days`);
    console.log(`Image Limit: ${plan.imageLimit}`);
    console.log(`Content Limit: ${plan.contentLimit}`);
    console.log(`Active: ${plan.isActive}`);

  } catch (error) {
    console.error('❌ Error creating plan:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
createMatchingPlan();
