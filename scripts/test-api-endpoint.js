// Using global fetch (available in Node 18+)

async function testAPI() {
  try {
    console.log('🔍 Testing API endpoint...');
    
    const response = await fetch('http://localhost:3000/api/approved-content');
    const data = await response.json();
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response data:', {
      success: data.success,
      contentCount: data.content?.length || 0,
      hasContent: data.content && data.content.length > 0,
      debug: data.debug
    });
    
    if (data.content && data.content.length > 0) {
      console.log('✅ Sample content:', {
        id: data.content[0].id,
        title: data.content[0].topicTitle,
        contentLength: data.content[0].content?.length || 0,
        status: data.content[0].status
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

testAPI();
