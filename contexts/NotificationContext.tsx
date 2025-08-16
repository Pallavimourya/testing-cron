"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'

export interface Notification {
  id: string
  title: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  timestamp: Date
  read: boolean
  action?: {
    label: string
    url: string
  }
  category: 'content' | 'linkedin' | 'system' | 'billing'
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  removeNotification: (id: string) => void
  clearAllNotifications: () => void
  isNotificationCenterOpen: boolean
  setIsNotificationCenterOpen: (open: boolean) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false)

  // Load notifications from localStorage on mount
  useEffect(() => {
    if (session?.user?.email) {
      const savedNotifications = localStorage.getItem(`notifications_${session.user.email}`)
      if (savedNotifications) {
        try {
          const parsed = JSON.parse(savedNotifications)
          // Convert timestamp strings back to Date objects
          const notificationsWithDates = parsed.map((n: any) => ({
            ...n,
            timestamp: new Date(n.timestamp)
          }))
          setNotifications(notificationsWithDates)
        } catch (error) {
          console.error('Error loading notifications:', error)
        }
      }
    }
  }, [session?.user?.email])

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    if (session?.user?.email && notifications.length > 0) {
      localStorage.setItem(`notifications_${session.user.email}`, JSON.stringify(notifications))
    }
  }, [notifications, session?.user?.email])

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false
    }

    setNotifications(prev => [newNotification, ...prev.slice(0, 49)]) // Keep only last 50 notifications
  }, [])

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    )
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const clearAllNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    addNotification,
    removeNotification,
    clearAllNotifications,
    isNotificationCenterOpen,
    setIsNotificationCenterOpen
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
