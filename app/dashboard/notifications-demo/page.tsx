"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useNotificationToast } from "@/hooks/use-notification-toast"
import { useNotificationService } from "@/lib/notification-service"
import { useNotifications } from "@/contexts/NotificationContext"
import {
  Bell,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Trash2,
  Check,
  RefreshCw
} from "lucide-react"

export default function NotificationsDemoPage() {
  const notificationToast = useNotificationToast()
  const notificationService = useNotificationService()
  const { notifications, unreadCount, markAllAsRead, clearAllNotifications } = useNotifications()
  const [isLoading, setIsLoading] = useState(false)

  const handleTestNotification = (type: 'success' | 'error' | 'warning' | 'info') => {
    const messages = {
      success: {
        title: "Test Success Notification",
        message: "This is a test success notification with toast and notification center."
      },
      error: {
        title: "Test Error Notification", 
        message: "This is a test error notification with toast and notification center."
      },
      warning: {
        title: "Test Warning Notification",
        message: "This is a test warning notification with toast and notification center."
      },
      info: {
        title: "Test Info Notification",
        message: "This is a test info notification with toast and notification center."
      }
    }

    const { title, message } = messages[type]
    
    switch (type) {
      case 'success':
        notificationToast.success(title, message, {
          action: { label: "View Details", url: "/dashboard" },
          category: "system"
        })
        break
      case 'error':
        notificationToast.error(title, message, {
          action: { label: "Try Again", url: "/dashboard" },
          category: "system"
        })
        break
      case 'warning':
        notificationToast.warning(title, message, {
          action: { label: "Learn More", url: "/dashboard" },
          category: "system"
        })
        break
      case 'info':
        notificationToast.info(title, message, {
          action: { label: "Get Started", url: "/dashboard" },
          category: "system"
        })
        break
    }
  }

  const handleTestServiceNotification = (service: string) => {
    setIsLoading(true)
    
    // Simulate async operation
    setTimeout(() => {
      switch (service) {
        case 'linkedin':
          notificationService.linkedinConnected("John Doe")
          break
        case 'content':
          notificationService.contentGenerated("AI in Business")
          break
        case 'billing':
          notificationService.paymentSuccessful("$29.99", "Pro")
          break
        case 'welcome':
          notificationService.welcomeUser("User")
          break
      }
      setIsLoading(false)
    }, 1000)
  }

  const handleNotificationOnly = () => {
    notificationToast.notificationOnly(
      "Notification Center Only",
      "This notification only appears in the notification center, not as a toast.",
      {
        action: { label: "View", url: "/dashboard" },
        category: "system"
      }
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notification System Demo</h1>
          <p className="text-gray-600 mt-2">
            Test the notification system and see how it works
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="text-sm">
            {unreadCount} unread notifications
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            <Check className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllNotifications}
            disabled={notifications.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Toast Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Toast Notifications
            </CardTitle>
            <CardDescription>
              Test notifications that show both toast and notification center
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => handleTestNotification('success')}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Success Notification
            </Button>
            <Button
              onClick={() => handleTestNotification('error')}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Error Notification
            </Button>
            <Button
              onClick={() => handleTestNotification('warning')}
              className="w-full bg-yellow-600 hover:bg-yellow-700"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Warning Notification
            </Button>
            <Button
              onClick={() => handleTestNotification('info')}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Info className="h-4 w-4 mr-2" />
              Info Notification
            </Button>
          </CardContent>
        </Card>

        {/* Service Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Service Notifications
            </CardTitle>
            <CardDescription>
              Test notifications from different services
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => handleTestServiceNotification('linkedin')}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              LinkedIn Connected
            </Button>
            <Button
              onClick={() => handleTestServiceNotification('content')}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              Content Generated
            </Button>
            <Button
              onClick={() => handleTestServiceNotification('billing')}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              Payment Successful
            </Button>
            <Button
              onClick={() => handleTestServiceNotification('welcome')}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              Welcome Message
            </Button>
          </CardContent>
        </Card>

        {/* Notification Center Only */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Center Only
            </CardTitle>
            <CardDescription>
              Test notifications that only appear in the notification center
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={handleNotificationOnly}
              variant="outline"
              className="w-full"
            >
              <Bell className="h-4 w-4 mr-2" />
              Notification Center Only
            </Button>
            <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded-lg">
              <p>These notifications won't show as toast messages, only in the notification center.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Current Notifications ({notifications.length})</CardTitle>
          <CardDescription>
            All notifications in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No notifications yet</p>
              <p className="text-sm">Try creating some notifications above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <div className={`p-4 rounded-lg border ${
                    notification.read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {notification.type === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                          {notification.type === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
                          {notification.type === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                          {notification.type === 'info' && <Info className="h-4 w-4 text-blue-500" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm">{notification.title}</h4>
                            <Badge variant="outline" className="text-xs">
                              {notification.category}
                            </Badge>
                            {!notification.read && (
                              <Badge variant="secondary" className="text-xs">
                                New
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{notification.message}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {notification.timestamp.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  {index < notifications.length - 1 && <Separator className="my-3" />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
