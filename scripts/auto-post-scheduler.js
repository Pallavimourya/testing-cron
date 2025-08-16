const fetch = require('node-fetch')

async function triggerAutoPost() {
  try {
    console.log('🔄 Triggering auto-post at', new Date().toISOString())
    
    const response = await fetch('http://localhost:3000/api/cron/auto-post', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    if (response.ok) {
      const data = await response.json()
      console.log('✅ Auto-post triggered successfully:', {
        posted: data.posted,
        errors: data.errors,
        totalProcessed: data.totalProcessed,
        message: data.message
      })
    } else {
      console.log('❌ Auto-post trigger failed:', response.status, response.statusText)
    }
  } catch (error) {
    console.error('❌ Error triggering auto-post:', error.message)
  }
}

// Function to start the scheduler
function startAutoPostScheduler() {
  console.log('🚀 Starting auto-post scheduler...')
  console.log('⏰ Will trigger auto-post every 5 minutes')
  console.log('📅 First run will be in 5 minutes')
  
  // Initial delay of 5 minutes
  setTimeout(() => {
    triggerAutoPost()
    
    // Then run every 5 minutes
    setInterval(triggerAutoPost, 5 * 60 * 1000)
  }, 5 * 60 * 1000)
  
  console.log('✅ Auto-post scheduler started successfully!')
  console.log('💡 Keep this script running for automatic posting')
  console.log('🛑 Press Ctrl+C to stop the scheduler')
}

// Start the scheduler
startAutoPostScheduler()

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Auto-post scheduler stopped')
  process.exit(0)
})
