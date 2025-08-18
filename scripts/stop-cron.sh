#!/bin/bash

echo "🛑 Stopping auto-post cron job..."

# Check if PID file exists
if [ ! -f "cron.pid" ]; then
    echo "❌ No cron job PID file found. The cron job may not be running."
    exit 1
fi

# Get the PID
PID=$(cat cron.pid)

# Check if the process is still running
if ! ps -p $PID > /dev/null; then
    echo "❌ Process with PID $PID is not running."
    rm -f cron.pid
    exit 1
fi

# Kill the process
echo "🔄 Stopping process with PID $PID..."
kill $PID

# Wait a moment and check if it's still running
sleep 2
if ps -p $PID > /dev/null; then
    echo "⚠️  Process still running, force killing..."
    kill -9 $PID
fi

# Remove the PID file
rm -f cron.pid

echo "✅ Cron job stopped successfully"
