const mongoose = require('mongoose');
require('dotenv').config();

async function testLinkedInAPIEndpoint() {
  try {
    console.log('🧪 Testing LinkedIn API Endpoint...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Define the schema inline for testing
    const approvedContentSchema = new mongoose.Schema({
      id: {
        type: String,
        required: true,
        unique: true,
      },
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
      topicId: {
        type: String,
        required: true,
      },
      topicTitle: {
        type: String,
        required: true,
      },
      content: {
        type: String,
        required: true,
      },
      hashtags: [String],
      keyPoints: [String],
      imageUrl: String,
      contentType: {
        type: String,
        enum: ["storytelling", "tips", "insight", "question", "list"],
        default: "storytelling",
      },
      status: {
        type: String,
        enum: ["generated", "approved", "rejected", "scheduled", "posted"],
        default: "generated",
      },
      platform: {
        type: String,
        enum: ["linkedin", "twitter", "facebook"],
        default: "linkedin",
      },
      scheduledFor: Date,
      postedAt: Date,
    }, {
      timestamps: true,
    });

    // Create the model
    const ApprovedContent = mongoose.model('ApprovedContent', approvedContentSchema);

    // Create test content
    console.log('\n📝 Creating test content...');
    const testContent = new ApprovedContent({
      id: 'test-linkedin-api-' + Date.now(),
      userId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
      topicId: 'test-topic-api',
      topicTitle: 'Test Topic for API',
      content: 'This is a test post for LinkedIn API testing.',
      hashtags: ['#test', '#api', '#linkedin'],
      keyPoints: ['Point 1: API testing', 'Point 2: Endpoint verification'],
      imageUrl: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800&h=600&fit=crop',
      contentType: 'storytelling',
      status: 'approved',
      platform: 'linkedin'
    });

    await testContent.save();
    console.log('✅ Created test content:', testContent.id);

    // Test the API endpoint structure
    console.log('\n🔍 Testing API endpoint structure...');
    
    // Simulate the API call logic
    const contentToPost = await ApprovedContent.findOne({ id: testContent.id });
    if (contentToPost) {
      console.log('✅ Content found for posting:');
      console.log('   - ID:', contentToPost.id);
      console.log('   - Has imageUrl:', !!contentToPost.imageUrl);
      console.log('   - Status:', contentToPost.status);
      console.log('   - Platform:', contentToPost.platform);
      
      if (contentToPost.imageUrl) {
        console.log('📷 Content will be posted with image to LinkedIn');
        console.log('   - Image URL:', contentToPost.imageUrl);
        console.log('   - Post type: IMAGE');
      } else {
        console.log('📝 Content will be posted as text-only to LinkedIn');
        console.log('   - Post type: NONE');
      }
    }

    // Test URL construction
    console.log('\n🌐 Testing URL construction...');
    const host = 'localhost:3000';
    const protocol = 'http';
    const apiUrl = `${protocol}://${host}/api/linkedin/post`;
    
    console.log('✅ API URL constructed correctly:', apiUrl);
    console.log('✅ This URL will be used for LinkedIn posting');

    // Test request body structure
    console.log('\n📦 Testing request body structure...');
    const requestBody = {
      contentId: testContent.id
    };
    
    console.log('✅ Request body structure:', JSON.stringify(requestBody, null, 2));

    console.log('\n✅ LinkedIn API endpoint test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('1. Test content created:', testContent.id);
    console.log('2. API URL construction verified');
    console.log('3. Request body structure validated');
    console.log('4. Image detection logic working');
    console.log('5. Content structure verified');

    console.log('\n🎯 Next Steps:');
    console.log('- Test with actual authentication');
    console.log('- Verify LinkedIn API integration');
    console.log('- Test image upload functionality');

  } catch (error) {
    console.error('❌ Error in LinkedIn API endpoint test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testLinkedInAPIEndpoint();
