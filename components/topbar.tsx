"use client"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useSession } from "next-auth/react"
import { handleSignOut } from "@/lib/utils"
import Image from "next/image"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Settings, LogOut, Bell } from "lucide-react"
import { useRouter } from "next/navigation"

interface TopbarProps {
  userProfile?: any
}

export default function Topbar({ userProfile }: TopbarProps) {
  const [showINR, setShowINR] = useState(true)
  const { data: session } = useSession()
  const router = useRouter()

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-slate-200 flex items-center justify-between px-8 py-3 h-16 w-full shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <Image src="/zuper-logo.png" alt="LinkZup Logo" width={32} height={32} className="h-8 w-auto" />
          <div>
            <span className="font-bold text-lg text-slate-900">LinkZup</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">{userProfile?.niche || "Content Automation Platform"}</span>
              {session?.user?.email && <span className="text-xs text-slate-400 ml-1">(Pro)</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
        </Button>

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10 border-2 border-slate-200">
                <AvatarImage src={session?.user?.image || userProfile?.profileImage} />
                <AvatarFallback className="bg-gradient-to-tr from-blue-500 to-purple-600 text-white font-bold">
                  {session?.user?.name ? getInitials(session.user.name) : "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-white border border-slate-200 shadow-lg">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none text-slate-900">{session?.user?.name || "User"}</p>
                <p className="text-xs leading-none text-slate-500">{session?.user?.email}</p>
                {userProfile?.niche && <p className="text-xs leading-none text-slate-400">{userProfile.niche}</p>}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-200" />
            <DropdownMenuItem 
              onClick={() => router.push("/dashboard/profile")}
              className="text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => router.push("/dashboard/settings")}
              className="text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-200" />
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
