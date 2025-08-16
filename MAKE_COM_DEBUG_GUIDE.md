# 🔧 Make.com Webhook Debugging Guide

## 🚨 Current Issue
Make.com webhook is returning 400 error when trying to send data.

## 🔍 Debugging Steps

### **Step 1: Test Basic Connection**
Visit: `http://localhost:3000/api/test-make-connection`

This will test the basic webhook connection with sample data.

### **Step 2: Check Data Format**
The webhook expects these exact parameter names:
\`\`\`json
{
  "topic": "string",
  "base story": "string", 
  "customization": "string (JSON)",
  "user id": "string",
  "email": "string"
}
\`\`\`

### **Step 3: Verify Required Fields**
Make.com validation error suggests missing required fields:
- ✅ `topic`
- ✅ `base story`
- ✅ `customization`
- ✅ `user id`
- ✅ `email`

## 🛠️ **Potential Issues & Fixes**

### **Issue 1: Missing Required Fields**
**Problem**: Some fields might be undefined or null
**Fix**: Added fallback values in the code

### **Issue 2: Data Type Mismatch**
**Problem**: Make.com expects specific data types
**Fix**: Ensure all values are strings

### **Issue 3: Webhook URL Issues**
**Problem**: URL might be incorrect or webhook not configured
**Fix**: Verify webhook URL in Make.com

### **Issue 4: Authentication Issues**
**Problem**: Webhook might require authentication
**Fix**: Check if API key is needed

## 🔧 **Testing Commands**

### **Test 1: Basic Connection**
\`\`\`bash
curl -X GET http://localhost:3000/api/test-make-connection
\`\`\`

### **Test 2: Data Format**
\`\`\`bash
curl -X POST http://localhost:3000/api/test-make-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Test Topic",
    "base story": "Test story",
    "customization": "{\"test\":\"value\"}",
    "user id": "test123",
    "email": "test@example.com"
  }'
\`\`\`

## 📊 **Expected Debug Output**

### **Successful Connection:**
\`\`\`
🧪 Testing Make.com webhook connection...
📤 Make.com response status: 200
📤 Make.com response body: [response from Make.com]
\`\`\`

### **Failed Connection:**
\`\`\`
❌ Make.com webhook failed: 400
❌ Make.com error details: [error message from Make.com]
\`\`\`

## 🎯 **Next Steps**

1. **Run the test connection** to verify webhook URL
2. **Check Make.com scenario** configuration
3. **Verify parameter names** match exactly
4. **Test with minimal data** first
5. **Check Make.com logs** for detailed error messages

## 📝 **Common Solutions**

### **Solution 1: Fix Parameter Names**
Ensure exact parameter names match Make.com expectations.

### **Solution 2: Add Missing Fields**
Provide fallback values for all required fields.

### **Solution 3: Check Webhook Configuration**
Verify webhook is properly configured in Make.com.

### **Solution 4: Test with Minimal Data**
Start with basic data and add complexity gradually.

---

**🔍 Run the test endpoints to identify the exact issue!**
