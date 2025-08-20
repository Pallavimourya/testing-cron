const fetch = require('node-fetch');

async function testTopicApprovalAPI() {
  try {
    console.log('🔧 Testing topic approval API...');
    
    // First, let's get a story with pending topics
    const response = await fetch('http://localhost:3000/api/story/latest');
    
    if (!response.ok) {
      console.log('❌ Failed to get latest story:', response.status);
      return;
    }
    
    const storyData = await response.json();
    console.log('📦 Story data:', storyData);
    
    if (!storyData.success || !storyData.story) {
      console.log('❌ No story found');
      return;
    }
    
    const story = storyData.story;
    const pendingTopics = story.generatedTopics?.filter(topic => topic.status === "pending") || [];
    
    if (pendingTopics.length === 0) {
      console.log('❌ No pending topics found');
      return;
    }
    
    const topicToApprove = pendingTopics[0];
    console.log(`📝 Testing approval for topic: ${topicToApprove.title} (ID: ${topicToApprove.id})`);
    
    // Test the approval API
    const approvalResponse = await fetch('http://localhost:3000/api/story/topics/approve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        storyId: story._id,
        topicId: topicToApprove.id,
      }),
    });
    
    console.log('📡 Approval response status:', approvalResponse.status);
    
    const approvalData = await approvalResponse.json();
    console.log('📦 Approval response data:', approvalData);
    
    if (approvalResponse.ok) {
      console.log('✅ Topic approval successful!');
    } else {
      console.log('❌ Topic approval failed:', approvalData.error);
    }
    
  } catch (error) {
    console.error('❌ Error testing topic approval API:', error);
  }
}

testTopicApprovalAPI();
