# Scheduled Posts & External Cron Implementation

## Overview
This document outlines the implementation of the scheduled posts functionality and external cron system from Linkzup into the testing-cron-main project.

## Features Implemented

### 1. Enhanced Scheduled Posts Page
- **Location**: `/dashboard/scheduled-posts`
- **Features**:
  - Beautiful UI with gradient background and modern design
  - Real-time stats cards showing total, pending, posted, and failed posts
  - Separate sections for pending and completed posts
  - Auto-refresh every 30 seconds
  - Manual refresh button
  - Test cron job button for manual triggering
  - View post content in modal dialogs
  - Cancel pending posts with confirmation
  - Overdue post detection and highlighting
  - LinkedIn post links for successful posts
  - Error display for failed posts

### 2. Updated ScheduledPost Model
- **Location**: `models/ScheduledPost.ts`
- **New Fields**:
  - `contentId`: Optional reference to content
  - `scheduledTime`: UTC timestamp for scheduling
  - `scheduledTimeIST`: Human-readable IST time
  - `platform`: Platform type (linkedin)
  - `linkedinPostId`: LinkedIn post ID after successful posting
  - `linkedinUrl`: Direct link to posted content
  - `error`: Error message for failed posts
  - `attempts`: Number of posting attempts
  - `maxAttempts`: Maximum retry attempts (default: 3)
  - `lastAttempt`: Timestamp of last attempt
  - `postedAt`: Timestamp when successfully posted

### 3. IST Time Utility
- **Location**: `lib/utils/ist-time.ts`
- **Features**:
  - Convert between UTC and IST timezones
  - Format dates for display
  - Validate scheduling times
  - Check if posts are overdue
  - Get current IST time

### 4. API Endpoints

#### GET `/api/scheduled-posts`
- Fetches all scheduled posts for the authenticated user
- Returns posts with IST display times and overdue status
- Sorted by scheduled time

#### POST `/api/scheduled-posts`
- Creates new scheduled posts
- Validates scheduling time (minimum 5 minutes from now)
- Stores content, image URL, and scheduling information

#### DELETE `/api/scheduled-posts/[id]`
- Cancels pending scheduled posts
- Updates status to "cancelled" instead of deletion
- Verifies user ownership

#### GET `/api/external-cron`
- **External cron endpoint for auto-posting**
- Requires authentication token: `?token=EXTERNAL_CRON_TOKEN`
- Processes all due scheduled posts
- Posts to LinkedIn using user's access token
- Updates post status and stores LinkedIn URLs
- Handles retry logic (max 3 attempts)

#### GET `/api/test-cron`
- **Manual testing endpoint**
- Same functionality as external cron but without token requirement
- Useful for testing and debugging

## Environment Variables Required

Add these to your `.env.local`:

```env
# External cron authentication
EXTERNAL_CRON_TOKEN=your-secure-token-here

# LinkedIn API credentials (already configured)
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
```

## External Cron Setup

### Option 1: cron-job.org
1. Go to [cron-job.org](https://cron-job.org)
2. Create a new cron job
3. Set URL: `https://your-domain.com/api/external-cron?token=YOUR_EXTERNAL_CRON_TOKEN`
4. Set schedule: Every minute (`* * * * *`)
5. Save and activate

### Option 2: Vercel Cron Jobs
Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/external-cron?token=YOUR_EXTERNAL_CRON_TOKEN",
      "schedule": "* * * * *"
    }
  ]
}
```

## Usage Instructions

### 1. Scheduling Posts
1. Navigate to `/dashboard/approved-content`
2. Create or select content to schedule
3. Set scheduling time (minimum 5 minutes from now)
4. Submit to schedule the post

### 2. Managing Scheduled Posts
1. Go to `/dashboard/scheduled-posts`
2. View all scheduled posts with real-time status
3. Use "Test Cron Job" button to manually trigger posting
4. Cancel pending posts if needed
5. View posted content on LinkedIn via provided links

### 3. Monitoring
- Posts automatically refresh every 30 seconds
- Check stats cards for overview
- View detailed error messages for failed posts
- Monitor overdue posts highlighted in orange

## Technical Details

### Database Indexes
- `userId + status`: Efficient user-specific queries
- `scheduledTime + status`: Fast cron job queries
- `userEmail + status`: Email-based lookups
- `createdAt`: Chronological ordering

### Error Handling
- LinkedIn token validation
- Network error retry logic
- User authentication checks
- Graceful failure with detailed error messages

### Security
- User ownership verification
- Token-based external cron authentication
- Session-based API access control

## Dependencies Added
- `date-fns-tz`: Timezone handling
- `sonner`: Toast notifications (already present)

## Files Modified/Created

### New Files:
- `lib/utils/ist-time.ts`
- `app/api/external-cron/route.ts`
- `app/api/test-cron/route.ts`

### Modified Files:
- `app/dashboard/scheduled-posts/page.tsx`
- `models/ScheduledPost.ts`
- `app/api/scheduled-posts/route.ts`
- `app/api/scheduled-posts/[id]/route.ts`
- `components/ClientLayout.tsx`

## Testing

1. **Manual Testing**:
   - Use the "Test Cron Job" button on the scheduled posts page
   - Check browser console for detailed logs
   - Verify LinkedIn posting functionality

2. **External Cron Testing**:
   - Set up cron-job.org with your endpoint
   - Monitor logs for successful execution
   - Verify posts appear on LinkedIn

3. **Error Scenarios**:
   - Test with expired LinkedIn tokens
   - Test with invalid scheduling times
   - Test with network failures

## Troubleshooting

### Common Issues:
1. **Posts not posting**: Check LinkedIn token validity
2. **Cron not running**: Verify EXTERNAL_CRON_TOKEN environment variable
3. **Timezone issues**: Ensure IST time utility is working correctly
4. **Permission errors**: Verify user authentication and ownership

### Debug Steps:
1. Check browser console for errors
2. Monitor server logs for API calls
3. Verify environment variables are set
4. Test external cron endpoint manually
5. Check LinkedIn API credentials

## Next Steps

1. Set up external cron service (cron-job.org or Vercel)
2. Configure environment variables
3. Test with real LinkedIn credentials
4. Monitor initial posts for any issues
5. Adjust scheduling times and retry logic as needed
