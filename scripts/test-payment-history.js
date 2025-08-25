const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/linkzup';

async function testPaymentHistory() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get a user to test with
    const users = await mongoose.connection.db.collection('users').find({}).limit(1).toArray();
    
    if (users.length === 0) {
      console.log('❌ No users found.');
      return;
    }

    const user = users[0];
    console.log(`👤 Testing with user: ${user.email} (${user._id})`);

    // Check payments for this user
    const payments = await mongoose.connection.db.collection('payments').find({ 
      userId: user._id.toString() 
    }).sort({ createdAt: -1 }).toArray();
    
    console.log(`\n📊 Found ${payments.length} payments for user:`);
    
    if (payments.length === 0) {
      console.log('No payments found for this user');
    } else {
      payments.forEach((payment, index) => {
        console.log(`\n${index + 1}. ${payment.planName} (${payment.status})`);
        console.log(`   Amount: ₹${payment.amount}`);
        console.log(`   Order ID: ${payment.razorpayOrderId}`);
        console.log(`   Payment ID: ${payment.razorpayPaymentId || 'N/A'}`);
        console.log(`   Created: ${payment.createdAt}`);
        console.log(`   Updated: ${payment.updatedAt}`);
        if (payment.couponCode) {
          console.log(`   Coupon: ${payment.couponCode} (₹${payment.discountAmount} off)`);
        }
      });
    }

    // Check payment counts by status
    const statusCounts = await mongoose.connection.db.collection('payments').aggregate([
      { $match: { userId: user._id.toString() } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]).toArray();

    console.log('\n📊 Payment Status Summary:');
    statusCounts.forEach(status => {
      console.log(`   ${status._id}: ${status.count} payments`);
    });

    // Test the API endpoint
    console.log('\n🔍 Testing API endpoint...');
    console.log('Note: This would require authentication to test properly');

  } catch (error) {
    console.error('❌ Error testing payment history:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
testPaymentHistory();
