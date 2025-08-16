#!/usr/bin/env node

const crypto = require('crypto');

console.log('🔐 Generating secure tokens for external cron setup...\n');

// Generate secure random tokens
const externalCronSecret = crypto.randomBytes(32).toString('hex');
const cronJobToken = crypto.randomBytes(24).toString('hex');

console.log('📋 Add these environment variables to your Vercel project:\n');

console.log('EXTERNAL_CRON_SECRET=' + externalCronSecret);
console.log('CRON_JOB_TOKEN=' + cronJobToken);

console.log('\n🔧 For local development, add these to your .env.local file:');
console.log('EXTERNAL_CRON_SECRET=' + externalCronSecret);
console.log('CRON_JOB_TOKEN=' + cronJobToken);

console.log('\n📝 Next steps:');
console.log('1. Add these environment variables to your Vercel project');
console.log('2. Set up an external cron service (cron-job.org recommended)');
console.log('3. Configure the cron job to call: /api/cron/external-auto-post');
console.log('4. Add the Authorization and X-Cron-Job-Token headers');
console.log('5. Test the endpoint manually');

console.log('\n✅ Tokens generated successfully!');
