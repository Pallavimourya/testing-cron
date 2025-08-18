#!/bin/bash

# LinkedIn Auto-Poster Startup Script
echo "🚀 Starting LinkedIn Auto-Poster..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Set environment variables if .env file exists
if [ -f .env ]; then
    echo "📄 Loading environment variables from .env file..."
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "⚠️  No .env file found. Make sure environment variables are set."
fi

# Check required environment variables
if [ -z "$MONGODB_URI" ]; then
    echo "❌ MONGODB_URI environment variable is not set."
    exit 1
fi

echo "✅ Environment variables loaded"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Install node-cron if not already installed
if ! npm list node-cron &> /dev/null; then
    echo "📦 Installing node-cron..."
    npm install node-cron
fi

echo "✅ Dependencies ready"

# Create logs directory if it doesn't exist
mkdir -p logs

# Start the auto-poster with logging
echo "🔄 Starting LinkedIn Auto-Poster cron job..."
echo "📝 Logs will be saved to logs/auto-poster.log"

# Run the auto-poster script
node scripts/linkedin-auto-poster.js 2>&1 | tee logs/auto-poster.log

echo "🛑 LinkedIn Auto-Poster stopped"
