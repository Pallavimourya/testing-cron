const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function debugLogin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check the specific user that's having login issues
    const userEmail = 'vinnu123@gmail.com';
    
    console.log(`🔍 Checking user: ${userEmail}`);
    
    // Get the users collection directly
    const usersCollection = mongoose.connection.db.collection('users');
    const user = await usersCollection.findOne({ email: userEmail });
    
    if (user) {
      console.log('✅ User found in database');
      console.log('User details:', {
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        city: user.city,
        hasPassword: !!user.password,
        passwordLength: user.password ? user.password.length : 0,
        blocked: user.blocked || false,
        role: user.role || 'user',
        createdAt: user.createdAt
      });
      
      // Test password hashing
      if (user.password) {
        const testPassword = 'testpassword123'; // Updated password for testing
        const isPasswordValid = await bcrypt.compare(testPassword, user.password);
        console.log(`🔑 Test password '${testPassword}' valid: ${isPasswordValid}`);
        
        // Show password hash details
        console.log('Password hash starts with:', user.password.substring(0, 20) + '...');
        console.log('Password hash length:', user.password.length);
      }
    } else {
      console.log('❌ User not found in database');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

debugLogin();
