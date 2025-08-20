# Auto-Posting Setup Guide

This guide will help you set up the auto-posting functionality for your LinkedIn content scheduling system.

## 🚀 Quick Setup

### 1. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 2. Setup Configuration
\`\`\`bash
npm run setup-cron
\`\`\`

### 3. Start the Application
\`\`\`bash
# Terminal 1: Start Next.js app
npm run dev

# Terminal 2: Start cron job (for local development)
npm run cron
\`\`\`

## 📋 How It Works

### Auto-Posting Flow
1. **Content Creation**: Users create and approve content
2. **Scheduling**: Content is scheduled for specific times
3. **Auto-Posting**: Cron job runs every 5 minutes to check for due posts
4. **LinkedIn Posting**: Due posts are automatically posted to LinkedIn
5. **Status Update**: Posted content status is updated in the database

### Key Components
- **`/api/cron/auto-post`**: Main auto-posting endpoint
- **`/api/cron/status`**: Status monitoring endpoint
- **`scripts/cron-job.js`**: Standalone cron job script
- **`vercel.json`**: Vercel cron job configuration

## 🌐 Deployment Options

### Vercel (Recommended)
The `vercel.json` file automatically sets up cron jobs:
\`\`\`json
{
  "crons": [
    {
      "path": "/api/cron/auto-post",
      "schedule": "*/5 * * * *"
    }
  ]
}
\`\`\`

### Other Platforms
Use the standalone cron job script:
\`\`\`bash
# Set environment variables
export AUTO_POST_URL=https://your-domain.com/api/cron/auto-post
export CRON_SCHEDULE="*/5 * * * *"

# Run the cron job
node scripts/cron-job.js
\`\`\`

### System Cron (Linux/Mac)
Add to crontab:
\`\`\`bash
# Edit crontab
crontab -e

# Add this line (runs every 5 minutes)
*/5 * * * * curl -X GET https://your-domain.com/api/cron/auto-post
\`\`\`

## 🔧 Testing

### Manual Testing
\`\`\`bash
# Test auto-post endpoint
curl -X GET http://localhost:3000/api/cron/auto-post

# Check cron status
curl -X GET http://localhost:3000/api/cron/status

# Test individual posting
curl -X POST http://localhost:3000/api/linkedin/post \
  -H "Content-Type: application/json" \
  -d '{"content": "Test post", "contentId": "your-content-id"}'
\`\`\`

### Dashboard Testing
1. Go to the Calendar page in your dashboard
2. Click "Test Auto-Post" button
3. Check the results in the console

## 🐛 Troubleshooting

### Common Issues

#### 1. Posts Not Being Posted
**Symptoms**: Content is scheduled but not appearing on LinkedIn

**Solutions**:
- Check if LinkedIn is connected: Go to Profile settings
- Verify LinkedIn token is valid and not expired
- Check the auto-post logs in the console
- Ensure the cron job is running

#### 2. Cron Job Not Running
**Symptoms**: No auto-posting activity

**Solutions**:
- Verify the cron job is started: `npm run cron`
- Check environment variables are set correctly
- Test the endpoint manually
- Check server logs for errors

#### 3. LinkedIn API Errors
**Symptoms**: Posts fail with LinkedIn API errors

**Solutions**:
- Reconnect LinkedIn account
- Check LinkedIn app permissions
- Verify LinkedIn API credentials
- Check if LinkedIn API limits are reached

#### 4. Database Connection Issues
**Symptoms**: Auto-post fails with database errors

**Solutions**:
- Verify MongoDB connection string
- Check database permissions
- Ensure collections exist
- Check network connectivity

### Debug Commands

\`\`\`bash
# Check cron job status
npm run cron

# Test auto-post manually
curl -X GET http://localhost:3000/api/cron/auto-post

# Check scheduled posts
curl -X GET http://localhost:3000/api/cron/status

# View logs
tail -f logs/app.log
\`\`\`

## 📊 Monitoring

### Dashboard Monitoring
- **Calendar Page**: Shows scheduled and posted content
- **Cron Status**: Real-time auto-posting status
- **Activity Log**: Track posting history

### Log Monitoring
The auto-post system logs detailed information:
- ✅ Successful posts
- ❌ Failed posts with error details
- 🔍 User and content information
- ⏰ Timing information

### Key Metrics
- Total scheduled posts
- Posts due now
- Success/failure rates
- LinkedIn API response times

## 🔒 Security Considerations

### Environment Variables
Ensure these are properly configured:
- `LINKEDIN_CLIENT_ID`
- `LINKEDIN_CLIENT_SECRET`
- `MONGODB_URI`
- `NEXTAUTH_SECRET`

### Access Control
- Auto-post endpoint requires authentication
- User-specific content filtering
- LinkedIn token validation

## 📈 Performance Optimization

### Database Indexes
Ensure these indexes exist:
\`\`\`javascript
// approvedcontents collection
db.approvedcontents.createIndex({ "status": 1, "scheduledFor": 1 })
db.approvedcontents.createIndex({ "email": 1, "status": 1 })

// users collection
db.users.createIndex({ "email": 1 })
db.users.createIndex({ "linkedinAccessToken": 1 })
\`\`\`

### Rate Limiting
- LinkedIn API has rate limits
- Auto-post respects these limits
- Failed posts are retried with backoff

## 🆘 Support

### Getting Help
1. Check the troubleshooting section above
2. Review the console logs for error details
3. Test individual components manually
4. Verify all environment variables are set

### Common Error Messages
- **"LinkedIn not connected"**: Reconnect LinkedIn account
- **"User not found"**: Check user authentication
- **"Empty content"**: Verify content exists
- **"Token expired"**: Reconnect LinkedIn account

## 📝 Configuration Reference

### Environment Variables
\`\`\`bash
# Auto-post Configuration
AUTO_POST_URL=http://localhost:3000/api/cron/auto-post
CRON_SCHEDULE=*/5 * * * *

# Database
MONGODB_URI=mongodb://localhost:27017/your-database

# LinkedIn
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
\`\`\`

### Cron Schedule Formats
- `*/5 * * * *` - Every 5 minutes
- `*/15 * * * *` - Every 15 minutes
- `0 */1 * * *` - Every hour
- `0 9,18 * * *` - Twice daily (9 AM and 6 PM)

## ✅ Success Checklist

- [ ] Dependencies installed
- [ ] Environment variables configured
- [ ] LinkedIn account connected
- [ ] Cron job running
- [ ] Auto-post endpoint responding
- [ ] Content scheduling working
- [ ] Posts appearing on LinkedIn
- [ ] Status updates working
- [ ] Error handling working
- [ ] Monitoring set up

---

**Need help?** Check the troubleshooting section or contact support with specific error messages and logs.
