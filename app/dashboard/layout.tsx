"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import DashboardTopbar from "@/components/dashboard-topbar"
import { Toaster } from "@/components/ui/sonner"
import { usePathname } from "next/navigation"
import { NotificationProvider } from "@/contexts/NotificationContext"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (sidebarOpen && !target.closest('.sidebar') && !target.closest('.mobile-menu-button')) {
        setSidebarOpen(false)
      }
    }

    if (sidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'unset'
    }
  }, [sidebarOpen])

  const handleMenuClick = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const handleSidebarClose = () => {
    setSidebarOpen(false)
  }

  return (
    <NotificationProvider>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={handleSidebarClose}
          />
        )}

        {/* Sidebar */}
        <DashboardSidebar 
          onClose={handleSidebarClose} 
          isOpen={sidebarOpen}
          className="sidebar"
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <DashboardTopbar 
            onMenuClick={handleMenuClick} 
            className="mobile-menu-button"
          />
          <main className="flex-1 overflow-y-auto bg-gray-50">
            <div className="min-h-full">
              {children}
            </div>
          </main>
        </div>
        
        {/* Optimized Fast Loading Notifications */}
        <Toaster 
          position="top-center" 
          toastOptions={{
            style: {
              background: '#ffffff',
              color: '#16a34a', // Green color for all notification text
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              fontSize: '14px',
              padding: '12px 16px',
              minWidth: '300px',
              maxWidth: '400px',
              zIndex: 9999,
              border: '1px solid #e5e7eb',
              transform: 'translateZ(0)', // Hardware acceleration
              willChange: 'transform', // Optimize for animations
            },
            duration: 3000, // Reduced duration for faster experience
            className: 'fast-notification',
          }}
        />
      </div>
    </NotificationProvider>
  )
}
