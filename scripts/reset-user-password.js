const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function resetUserPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const userEmail = 'vinnu123@gmail.com';
    const newPassword = 'testpassword123'; // New password for testing
    
    console.log(`🔧 Resetting password for user: ${userEmail}`);
    console.log(`🔑 New password: ${newPassword}`);
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    console.log('🔐 Password hashed successfully');
    
    // Update the user's password
    const usersCollection = mongoose.connection.db.collection('users');
    const result = await usersCollection.updateOne(
      { email: userEmail },
      { $set: { password: hashedPassword } }
    );
    
    if (result.matchedCount > 0) {
      console.log('✅ Password updated successfully');
      console.log('📧 Email:', userEmail);
      console.log('🔑 Password:', newPassword);
      console.log('💡 You can now test login with these credentials');
    } else {
      console.log('❌ User not found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

resetUserPassword();
