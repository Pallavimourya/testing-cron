const mongoose = require('mongoose');
require('dotenv').config();

async function testLinkedInPosting() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get the ApprovedContent model
    const ApprovedContent = mongoose.model('ApprovedContent');

    // Create test content with image
    const contentWithImage = new ApprovedContent({
      id: 'test-content-with-image-' + Date.now(),
      userId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'), // Replace with actual user ID
      topicId: 'test-topic-1',
      topicTitle: 'Test Topic with Image',
      content: 'This is a test post with an image for LinkedIn posting.',
      hashtags: ['#test', '#linkedin', '#posting'],
      keyPoints: ['Point 1', 'Point 2'],
      imageUrl: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800&h=600&fit=crop',
      contentType: 'storytelling',
      status: 'approved',
      platform: 'linkedin'
    });

    await contentWithImage.save();
    console.log('✅ Created test content with image:', contentWithImage.id);

    // Create test content without image
    const contentWithoutImage = new ApprovedContent({
      id: 'test-content-without-image-' + Date.now(),
      userId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'), // Replace with actual user ID
      topicId: 'test-topic-2',
      topicTitle: 'Test Topic without Image',
      content: 'This is a test post without an image for LinkedIn posting.',
      hashtags: ['#test', '#linkedin', '#textonly'],
      keyPoints: ['Point 1', 'Point 2'],
      contentType: 'tips',
      status: 'approved',
      platform: 'linkedin'
    });

    await contentWithoutImage.save();
    console.log('✅ Created test content without image:', contentWithoutImage.id);

    console.log('\n📋 Test Content Summary:');
    console.log('1. Content with image:', contentWithImage.id);
    console.log('   - Has imageUrl:', !!contentWithImage.imageUrl);
    console.log('   - Content:', contentWithImage.content.substring(0, 50) + '...');
    
    console.log('2. Content without image:', contentWithoutImage.id);
    console.log('   - Has imageUrl:', !!contentWithoutImage.imageUrl);
    console.log('   - Content:', contentWithoutImage.content.substring(0, 50) + '...');

    console.log('\n🎯 LinkedIn Posting Logic:');
    console.log('- If content has imageUrl: Post with image');
    console.log('- If content has no imageUrl: Post text only');
    console.log('- Both types will be posted to LinkedIn with appropriate media category');

    console.log('\n✅ Test setup complete! You can now test the LinkedIn posting functionality.');

  } catch (error) {
    console.error('❌ Error in test setup:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testLinkedInPosting();
