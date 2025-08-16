const cron = require('node-cron');
const fetch = require('node-fetch');

// Configuration
const AUTO_POST_URL = process.env.AUTO_POST_URL || 'http://localhost:3000/api/cron/auto-post';
const CRON_SCHEDULE = process.env.CRON_SCHEDULE || '* * * * *'; // Every minute

console.log('🤖 Starting auto-post cron job...');
console.log(`📅 Schedule: ${CRON_SCHEDULE} (Every minute)`);
console.log(`🔗 Endpoint: ${AUTO_POST_URL}`);

// Function to call the auto-post endpoint
async function triggerAutoPost() {
  try {
    console.log(`⏰ [${new Date().toISOString()}] Triggering auto-post...`);
    
    const response = await fetch(AUTO_POST_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Auto-post completed:`, {
        posted: result.posted || 0,
        errors: result.errors || 0,
        totalProcessed: result.totalProcessed || 0,
      });
    } else {
      const errorText = await response.text();
      console.error(`❌ Auto-post failed: ${response.status}`, errorText);
    }
  } catch (error) {
    console.error(`❌ Error triggering auto-post:`, error.message);
  }
}

// Schedule the cron job
const task = cron.schedule(CRON_SCHEDULE, triggerAutoPost, {
  scheduled: true,
  timezone: "Asia/Kolkata" // Use Indian Standard Time
});

console.log('✅ Cron job scheduled successfully');

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Stopping cron job...');
  task.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 Stopping cron job...');
  task.stop();
  process.exit(0);
});

// Initial run after 10 seconds
setTimeout(() => {
  console.log('🚀 Running initial auto-post check...');
  triggerAutoPost();
}, 10000);
