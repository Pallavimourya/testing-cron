# LinkZup Setup Instructions & Fixes

## 🚀 **Quick Setup**

### 1. **Environment Variables**
Create a `.env.local` file in your project root:

\`\`\`env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-here

# LinkedIn OAuth Configuration
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
LINKEDIN_REDIRECT_URI=http://localhost:3000/api/auth/linkedin/callback

# Razorpay Configuration
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret

# MongoDB Configuration
MONGODB_URI=your-mongodb-connection-string

# OpenAI Configuration (for content generation)
OPENAI_API_KEY=your-openai-api-key

# Cloudinary Configuration (for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Make.com Configuration (for automation)
MAKE_WEBHOOK_URL=your-make-webhook-url
MAKE_API_TOKEN=your-make-api-token
\`\`\`

### 2. **Install Dependencies**
\`\`\`bash
npm install
# or
pnpm install
\`\`\`

### 3. **Run the Application**
\`\`\`bash
npm run dev
# or
pnpm dev
\`\`\`

## 🔧 **Fixes Implemented**

### ✅ **1. Toast Popup Positioning**
- **Issue**: Popups appearing in left corner instead of center
- **Fix**: Updated Sonner Toaster to use `top-center` positioning with custom styling
- **Location**: `components/dashboard-sidebar.tsx`

### ✅ **2. Dashboard Pricing Modal**
- **Issue**: Pricing modal showing every login even after payment
- **Root Cause**: Mismatch between payment verification and subscription check APIs
- **Fix**: 
  - Updated `app/api/payments/verify/route.ts` to use correct User model fields
  - Updated `app/api/subscription/check/route.ts` to match field names
  - Now uses `subscriptionStatus` and `subscriptionExpiry` consistently

### ✅ **3. Razorpay Payment Issues**
- **Issue**: "Payment failed" message after successful payment
- **Issue**: Subscription not active after payment
- **Fix**: Fixed payment verification API to update correct database fields

### ✅ **4. Subscription Protection**
- **Issue**: Users could generate content without active subscription
- **Fix**: Added subscription checks to content generation APIs
- **Location**: `app/api/send-to-make/route.ts`

## 🆕 **New Features Implemented**

### 📊 **1. Performance Overview Dashboard**
- **Content Performance**: Views, likes, comments, shares tracking
- **Engagement Rate**: Average engagement per post calculation
- **Growth Metrics**: Content growth trends over time
- **LinkedIn Health**: Connection status, sync frequency monitoring
- **Automation Efficiency**: Scheduled vs published content tracking
- **Location**: `app/api/dashboard-stats/route.ts`

### 🎯 **2. Base Story Feature**
- **Character Profile**: Professional background and expertise
- **Goals & Challenges**: User's objectives and obstacles
- **Success Metrics**: Measurable outcomes
- **Location**: `app/api/generate-content/route.ts`

### 📈 **3. Trending Topics**
- **Industry-Specific**: Topics relevant to user's industry
- **Engagement Scoring**: Topics ranked by potential engagement
- **Content Suggestions**: Pre-generated content ideas
- **Location**: `app/api/generate-content/route.ts`

### 💡 **4. User-Generated Topics**
- **Profile-Based**: Topics suggested based on user profile
- **Reasoning**: Explanation for topic suggestions
- **Content Ideas**: Multiple content variations per topic
- **Engagement Estimation**: Predicted performance metrics
- **Location**: `app/api/generate-content/route.ts`

### 🎨 **5. Enhanced Content Model**
- **Template Support**: Multiple content templates
- **Photo Styles**: Customizable visual styles
- **Content Variations**: Platform-specific content versions
- **Performance Tracking**: Engagement and performance metrics
- **Location**: `models/Content.ts`

## 🔄 **Content Generation Process**

### **30 Pieces of Content Workflow:**
1. **Batch Generation**: Generate 30 pieces at once via API
2. **Approval Workflow**: Bulk approve/reject options
3. **Scheduling Queue**: Auto-schedule approved content
4. **Content Calendar**: Visual calendar view

### **Content Approval Process:**
1. **Generate Content**: Use `/api/generate-content` endpoint
2. **Review & Edit**: Modify content as needed
3. **Approve/Reject**: Use approval workflow
4. **Schedule**: Set posting schedule
5. **Monitor**: Track performance and engagement

## 🎨 **Photo Style Options**

### **Available Templates:**
- **Professional**: Clean, business-focused design
- **Creative**: Artistic, eye-catching layouts
- **Minimalist**: Simple, elegant designs
- **Bold**: High-contrast, attention-grabbing styles

### **Customization Options:**
- **Colors**: Brand color schemes
- **Fonts**: Typography selection
- **Layouts**: Content arrangement options
- **Branding**: Logo and brand integration

## 🔒 **Subscription Protection**

### **Protected Features:**
- Content generation
- Advanced analytics
- Bulk operations
- Premium templates
- Priority support

### **Free Tier Limitations:**
- Limited content generation (5 pieces/month)
- Basic analytics
- Standard templates
- Community support

## 📱 **LinkedIn Integration**

### **Connection Process:**
1. Click "Connect LinkedIn" in dashboard
2. Authorize LinkZup application
3. Grant necessary permissions
4. Automatic profile sync
5. Ready for content posting

### **Required Permissions:**
- Profile information
- Post creation
- Network access
- Analytics data

## 🚨 **Troubleshooting**

### **Common Issues:**

#### **1. LinkedIn Connection Issues**
- **Problem**: Wrong redirection to localhost
- **Solution**: Update `NEXTAUTH_URL` and `LINKEDIN_REDIRECT_URI` in `.env.local`

#### **2. Payment Issues**
- **Problem**: Payment shows as failed after success
- **Solution**: Check Razorpay webhook configuration and database connection

#### **3. Content Generation Issues**
- **Problem**: Cannot generate content
- **Solution**: Verify subscription status and API keys

#### **4. Toast Positioning Issues**
- **Problem**: Popups not centered
- **Solution**: Ensure Sonner Toaster is configured correctly in dashboard sidebar

### **Debug Steps:**
1. Check browser console for errors
2. Verify environment variables
3. Test API endpoints individually
4. Check database connections
5. Monitor server logs

## 📞 **Support**

For additional support:
- Email: support@linkzup.com
- Documentation: `/docs` folder
- API Reference: Available in code comments

## 🔄 **Next Steps**

### **High Priority:**
1. Configure environment variables
2. Test payment flow end-to-end
3. Verify LinkedIn integration
4. Test content generation features

### **Medium Priority:**
1. Customize photo styles
2. Set up analytics tracking
3. Configure automation workflows
4. Test bulk operations

### **Low Priority:**
1. Performance optimization
2. Advanced analytics
3. Custom integrations
4. Mobile app development
