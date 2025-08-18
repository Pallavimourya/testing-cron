# External Cron Integration Setup Guide

This guide will help you set up external cron scheduling for LinkedIn posting using cron-job.org and Vercel deployment.

## 🎯 Overview

The system now supports both:
1. **Vercel Cron Jobs** (built-in, automatic)
2. **External Cron Services** (cron-job.org, manual setup)

## 📋 Prerequisites

- Vercel account with deployed application
- cron-job.org account (free tier available)
- MongoDB database
- LinkedIn Developer App credentials

## 🔧 Environment Variables Setup

### 1. Vercel Environment Variables

Add these environment variables in your Vercel dashboard:

```bash
# Database
MONGODB_URI=your-mongodb-connection-string

# Authentication
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://your-app.vercel.app

# LinkedIn API
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret

# Cron Security (Multiple options for flexibility)
CRON_SECRET=your-vercel-cron-secret-key
EXTERNAL_CRON_SECRET=your-external-cron-secret-key
CRON_JOB_TOKEN=your-cron-job-org-token

# Other Required Variables
NEXTAUTH_URL=https://your-app.vercel.app
```

### 2. Generate Secure Secrets

```bash
# Generate secure secrets (run these commands)
openssl rand -base64 32  # For CRON_SECRET
openssl rand -base64 32  # For EXTERNAL_CRON_SECRET
openssl rand -base64 32  # For CRON_JOB_TOKEN
```

## 🚀 Deployment Steps

### 1. Deploy to Vercel

```bash
# Install Vercel CLI if not installed
npm i -g vercel

# Deploy your application
vercel --prod
```

### 2. Verify Vercel Cron Jobs

The `vercel.json` file automatically configures cron jobs:

```json
{
  "crons": [
    {
      "path": "/api/cron/auto-post",
      "schedule": "* * * * *"
    }
  ]
}
```

This will run every minute automatically.

## 🔗 External Cron Setup (cron-job.org)

### 1. Create cron-job.org Account

1. Go to [cron-job.org](https://cron-job.org)
2. Sign up for a free account
3. Verify your email

### 2. Create New Cron Job

1. **Job Title**: `LinkedIn Auto Posting`
2. **URL**: `https://your-app.vercel.app/api/cron/external-auto-post`
3. **Schedule**: Every minute (`* * * * *`)
4. **HTTP Method**: GET

### 3. Configure Headers

Add these headers for security:

#### Option 1: Authorization Header
```
Header Name: Authorization
Header Value: Bearer YOUR_EXTERNAL_CRON_SECRET
```

#### Option 2: Custom Token Header
```
Header Name: X-Cron-Job-Token
Header Value: YOUR_CRON_JOB_TOKEN
```

### 4. Advanced Settings

- **Retry on Failure**: 3 attempts
- **Retry Delay**: 5 minutes
- **Timeout**: 30 seconds
- **Notifications**: Enable email notifications for failures

## 🧪 Testing the Setup

### 1. Test External Cron Endpoint

Visit: `https://your-app.vercel.app/api/test-external-cron`

Expected response:
```json
{
  "success": true,
  "message": "External cron test endpoint is working",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "istTime": "2024-01-15T16:00:00.000Z",
  "istTimeFormatted": "1/15/2024, 4:00:00 PM",
  "environment": {
    "hasExternalCronSecret": true,
    "hasCronJobToken": true,
    "hasCronSecret": true
  }
}
```

### 2. Test Manual Cron Execution

```bash
# Test with curl
curl -X GET "https://your-app.vercel.app/api/cron/external-auto-post" \
  -H "Authorization: Bearer YOUR_EXTERNAL_CRON_SECRET"

# Or test with custom token
curl -X GET "https://your-app.vercel.app/api/cron/external-auto-post" \
  -H "X-Cron-Job-Token: YOUR_CRON_JOB_TOKEN"
```

### 3. Test Scheduling

1. Go to your app's dashboard
2. Navigate to "Approved Content"
3. Click the clock icon on any approved content
4. Schedule a post for 2-3 minutes from now
5. Wait and check if it gets posted automatically

## 📊 Monitoring & Logs

### 1. Vercel Function Logs

- Go to Vercel Dashboard
- Select your project
- Go to "Functions" tab
- Check `/api/cron/auto-post` and `/api/cron/external-auto-post` logs

### 2. cron-job.org Monitoring

- Login to cron-job.org
- Check job execution history
- Monitor success/failure rates
- Set up email notifications

### 3. Database Monitoring

```javascript
// Check scheduled posts
db.approvedcontents.find({ status: "scheduled" })

// Check recently posted content
db.approvedcontents.find({ status: "posted" }).sort({ postedAt: -1 }).limit(10)

// Check for errors
db.approvedcontents.find({ error: { $exists: true } })
```

## 🔒 Security Features

### 1. Multiple Authentication Methods

The system accepts multiple authentication methods:

- **Vercel Cron**: Automatic (no additional auth needed)
- **External Cron**: 
  - `Authorization: Bearer TOKEN`
  - `X-Cron-Job-Token: TOKEN`
  - User-Agent detection for cron-job.org

### 2. Rate Limiting

- Prevents multiple simultaneous executions
- 1-minute minimum interval between runs
- Automatic retry logic for failed posts

### 3. Error Handling

- Comprehensive error logging
- Automatic status updates
- User-friendly error messages

## 🛠️ Troubleshooting

### Common Issues

#### 1. Cron Job Not Running
**Symptoms**: Posts not being published
**Solutions**:
- Check Vercel deployment status
- Verify environment variables are set
- Check Vercel function logs
- Test manual endpoint execution

#### 2. Authentication Errors
**Symptoms**: 401 Unauthorized responses
**Solutions**:
- Verify `EXTERNAL_CRON_SECRET` is set correctly
- Check header format in cron-job.org
- Ensure token matches environment variable

#### 3. LinkedIn Posting Failures
**Symptoms**: Posts scheduled but not published
**Solutions**:
- Check LinkedIn token validity
- Verify user has connected LinkedIn account
- Check LinkedIn API rate limits
- Review error logs for specific issues

#### 4. Timezone Issues
**Symptoms**: Posts published at wrong time
**Solutions**:
- System uses IST (Indian Standard Time)
- All scheduling is done in IST
- Automatic conversion to UTC for storage
- Verify timezone settings in cron-job.org

### Debug Commands

```bash
# Test endpoint directly
curl -X GET "https://your-app.vercel.app/api/test-external-cron"

# Test with authentication
curl -X GET "https://your-app.vercel.app/api/cron/external-auto-post" \
  -H "Authorization: Bearer YOUR_SECRET"

# Check Vercel logs
vercel logs your-app-name
```

## 📈 Performance Optimization

### 1. Database Indexes

Ensure these indexes exist for optimal performance:

```javascript
// Create indexes for faster queries
db.approvedcontents.createIndex({ status: 1, scheduledFor: 1 })
db.approvedcontents.createIndex({ userId: 1, status: 1 })
db.approvedcontents.createIndex({ postedAt: -1 })
```

### 2. Batch Processing

The system processes multiple posts in batches:
- Checks all collections simultaneously
- Processes up to 10 posts per run
- Automatic error recovery

### 3. Memory Management

- Automatic cleanup of completed posts
- Efficient database queries
- Minimal memory footprint

## 🔄 Backup & Recovery

### 1. Database Backup

```bash
# Backup MongoDB collections
mongodump --uri="your-mongodb-uri" --collection=approvedcontents
mongodump --uri="your-mongodb-uri" --collection=users
```

### 2. Environment Backup

Keep a secure copy of all environment variables:
- Store in password manager
- Document in secure location
- Regular rotation of secrets

### 3. Monitoring Alerts

Set up alerts for:
- Cron job failures
- Database connection issues
- LinkedIn API errors
- High error rates

## 📞 Support

If you encounter issues:

1. **Check Logs**: Review Vercel function logs first
2. **Test Endpoints**: Use the test endpoints to verify functionality
3. **Verify Setup**: Double-check environment variables and cron-job.org configuration
4. **Database Check**: Verify data integrity in MongoDB

## 🎉 Success Indicators

You'll know everything is working when:

✅ Posts are automatically published at scheduled times
✅ Vercel function logs show successful executions
✅ cron-job.org shows successful job runs
✅ No authentication errors in logs
✅ Users can schedule posts and see them published

---

**Note**: This system provides redundancy with both Vercel cron jobs and external cron services. If one fails, the other will continue to work, ensuring reliable LinkedIn posting.
