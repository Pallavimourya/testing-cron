const mongoose = require('mongoose');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/linky-linky');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// PaymentSettings Schema
const PaymentSettingsSchema = new mongoose.Schema({
  razorpayKeyId: {
    type: String,
    required: false,
    default: "",
  },
  razorpayKeySecret: {
    type: String,
    required: false,
    default: "",
  },
  razorpayWebhookSecret: {
    type: String,
    required: false,
    default: "",
  },
  taxPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  currency: {
    type: String,
    default: "INR",
    uppercase: true,
  },
  paymentsEnabled: {
    type: Boolean,
    default: false,
  },
  couponEngineEnabled: {
    type: Boolean,
    default: true,
  },
  lastWebhookTime: {
    type: Date,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

const PaymentSettings = mongoose.models.PaymentSettings || mongoose.model('PaymentSettings', PaymentSettingsSchema);

// Fix null taxPercentage values
const fixNullTaxPercentage = async () => {
  try {
    console.log('Checking for PaymentSettings with null taxPercentage...');
    
    // Find all documents with null taxPercentage
    const documentsWithNullTax = await PaymentSettings.find({
      $or: [
        { taxPercentage: null },
        { taxPercentage: { $exists: false } }
      ]
    });
    
    console.log(`Found ${documentsWithNullTax.length} documents with null taxPercentage`);
    
    if (documentsWithNullTax.length > 0) {
      // Update all documents with null taxPercentage to have default value 0
      const result = await PaymentSettings.updateMany(
        {
          $or: [
            { taxPercentage: null },
            { taxPercentage: { $exists: false } }
          ]
        },
        {
          $set: { taxPercentage: 0 }
        }
      );
      
      console.log(`Updated ${result.modifiedCount} documents`);
    }
    
    // Also check for any other null values that should have defaults
    const documentsWithNullValues = await PaymentSettings.find({
      $or: [
        { currency: null },
        { currency: { $exists: false } },
        { paymentsEnabled: null },
        { paymentsEnabled: { $exists: false } },
        { couponEngineEnabled: null },
        { couponEngineEnabled: { $exists: false } }
      ]
    });
    
    console.log(`Found ${documentsWithNullValues.length} documents with other null values`);
    
    if (documentsWithNullValues.length > 0) {
      const result = await PaymentSettings.updateMany(
        {
          $or: [
            { currency: null },
            { currency: { $exists: false } },
            { paymentsEnabled: null },
            { paymentsEnabled: { $exists: false } },
            { couponEngineEnabled: null },
            { couponEngineEnabled: { $exists: false } }
          ]
        },
        {
          $set: {
            currency: "INR",
            paymentsEnabled: false,
            couponEngineEnabled: true
          }
        }
      );
      
      console.log(`Updated ${result.modifiedCount} documents with default values`);
    }
    
    console.log('Database cleanup completed successfully');
    
  } catch (error) {
    console.error('Error fixing null values:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await fixNullTaxPercentage();
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
  process.exit(0);
};

main().catch(console.error);
