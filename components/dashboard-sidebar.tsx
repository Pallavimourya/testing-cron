"use client"

import { useSession } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import {
  Home,
  Sparkles,
  Calendar,
  Users,
  Linkedin,
  CheckCircle,
  X,
  FileText,
  Target,
  ChevronRight,
  Bell,
  Crown,
  Menu,
  ChevronLeft,
} from "lucide-react"
import { toast } from "sonner"



interface LinkedInStatus {
  isConnected: boolean
  linkedinName?: string
  linkedinEmail?: string
  linkedinProfileUrl?: string
  profileUrl?: string
  connectedAt?: string
  lastSync?: string
  serviceStatus?: "online" | "offline" | "unknown"
  linkedinId?: string
  tokenExpired?: boolean
  message?: string
}

interface DashboardSidebarProps {
  onClose?: () => void
  isOpen?: boolean
  className?: string
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export function DashboardSidebar({ 
  onClose, 
  isOpen = true, 
  className, 
  isCollapsed = false,
  onToggleCollapse 
}: DashboardSidebarProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [linkedinStatus, setLinkedinStatus] = useState<LinkedInStatus>({ isConnected: false })
  const [connecting, setConnecting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [hasShownConnectionNotification, setHasShownConnectionNotification] = useState(false)






  const isActive = (path: string) => pathname === path

  const menuItems = [
    {
      path: "/dashboard",
      icon: Home,
      label: "Dashboard",
      description: "Overview & Analytics",
      badge: "New",
      color: "blue",
    },
    {
      path: "/dashboard/profile",
      icon: Users,
      label: "My Profile",
      description: "Personal brand story",
      color: "blue",
    },
    {
      path: "/dashboard/topic-bank",
      icon: Target,
      label: "Topic Bank",
      description: "Manage content topics",
      color: "blue",
    },
    {
      path: "/dashboard/approved-content",
      icon: CheckCircle,
      label: "Approved Content",
      description: "Ready to publish",
      color: "blue",
    },
    {
      path: "/dashboard/scheduled-posts",
      icon: Calendar,
      label: "Scheduled Posts",
      description: "Manage scheduled content",
      color: "blue",
    },
    {
      path: "/dashboard/linkedin",
      icon: Linkedin,
      label: "LinkedIn",
      description: "Connection & Analytics",
      color: "blue",
    },

    {
      path: "/dashboard/billing",
      icon: Crown,
      label: "Premium",
      description: "Upgrade your plan",
      color: "blue",
    },
    {
      path: "/dashboard/how-to-use",
      icon: FileText,
      label: "Help & Guides",
      description: "Tutorials & support",
      color: "blue",
    },
  ]

  // Check LinkedIn connection status
  const checkLinkedInStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/linkedin/status")

      if (response.ok) {
        const data = await response.json()
        console.log("LinkedIn status data:", data) // Debug log

        // Only show notification if this is the first time checking and LinkedIn is connected
        // or if the connection status actually changed from disconnected to connected
        const wasConnected = linkedinStatus.isConnected
        const isNowConnected = data.isConnected

        if (
          isNowConnected &&
          !wasConnected &&
          linkedinStatus.isConnected !== undefined &&
          !hasShownConnectionNotification
        ) {
          setHasShownConnectionNotification(true)
        }

        setLinkedinStatus(data)
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error("Failed to check LinkedIn status:", response.status, errorData)
      }
    } catch (error) {
      console.error("Error checking LinkedIn status:", error)
    } finally {
      setLoading(false)
    }
  }

  // Check LinkedIn connection status on mount and periodically
  useEffect(() => {
    checkLinkedInStatus()
    const interval = setInterval(checkLinkedInStatus, 120000) // Check every 2 minutes instead of 30 seconds
    return () => clearInterval(interval)
  }, [])

  // Connect LinkedIn account
  const handleConnectLinkedIn = async () => {
    try {
      setConnecting(true)

      // Get LinkedIn OAuth URL
      const response = await fetch("/api/auth/linkedin")

      if (response.ok) {
        const data = await response.json()

        if (data.authUrl) {
          // Redirect to LinkedIn OAuth
          window.location.href = data.authUrl
        } else {
          toast.error("Failed to get LinkedIn authorization URL")
        }
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to connect LinkedIn")
      }
    } catch (error) {
      console.error("Error connecting LinkedIn:", error)
      toast.error("Failed to connect LinkedIn account. Please try again later.")
    } finally {
      setConnecting(false)
    }
  }

  // Disconnect LinkedIn account
  const handleDisconnectLinkedIn = async () => {
    try {
      setLoading(true)

      const response = await fetch("/api/linkedin/disconnect", {
        method: "POST",
      })

      if (response.ok) {
        setLinkedinStatus({ isConnected: false })
        setHasShownConnectionNotification(false) // Reset notification flag
      } else {
        toast.error("Failed to disconnect LinkedIn account")
      }
    } catch (error) {
      console.error("Error disconnecting LinkedIn:", error)
      toast.error("Failed to disconnect LinkedIn account")
    } finally {
      setLoading(false)
    }
  }

  // Sync LinkedIn data with debounce
  const [isSyncing, setIsSyncing] = useState(false)

  const handleSyncLinkedIn = async () => {
    if (isSyncing) {
      toast.info("Sync already in progress...")
      return
    }

    try {
      setIsSyncing(true)
      setLoading(true)

      const response = await fetch("/api/linkedin/sync", {
        method: "POST",
      })

      if (response.ok) {
        await checkLinkedInStatus() // Refresh status
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to sync LinkedIn data")
      }
    } catch (error) {
      console.error("Error syncing LinkedIn:", error)
      toast.error("Failed to sync LinkedIn data")
    } finally {
      setIsSyncing(false)
      setLoading(false)
    }
  }

  const handleNavigation = (path: string) => {
    router.push(path)
    if (onClose) {
      onClose()
    }
  }

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text
  }

  const getColorClasses = (color: string, isActive: boolean) => {
    return isActive ? "bg-blue-600 text-white shadow-md" : "text-blue-600 hover:bg-blue-50 hover:shadow-sm"
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      <aside
        className={`
        fixed lg:static inset-y-0 left-0 z-50 h-screen bg-white border-r border-gray-200 shadow-lg flex flex-col
        transform transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-16' : 'w-64 sm:w-72 lg:w-80'}
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        ${className || ""}
      `}
      >
        {/* Header */}
        <div className="px-3 sm:px-4 py-3 sm:py-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden hover:scale-105 transition-transform duration-200">
                <Image
                  src="/linkzup_cut.jpeg"
                  alt="LinkZup"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover rounded-xl"
                  priority
                />
              </div>
              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <h1 className="text-base sm:text-lg font-bold text-gray-900 truncate">LinkZup</h1>
                  <p className="text-xs text-gray-500 truncate">AI Content Platform</p>
                </div>
              )}
            </div>
            {/* Mobile close button */}
            {onClose && !isCollapsed && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="lg:hidden p-1.5 sm:p-2 flex-shrink-0 ml-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            {/* Collapse/Expand toggle button - only show on desktop when onToggleCollapse is provided */}
            {onToggleCollapse && !onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleCollapse}
                className="hidden lg:flex p-1.5 sm:p-2 flex-shrink-0 ml-2 hover:bg-blue-50 rounded-lg text-gray-600 hover:text-blue-600 border border-gray-200 hover:border-blue-300 bg-white shadow-sm"
                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 sm:px-3 py-3 sm:py-4 space-y-1 overflow-y-auto">
          {!isCollapsed && (
            <div className="mb-3 sm:mb-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 sm:mb-3 px-2">Navigation</h3>
            </div>
          )}

          {menuItems.map(({ path, icon: Icon, label, description, badge, color }) => {
            const active = isActive(path)
            const colorClasses = getColorClasses(color, active)

            return (
              <div key={path} className="relative group">
                <Button
                  onClick={() => handleNavigation(path)}
                  variant="ghost"
                  className={`w-full justify-start gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    active ? `${colorClasses}` : `${colorClasses}`
                  }`}
                  title={isCollapsed ? label : undefined}
                >
                  <div
                    className={`p-1 sm:p-1.5 rounded-lg transition-all duration-200 ${
                      active ? "bg-white/20" : "bg-gray-100 group-hover:bg-white"
                    }`}
                  >
                    <Icon className={`h-3 w-3 sm:h-4 sm:w-4 ${active ? "text-white" : ""}`} />
                  </div>
                  {!isCollapsed && (
                    <div className="flex flex-col items-start min-w-0 flex-1">
                      <div className="flex items-center gap-1 sm:gap-2 w-full">
                        <span className="truncate font-medium text-xs sm:text-sm">{label}</span>
                        {badge && (
                          <Badge
                            variant="secondary"
                            className={`text-xs px-1 sm:px-1.5 py-0.5 ${
                              active ? "bg-white/20 text-white" : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {badge}
                          </Badge>
                        )}
                      </div>
                      <span className={`text-xs truncate hidden sm:block ${active ? "text-white/80" : "text-gray-500"}`}>
                        {description}
                      </span>
                    </div>
                  )}
                  {active && !isCollapsed && <ChevronRight className="h-2 w-2 sm:h-3 sm:w-3 text-white/60 flex-shrink-0" />}
                </Button>
                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    {label}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* User Profile Section */}
        <div className="px-2 sm:px-3 pb-3 sm:pb-4">
          {!isCollapsed ? (
            <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <Avatar className="h-6 w-6 sm:h-8 sm:w-8 ring-2 ring-white flex-shrink-0">
                  <AvatarImage src={session?.user?.image || ""} />
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold text-xs sm:text-sm">
                    {session?.user?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col overflow-hidden min-w-0 flex-1">
                  <span className="text-xs sm:text-sm font-medium truncate" title={session?.user?.name || ""}>
                    {truncateText(session?.user?.name || "", 12)}
                  </span>
                  <span className="text-xs text-gray-500 truncate" title={session?.user?.email || ""}>
                    {truncateText(session?.user?.email || "", 15)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            // Collapsed state - just show avatar with tooltip
            <div className="flex justify-center">
              <div className="relative group">
                <Avatar className="h-8 w-8 ring-2 ring-white flex-shrink-0 cursor-pointer hover:scale-105 transition-transform">
                  <AvatarImage src={session?.user?.image || ""} />
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold text-xs">
                    {session?.user?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                {/* Tooltip for collapsed state */}
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  {session?.user?.name || "User"}
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
