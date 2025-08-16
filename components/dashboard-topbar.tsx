"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Menu, Bell, Check, User, LogOut } from "lucide-react"
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


interface DashboardTopbarProps {
  onMenuClick: () => void
  className?: string
}

export default function DashboardTopbar({ onMenuClick, className }: DashboardTopbarProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [isConnected, setIsConnected] = useState(true)

  const handleProfile = () => {
    router.push("/dashboard/profile")
  }



  return (
    <header
      className={`sticky top-0 z-10 flex h-14 sm:h-16 items-center justify-between border-b border-slate-200 bg-white px-3 sm:px-4 lg:px-6 shadow-sm ${className || ""}`}
    >
      <div className="flex items-center gap-2 sm:gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg h-8 w-8 sm:h-10 sm:w-10"
        >
          <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
        <div className="hidden sm:block">
          <Badge
            variant={isConnected ? "default" : "destructive"}
            className={`${isConnected ? "bg-green-500" : ""} text-xs sm:text-sm`}
          >
            {isConnected ? (
              <>
                <Check className="mr-1 h-3 w-3" /> Content Generation Connected
              </>
            ) : (
              "Disconnected"
            )}
          </Badge>
        </div>
        {/* Mobile version - shorter text */}
        <div className="block sm:hidden">
          <Badge
            variant={isConnected ? "default" : "destructive"}
            className={`${isConnected ? "bg-green-500" : ""} text-xs`}
          >
            {isConnected ? (
              <>
                <Check className="mr-1 h-2 w-2" /> Connected
              </>
            ) : (
              "Offline"
            )}
          </Badge>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
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
            <DropdownMenuItem onClick={handleProfile} className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
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
