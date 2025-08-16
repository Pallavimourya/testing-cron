import { useNotifications } from '@/contexts/NotificationContext'
import { toast } from 'sonner'

// Notification service for automatic notifications
export class NotificationService {
  private static instance: NotificationService
  private addNotification: any

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  setAddNotification(addNotification: any) {
    this.addNotification = addNotification
  }

  // LinkedIn related notifications
  linkedinConnected(accountName: string) {
    this.addNotification?.({
      title: "LinkedIn Connected",
      message: `Successfully connected to LinkedIn account: ${accountName}`,
      type: "success",
      category: "linkedin",
      action: {
        label: "View Profile",
        url: "/dashboard/linkedin"
      }
    })
    
    // Show toast notification
    toast.success(`LinkedIn Connected: ${accountName}`)
  }

  linkedinDisconnected() {
    this.addNotification?.({
      title: "LinkedIn Disconnected",
      message: "Your LinkedIn account has been disconnected",
      type: "warning",
      category: "linkedin",
      action: {
        label: "Reconnect",
        url: "/dashboard/linkedin"
      }
    })
    
    // Show toast notification
    toast.warning("LinkedIn account disconnected")
  }

  linkedinSyncCompleted() {
    this.addNotification?.({
      title: "LinkedIn Sync Complete",
      message: "Your LinkedIn data has been successfully synced",
      type: "success",
      category: "linkedin"
    })
    
    // Show toast notification
    toast.success("LinkedIn data synced successfully")
  }

  linkedinTokenExpired() {
    this.addNotification?.({
      title: "LinkedIn Token Expired",
      message: "Your LinkedIn connection has expired. Please reconnect your account.",
      type: "error",
      category: "linkedin",
      action: {
        label: "Reconnect",
        url: "/dashboard/linkedin"
      }
    })
    
    // Show toast notification
    toast.error("LinkedIn token expired. Please reconnect your account.")
  }

  linkedinRateLimitExceeded() {
    this.addNotification?.({
      title: "LinkedIn API Rate Limit",
      message: "LinkedIn API rate limit exceeded. Please try again later.",
      type: "warning",
      category: "linkedin",
      action: {
        label: "View Details",
        url: "/dashboard/linkedin"
      }
    })
    
    // Show toast notification
    toast.warning("LinkedIn API rate limit exceeded. Please try again later.")
  }

  // Content related notifications
  contentGenerated(topicTitle: string) {
    this.addNotification?.({
      title: "Content Generated",
      message: `New content has been generated for: ${topicTitle}`,
      type: "success",
      category: "content",
      action: {
        label: "View Content",
        url: "/dashboard/approved-content"
      }
    })
  }

  contentPosted(platform: string) {
    this.addNotification?.({
      title: "Content Posted",
      message: `Your content has been successfully posted to ${platform}`,
      type: "success",
      category: "content"
    })
  }

  contentApproved(topicTitle: string) {
    this.addNotification?.({
      title: "Content Approved",
      message: `Content for "${topicTitle}" has been approved and is ready to post`,
      type: "success",
      category: "content",
      action: {
        label: "View Content",
        url: "/dashboard/approved-content"
      }
    })
  }

  // Topic related notifications
  topicCreated(topicTitle: string) {
    this.addNotification?.({
      title: "Topic Created",
      message: `New topic created: ${topicTitle}`,
      type: "info",
      category: "content",
      action: {
        label: "View Topic",
        url: "/dashboard/topic-bank"
      }
    })
  }

  topicApproved(topicTitle: string) {
    this.addNotification?.({
      title: "Topic Approved",
      message: `Topic "${topicTitle}" has been approved`,
      type: "success",
      category: "content",
      action: {
        label: "Generate Content",
        url: "/dashboard/topic-bank"
      }
    })
  }

  // Billing related notifications
  paymentSuccessful(amount: string, plan: string) {
    this.addNotification?.({
      title: "Payment Successful",
      message: `Payment of ${amount} for ${plan} plan completed successfully`,
      type: "success",
      category: "billing",
      action: {
        label: "View Billing",
        url: "/dashboard/billing"
      }
    })
  }

  paymentFailed(reason: string) {
    this.addNotification?.({
      title: "Payment Failed",
      message: `Payment failed: ${reason}`,
      type: "error",
      category: "billing",
      action: {
        label: "Retry Payment",
        url: "/dashboard/billing"
      }
    })
  }

  subscriptionExpiring(daysLeft: number) {
    this.addNotification?.({
      title: "Subscription Expiring",
      message: `Your subscription will expire in ${daysLeft} days`,
      type: "warning",
      category: "billing",
      action: {
        label: "Renew Now",
        url: "/dashboard/billing"
      }
    })
  }

  // System notifications
  systemMaintenance(scheduledTime: string) {
    this.addNotification?.({
      title: "System Maintenance",
      message: `Scheduled maintenance on ${scheduledTime}. Service may be temporarily unavailable.`,
      type: "warning",
      category: "system"
    })
  }

  featureUpdate(featureName: string) {
    this.addNotification?.({
      title: "New Feature Available",
      message: `${featureName} is now available! Check it out.`,
      type: "info",
      category: "system"
    })
  }

  // Error notifications
  apiError(service: string, error: string) {
    this.addNotification?.({
      title: `${service} Error`,
      message: `An error occurred: ${error}`,
      type: "error",
      category: "system"
    })
  }

  // Welcome notification
  welcomeUser(userName: string) {
    this.addNotification?.({
      title: "Welcome to LinkZup!",
      message: `Hi ${userName}, welcome to your AI content platform. Let's get started!`,
      type: "info",
      category: "system",
      action: {
        label: "Get Started",
        url: "/dashboard/how-to-use"
      }
    })
  }
}

// Hook to use notification service
export function useNotificationService() {
  const { addNotification } = useNotifications()
  const service = NotificationService.getInstance()
  
  // Set the addNotification function
  service.setAddNotification(addNotification)
  
  return service
}
