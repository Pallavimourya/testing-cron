#!/bin/bash

# External Cron Setup Script for LinkedIn Auto Posting
# This script helps you set up external cron integration

echo "🚀 External Cron Setup for LinkedIn Auto Posting"
echo "================================================"

# Generate secure secrets
echo "🔐 Generating secure secrets..."
CRON_SECRET=$(openssl rand -base64 32)
EXTERNAL_CRON_SECRET=$(openssl rand -base64 32)
CRON_JOB_TOKEN=$(openssl rand -base64 32)

echo ""
echo "✅ Generated secure secrets:"
echo "CRON_SECRET=$CRON_SECRET"
echo "EXTERNAL_CRON_SECRET=$EXTERNAL_CRON_SECRET"
echo "CRON_JOB_TOKEN=$CRON_JOB_TOKEN"
echo ""

# Create environment file template
echo "📝 Creating environment variables template..."
cat > .env.example << EOF
# Database
MONGODB_URI=your-mongodb-connection-string

# Authentication
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://your-app.vercel.app

# LinkedIn API
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret

# Cron Security
CRON_SECRET=$CRON_SECRET
EXTERNAL_CRON_SECRET=$EXTERNAL_CRON_SECRET
CRON_JOB_TOKEN=$CRON_JOB_TOKEN
EOF

echo "✅ Created .env.example file with generated secrets"
echo ""

# Display setup instructions
echo "📋 Setup Instructions:"
echo "====================="
echo ""
echo "1. 🚀 Deploy to Vercel:"
echo "   vercel --prod"
echo ""
echo "2. 🔧 Set Environment Variables in Vercel Dashboard:"
echo "   - Go to your Vercel project dashboard"
echo "   - Navigate to Settings > Environment Variables"
echo "   - Add all variables from .env.example"
echo ""
echo "3. 🔗 Set up cron-job.org:"
echo "   - Go to https://cron-job.org"
echo "   - Create account and verify email"
echo "   - Create new cron job with these settings:"
echo "     * URL: https://your-app.vercel.app/api/cron/external-auto-post"
echo "     * Schedule: Every minute (* * * * *)"
echo "     * Method: GET"
echo "     * Headers:"
echo "       - Authorization: Bearer $EXTERNAL_CRON_SECRET"
echo "       - OR X-Cron-Job-Token: $CRON_JOB_TOKEN"
echo ""
echo "4. 🧪 Test the setup:"
echo "   - Visit: https://your-app.vercel.app/api/test-external-cron"
echo "   - Should show success response"
echo ""
echo "5. 📊 Monitor:"
echo "   - Check Vercel function logs"
echo "   - Monitor cron-job.org execution history"
echo "   - Test scheduling a post in your app"
echo ""

# Check if vercel.json exists
if [ -f "vercel.json" ]; then
    echo "✅ vercel.json found - Vercel cron jobs will be configured automatically"
else
    echo "❌ vercel.json not found - Please ensure it exists with cron configuration"
fi

echo ""
echo "🎉 Setup complete! Follow the instructions above to complete the configuration."
echo ""
echo "📚 For detailed instructions, see: EXTERNAL_CRON_SETUP_GUIDE.md"
