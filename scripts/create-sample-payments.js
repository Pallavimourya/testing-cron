const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/linkzup';

async function createSamplePayments() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get a user to associate payments with
    const users = await mongoose.connection.db.collection('users').find({}).limit(1).toArray();
    
    if (users.length === 0) {
      console.log('❌ No users found. Please create a user first.');
      return;
    }

    const user = users[0];
    console.log(`👤 Using user: ${user.email} (${user._id})`);

    // Create sample payments using the Payment model
    const Payment = mongoose.model('Payment', new mongoose.Schema({
      userId: String,
      razorpayOrderId: String,
      razorpayPaymentId: String,
      razorpaySignature: String,
      amount: Number,
      originalAmount: Number,
      discountAmount: Number,
      currency: String,
      status: String,
      planId: String,
      planName: String,
      planDuration: String,
      couponCode: String,
      couponId: String,
      metadata: Object,
      createdAt: Date,
      updatedAt: Date
    }));

    const samplePayments = [
      {
        userId: user._id.toString(),
        razorpayOrderId: `order_${Date.now()}_1`,
        razorpayPaymentId: `pay_${Date.now()}_1`,
        razorpaySignature: `sig_${Date.now()}_1`,
        amount: 299,
        originalAmount: 299,
        discountAmount: 0,
        currency: "INR",
        status: "paid",
        planId: "starter",
        planName: "Starter Plan",
        planDuration: "30 days",
        metadata: {
          planType: "starter",
          userEmail: user.email,
          userName: user.name
        }
      },
      {
        userId: user._id.toString(),
        razorpayOrderId: `order_${Date.now()}_2`,
        razorpayPaymentId: `pay_${Date.now()}_2`,
        razorpaySignature: `sig_${Date.now()}_2`,
        amount: 499,
        originalAmount: 599,
        discountAmount: 100,
        currency: "INR",
        status: "paid",
        planId: "basic",
        planName: "Basic Plan",
        planDuration: "30 days",
        couponCode: "SAVE100",
        metadata: {
          planType: "basic",
          userEmail: user.email,
          userName: user.name
        }
      },
      {
        userId: user._id.toString(),
        razorpayOrderId: `order_${Date.now()}_3`,
        razorpayPaymentId: `pay_${Date.now()}_3`,
        razorpaySignature: `sig_${Date.now()}_3`,
        amount: 799,
        originalAmount: 799,
        discountAmount: 0,
        currency: "INR",
        status: "paid",
        planId: "pro",
        planName: "Pro Plan",
        planDuration: "30 days",
        metadata: {
          planType: "pro",
          userEmail: user.email,
          userName: user.name
        }
      },
      {
        userId: user._id.toString(),
        razorpayOrderId: `order_${Date.now()}_4`,
        razorpayPaymentId: null,
        razorpaySignature: null,
        amount: 299,
        originalAmount: 299,
        discountAmount: 0,
        currency: "INR",
        status: "failed",
        planId: "starter",
        planName: "Starter Plan",
        planDuration: "30 days",
        metadata: {
          planType: "starter",
          userEmail: user.email,
          userName: user.name
        }
      },
      {
        userId: user._id.toString(),
        razorpayOrderId: `order_${Date.now()}_5`,
        razorpayPaymentId: null,
        razorpaySignature: null,
        amount: 499,
        originalAmount: 499,
        discountAmount: 0,
        currency: "INR",
        status: "cancelled",
        planId: "basic",
        planName: "Basic Plan",
        planDuration: "30 days",
        metadata: {
          planType: "basic",
          userEmail: user.email,
          userName: user.name
        }
      }
    ];

    console.log('📝 Creating sample payments...');
    
    for (const payment of samplePayments) {
      const newPayment = new Payment({
        ...payment,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await newPayment.save();
      console.log(`✅ Created payment: ${newPayment.planName} (${newPayment.status}) - ₹${newPayment.amount}`);
    }

    console.log('\n✅ Sample payments created successfully!');
    
    // Verify the data was created
    const paidPayments = await Payment.countDocuments({ userId: user._id.toString(), status: "paid" });
    const failedPayments = await Payment.countDocuments({ userId: user._id.toString(), status: "failed" });
    const cancelledPayments = await Payment.countDocuments({ userId: user._id.toString(), status: "cancelled" });
    
    console.log(`📊 Verification: Paid=${paidPayments}, Failed=${failedPayments}, Cancelled=${cancelledPayments}`);

  } catch (error) {
    console.error('❌ Error creating sample payments:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
createSamplePayments();
