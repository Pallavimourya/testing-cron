#!/bin/bash
echo "🚀 Starting Auto-Poster..."

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 is not installed. Installing PM2..."
    npm install -g pm2
fi

# Start the auto-poster
echo "🔄 Starting auto-poster with PM2..."
pm2 start ecosystem.config.js --only auto-poster

echo "✅ Auto-poster started!"
echo "📊 Check status: pm2 status"
echo "📋 View logs: pm2 logs auto-poster"
echo "🛑 Stop: pm2 stop auto-poster"
