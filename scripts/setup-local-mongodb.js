const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Use local MongoDB for development
const MONGODB_URI = 'mongodb://localhost:27017/linkzup';

async function setupLocalMongoDB() {
  try {
    console.log('🔧 Setting up local MongoDB...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Create User schema if it doesn't exist
    const userSchema = new mongoose.Schema({
      name: String,
      email: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      subscriptionStatus: { type: String, default: 'free' },
      subscriptionExpiry: Date,
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    });

    const User = mongoose.models.User || mongoose.model('User', userSchema);

    // Check if test user exists
    const existingUser = await User.findOne({ email: 'test@example.com' });
    
    if (!existingUser) {
      console.log('👤 Creating test user...');
      
      // Hash password
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      // Create test user
      const testUser = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword,
        subscriptionStatus: 'premium',
        subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      });
      
      await testUser.save();
      console.log('✅ Test user created successfully');
      console.log('📧 Email: test@example.com');
      console.log('🔑 Password: password123');
    } else {
      console.log('✅ Test user already exists');
    }

    console.log('\n🚀 Local MongoDB setup complete!');
    console.log('💡 Update your .env.local with: MONGODB_URI=mongodb://localhost:27017/linkzup');
    
  } catch (error) {
    console.error('❌ Error setting up MongoDB:', error);
  } finally {
    await mongoose.disconnect();
  }
}

setupLocalMongoDB();
