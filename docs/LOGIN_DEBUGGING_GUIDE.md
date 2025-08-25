# Login Issue Debugging Guide

## Problem Description
New users can sign up successfully but are unable to log in after registration.

## Root Cause Analysis

### Potential Issues:

1. **Password Hashing Mismatch**: Different hashing methods between signup and login
2. **User Model Schema Issues**: Missing or incorrect field definitions
3. **NextAuth Configuration**: Authentication provider setup problems
4. **Database Connection Issues**: Connection problems during authentication
5. **User Blocking**: Users might be getting blocked during registration
6. **Session Management**: NextAuth session configuration issues

## Debugging Steps

### Step 1: Check User Registration
Run the test script to verify user creation:
```bash
node scripts/test-user-login.js
```

This will:
- List all users in the database
- Check if users have passwords
- Verify password hashing
- Test authentication flow

### Step 2: Check Console Logs
Look for these log messages during login attempts:

**Registration Logs:**
- `📝 Starting user registration...`
- `📋 Registration data: {...}`
- `🔐 Password hashed successfully`
- `✅ User saved successfully: [user_id]`

**Login Logs:**
- `🔐 Auth attempt for email: [email]`
- `✅ Database connected`
- `👤 User check: Found/Not found`
- `🔑 User password valid: true/false`
- `✅ User login successful`

### Step 3: Database Verification
Check if the user exists in the database with proper fields:

```javascript
// Check user in MongoDB
db.users.findOne({email: "user@example.com"})

// Verify password field exists
db.users.findOne({email: "user@example.com"}, {password: 1})

// Check if user is blocked
db.users.findOne({email: "user@example.com"}, {blocked: 1, role: 1})
```

### Step 4: Test Authentication Flow
Use the test script to verify the complete flow:

```bash
# Test with a specific user
node scripts/test-user-login.js
```

## Common Issues and Solutions

### Issue 1: Password Field Missing
**Symptoms:** User exists but login fails with "Invalid credentials"
**Solution:** Check if password field is properly saved during registration

### Issue 2: Password Hashing Mismatch
**Symptoms:** Password verification fails even with correct password
**Solution:** Ensure consistent bcrypt salt rounds (12) in both signup and login

### Issue 3: User Blocked
**Symptoms:** User exists but login returns null
**Solution:** Check `blocked` field in user document

### Issue 4: Database Connection Issues
**Symptoms:** Authentication times out or fails
**Solution:** Verify MongoDB connection string and network connectivity

### Issue 5: NextAuth Configuration
**Symptoms:** Login appears successful but session not established
**Solution:** Check NextAuth secret and session configuration

## Testing Commands

### Create Test User
```bash
node scripts/test-user-login.js
```

### Test Specific User Login
```bash
# Modify the script to test with specific email/password
node scripts/test-user-login.js
```

### Check Database Collections
```bash
# Connect to MongoDB and check collections
mongo
use your_database_name
show collections
db.users.find().pretty()
```

## Environment Variables Check

Ensure these environment variables are set correctly:

```env
MONGODB_URI=mongodb://localhost:27017/your_database
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=http://localhost:3000
```

## Debugging Checklist

- [ ] User exists in database
- [ ] User has password field
- [ ] Password is properly hashed
- [ ] User is not blocked
- [ ] Database connection works
- [ ] NextAuth configuration is correct
- [ ] Environment variables are set
- [ ] Console logs show authentication flow
- [ ] Session is established after login

## Quick Fixes

### 1. Reset User Password
```javascript
// In MongoDB shell
const bcrypt = require('bcryptjs');
const hashedPassword = await bcrypt.hash('newpassword123', 12);
db.users.updateOne(
  {email: "user@example.com"},
  {$set: {password: hashedPassword}}
)
```

### 2. Unblock User
```javascript
// In MongoDB shell
db.users.updateOne(
  {email: "user@example.com"},
  {$set: {blocked: false}}
)
```

### 3. Verify User Role
```javascript
// In MongoDB shell
db.users.updateOne(
  {email: "user@example.com"},
  {$set: {role: "user"}}
)
```

## Monitoring and Logging

The enhanced logging will help identify exactly where the login process fails:

1. **Registration Phase**: Check if user is created properly
2. **Authentication Phase**: Check if user is found and password is valid
3. **Session Phase**: Check if session is established

## Next Steps

1. Run the test script to identify the specific issue
2. Check console logs during login attempts
3. Verify database state
4. Apply appropriate fix based on the issue identified
5. Test the complete flow again

## Support

If the issue persists after following this guide:
1. Check the console logs for specific error messages
2. Verify the database state using the test script
3. Review the NextAuth configuration
4. Check for any middleware that might be blocking authentication
