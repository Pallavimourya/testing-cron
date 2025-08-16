"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { DashboardSidebar } from "./dashboard-sidebar"
import DashboardTopbar from "./dashboard-topbar"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import { Monitor, Smartphone, X } from "lucide-react"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showMobilePopup, setShowMobilePopup] = useState(false)
  const pathname = usePathname()
  const isMobile = useIsMobile()

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }, [pathname, isMobile])

  // Show mobile popup only on very small screens (phones)
  useEffect(() => {
    const checkScreenSize = () => {
      const isVerySmall = window.innerWidth < 480 // Less than mobile breakpoint
      if (isVerySmall && !showMobilePopup) {
        setShowMobilePopup(true)
      }
    }

    checkScreenSize()
    window.addEventListener("resize", checkScreenSize)
    return () => window.removeEventListener("resize", checkScreenSize)
  }, [showMobilePopup])

  // Mobile popup for very small screens
  if (showMobilePopup && window.innerWidth < 480) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center">
          {/* Close button */}
          <div className="flex justify-end mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMobilePopup(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Icons */}
          <div className="flex justify-center items-center gap-4 mb-6">
            <div className="p-3 bg-red-100 rounded-full">
              <Smartphone className="h-6 w-6 text-red-500" />
            </div>
            <div className="text-gray-400 text-xl">→</div>
            <div className="p-3 bg-green-100 rounded-full">
              <Monitor className="h-6 w-6 text-green-500" />
            </div>
          </div>

          {/* Content */}
          <h1 className="text-xl font-bold text-gray-900 mb-3">Better on Larger Screens</h1>
          <p className="text-gray-600 mb-4 text-sm leading-relaxed">
            LinkZup works best on tablets and desktops. For the optimal experience, please use a larger screen.
          </p>

          {/* Action buttons */}
          <div className="space-y-2">
            <Button
              onClick={() => setShowMobilePopup(false)}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2 rounded-lg text-sm"
            >
              Continue Anyway
            </Button>
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 py-2 rounded-lg text-sm"
            >
              Go Back
            </Button>
          </div>

          {/* Footer */}
          <p className="text-xs text-gray-500 mt-4">Need help? Contact us at support@linkzup.com</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <DashboardSidebar onClose={() => setSidebarOpen(false)} isOpen={sidebarOpen} />

      {/* Main Content */}
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <DashboardTopbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-2 sm:p-4 lg:p-6 bg-slate-50">
          <div className="max-w-full">{children}</div>
        </main>
      </div>
    </div>
  )
}
