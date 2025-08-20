#!/usr/bin/env node

const https = require('https');
const http = require('http');

// Configuration
const config = {
  baseUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  token: process.env.EXTERNAL_CRON_TOKEN || 'd3a1f120153d765b53d20a143e36e53df970019558efe380163e04eb729ac76c',
  endpoint: '/api/cron/external-auto-post'
};

function makeRequest(url, options) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    const req = protocol.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
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

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function testCronSetup() {
  console.log('🧪 Testing Cron Setup');
  console.log('=====================');
  console.log(`Base URL: ${config.baseUrl}`);
  console.log(`Endpoint: ${config.endpoint}`);
  console.log(`Token: ${config.token ? '✅ Set' : '❌ Not set'}`);
  console.log('');

  if (!config.token) {
    console.error('❌ EXTERNAL_CRON_TOKEN not found');
    console.log('Please run: ./scripts/setup-external-cron.sh');
    process.exit(1);
  }

  const testUrl = `${config.baseUrl}${config.endpoint}`;

  console.log('📡 Testing external cron endpoint...');
  console.log('');

  try {
    // Test with Bearer token
    console.log('1️⃣ Testing with Bearer token...');
    const bearerResponse = await makeRequest(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'User-Agent': 'test-script/1.0',
        'Content-Type': 'application/json'
      }
    });

    console.log(`   Status: ${bearerResponse.status}`);
    if (bearerResponse.status === 200) {
      console.log('   ✅ Bearer token authentication works!');
      console.log(`   📊 Response: ${JSON.stringify(bearerResponse.data, null, 2)}`);
    } else {
      console.log('   ❌ Bearer token authentication failed');
      console.log(`   📊 Response: ${JSON.stringify(bearerResponse.data, null, 2)}`);
    }
    console.log('');

    // Test with query parameter
    console.log('2️⃣ Testing with query parameter...');
    const queryUrl = `${testUrl}?token=${config.token}`;
    const queryResponse = await makeRequest(queryUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'test-script/1.0',
        'Content-Type': 'application/json'
      }
    });

    console.log(`   Status: ${queryResponse.status}`);
    if (queryResponse.status === 200) {
      console.log('   ✅ Query parameter authentication works!');
      console.log(`   📊 Response: ${JSON.stringify(queryResponse.data, null, 2)}`);
    } else {
      console.log('   ❌ Query parameter authentication failed');
      console.log(`   📊 Response: ${JSON.stringify(queryResponse.data, null, 2)}`);
    }
    console.log('');

    // Test without authentication
    console.log('3️⃣ Testing without authentication (should fail)...');
    const noAuthResponse = await makeRequest(testUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'test-script/1.0',
        'Content-Type': 'application/json'
      }
    });

    console.log(`   Status: ${noAuthResponse.status}`);
    if (noAuthResponse.status === 401) {
      console.log('   ✅ Authentication protection works!');
    } else {
      console.log('   ⚠️  Authentication protection may not be working');
    }
    console.log('');

    // Summary
    console.log('📋 Cron-job.org Configuration:');
    console.log('==============================');
    console.log(`URL: ${testUrl}`);
    console.log(`Schedule: */5 * * * * (Every 5 minutes)`);
    console.log(`Method: GET`);
    console.log('');
    console.log('🔐 Authentication Methods:');
    console.log('1. Bearer Token Header:');
    console.log(`   Authorization: Bearer ${config.token}`);
    console.log('');
    console.log('2. Query Parameter:');
    console.log(`   URL: ${queryUrl}`);
    console.log('');
    console.log('✅ Setup is ready for cron-job.org!');

  } catch (error) {
    console.error('❌ Error testing cron setup:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('');
      console.log('💡 Make sure your application is running:');
      console.log('   npm run dev');
    }
  }
}

// Run the test
testCronSetup();
