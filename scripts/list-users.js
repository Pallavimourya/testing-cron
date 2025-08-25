const mongoose = require('mongoose');
require('dotenv').config();

async function listUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const usersCollection = mongoose.connection.db.collection('users');
    const users = await usersCollection.find({}).toArray();
    
    console.log(`\n👥 Found ${users.length} users in database:`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - Created: ${user.createdAt?.toDateString() || 'Unknown'}`);
    });

    // Check for the specific user
    const specificUser = await usersCollection.findOne({ email: 'vinnu123@gmail.com' });
    if (specificUser) {
      console.log('\n✅ Found vinnu123@gmail.com:', {
        _id: specificUser._id,
        name: specificUser.name,
        email: specificUser.email,
        hasPassword: !!specificUser.password
      });
    } else {
      console.log('\n❌ vinnu123@gmail.com not found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

listUsers();
