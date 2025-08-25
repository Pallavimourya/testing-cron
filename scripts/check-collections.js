const mongoose = require('mongoose');
require('dotenv').config();

async function checkCollections() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📚 Available collections:');
    collections.forEach(collection => {
      console.log(`  - ${collection.name}`);
    });

    // Check for users in different possible collection names
    const possibleUserCollections = ['users', 'user', 'Users', 'User'];
    
    for (const collectionName of possibleUserCollections) {
      try {
        const collection = mongoose.connection.db.collection(collectionName);
        const count = await collection.countDocuments();
        console.log(`\n📊 Collection '${collectionName}': ${count} documents`);
        
        if (count > 0) {
          const user = await collection.findOne({ email: 'vinnu123@gmail.com' });
          if (user) {
            console.log(`✅ Found user in '${collectionName}':`, {
              _id: user._id,
              name: user.name,
              email: user.email,
              hasPassword: !!user.password
            });
          }
        }
      } catch (error) {
        console.log(`❌ Collection '${collectionName}' not found`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkCollections();
