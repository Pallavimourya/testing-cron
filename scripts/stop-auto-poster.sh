#!/bin/bash

# LinkedIn Auto-Poster Stop Script
echo "🛑 Stopping LinkedIn Auto-Poster..."

# Find and kill the auto-poster process
PIDS=$(ps aux | grep "linkedin-auto-poster.js" | grep -v grep | awk '{print $2}')

if [ -z "$PIDS" ]; then
    echo "ℹ️  No LinkedIn Auto-Poster processes found running."
else
    echo "🔍 Found LinkedIn Auto-Poster processes: $PIDS"
    
    for PID in $PIDS; do
        echo "🔪 Killing process $PID..."
        kill -TERM $PID
        
        # Wait a moment for graceful shutdown
        sleep 2
        
        # Force kill if still running
        if kill -0 $PID 2>/dev/null; then
            echo "⚡ Force killing process $PID..."
            kill -KILL $PID
        fi
    done
    
    echo "✅ LinkedIn Auto-Poster stopped successfully"
fi

# Also kill any node processes running the script
NODE_PIDS=$(ps aux | grep "node.*linkedin-auto-poster" | grep -v grep | awk '{print $2}')

if [ ! -z "$NODE_PIDS" ]; then
    echo "🔍 Found additional node processes: $NODE_PIDS"
    for PID in $NODE_PIDS; do
        echo "🔪 Killing node process $PID..."
        kill -TERM $PID
        sleep 1
        if kill -0 $PID 2>/dev/null; then
            kill -KILL $PID
        fi
    done
fi

echo "🏁 All LinkedIn Auto-Poster processes stopped"
