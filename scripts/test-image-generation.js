#!/usr/bin/env node

/**
 * Test script for the new image generation methods
 * Run with: node scripts/test-image-generation.js
 */

const fs = require('fs');
const path = require('path');

// Test configurations
const testCases = [
  {
    name: "DALL-E Professional Business",
    config: {
      prompt: "leadership strategies for team growth",
      content: "Effective leadership is about inspiring your team to achieve their full potential. Focus on clear communication, setting achievable goals, and providing constructive feedback. Remember that great leaders lead by example and create an environment where everyone feels valued and motivated to succeed.",
      style: "professional",
      theme: "business",
      generationMethod: "dalle"
    }
  },
  {
    name: "SDXL Creative Technology", 
    config: {
      prompt: "digital transformation trends",
      content: "The future of business lies in embracing digital transformation. Companies that adapt quickly to new technologies will thrive in the competitive landscape. Key areas include AI integration, cloud computing, and data-driven decision making.",
      style: "creative",
      theme: "technology",
      generationMethod: "sdxl"
    }
  },
  {
    name: "Hybrid Minimal Leadership",
    config: {
      prompt: "building high-performing teams",
      content: "High-performing teams are built on trust, clear communication, and shared goals. Leaders must create psychological safety, encourage diverse perspectives, and celebrate both individual and team achievements.",
      style: "minimal",
      theme: "leadership", 
      generationMethod: "hybrid"
    }
  },
  {
    name: "DALL-E Modern Marketing",
    config: {
      prompt: "customer engagement strategies",
      content: "Modern marketing is all about creating meaningful connections with your audience. Use data-driven insights to personalize experiences, leverage social media effectively, and build authentic relationships that drive long-term loyalty.",
      style: "modern",
      theme: "marketing",
      generationMethod: "dalle"
    }
  }
];

async function testImageGeneration() {
  console.log('🎨 Testing Image Generation Methods\n');
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const results = [];
  
  for (const testCase of testCases) {
    console.log(`Testing: ${testCase.name}`);
    console.log(`Method: ${testCase.config.generationMethod.toUpperCase()}`);
    console.log(`Style: ${testCase.config.style}`);
    console.log(`Theme: ${testCase.config.theme}`);
    console.log('---');
    
    try {
      const startTime = Date.now();
      
      const response = await fetch(`${baseUrl}/api/generate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCase.config)
      });
      
      const result = await response.json();
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      if (result.success) {
        console.log(`✅ Success! (${duration}ms)`);
        console.log(`📸 Image URL: ${result.imageUrl}`);
        console.log(`🎯 Prompt used: ${result.prompt.substring(0, 100)}...`);
        console.log(`📊 Generations: ${result.imageGenerations?.used || 'N/A'}/${result.imageGenerations?.limit || 'N/A'}`);
        
        results.push({
          testCase: testCase.name,
          method: testCase.config.generationMethod,
          success: true,
          duration,
          imageUrl: result.imageUrl,
          prompt: result.prompt
        });
      } else {
        console.log(`❌ Failed: ${result.error}`);
        results.push({
          testCase: testCase.name,
          method: testCase.config.generationMethod,
          success: false,
          error: result.error
        });
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      results.push({
        testCase: testCase.name,
        method: testCase.config.generationMethod,
        success: false,
        error: error.message
      });
    }
    
    console.log('\n');
    
    // Wait between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Generate summary report
  console.log('📊 Test Summary\n');
  console.log('='.repeat(50));
  
  const successfulTests = results.filter(r => r.success);
  const failedTests = results.filter(r => !r.success);
  
  console.log(`✅ Successful: ${successfulTests.length}/${results.length}`);
  console.log(`❌ Failed: ${failedTests.length}/${results.length}`);
  
  if (successfulTests.length > 0) {
    console.log('\n🎯 Successful Tests:');
    successfulTests.forEach(test => {
      console.log(`  • ${test.testCase} (${test.method}) - ${test.duration}ms`);
    });
  }
  
  if (failedTests.length > 0) {
    console.log('\n❌ Failed Tests:');
    failedTests.forEach(test => {
      console.log(`  • ${test.testCase} (${test.method}) - ${test.error}`);
    });
  }
  
  // Save results to file
  const reportPath = path.join(__dirname, 'image-generation-test-results.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Detailed results saved to: ${reportPath}`);
  
  // Generate HTML report
  generateHTMLReport(results);
}

function generateHTMLReport(results) {
  const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Image Generation Test Results</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .test-case { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
        .success { border-left: 4px solid #10B981; }
        .failure { border-left: 4px solid #EF4444; }
        .image-preview { max-width: 300px; margin: 10px 0; }
        .method { font-weight: bold; color: #3B82F6; }
        .duration { color: #6B7280; }
        .error { color: #EF4444; }
    </style>
</head>
<body>
    <h1>🎨 Image Generation Test Results</h1>
    <p>Generated on: ${new Date().toLocaleString()}</p>
    
    ${results.map(result => `
        <div class="test-case ${result.success ? 'success' : 'failure'}">
            <h3>${result.testCase}</h3>
            <p><span class="method">Method:</span> ${result.method.toUpperCase()}</p>
            ${result.success ? `
                <p><span class="duration">Duration:</span> ${result.duration}ms</p>
                <p><strong>Prompt:</strong> ${result.prompt}</p>
                <img src="${result.imageUrl}" alt="Generated image" class="image-preview">
                <p><a href="${result.imageUrl}" target="_blank">View Full Image</a></p>
            ` : `
                <p class="error"><strong>Error:</strong> ${result.error}</p>
            `}
        </div>
    `).join('')}
</body>
</html>`;
  
  const htmlPath = path.join(__dirname, 'image-generation-test-results.html');
  fs.writeFileSync(htmlPath, html);
  console.log(`📄 HTML report saved to: ${htmlPath}`);
}

// Check if running in Node.js environment
if (typeof fetch === 'undefined') {
  console.log('⚠️  Fetch not available. Installing node-fetch...');
  console.log('Run: npm install node-fetch');
  process.exit(1);
}

// Run the test
testImageGeneration().catch(console.error);
