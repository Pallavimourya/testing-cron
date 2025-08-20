# LinkedIn Auto-Posting Setup Guide

This guide will help you set up the LinkedIn auto-posting functionality in your LinkZup application.

## Overview

The auto-posting system allows users to schedule LinkedIn posts that will be automatically posted at the specified time using a cron job running every minute.

## Features

- ✅ Schedule posts in Indian Standard Time (IST)
- ✅ Automatic timezone conversion (IST → UTC)
- ✅ Support for text and image posts
- ✅ Retry logic (up to 3 attempts)
- ✅ Token expiry handling
- ✅ Comprehensive error handling
- ✅ Real-time status tracking
- ✅ User-friendly scheduling interface

## Architecture

### Components

1. **ScheduledPost Model** - MongoDB schema for scheduled posts
2. **LinkedIn Poster Library** - Reusable posting functions
3. **Timezone Utils** - IST/UTC conversion utilities
4. **Cron Job Script** - Background processor
5. **API Routes** - CRUD operations for scheduled posts
6. **UI Components** - Scheduling interface

### Data Flow

\`\`\`
User schedules post (IST) → Convert to UTC → Store in MongoDB → Cron job processes → Post to LinkedIn → Update status
\`\`\`

## Setup Instructions

### 1. Install Dependencies

\`\`\`bash
npm install node-cron @types/node-cron
\`\`\`

### 2. Environment Variables

Add these to your `.env` file:

\`\`\`env
# Existing variables...
MONGODB_URI=your_mongodb_connection_string
NEXTAUTH_SECRET=your_nextauth_secret

# Optional: For production cron security
CRON_SECRET=your_secure_cron_secret
\`\`\`

### 3. Database Setup

The `ScheduledPost` model will be automatically created when you first use it. No manual database setup required.

### 4. Start the Auto-Poster

#### Development
\`\`\`bash
npm run auto-poster
\`\`\`

#### Production (with scripts)
\`\`\`bash
# Start the auto-poster
npm run start-auto-poster

# Stop the auto-poster
npm run stop-auto-poster
\`\`\`

#### Manual start
\`\`\`bash
node scripts/linkedin-auto-poster.js
\`\`\`

## Usage

### Scheduling a Post

1. Users can schedule posts through the UI
2. Select date/time in IST
3. Add content and optional image
4. System converts to UTC and stores in database

### API Endpoints

- `POST /api/scheduled-posts` - Create scheduled post
- `GET /api/scheduled-posts` - List user's scheduled posts
- `GET /api/scheduled-posts/stats` - Get scheduling statistics
- `PUT /api/scheduled-posts/[id]` - Update scheduled post
- `DELETE /api/scheduled-posts/[id]` - Cancel scheduled post

### Cron Job Process

1. Runs every minute
2. Finds posts where `scheduledAt <= current time` and `status = 'pending'`
3. Validates user's LinkedIn token
4. Posts to LinkedIn API
5. Updates post status and metadata
6. Handles errors and retries

## Status Types

- **pending** - Waiting to be posted
- **posted** - Successfully posted to LinkedIn
- **failed** - Failed after 3 retry attempts
- **cancelled** - Cancelled by user

## Error Handling

### Token Expiry
- Checks token validity before posting
- Marks posts as failed if token expired
- User needs to reconnect LinkedIn

### API Failures
- Retries up to 3 times
- Exponential backoff between retries
- Detailed error logging

### Network Issues
- Graceful handling of network failures
- Automatic retry on next cron run

## Deployment Options

### Option 1: Persistent Server (Recommended)
Deploy on platforms that support persistent processes:
- AWS EC2
- DigitalOcean Droplets
- Render
- Railway
- Heroku (with worker dyno)

### Option 2: Serverless with External Cron
Use external services to trigger cron:
- Vercel Cron Functions
- GitHub Actions
- External cron services

### Option 3: Process Manager (PM2)
For production servers:

\`\`\`bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start scripts/linkedin-auto-poster.js --name "linkedin-auto-poster"

# Save PM2 configuration
pm2 save
pm2 startup
\`\`\`

## Monitoring

### Logs
- Console logs for all operations
- Error tracking with details
- Performance metrics

### Health Checks
- Monitor cron job status
- Track posting success rates
- Alert on failures

### Database Queries
Useful queries for monitoring:

\`\`\`javascript
// Check pending posts
db.scheduledposts.find({ status: "pending", scheduledAt: { $lte: new Date() } })

// Check failed posts
db.scheduledposts.find({ status: "failed" })

// Get posting statistics
db.scheduledposts.aggregate([
  { $group: { _id: "$status", count: { $sum: 1 } } }
])
\`\`\`

## Troubleshooting

### Common Issues

1. **Cron job not running**
   - Check if Node.js process is active
   - Verify environment variables
   - Check MongoDB connection

2. **Posts not being posted**
   - Verify LinkedIn tokens are valid
   - Check scheduled times (must be in future)
   - Review error logs

3. **Token expiry issues**
   - Users need to reconnect LinkedIn
   - Implement token refresh logic
   - Monitor token expiry dates

4. **Timezone confusion**
   - All times stored in UTC
   - UI shows IST for user convenience
   - Verify timezone conversion logic

### Debug Commands

\`\`\`bash
# Check running processes
ps aux | grep linkedin-auto-poster

# View logs
tail -f logs/auto-poster.log

# Test database connection
node -e "require('./lib/mongodb').default.then(() => console.log('Connected'))"
\`\`\`

## Security Considerations

1. **API Security**
   - Validate user authentication
   - Rate limiting on scheduling
   - Input sanitization

2. **Cron Security**
   - Use CRON_SECRET for production
   - Restrict cron endpoint access
   - Monitor for abuse

3. **Data Protection**
   - Encrypt sensitive tokens
   - Regular token rotation
   - Audit logging

## Performance Optimization

1. **Database Indexing**
   - Index on `scheduledAt` and `status`
   - Compound indexes for queries
   - TTL index for cleanup

2. **Batch Processing**
   - Process multiple posts efficiently
   - Limit concurrent API calls
   - Queue management

3. **Memory Management**
   - Clean up old posts
   - Monitor memory usage
   - Optimize queries

## Future Enhancements

- [ ] Bulk scheduling
- [ ] Recurring posts
- [ ] Advanced scheduling rules
- [ ] Analytics and reporting
- [ ] Multi-platform support
- [ ] Content templates
- [ ] Team collaboration features

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review logs for error details
3. Test individual components
4. Contact development team

---

**Note**: This system requires a persistent Node.js environment to run the cron job. Serverless platforms may require additional configuration or external cron services.
