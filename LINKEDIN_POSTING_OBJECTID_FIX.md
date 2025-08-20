# LinkedIn Posting ObjectId Casting Fix

## Issue
The LinkedIn posting API was failing with the following error:
\`\`\`
CastError: Cast to ObjectId failed for value "21" (type string) at path "_id" for model "ApprovedContent"
\`\`\`

## Root Cause
The issue occurred because the code was trying to cast string IDs (like "21") to MongoDB ObjectIds, which require 24-character hex strings. When a string like "21" was passed as `contentId`, the query was attempting to use it as an ObjectId in the `_id` field, causing a casting error.

## Fix Applied

### 1. Fixed ApprovedContent Model Query
**File**: `app/api/linkedin/post/route.ts` (lines 128-133)

**Before**:
\`\`\`javascript
let content = await ApprovedContent.findOne({
  $or: [{ _id: contentId }, { id: contentId }],
  userId: session.user.id,
})
\`\`\`

**After**:
\`\`\`javascript
let content = await ApprovedContent.findOne({
  $or: [
    { id: contentId },
    // Only try _id if contentId is a valid ObjectId
    ...(mongoose.Types.ObjectId.isValid(contentId) ? [{ _id: new mongoose.Types.ObjectId(contentId) }] : [])
  ],
  userId: session.user.id,
})
\`\`\`

### 2. Fixed Raw Collection Queries
**File**: `app/api/linkedin/post/route.ts` (lines 147-165 and 175-193)

**Before**:
\`\`\`javascript
$or: [
  { _id: new mongoose.Types.ObjectId(contentId) },
  { id: contentId },
  { ID: contentId },
  { contentId: contentId },
],
\`\`\`

**After**:
\`\`\`javascript
$or: [
  { id: contentId },
  { ID: contentId },
  { contentId: contentId },
  // Only try _id if contentId is a valid ObjectId
  ...(mongoose.Types.ObjectId.isValid(contentId) ? [{ _id: new mongoose.Types.ObjectId(contentId) }] : [])
],
\`\`\`

### 3. Fixed User ID ObjectId Casting
Also applied the same logic to prevent casting errors when `session.user.id` is not a valid ObjectId.

## How the Fix Works

1. **ObjectId Validation**: Uses `mongoose.Types.ObjectId.isValid()` to check if a string can be converted to a valid ObjectId
2. **Conditional Query Construction**: Only includes `_id` field in the query if the `contentId` is a valid ObjectId
3. **Fallback to String Search**: For invalid ObjectIds, the query only searches by string fields (`id`, `ID`, `contentId`)

## Test Results
Created test script `scripts/test-linkedin-post-fix.js` that confirms:
- String "21" is correctly identified as invalid ObjectId
- Valid ObjectIds are correctly identified and converted
- Query construction works correctly for both cases

## Impact
- ✅ Fixes the ObjectId casting error for string IDs
- ✅ Maintains backward compatibility with valid ObjectIds
- ✅ Prevents similar errors in raw collection queries
- ✅ No breaking changes to existing functionality

## Files Modified
- `app/api/linkedin/post/route.ts` - Fixed ObjectId casting logic in multiple queries
