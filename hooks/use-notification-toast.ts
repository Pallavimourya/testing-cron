import { useNotifications } from '@/contexts/NotificationContext'
import { toast } from 'sonner'

export function useNotificationToast() {
  const { addNotification } = useNotifications()

  const success = (title: string, message?: string, options?: {
    action?: { label: string; url: string }
    category?: 'content' | 'linkedin' | 'system' | 'billing'
    showToast?: boolean
  }) => {
    const { action, category = 'system', showToast = true } = options || {}
    
    // Add to notification center (background storage)
    addNotification({
      title,
      message: message || title,
      type: 'success',
      category,
      action
    })

    // Always show toast (main notification method)
    toast.success(title, {
      duration: 3000,
      description: message
    })
  }

  const error = (title: string, message?: string, options?: {
    action?: { label: string; url: string }
    category?: 'content' | 'linkedin' | 'system' | 'billing'
    showToast?: boolean
  }) => {
    const { action, category = 'system', showToast = true } = options || {}
    
    // Add to notification center (background storage)
    addNotification({
      title,
      message: message || title,
      type: 'error',
      category,
      action
    })

    // Always show toast (main notification method)
    toast.error(title, {
      duration: 4000,
      description: message
    })
  }

  const warning = (title: string, message?: string, options?: {
    action?: { label: string; url: string }
    category?: 'content' | 'linkedin' | 'system' | 'billing'
    showToast?: boolean
  }) => {
    const { action, category = 'system', showToast = true } = options || {}
    
    // Add to notification center (background storage)
    addNotification({
      title,
      message: message || title,
      type: 'warning',
      category,
      action
    })

    // Always show toast (main notification method)
    toast.warning(title, {
        duration: 3500,
        description: message
      })
  }

  const info = (title: string, message?: string, options?: {
    action?: { label: string; url: string }
    category?: 'content' | 'linkedin' | 'system' | 'billing'
    showToast?: boolean
  }) => {
    const { action, category = 'system', showToast = true } = options || {}
    
    // Add to notification center (background storage)
    addNotification({
      title,
      message: message || title,
      type: 'info',
      category,
      action
    })

    // Always show toast (main notification method)
    toast.info(title, {
        duration: 3000,
        description: message
      })
  }

  const notificationOnly = (title: string, message?: string, options?: {
    action?: { label: string; url: string }
    category?: 'content' | 'linkedin' | 'system' | 'billing'
  }) => {
    const { action, category = 'system' } = options || {}
    
    // Add to notification center only (no toast)
    addNotification({
      title,
      message: message || title,
      type: 'info',
      category,
      action
    })
  }

  return {
    success,
    error,
    warning,
    info,
    notificationOnly
  }
}
