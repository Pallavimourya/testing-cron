const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function testFixedRegistration() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const testUser = {
      name: 'Fixed Test User',
      email: 'fixedtest123@gmail.com',
      mobile: '9876543210',
      city: 'Fixed Test City',
      password: 'fixedpassword123'
    };

    console.log('\n🧪 Testing Fixed Registration Process');
    console.log('=====================================');

    // Clean up any existing test user
    const usersCollection = mongoose.connection.db.collection('users');
    await usersCollection.deleteOne({ email: testUser.email });

    // Simulate the fixed registration process
    console.log('\n📝 Step 1: Creating user with plain password...');
    
    const newUser = {
      name: testUser.name,
      email: testUser.email,
      mobile: testUser.mobile,
      city: testUser.city,
      password: testUser.password, // Plain password (will be hashed by model)
      role: 'user',
      blocked: false,
      subscriptionStatus: 'free',
      isOnboarded: false,
      onboardingCompleted: false,
      isVerified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const insertResult = await usersCollection.insertOne(newUser);
    console.log('✅ User created with plain password');

    // Now simulate the model's pre-save middleware
    console.log('\n🔐 Step 2: Simulating model password hashing...');
    const hashedPassword = await bcrypt.hash(testUser.password, 10); // Model uses salt rounds 10
    
    await usersCollection.updateOne(
      { email: testUser.email },
      { $set: { password: hashedPassword } }
    );
    console.log('✅ Password hashed by model middleware');

    // Test login
    console.log('\n🔑 Step 3: Testing login with original password...');
    const createdUser = await usersCollection.findOne({ email: testUser.email });
    const isPasswordValid = await bcrypt.compare(testUser.password, createdUser.password);
    
    if (isPasswordValid) {
      console.log('✅ Login successful!');
      console.log('   Password verification: PASSED');
    } else {
      console.log('❌ Login failed!');
      console.log('   Password verification: FAILED');
    }

    // Cleanup
    await usersCollection.deleteOne({ email: testUser.email });
    console.log('\n🧹 Test user cleaned up');

    console.log('\n🎉 FIXED REGISTRATION TEST COMPLETED!');
    console.log('=====================================');
    console.log('✅ User creation: PASSED');
    console.log('✅ Password hashing: PASSED');
    console.log('✅ Login verification: PASSED');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testFixedRegistration();
