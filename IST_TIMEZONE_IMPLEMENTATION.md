# Indian Standard Time (IST) Implementation

## 🎯 Objective
Modified the auto-posting system to work with Indian Standard Time (IST) so that when users schedule content, it gets posted at the exact IST time they specify.

## ✅ Changes Implemented

### 1. Auto-Post Endpoint (`app/api/cron/auto-post/route.ts`)
- **Time Calculation**: Updated to use IST timezone for determining when posts are due
- **Buffer Logic**: 5-minute buffer now calculated in IST
- **Logging**: Added IST time logging for debugging
- **Query Logic**: Database queries now use IST-adjusted times

### 2. Cron Status Endpoint (`app/api/cron/status/route.ts`)
- **Time Display**: Shows current time in IST
- **Due Posts**: Calculates due posts based on IST
- **Next Posts**: Time until posting calculated in IST

### 3. Calendar Page (`app/dashboard/calendar/page.tsx`)
- **Time Display**: All scheduled and posted times shown in IST
- **Scheduling**: User input converted to IST before sending to server
- **Time Until**: Calculations done in IST
- **Helper Functions**: Added `formatTimeIST()` function

### 4. Bulk Scheduling (`app/api/content/schedule-bulk/route.ts`)
- **Base Date**: Start date/time converted to IST
- **Intervals**: All scheduling intervals calculated in IST
- **Logging**: Added IST time logging

### 5. Individual Scheduling (`app/api/approved-content/[id]/schedule/route.ts`)
- **Validation**: Future date validation done in IST
- **Logging**: Shows scheduled time in IST format

### 6. Cron Job Script (`scripts/cron-job.js`)
- **Timezone**: Set to "Asia/Kolkata" for IST
- **Scheduling**: Cron job runs in IST timezone

## 🕐 Timezone Handling

### IST Offset
\`\`\`javascript
const istOffset = 5.5 * 60 * 60 * 1000 // IST is UTC+5:30
\`\`\`

### Time Conversion Examples
\`\`\`javascript
// Convert UTC to IST
const utcTime = new Date()
const istTime = new Date(utcTime.getTime() + istOffset)

// Convert IST to UTC (for database storage)
const istInput = new Date('2024-01-15T10:30:00')
const utcForStorage = new Date(istInput.getTime() - istOffset)
\`\`\`

## 📅 User Experience

### Scheduling Interface
- Users see times in IST format
- Input times are interpreted as IST
- Display shows IST times throughout

### Examples
\`\`\`
User schedules for: 10:30 AM IST
Database stores: 05:00 AM UTC
Auto-post triggers: When IST time reaches 10:30 AM
\`\`\`

## 🔧 Technical Implementation

### 1. Database Storage
- All times stored in UTC format
- Conversion happens at application level
- Ensures consistency across different timezones

### 2. Auto-Post Logic
\`\`\`javascript
// Check if post is due (IST-based)
function isPostDue(scheduledFor) {
  const now = new Date()
  const scheduled = new Date(scheduledFor)
  
  // Convert to IST
  const istOffset = 5.5 * 60 * 60 * 1000
  const nowIST = new Date(now.getTime() + istOffset)
  const scheduledIST = new Date(scheduled.getTime() + istOffset)
  
  return scheduledIST <= nowIST
}
\`\`\`

### 3. Display Formatting
\`\`\`javascript
// Format time in IST
const formatTimeIST = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString('en-IN', { 
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
\`\`\`

## 🧪 Testing

### Manual Testing
\`\`\`bash
# Test auto-post with IST timing
curl -X GET http://localhost:3000/api/cron/auto-post

# Check current IST time
node -e "console.log(new Date().toLocaleString('en-IN', {timeZone: 'Asia/Kolkata'}))"
\`\`\`

### Expected Behavior
1. **User schedules post for 2:00 PM IST**
2. **System stores 8:30 AM UTC in database**
3. **Auto-post triggers when IST time reaches 2:00 PM**
4. **Post appears on LinkedIn at exactly 2:00 PM IST**

## 📊 Monitoring

### Logs
- All time-related logs show IST times
- Easy to debug timing issues
- Clear indication of when posts are due

### Dashboard
- Calendar shows IST times
- Status updates in IST
- Time until posting calculated in IST

## 🎉 Benefits

### 1. User-Friendly
- Users see times in their local timezone (IST)
- No confusion about UTC vs local time
- Intuitive scheduling experience

### 2. Accurate Posting
- Posts appear exactly when scheduled
- No timezone conversion errors
- Reliable auto-posting

### 3. Debugging
- Clear IST time logging
- Easy to track timing issues
- Consistent time display

## 🚀 Deployment

### Vercel
- Cron jobs run in UTC but logic handles IST
- No additional configuration needed
- Automatic timezone handling

### Other Platforms
- Cron job script uses IST timezone
- Environment variables can override if needed
- Flexible timezone configuration

## 📝 Configuration

### Environment Variables
\`\`\`bash
# Optional: Override timezone
TZ=Asia/Kolkata
\`\`\`

### Cron Schedule (IST-based)
\`\`\`bash
# Every minute in IST
* * * * *

# Every 5 minutes in IST
*/5 * * * *

# Twice daily in IST (9 AM and 6 PM)
0 9,18 * * *
\`\`\`

## ✅ Verification

### Checklist
- [x] Auto-post triggers at correct IST time
- [x] User interface shows IST times
- [x] Database stores UTC times correctly
- [x] Time calculations accurate
- [x] Logging shows IST times
- [x] Dashboard displays IST times
- [x] Scheduling works with IST input
- [x] Posted times shown in IST

---

**Status**: ✅ **IMPLEMENTED** - Auto-posting now works with Indian Standard Time (IST) and posts content at the exact IST time specified by users.
