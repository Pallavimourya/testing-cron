# Vercel Auto-Posting Setup Guide

This guide explains how to set up automatic LinkedIn posting using Vercel Cron Jobs - a much simpler approach than running separate Node.js processes.

## How It Works

1. **Vercel Cron Jobs**: Automatically trigger the auto-posting API every minute
2. **API Route**: `/api/cron/auto-post-scheduler` processes scheduled posts
3. **Database**: MongoDB stores scheduled posts with UTC timestamps
4. **Security**: CRON_SECRET environment variable protects the endpoint

## Setup Steps

### 1. Configure Vercel Cron Jobs

The `vercel.json` file is already configured to run the cron job every minute:

\`\`\`json
{
  "crons": [
    {
      "path": "/api/cron/auto-post-scheduler",
      "schedule": "* * * * *"
    }
  ]
}
\`\`\`

### 2. Set Environment Variables

Add these environment variables in your Vercel dashboard:

\`\`\`bash
CRON_SECRET=your-secret-key-here
MONGODB_URI=your-mongodb-connection-string
NEXTAUTH_SECRET=your-nextauth-secret
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
\`\`\`

### 3. Deploy to Vercel

\`\`\`bash
# Deploy your application
vercel --prod
\`\`\`

The cron job will automatically start running once deployed.

## Features

### ✅ **Easy Scheduling**
- Users schedule posts in IST timezone
- Automatic conversion to UTC for storage
- User-friendly datetime picker

### ✅ **Reliable Processing**
- Runs every minute via Vercel Cron
- Processes all due posts automatically
- Comprehensive error handling

### ✅ **Retry Logic**
- Up to 3 automatic retries for failed posts
- Exponential backoff between retries
- Clear error messages for users

### ✅ **Status Tracking**
- Real-time status updates (pending/posted/failed/cancelled)
- Detailed error messages
- LinkedIn post URLs for successful posts

### ✅ **Security**
- CRON_SECRET protects the endpoint
- User authentication for all operations
- LinkedIn token validation

## API Endpoints

### Schedule a Post
\`\`\`bash
POST /api/scheduled-posts
{
  "content": "Your LinkedIn post content",
  "imageUrl": "https://example.com/image.jpg", // optional
  "scheduledAtIST": "2024-01-15T14:30" // IST datetime
}
\`\`\`

### List Scheduled Posts
\`\`\`bash
GET /api/scheduled-posts?status=pending&page=1&limit=10
\`\`\`

### Update/Cancel Post
\`\`\`bash
PUT /api/scheduled-posts/{id}
DELETE /api/scheduled-posts/{id}
\`\`\`

### Manual Test
\`\`\`bash
GET /api/test-auto-posting
\`\`\`

## Usage

### 1. **Schedule Posts**
\`\`\`javascript
// Users can schedule posts through the UI
const schedulePost = async () => {
  const response = await fetch('/api/scheduled-posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: 'Hello LinkedIn!',
      scheduledAtIST: '2024-01-15T14:30'
    })
  })
}
\`\`\`

### 2. **Monitor Status**
\`\`\`javascript
// Check scheduled posts status
const checkPosts = async () => {
  const response = await fetch('/api/scheduled-posts')
  const data = await response.json()
  console.log(data.posts)
}
\`\`\`

## Monitoring

### Vercel Function Logs
- View cron job execution in Vercel dashboard
- Monitor success/failure rates
- Debug any issues

### Database Queries
\`\`\`javascript
// Check pending posts
db.scheduledposts.find({ status: "pending", scheduledAt: { $lte: new Date() } })

// Check recent activity
db.scheduledposts.find().sort({ updatedAt: -1 }).limit(10)
\`\`\`

## Advantages Over Node.js Cron

1. **No Server Management**: Vercel handles everything
2. **Automatic Scaling**: Scales with your application
3. **Built-in Monitoring**: Vercel dashboard shows execution logs
4. **Zero Configuration**: Just deploy and it works
5. **Cost Effective**: Only pay for execution time
6. **Reliable**: Vercel's infrastructure ensures high uptime

## Troubleshooting

### Cron Job Not Running
1. Check `vercel.json` is in project root
2. Verify deployment was successful
3. Check Vercel dashboard for cron job status

### Posts Not Being Posted
1. Check LinkedIn token validity
2. Verify CRON_SECRET is set correctly
3. Monitor function logs in Vercel dashboard

### Manual Testing
\`\`\`bash
# Test the auto-posting functionality manually
curl -X GET https://your-app.vercel.app/api/test-auto-posting
\`\`\`

This approach is much simpler and more reliable than managing separate Node.js processes!
