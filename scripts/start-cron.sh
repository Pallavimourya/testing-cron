#!/bin/bash

echo "🚀 Starting auto-post cron job..."

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if the cron job script exists
if [ ! -f "scripts/cron-job.js" ]; then
    echo "❌ Cron job script not found. Please run 'pnpm run setup-cron' first."
    exit 1
fi

# Start the cron job in the background
echo "✅ Starting cron job in background..."
nohup node scripts/cron-job.js > cron.log 2>&1 &

# Save the process ID
echo $! > cron.pid

echo "✅ Cron job started with PID $(cat cron.pid)"
echo "📝 Logs are being written to cron.log"
echo "🛑 To stop the cron job, run: pnpm run stop-cron"
