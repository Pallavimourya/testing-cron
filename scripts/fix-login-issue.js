const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function fixLoginIssue() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // The user that's having login issues
    const userEmail = 'pissu@gmail.com';
    const newPassword = 'password123'; // Simple password for testing
    
    console.log(`🔧 Fixing login issue for: ${userEmail}`);
    console.log(`🔑 Setting new password: ${newPassword}`);

    // Find the user
    const usersCollection = mongoose.connection.db.collection('users');
    const user = await usersCollection.findOne({ email: userEmail });
    
    if (!user) {
      console.log('❌ User not found, creating new user...');
      
      // Create the user with proper password
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      const newUser = {
        name: 'Pissu User',
        email: userEmail,
        mobile: '9876543210',
        city: 'Test City',
        password: hashedPassword,
        role: 'user',
        blocked: false,
        subscriptionStatus: 'free',
        isOnboarded: false,
        onboardingCompleted: false,
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await usersCollection.insertOne(newUser);
      console.log('✅ User created successfully');
    } else {
      console.log('✅ User found, updating password...');
      
      // Update the password
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await usersCollection.updateOne(
        { email: userEmail },
        { $set: { password: hashedPassword } }
      );
      console.log('✅ Password updated successfully');
    }

    // Verify the fix
    const updatedUser = await usersCollection.findOne({ email: userEmail });
    const isPasswordValid = await bcrypt.compare(newPassword, updatedUser.password);
    
    if (isPasswordValid) {
      console.log('✅ Password verification successful!');
      console.log('\n🎉 LOGIN ISSUE FIXED!');
      console.log('=====================');
      console.log(`📧 Email: ${userEmail}`);
      console.log(`🔑 Password: ${newPassword}`);
      console.log('💡 You can now login with these credentials');
    } else {
      console.log('❌ Password verification still failing');
    }

  } catch (error) {
    console.error('❌ Error fixing login:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixLoginIssue();
