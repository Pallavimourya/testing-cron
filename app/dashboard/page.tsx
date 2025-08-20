"use client"

import { useState, useEffect, Suspense, lazy } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  FileText,
  TrendingUp,
  Calendar,
  Target,
  Activity,
  Zap,
  BarChart3,
  PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  RefreshCw,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { PerformanceMonitor } from "@/components/performance-monitor"

// Lazy load heavy chart components
const DashboardCharts = lazy(() => import('./DashboardCharts'))
const DashboardActivity = lazy(() => import('./DashboardActivity'))

interface DashboardStats {
  totalTopics: number
  approvedTopics: number
  pendingTopics: number
  totalContent: number
  generatedContent: number
  approvedContent: number
  postedContent: number
  monthlyContent: number
  monthlyLimit: number
  remainingContent: number
  engagementRate: number
  weeklyGrowth: number
  recentActivity: {
    topics: Array<{
      title: string
      status: string
      createdAt: string
    }>
    content: Array<{
      topicTitle: string
      status: string
      createdAt: string
    }>
  }
  contentByStatus: {
    generated: number
    approved: number
    posted: number
    failed: number
  }
  monthlyProgress: number
  weeklyData?: Array<{
    name: string
    content: number
  }>
}

// Skeleton loading component
const DashboardSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      {/* Header skeleton */}
      <div className="mb-6 lg:mb-8">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6 lg:mb-8">
        {[1, 2].map((i) => (
          <Card key={i} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-64 lg:h-80 bg-gray-200 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </div>
)

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showCharts, setShowCharts] = useState(false)

  const loadDashboardStats = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/dashboard-stats?minimal=true")
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
        // Load charts after initial data is loaded
        setTimeout(() => setShowCharts(true), 100)
      } else {
        toast.error("Failed to load dashboard stats")
      }
    } catch (error) {
      console.error("Error loading dashboard stats:", error)
      toast.error("Failed to load dashboard stats")
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      // Clear cache and reload
      await fetch('/api/dashboard-stats', { method: 'POST' })
      await loadDashboardStats()
      toast.success("Dashboard refreshed")
    } catch (error) {
      toast.error("Failed to refresh dashboard")
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadDashboardStats()
  }, [session])

  if (loading) {
    return <DashboardSkeleton />
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Data Available</h3>
            <p className="text-gray-500">Unable to load dashboard statistics.</p>
            <Button onClick={loadDashboardStats} className="mt-4">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusColor = (status: string) => {
    const colors = {
      generated: "bg-blue-100 text-blue-800",
      approved: "bg-green-100 text-green-800",
      posted: "bg-purple-100 text-purple-800",
      pending: "bg-yellow-100 text-yellow-800",
      failed: "bg-red-100 text-red-800",
    }
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  return (
    <>
      <PerformanceMonitor componentName="Dashboard" />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col space-y-4 lg:flex-row lg:justify-between lg:items-center lg:space-y-0">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600">
                Welcome back! Here&apos;s your personal content overview.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button
                onClick={handleRefresh}
                variant="outline"
                className="flex items-center justify-center gap-2 bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-gray-50 flex-1 sm:flex-none"
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </Button>
              <Link href="/dashboard/topic-bank" className="flex-1 sm:flex-none">
                <Button className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4" />
                  <span>Generate Content</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards - Load immediately */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Topics</CardTitle>
              <Target className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.totalTopics}</div>
              <p className="text-xs text-gray-500 mt-1">
                {stats.approvedTopics} approved, {stats.pendingTopics} pending
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Content</CardTitle>
              <FileText className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.totalContent}</div>
              <p className="text-xs text-gray-500 mt-1">
                {stats.postedContent} posted, {stats.generatedContent} generated
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Monthly Usage</CardTitle>
              <Calendar className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats.monthlyContent}/{stats.monthlyLimit}
              </div>
              <Progress value={stats.monthlyProgress} className="mt-2" />
              <p className="text-xs text-gray-500 mt-1">{stats.remainingContent} remaining</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Engagement Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.engagementRate}%</div>
              <div className="flex items-center text-xs text-gray-500 mt-1">
                {stats.weeklyGrowth >= 0 ? (
                  <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                )}
                {Math.abs(stats.weeklyGrowth)}% from last week
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts - Lazy loaded */}
        {showCharts && (
          <Suspense fallback={
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6 lg:mb-8">
              {[1, 2].map((i) => (
                <Card key={i} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 lg:h-80 bg-gray-200 rounded animate-pulse"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          }>
            <DashboardCharts stats={stats} />
          </Suspense>
        )}

        {/* Activity Sections - Lazy loaded */}
        {showCharts && (
          <Suspense fallback={
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6 lg:mb-8">
              {[1, 2].map((i) => (
                <Card key={i} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[1, 2, 3].map((j) => (
                        <div key={j} className="h-12 bg-gray-200 rounded animate-pulse"></div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          }>
            <DashboardActivity stats={stats} formatDate={formatDate} getStatusColor={getStatusColor} />
          </Suspense>
        )}

        {/* Quick Actions - Load immediately */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-base lg:text-lg">Quick Actions</CardTitle>
            <CardDescription className="text-sm">Get started with these common tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link href="/dashboard/topic-bank">
                <Button
                  variant="outline"
                  className="w-full h-20 flex flex-col gap-2 bg-white/50 hover:bg-gray-50 border-gray-200"
                >
                  <Target className="h-6 w-6" />
                  <span className="text-sm font-medium">Generate Topics</span>
                </Button>
              </Link>
              <Link href="/dashboard/approved-content">
                <Button
                  variant="outline"
                  className="w-full h-20 flex flex-col gap-2 bg-white/50 hover:bg-gray-50 border-gray-200"
                >
                  <FileText className="h-6 w-6" />
                  <span className="text-sm font-medium">View Content</span>
                </Button>
              </Link>
              <Link href="/dashboard/ai-story" className="sm:col-span-2 lg:col-span-1">
                <Button
                  variant="outline"
                  className="w-full h-20 flex flex-col gap-2 bg-white/50 hover:bg-gray-50 border-gray-200"
                >
                  <Zap className="h-6 w-6" />
                  <span className="text-sm font-medium">AI Story Builder</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  )
}
