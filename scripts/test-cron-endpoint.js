#!/usr/bin/env node

const https = require('https');
require('dotenv').config({ path: '.env.local' });

const EXTERNAL_CRON_SECRET = process.env.EXTERNAL_CRON_SECRET;
const CRON_JOB_TOKEN = process.env.CRON_JOB_TOKEN;
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

if (!EXTERNAL_CRON_SECRET || !CRON_JOB_TOKEN) {
  console.error('❌ Missing environment variables. Please run generate-cron-secrets.js first.');
  process.exit(1);
}

console.log('🧪 Testing external cron endpoint...\n');

const options = {
  hostname: new URL(BASE_URL).hostname,
  port: new URL(BASE_URL).port || (new URL(BASE_URL).protocol === 'https:' ? 443 : 80),
  path: '/api/cron/external-auto-post',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${EXTERNAL_CRON_SECRET}`,
    'X-Cron-Job-Token': CRON_JOB_TOKEN,
    'User-Agent': 'test-cron-script/1.0'
  }
};

const req = https.request(options, (res) => {
  console.log(`📡 Status: ${res.statusCode}`);
  console.log(`📡 Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('\n✅ Response:');
      console.log(JSON.stringify(response, null, 2));
      
      if (response.success) {
        console.log('\n🎉 Cron endpoint is working correctly!');
      } else {
        console.log('\n❌ Cron endpoint returned an error');
      }
    } catch (e) {
      console.log('\n📄 Raw response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Request failed:', e.message);
});

req.end();
