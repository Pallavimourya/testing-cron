#!/usr/bin/env node

/**
 * Test script for external cron functionality
 * This script tests the external cron endpoint to ensure it's working properly
 */

const https = require('https');
const http = require('http');

// Configuration
const config = {
  baseUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  token: process.env.EXTERNAL_CRON_TOKEN,
  endpoint: '/api/cron/external-auto-post'
};

function makeRequest(url, options) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const req = client.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

async function testExternalCron() {
  console.log('🧪 Testing External Cron Functionality');
  console.log('=====================================');
  console.log(`Base URL: ${config.baseUrl}`);
  console.log(`Endpoint: ${config.endpoint}`);
  console.log(`Token: ${config.token ? '✅ Set' : '❌ Not set'}`);
  console.log('');
  
  if (!config.token) {
    console.error('❌ EXTERNAL_CRON_TOKEN environment variable is not set');
    console.log('Please set the EXTERNAL_CRON_TOKEN environment variable');
    process.exit(1);
  }
  
  const testUrl = `${config.baseUrl}${config.endpoint}`;
  
  try {
    console.log('📡 Making request to external cron endpoint...');
    
    const response = await makeRequest(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'User-Agent': 'test-script/1.0',
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📊 Response Status: ${response.status}`);
    console.log(`📊 Response Headers:`, response.headers);
    console.log('');
    
    if (response.status === 200) {
      console.log('✅ External cron endpoint is working!');
      console.log('📋 Response Data:');
      console.log(JSON.stringify(response.data, null, 2));
      
      if (response.data.success) {
        console.log('');
        console.log('🎉 External cron is functioning correctly!');
        console.log(`📈 Processed: ${response.data.processed || 0} posts`);
        console.log(`✅ Success: ${response.data.successCount || 0} posts`);
        console.log(`❌ Failed: ${response.data.failureCount || 0} posts`);
        console.log(`🕐 Current Time: ${response.data.currentTime || 'N/A'}`);
      }
    } else {
      console.error('❌ External cron endpoint returned an error');
      console.error('Response:', response.data);
    }
    
  } catch (error) {
    console.error('❌ Error testing external cron:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('');
      console.log('💡 Troubleshooting tips:');
      console.log('1. Make sure your application is running');
      console.log('2. Check if the base URL is correct');
      console.log('3. Verify the endpoint path is correct');
    }
  }
}

// Test with different authentication methods
async function testAllAuthMethods() {
  console.log('🔐 Testing Different Authentication Methods');
  console.log('===========================================');
  
  const testUrl = `${config.baseUrl}${config.endpoint}`;
  const authMethods = [
    {
      name: 'Bearer Token Header',
      options: {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Content-Type': 'application/json'
        }
      }
    },
    {
      name: 'Query Parameter Token',
      options: {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      },
      url: `${testUrl}?token=${config.token}`
    },
    {
      name: 'Cron-job.org User Agent',
      options: {
        method: 'GET',
        headers: {
          'User-Agent': 'cron-job.org/1.0',
          'Content-Type': 'application/json'
        }
      }
    }
  ];
  
  for (const method of authMethods) {
    console.log(`\n🔍 Testing: ${method.name}`);
    console.log('─'.repeat(50));
    
    try {
      const url = method.url || testUrl;
      const response = await makeRequest(url, method.options);
      
      console.log(`Status: ${response.status}`);
      
      if (response.status === 200) {
        console.log('✅ Authentication successful');
        console.log(`Processed: ${response.data.processed || 0} posts`);
      } else {
        console.log('❌ Authentication failed');
        console.log('Response:', response.data);
      }
    } catch (error) {
      console.log('❌ Request failed:', error.message);
    }
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--auth-test')) {
    await testAllAuthMethods();
  } else {
    await testExternalCron();
  }
}

// Run the test
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testExternalCron, testAllAuthMethods };
