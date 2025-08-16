"use client"

import {
  FaTachometerAlt,
  FaCog,
  FaChartBar,
  FaFileAlt,
  FaCalendarAlt,
  FaLightbulb,
  FaUserFriends,
  FaFolderOpen,
  FaRobot,
} from "react-icons/fa"
import { MdOutlineViewCarousel } from "react-icons/md"
import { BsSoundwave } from "react-icons/bs"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { memo } from "react"

// Memoize the nav sections to prevent unnecessary recreations
const navSections = [
  {
    heading: null,
    items: [
      { label: "Dashboard", icon: <FaTachometerAlt />, href: "/dashboard" },
      { label: "Settings", icon: <FaCog />, href: "/dashboard/settings" },
      { label: "Analytics", icon: <FaChartBar />, href: "/dashboard/analytics" },
    ],
  },
  {
    heading: "Content Creation",
    items: [
      { label: "Post Generator", icon: <FaFileAlt />, href: "/dashboard/post-generator" },
      { label: "Carousel Maker", icon: <MdOutlineViewCarousel />, href: "/dashboard/carousel-maker" },
      { label: "Voice Notes", icon: <BsSoundwave />, href: "/dashboard/voice-notes" },
    ],
  },
  {
    heading: "Engagement",
    items: [{ label: "Engage", icon: <FaUserFriends />, href: "/dashboard/engage" }],
  },
  {
    heading: "Drafts & Scheduling",
    items: [
      { label: "Drafts", icon: <FaFileAlt />, href: "/dashboard/drafts" },
      { label: "Calendar", icon: <FaCalendarAlt />, href: "/dashboard/calendar" },
    ],
  },
  {
    heading: "Content Inspiration",
    items: [
      { label: "Viral Posts", icon: <FaLightbulb />, href: "/dashboard/viral-posts" },
      { label: "Influencers", icon: <FaUserFriends />, href: "/dashboard/influencers" },
      { label: "Swipe Files", icon: <FaFolderOpen />, href: "/dashboard/swipe-files" },
    ],
  },
  {
    heading: "Automation",
    items: [{ label: "Auto-pilot Posts Generator", icon: <FaRobot />, href: "/dashboard/auto-pilot-posts-generator" }],
  },
]

// Memoize the NavItem component
const NavItem = memo(({ item, isActive }: { item: any; isActive: boolean }) => (
  <Link
    href={item.href}
    className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
      isActive
        ? "bg-blue-600/20 text-blue-400"
        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
    }`}
  >
    <span className="text-lg">{item.icon}</span>
    <span className="text-sm font-medium">{item.label}</span>
  </Link>
))

NavItem.displayName = "NavItem"

// Memoize the NavSection component
const NavSection = memo(({ section, pathname }: { section: any; pathname: string }) => (
  <div className="space-y-1">
    {section.heading && (
      <h3 className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {section.heading}
      </h3>
    )}
    <div className="space-y-1">
      {section.items.map((item: any) => (
        <NavItem key={item.href} item={item} isActive={pathname === item.href} />
      ))}
    </div>
  </div>
))

NavSection.displayName = "NavSection"

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-[#16213e] border-r border-slate-800/50 hidden md:block">
      <div className="flex flex-col h-full">
        <div className="p-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white">LinkZup</span>
          </Link>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
          {navSections.map((section, index) => (
            <NavSection key={index} section={section} pathname={pathname} />
          ))}
        </nav>
      </div>
    </aside>
  )
}
