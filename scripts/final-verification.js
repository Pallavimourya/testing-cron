const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function finalVerification() {
  console.log('🔍 FINAL VERIFICATION - Login Issue Fixed');
  console.log('=========================================');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    // Test credentials
    const testEmail = 'pissu@gmail.com';
    const testPassword = 'password123';

    console.log(`\n📧 Testing with: ${testEmail}`);
    console.log(`🔑 Password: ${testPassword}`);

    // Check if user exists
    const usersCollection = mongoose.connection.db.collection('users');
    const user = await usersCollection.findOne({ email: testEmail });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('✅ User found in database');
    console.log('   Name:', user.name);
    console.log('   Has password:', !!user.password);
    console.log('   Password length:', user.password ? user.password.length : 0);

    // Test password verification
    const isPasswordValid = await bcrypt.compare(testPassword, user.password);
    
    if (isPasswordValid) {
      console.log('\n🎉 LOGIN VERIFICATION: PASSED!');
      console.log('==============================');
      console.log('✅ User exists in database');
      console.log('✅ Password is properly hashed');
      console.log('✅ Password verification works');
      console.log('✅ Login will succeed');
      console.log('\n💡 You can now login with:');
      console.log(`   Email: ${testEmail}`);
      console.log(`   Password: ${testPassword}`);
    } else {
      console.log('\n❌ LOGIN VERIFICATION: FAILED!');
      console.log('==============================');
      console.log('❌ Password verification failed');
      console.log('❌ Login will not work');
    }

  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

finalVerification();
