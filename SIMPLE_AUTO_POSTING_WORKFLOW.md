# Simple Auto-Posting Workflow

## Overview
This is a clean, simple auto-posting system that works as follows:

1. **User schedules a post** → Date/time saved in database
2. **Cron job checks database** → Finds posts due for posting (comparing IST times)
3. **Posts get published** → When date/time matches current IST time
4. **Date/time can be edited** → From any tab (approved content or calendar)

## How It Works

### 1. Scheduling Posts
- User goes to **Approved Content** or **Calendar** page
- Clicks "Schedule" on any approved post
- Selects custom date and time (in IST)
- System saves the scheduled time to database with status = "scheduled"

### 2. Auto-Posting Process
- **Cron job runs every minute** (`scripts/simple-auto-poster.js`)
- Checks database for posts where:
  - `status = "scheduled"`
  - `scheduledFor <= current IST time` (within 1-minute buffer)
- For each due post:
  - Posts to LinkedIn using existing API
  - Updates status to "posted"
  - Saves LinkedIn URL and posted timestamp

### 3. Editing Scheduled Posts
- User can edit date/time from **Calendar** page
- Changes are saved to database
- Cron job will pick up the new schedule automatically

## Database Schema

\`\`\`javascript
// ApprovedContent Model
{
  _id: ObjectId,
  id: String,
  userId: ObjectId,
  topicTitle: String,
  content: String,
  hashtags: [String],
  status: "generated" | "approved" | "rejected" | "scheduled" | "posted",
  scheduledFor: Date,  // When to post (stored in UTC)
  postedAt: Date,      // When actually posted
  linkedinUrl: String, // URL of posted content
  // ... other fields
}
\`\`\`

## Files Structure

\`\`\`
scripts/
├── simple-auto-poster.js          # Main cron job
├── setup-simple-auto-poster.sh    # Setup script
└── test-simple-auto-poster.js     # Test script

ecosystem.config.js                 # PM2 configuration
start-auto-poster.sh               # Start script
stop-auto-poster.sh                # Stop script
status-auto-poster.sh              # Status script
\`\`\`

## Setup Instructions

### 1. Install Dependencies
\`\`\`bash
npm install node-cron node-fetch
\`\`\`

### 2. Run Setup Script
\`\`\`bash
chmod +x scripts/setup-simple-auto-poster.sh
./scripts/setup-simple-auto-poster.sh
\`\`\`

### 3. Update Environment Variables
Edit `.env` file with your actual values:
\`\`\`env
MONGODB_URI=mongodb://your-mongodb-uri
NEXTAUTH_URL=https://your-domain.com
CRON_SECRET=your-secure-secret
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
\`\`\`

### 4. Start Auto-Poster
\`\`\`bash
./start-auto-poster.sh
\`\`\`

### 5. Check Status
\`\`\`bash
./status-auto-poster.sh
\`\`\`

## API Endpoints

### Schedule a Post
\`\`\`http
POST /api/approved-content/[id]/schedule
Content-Type: application/json

{
  "scheduledFor": "2024-01-16T14:30:00.000Z"  // UTC time
}
\`\`\`

### Edit Scheduled Post
\`\`\`http
PUT /api/content/[id]/schedule
Content-Type: application/json

{
  "scheduledFor": "2024-01-16T15:00:00.000Z"  // UTC time
}
\`\`\`

## Timezone Handling

- **Frontend**: All times displayed in IST (Indian Standard Time)
- **Database**: All times stored in UTC
- **Cron Job**: Compares current IST time with scheduled times
- **Conversion**: Frontend converts IST → UTC before saving to database

## Cron Job Logic

\`\`\`javascript
// Every minute, the cron job:
1. Gets current IST time
2. Finds posts where:
   - status = "scheduled"
   - scheduledFor <= current IST time (within 1-minute buffer)
3. For each due post:
   - Posts to LinkedIn
   - Updates status to "posted"
   - Saves LinkedIn URL
\`\`\`

## Monitoring

### Check Status
\`\`\`bash
pm2 status auto-poster
\`\`\`

### View Logs
\`\`\`bash
pm2 logs auto-poster
\`\`\`

### Test Setup
\`\`\`bash
node scripts/test-simple-auto-poster.js
\`\`\`

## Troubleshooting

### Common Issues

1. **Posts not posting**: Check if cron job is running
2. **Wrong times**: Verify timezone settings
3. **API errors**: Check LinkedIn credentials
4. **Database issues**: Verify MongoDB connection

### Debug Commands

\`\`\`bash
# Check if cron job is running
pm2 status

# View recent logs
pm2 logs auto-poster --lines 50

# Test database connection
node scripts/test-simple-auto-poster.js

# Restart auto-poster
pm2 restart auto-poster
\`\`\`

## Security

- Cron job uses secure authentication
- Environment variables for sensitive data
- PM2 process management for reliability
- Logging for monitoring and debugging

## Performance

- Runs every minute (configurable)
- 1-minute buffer for processing time
- Efficient database queries with indexes
- Graceful error handling and retries
