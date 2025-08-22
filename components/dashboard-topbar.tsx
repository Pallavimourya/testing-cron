"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Menu, LogOut, Eye, Linkedin, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { handleSignOut } from "@/lib/utils"
import { toast } from "sonner"

interface DashboardTopbarProps {
  onMenuClick: () => void
  onToggleCollapse?: () => void
  isCollapsed?: boolean
  className?: string
}

export default function DashboardTopbar({
  onMenuClick,
  onToggleCollapse,
  isCollapsed = false,
  className,
}: DashboardTopbarProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [isConnected, setIsConnected] = useState(true)
  const [linkedinConnected, setLinkedinConnected] = useState(false)
  const [linkedinConnecting, setLinkedinConnecting] = useState(false)

  const checkLinkedInStatus = async () => {
    try {
      const response = await fetch("/api/linkedin/status")
      if (response.ok) {
        const data = await response.json()
        setLinkedinConnected(data.isConnected && !data.tokenExpired)
      }
    } catch (error) {
      console.error("Error checking LinkedIn status:", error)
    }
  }

  const connectLinkedIn = async () => {
    try {
      setLinkedinConnecting(true)
      const response = await fetch("/api/auth/linkedin")

      if (response.ok) {
        const data = await response.json()
        if (data.authUrl) {
          localStorage.setItem("linkedin_connecting", "true")
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
      toast.error("Failed to connect LinkedIn account")
    } finally {
      setLinkedinConnecting(false)
    }
  }

  const disconnectLinkedIn = async () => {
    try {
      setLinkedinConnecting(true)
      const response = await fetch("/api/linkedin/disconnect", { method: "POST" })

      if (response.ok) {
        setLinkedinConnected(false)
        toast.success("LinkedIn account disconnected successfully")
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Failed to disconnect LinkedIn account")
      }
    } catch (error) {
      console.error("Error disconnecting LinkedIn:", error)
      toast.error("Failed to disconnect LinkedIn account")
    } finally {
      setLinkedinConnecting(false)
    }
  }

  useEffect(() => {
    // Only check LinkedIn status if we're on the dashboard page
    if (window.location.pathname === "/dashboard") {
      checkLinkedInStatus()
    }

    // Check for connection success from URL params
    const urlParams = new URLSearchParams(window.location.search)
    const linkedinParam = urlParams.get("linkedin")

    if (linkedinParam === "connected") {
      toast.success("LinkedIn account connected successfully!")
      checkLinkedInStatus()
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
      localStorage.removeItem("linkedin_connecting")
    }
  }, [])

  const handleProfile = () => {
    router.push("/dashboard/profile")
  }

  const handleViewProfile = () => {
    router.push("/dashboard/view-profile")
  }

  return (
    <header
      className={`sticky top-0 z-10 flex h-14 sm:h-16 items-center justify-between border-b border-slate-200 bg-white px-3 sm:px-4 lg:px-6 shadow-sm ${className || ""}`}
    >
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Mobile hamburger menu */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg h-8 w-8 sm:h-10 sm:w-10"
        >
          <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>

        {/* Desktop collapse toggle button */}
        {onToggleCollapse && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="hidden lg:flex p-2 hover:bg-gray-100 rounded-lg h-8 w-8 sm:h-10 sm:w-10"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            ) : (
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        {!linkedinConnected ? (
          <Button
            onClick={connectLinkedIn}
            disabled={linkedinConnecting}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white hidden sm:flex"
          >
            {linkedinConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Linkedin className="mr-2 h-4 w-4" />
                Connect LinkedIn
              </>
            )}
          </Button>
        ) : (
          <div className="flex items-center gap-2 hidden sm:flex">
            <Badge className="bg-blue-100 text-blue-700">
              <Linkedin className="mr-1 h-3 w-3" />
              LinkedIn Connected
            </Badge>
            <Button
              onClick={disconnectLinkedIn}
              disabled={linkedinConnecting}
              size="sm"
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              Disconnect
            </Button>
          </div>
        )}

        {/* Mobile LinkedIn buttons */}
        {!linkedinConnected ? (
          <Button
            onClick={connectLinkedIn}
            disabled={linkedinConnecting}
            size="icon"
            className="bg-blue-600 hover:bg-blue-700 text-white sm:hidden h-8 w-8"
          >
            {linkedinConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Linkedin className="h-4 w-4" />}
          </Button>
        ) : (
          <div className="flex items-center gap-1 sm:hidden">
            <Badge className="bg-blue-100 text-blue-700 text-xs">
              <Linkedin className="mr-1 h-2 w-2" />
              Connected
            </Badge>
            <Button
              onClick={disconnectLinkedIn}
              disabled={linkedinConnecting}
              size="icon"
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50 h-8 w-8"
            >
              {linkedinConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="text-xs">×</span>}
            </Button>
          </div>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full hover:bg-gray-100 p-0">
              <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || "User"} />
                <AvatarFallback className="bg-purple-600 text-white text-xs sm:text-sm">
                  {session?.user?.name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 sm:w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none truncate">{session?.user?.name || "User"}</p>
                <p className="text-xs leading-none text-slate-500 truncate">
                  {session?.user?.email || "user@example.com"}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleViewProfile} className="cursor-pointer">
              <Eye className="mr-2 h-4 w-4" />
              View Profile
            </DropdownMenuItem>
            {linkedinConnected && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={disconnectLinkedIn}
                  className="text-red-600 hover:bg-red-50 cursor-pointer"
                >
                  <Linkedin className="mr-2 h-4 w-4" />
                  Disconnect LinkedIn
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleSignOut(router)}
              className="text-red-600 hover:bg-red-50 cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
