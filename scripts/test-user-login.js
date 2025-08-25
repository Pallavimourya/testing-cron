const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User').default;
const Admin = require('../models/Admin').default;

async function testUserLogin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Test 1: Check if users exist
    console.log('\n🔍 Test 1: Checking for users in database...');
    const users = await User.find().select('name email mobile city createdAt');
    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - Created: ${user.createdAt.toDateString()}`);
    });

    // Test 2: Check if a specific user exists and has password
    console.log('\n🔍 Test 2: Checking specific user details...');
    const testEmail = 'test@example.com'; // Change this to test a specific user
    const user = await User.findOne({ email: testEmail }).select('+password');
    
    if (user) {
      console.log(`✅ User found: ${user.name}`);
      console.log(`  - Email: ${user.email}`);
      console.log(`  - Mobile: ${user.mobile}`);
      console.log(`  - City: ${user.city}`);
      console.log(`  - Has password: ${user.password ? 'Yes' : 'No'}`);
      console.log(`  - Password length: ${user.password ? user.password.length : 0}`);
      console.log(`  - Blocked: ${user.blocked || false}`);
      console.log(`  - Role: ${user.role || 'user'}`);
      
      // Test password hashing
      if (user.password) {
        const testPassword = 'password123'; // Change this to test with actual password
        const isPasswordValid = await bcrypt.compare(testPassword, user.password);
        console.log(`  - Test password '${testPassword}' valid: ${isPasswordValid}`);
      }
    } else {
      console.log(`❌ User with email '${testEmail}' not found`);
    }

    // Test 3: Check admin users
    console.log('\n🔍 Test 3: Checking admin users...');
    const admins = await Admin.find().select('name email role isActive');
    console.log(`Found ${admins.length} admin users:`);
    admins.forEach(admin => {
      console.log(`  - ${admin.name} (${admin.email}) - Role: ${admin.role} - Active: ${admin.isActive}`);
    });

    // Test 4: Test password hashing
    console.log('\n🔍 Test 4: Testing password hashing...');
    const testPassword = 'testpassword123';
    const hashedPassword = await bcrypt.hash(testPassword, 12);
    console.log(`Original password: ${testPassword}`);
    console.log(`Hashed password: ${hashedPassword.substring(0, 20)}...`);
    
    const isValid = await bcrypt.compare(testPassword, hashedPassword);
    console.log(`Password verification: ${isValid ? '✅ Valid' : '❌ Invalid'}`);

    // Test 5: Create a test user if none exists
    if (users.length === 0) {
      console.log('\n🔍 Test 5: Creating a test user...');
      const hashedPassword = await bcrypt.hash('testpassword123', 12);
      
      const testUser = new User({
        name: 'Test User',
        email: 'test@example.com',
        mobile: '9876543210',
        city: 'Test City',
        password: hashedPassword,
        role: 'user',
        blocked: false,
        subscriptionStatus: 'free'
      });
      
      await testUser.save();
      console.log('✅ Test user created successfully');
      console.log('📧 Email: test@example.com');
      console.log('🔑 Password: testpassword123');
    }

    // Test 6: Check database connection and collections
    console.log('\n🔍 Test 6: Checking database collections...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:');
    collections.forEach(collection => {
      console.log(`  - ${collection.name}`);
    });

  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the test
testUserLogin();
