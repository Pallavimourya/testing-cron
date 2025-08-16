"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
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
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadDashboardStats = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/dashboard-stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
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
      await loadDashboardStats()
      toast.success("Dashboard refreshed")
    } catch (error) {
      toast.error("Failed to refresh dashboard")
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadDashboardStats();
    // Note: Removed blocked status check for regular users
    // Admin users can check blocked status through admin panel
  }, [session]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading dashboard...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
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

  // Prepare chart data
  const contentStatusData = [
    { name: "Generated", value: stats.contentByStatus.generated, color: "#3B82F6" },
    { name: "Approved", value: stats.contentByStatus.approved, color: "#10B981" },
    { name: "Posted", value: stats.contentByStatus.posted, color: "#8B5CF6" },
    { name: "Failed", value: stats.contentByStatus.failed, color: "#EF4444" },
  ]

  const weeklyData = [
    { name: "Mon", content: Math.floor(Math.random() * 10) + 1 },
    { name: "Tue", content: Math.floor(Math.random() * 10) + 1 },
    { name: "Wed", content: Math.floor(Math.random() * 10) + 1 },
    { name: "Thu", content: Math.floor(Math.random() * 10) + 1 },
    { name: "Fri", content: Math.floor(Math.random() * 10) + 1 },
    { name: "Sat", content: Math.floor(Math.random() * 10) + 1 },
    { name: "Sun", content: Math.floor(Math.random() * 10) + 1 },
  ]

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
              <p className="text-gray-600 text-sm sm:text-base lg:text-lg">
                Welcome back! Here&apos;s your content overview.
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                onClick={handleRefresh}
                variant="outline"
                className="flex items-center gap-2 bg-transparent flex-1 sm:flex-none"
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Link href="/dashboard/topic-bank" className="flex-1 sm:flex-none">
                <Button className="flex items-center gap-2 w-full">
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Generate Content</span>
                  <span className="sm:hidden">Generate</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Total Topics</CardTitle>
              <Target className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{stats.totalTopics}</div>
              <p className="text-xs text-gray-500 mt-1">
                {stats.approvedTopics} approved, {stats.pendingTopics} pending
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Total Content</CardTitle>
              <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{stats.totalContent}</div>
              <p className="text-xs text-gray-500 mt-1">
                {stats.postedContent} posted, {stats.generatedContent} generated
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Monthly Usage</CardTitle>
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                {stats.monthlyContent}/{stats.monthlyLimit}
              </div>
              <Progress value={stats.monthlyProgress} className="mt-2" />
              <p className="text-xs text-gray-500 mt-1">{stats.remainingContent} remaining</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Engagement Rate</CardTitle>
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{stats.engagementRate}%</div>
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

        {/* Charts and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <PieChartIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                Content by Status
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Distribution of your content across different statuses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-48 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={contentStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {contentStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2 sm:gap-4 mt-4">
                {contentStatusData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-xs sm:text-sm text-gray-600">
                      {item.name}: {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                Weekly Activity
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Content generation activity over the past week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-48 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="content" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                Recent Topics
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Your latest topic activities</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.recentActivity.topics.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {stats.recentActivity.topics.map((topic, index) => (
                    <div key={index} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate text-xs sm:text-sm">{topic.title}</h4>
                        <p className="text-xs text-gray-500">{formatDate(topic.createdAt)}</p>
                      </div>
                      <Badge className={`${getStatusColor(topic.status)} text-xs ml-2`}>{topic.status}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8">
                  <Target className="h-8 w-8 sm:h-12 sm:w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No recent topics</p>
                  <Link href="/dashboard/topic-bank">
                    <Button size="sm" className="mt-2">
                      Create Topics
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                Recent Content
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Your latest generated content</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.recentActivity.content.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {stats.recentActivity.content.map((content, index) => (
                    <div key={index} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate text-xs sm:text-sm">{content.topicTitle}</h4>
                        <p className="text-xs text-gray-500">{formatDate(content.createdAt)}</p>
                      </div>
                      <Badge className={`${getStatusColor(content.status)} text-xs ml-2`}>{content.status}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8">
                  <FileText className="h-8 w-8 sm:h-12 sm:w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No recent content</p>
                  <Link href="/dashboard/approved-content">
                    <Button size="sm" className="mt-2">
                      View Content
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 sm:mt-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-sm sm:text-base">Quick Actions</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Get started with these common tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <Link href="/dashboard/topic-bank">
                  <Button variant="outline" className="w-full h-16 sm:h-20 flex flex-col gap-2 bg-transparent">
                    <Target className="h-5 w-5 sm:h-6 sm:w-6" />
                    <span className="text-xs sm:text-sm">Generate Topics</span>
                  </Button>
                </Link>
                <Link href="/dashboard/approved-content">
                  <Button variant="outline" className="w-full h-16 sm:h-20 flex flex-col gap-2 bg-transparent">
                    <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
                    <span className="text-xs sm:text-sm">View Content</span>
                  </Button>
                </Link>
                <Link href="/dashboard/ai-story">
                  <Button variant="outline" className="w-full h-16 sm:h-20 flex flex-col gap-2 bg-transparent">
                    <Zap className="h-5 w-5 sm:h-6 sm:w-6" />
                    <span className="text-xs sm:text-sm">AI Story Builder</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
