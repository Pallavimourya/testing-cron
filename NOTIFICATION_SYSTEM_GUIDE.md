# 🔔 Notification System Guide

## Overview
The notification system has been completely redesigned to provide a better user experience with proper notification management, real-time updates, and organized notification center.

## 🎯 Key Features

### ✅ **Fixed Issues**
- **Proper notification timing**: Notifications now show at the right time
- **Notification center**: All notifications are stored and accessible
- **Unread count**: Visual indicator of unread notifications
- **Notification categories**: Organized by type (content, linkedin, system, billing)
- **Action buttons**: Direct links to relevant pages
- **Persistent storage**: Notifications saved in localStorage
- **Real-time updates**: Immediate notification display

### 🚀 **New Features**
- **Notification Center**: Click bell icon to see all notifications
- **Toast + Notification Center**: Choose to show both or just notification center
- **Mark as read**: Individual and bulk read status management
- **Delete notifications**: Remove individual or all notifications
- **Time tracking**: Shows when notifications were created
- **Category filtering**: Different types of notifications
- **Action buttons**: Direct navigation to relevant pages

## 📁 File Structure

\`\`\`
contexts/
├── NotificationContext.tsx          # Main notification context
components/
├── notification-center.tsx          # Notification center UI
hooks/
├── use-notification-toast.ts        # Combined toast + notification hook
lib/
├── notification-service.ts          # Service for automatic notifications
app/dashboard/
├── notifications-demo/page.tsx      # Demo page for testing
\`\`\`

## 🛠️ Usage

### 1. **Basic Usage with Toast + Notification Center**

\`\`\`typescript
import { useNotificationToast } from '@/hooks/use-notification-toast'

const notificationToast = useNotificationToast()

// Success notification (shows toast + notification center)
notificationToast.success(
  "LinkedIn Connected", 
  "Successfully connected to LinkedIn account",
  {
    action: { label: "View Profile", url: "/dashboard/linkedin" },
    category: "linkedin"
  }
)

// Error notification
notificationToast.error(
  "Connection Failed",
  "Failed to connect to LinkedIn",
  {
    action: { label: "Try Again", url: "/dashboard/linkedin" },
    category: "linkedin"
  }
)
\`\`\`

### 2. **Notification Center Only**

\`\`\`typescript
// Only shows in notification center, no toast
notificationToast.notificationOnly(
  "Background Task Complete",
  "Your content generation is ready",
  {
    action: { label: "View Content", url: "/dashboard/approved-content" },
    category: "content"
  }
)
\`\`\`

### 3. **Using Notification Service**

\`\`\`typescript
import { useNotificationService } from '@/lib/notification-service'

const notificationService = useNotificationService()

// LinkedIn notifications
notificationService.linkedinConnected("John Doe")
notificationService.linkedinDisconnected()
notificationService.linkedinSyncCompleted()
notificationService.linkedinTokenExpired()

// Content notifications
notificationService.contentGenerated("AI in Business")
notificationService.contentPosted("LinkedIn")
notificationService.contentApproved("Marketing Tips")

// Billing notifications
notificationService.paymentSuccessful("$29.99", "Pro")
notificationService.paymentFailed("Insufficient funds")
notificationService.subscriptionExpiring(7)

// System notifications
notificationService.welcomeUser("John")
notificationService.systemMaintenance("Tomorrow 2 AM")
notificationService.featureUpdate("AI Content Generator")
\`\`\`

### 4. **Direct Context Usage**

\`\`\`typescript
import { useNotifications } from '@/contexts/NotificationContext'

const { 
  notifications, 
  unreadCount, 
  markAsRead, 
  markAllAsRead,
  addNotification,
  removeNotification,
  clearAllNotifications 
} = useNotifications()

// Add custom notification
addNotification({
  title: "Custom Notification",
  message: "This is a custom notification",
  type: "info",
  category: "system",
  action: {
    label: "View Details",
    url: "/dashboard"
  }
})
\`\`\`

## 🎨 UI Components

### **Notification Center**
- **Location**: Bell icon in topbar and sidebar
- **Features**: 
  - Shows unread count badge
  - Popover with all notifications
  - Mark all as read button
  - Clear all button
  - Individual notification actions

### **Notification Types**
- **Success**: Green color, checkmark icon
- **Error**: Red color, X icon  
- **Warning**: Yellow color, triangle icon
- **Info**: Blue color, info icon

### **Categories**
- **content**: Content generation and management
- **linkedin**: LinkedIn integration events
- **system**: System-wide notifications
- **billing**: Payment and subscription events

## 🔧 Integration Examples

### **LinkedIn Integration**
\`\`\`typescript
// In dashboard-sidebar.tsx
const notificationService = useNotificationService()

// When LinkedIn connects
if (data.isConnected && !linkedinStatus.isConnected) {
  notificationService.linkedinConnected(data.linkedinName || "LinkedIn Account")
}

// When LinkedIn disconnects
if (response.ok) {
  setLinkedinStatus({ isConnected: false })
  notificationService.linkedinDisconnected()
}
\`\`\`

### **Content Generation**
\`\`\`typescript
// When content is generated
notificationService.contentGenerated(topicTitle)

// When content is approved
notificationService.contentApproved(topicTitle)

// When content is posted
notificationService.contentPosted("LinkedIn")
\`\`\`

### **Payment Processing**
\`\`\`typescript
// When payment succeeds
notificationService.paymentSuccessful(amount, planName)

// When payment fails
notificationService.paymentFailed(errorMessage)

// When subscription expires soon
notificationService.subscriptionExpiring(daysLeft)
\`\`\`

## 🧪 Testing

### **Demo Page**
Visit `/dashboard/notifications-demo` to test all notification features:

1. **Toast Notifications**: Test different notification types
2. **Service Notifications**: Test automatic service notifications
3. **Notification Center Only**: Test notifications without toast
4. **Current Notifications**: View all stored notifications

### **Manual Testing**
\`\`\`typescript
// Test different notification types
notificationToast.success("Test Success", "This is a test")
notificationToast.error("Test Error", "This is a test")
notificationToast.warning("Test Warning", "This is a test")
notificationToast.info("Test Info", "This is a test")

// Test service notifications
notificationService.linkedinConnected("Test User")
notificationService.contentGenerated("Test Topic")
notificationService.paymentSuccessful("$10", "Basic")
\`\`\`

## 📱 Mobile Responsiveness

- **Notification center**: Responsive popover design
- **Bell icon**: Proper sizing for mobile
- **Notification cards**: Mobile-optimized layout
- **Touch interactions**: Proper touch targets

## 🔒 Data Persistence

- **Storage**: Notifications saved in localStorage per user
- **User-specific**: Each user has their own notification history
- **Automatic cleanup**: Keeps only last 50 notifications
- **Session persistence**: Notifications survive page refreshes

## 🎯 Best Practices

### **When to Use Toast + Notification Center**
- Important user actions (success/error)
- Time-sensitive information
- Actions that need immediate feedback

### **When to Use Notification Center Only**
- Background processes
- Non-critical updates
- Information that doesn't need immediate attention

### **Notification Content**
- **Title**: Short, descriptive (max 50 chars)
- **Message**: Clear explanation (max 200 chars)
- **Action**: Relevant navigation when possible
- **Category**: Proper categorization for organization

### **Timing**
- **Success**: 3 seconds duration
- **Error**: 4 seconds duration  
- **Warning**: 3.5 seconds duration
- **Info**: 3 seconds duration

## 🚀 Performance Optimizations

- **Hardware acceleration**: CSS transforms for smooth animations
- **Efficient rendering**: Only re-render when notifications change
- **Memory management**: Limit to 50 notifications per user
- **Lazy loading**: Notifications loaded on demand

## 🔄 Migration from Old System

### **Before (Old Toast Only)**
\`\`\`typescript
import { toast } from "sonner"
toast.success("LinkedIn connected successfully!")
\`\`\`

### **After (New System)**
\`\`\`typescript
import { useNotificationToast } from '@/hooks/use-notification-toast'

const notificationToast = useNotificationToast()
notificationToast.success(
  "LinkedIn Connected",
  "Successfully connected to LinkedIn account",
  {
    action: { label: "View Profile", url: "/dashboard/linkedin" },
    category: "linkedin"
  }
)
\`\`\`

## 🎉 Benefits

1. **Better UX**: Users can see all notifications in one place
2. **No missed notifications**: Persistent storage ensures nothing is lost
3. **Organized**: Categories help users find relevant notifications
4. **Actionable**: Direct links to relevant pages
5. **Flexible**: Choose between toast + notification or notification only
6. **Scalable**: Easy to add new notification types and categories

---

**🎯 The notification system is now properly implemented with real-time updates, proper timing, and a comprehensive notification center!**
