#!/bin/bash

echo "🚀 Setting up Simple Auto-Poster..."

# Install dependencies if not already installed
echo "📦 Installing dependencies..."
npm install node-cron node-fetch

# Create logs directory
echo "📁 Creating logs directory..."
mkdir -p logs

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/linkzup

# NextAuth URL
NEXTAUTH_URL=http://localhost:3000

# Cron Secret (change this to a secure value)
CRON_SECRET=your-secure-cron-secret-here

# LinkedIn API Credentials (add your actual values)
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
EOF
    echo "✅ Created .env file - Please update with your actual values"
else
    echo "✅ .env file already exists"
fi

# Create PM2 ecosystem file
echo "📝 Creating PM2 ecosystem file..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'linkzup-app',
      script: 'npm',
      args: 'start',
      cwd: './',
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'auto-poster',
      script: './scripts/simple-auto-poster.js',
      cwd: './',
      env: {
        NODE_ENV: 'production'
      },
      log_file: './logs/auto-poster.log',
      out_file: './logs/auto-poster-out.log',
      error_file: './logs/auto-poster-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    }
  ]
}
EOF

# Create start script
echo "📝 Creating start script..."
cat > start-auto-poster.sh << 'EOF'
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
EOF

# Create stop script
echo "📝 Creating stop script..."
cat > stop-auto-poster.sh << 'EOF'
#!/bin/bash
echo "🛑 Stopping Auto-Poster..."
pm2 stop auto-poster
echo "✅ Auto-poster stopped!"
EOF

# Create status script
echo "📝 Creating status script..."
cat > status-auto-poster.sh << 'EOF'
#!/bin/bash
echo "📊 Auto-Poster Status:"
pm2 status auto-poster
echo ""
echo "📋 Recent Logs:"
pm2 logs auto-poster --lines 20
EOF

# Make scripts executable
chmod +x start-auto-poster.sh
chmod +x stop-auto-poster.sh
chmod +x status-auto-poster.sh

echo ""
echo "✅ Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Update .env file with your actual values"
echo "2. Run: ./start-auto-poster.sh"
echo "3. Check status: ./status-auto-poster.sh"
echo "4. Stop: ./stop-auto-poster.sh"
echo ""
echo "🔧 Manual Commands:"
echo "- Start: pm2 start ecosystem.config.js --only auto-poster"
echo "- Status: pm2 status"
echo "- Logs: pm2 logs auto-poster"
echo "- Stop: pm2 stop auto-poster"
echo ""
echo "📁 Files Created:"
echo "- scripts/simple-auto-poster.js (main cron job)"
echo "- ecosystem.config.js (PM2 configuration)"
echo "- start-auto-poster.sh (start script)"
echo "- stop-auto-poster.sh (stop script)"
echo "- status-auto-poster.sh (status script)"
echo "- logs/ (log directory)"
