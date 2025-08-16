"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Linkedin,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Calendar,
  TrendingUp,
  Loader2,
  Heart,
  MessageCircle,
  Share2,
  Eye,
  BarChart3,
  Users,
  Activity,
  LinkIcon,
  Zap,
  Target,
  Award,
  Globe,
  ArrowUp,
  ArrowDown,
  Minus,
  Copy,
  Download,
  Filter,
  Search,
} from "lucide-react"
import { toast } from "sonner"
import { useNotificationService } from "@/lib/notification-service"
import { LinkedInRateLimitTracker } from "@/lib/linkedin-rate-limit-tracker"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface LinkedInStatus {
  isConnected: boolean
  linkedinName?: string
  linkedinEmail?: string
  linkedinProfileUrl?: string
  profilePicture?: string
  connectedAt?: string
  lastSync?: string
  serviceStatus?: "online" | "offline" | "unknown"
  linkedinId?: string
  tokenExpired?: boolean
  connectionsCount?: number
  postsCount?: number
  followersCount?: number
  profileViews?: number
}

interface LinkedInPost {
  id: string
  text: string
  createdAt: string
  likes: number
  comments: number
  shares: number
  impressions: number
  clicks: number
  url: string
  status: "posted" | "failed" | "pending"
  contentId?: string
  imageUrl?: string
  engagementRate: number
  reach: number
  type: "text" | "image" | "video" | "article"
}

interface LinkedInAnalytics {
  totalPosts: number
  totalLikes: number
  totalComments: number
  totalShares: number
  totalImpressions: number
  totalClicks: number
  averageEngagement: number
  topPost: LinkedInPost | null
  recentPosts: LinkedInPost[]
  monthlyStats: {
    posts: number
    engagement: number
    reach: number
    growth: number
  }
  weeklyStats: {
    posts: number
    engagement: number
    reach: number
  }
  performanceMetrics: {
    bestPerformingDay: string
    bestPerformingTime: string
    averagePostsPerWeek: number
    engagementTrend: "up" | "down" | "stable"
  }
}

export default function LinkedInDashboard() {
  const [status, setStatus] = useState<LinkedInStatus>({ isConnected: false })
  const [analytics, setAnalytics] = useState<LinkedInAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const notificationService = useNotificationService()
  const [filterStatus, setFilterStatus] = useState("all")
  const [rateLimitMessage, setRateLimitMessage] = useState("")
  const [sortBy, setSortBy] = useState("date")

  // Check LinkedIn connection status
  const checkLinkedInStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/linkedin/status")

      if (response.ok) {
        const data = await response.json()
        setStatus(data)

        if (data.tokenExpired) {
          toast.error("LinkedIn token expired. Please reconnect your account.")
        } else if (data.isConnected && data.serviceStatus === "offline") {
          toast.warning("LinkedIn services are currently unavailable.")
        }
      } else {
        const errorData = await response.json()
        console.error("Failed to check LinkedIn status:", errorData)
        setStatus({ isConnected: false, serviceStatus: "unknown" })
      }
    } catch (error) {
      console.error("Error checking LinkedIn status:", error)
      setStatus({ isConnected: false, serviceStatus: "offline" })
      toast.error("Unable to check LinkedIn connection status")
    } finally {
      setLoading(false)
    }
  }

  // Fetch LinkedIn analytics
  const fetchLinkedInAnalytics = async () => {
    try {
      const response = await fetch("/api/linkedin/analytics")
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data.analytics)
      } else {
        console.error("Failed to fetch LinkedIn analytics")
      }
    } catch (error) {
      console.error("Error fetching LinkedIn analytics:", error)
    }
  }

  // Connect LinkedIn account
  const connectLinkedIn = async () => {
    try {
      setConnecting(true)
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
      toast.error("Failed to connect LinkedIn account. Please try again later.")
    } finally {
      setConnecting(false)
    }
  }

  // Disconnect LinkedIn account
  const disconnectLinkedIn = async () => {
    try {
      setDisconnecting(true)
      const response = await fetch("/api/linkedin/disconnect", { method: "POST" })

      if (response.ok) {
        setStatus({ isConnected: false })
        setAnalytics(null)
        toast.success("LinkedIn account disconnected successfully")
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Failed to disconnect LinkedIn account")
      }
    } catch (error) {
      console.error("Error disconnecting LinkedIn:", error)
      toast.error("Failed to disconnect LinkedIn account")
    } finally {
      setDisconnecting(false)
    }
  }

  // Sync LinkedIn data
  const syncLinkedInData = async () => {
    try {
      setSyncing(true)
      const response = await fetch("/api/linkedin/sync", { method: "POST" })

      if (response.ok) {
        toast.success("LinkedIn data synced successfully")
        await checkLinkedInStatus()
        await fetchLinkedInAnalytics()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Failed to sync LinkedIn data")
      }
    } catch (error) {
      console.error("Error syncing LinkedIn data:", error)
      toast.error("Failed to sync LinkedIn data")
    } finally {
      setSyncing(false)
    }
  }

  // Copy post URL
  const copyPostUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    toast.success("Post URL copied to clipboard!")
  }

  // Export analytics
  const exportAnalytics = () => {
    if (!analytics) return

    const data = {
      exportDate: new Date().toISOString(),
      totalPosts: analytics.totalPosts,
      totalEngagement: analytics.totalLikes + analytics.totalComments + analytics.totalShares,
      averageEngagement: analytics.averageEngagement,
      posts: analytics.recentPosts,
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `linkedin-analytics-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Analytics exported successfully!")
  }

  // Filter and sort posts
  const filteredPosts =
    analytics?.recentPosts
      .filter((post) => {
        const matchesSearch = post.text.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesFilter = filterStatus === "all" || post.status === filterStatus
        return matchesSearch && matchesFilter
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "engagement":
            return b.likes + b.comments + b.shares - (a.likes + a.comments + a.shares)
          case "likes":
            return b.likes - a.likes
          case "date":
          default:
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        }
      }) || []

  // Check for connection success from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const linkedinParam = urlParams.get("linkedin")
    const errorParam = urlParams.get("error")

    if (linkedinParam === "connected") {
      toast.success("LinkedIn account connected successfully!")
      window.history.replaceState({}, document.title, window.location.pathname)
      localStorage.removeItem("linkedin_connecting")
    } else if (errorParam) {
      const errorMessages: { [key: string]: string } = {
        linkedin_auth_failed: "LinkedIn authorization failed",
        missing_params: "Missing authorization parameters",
        invalid_state: "Invalid authorization state",
        token_exchange_failed: "Failed to exchange authorization code",
        profile_fetch_failed: "Failed to fetch LinkedIn profile",
        rate_limit_exceeded: "LinkedIn API rate limit exceeded. Please try again later.",
        unauthorized: "LinkedIn API access denied. Please check your permissions.",
        callback_failed: "LinkedIn callback failed",
      }
      
      // Use notification service for better error handling
      if (errorParam === "rate_limit_exceeded") {
        notificationService.linkedinRateLimitExceeded()
        LinkedInRateLimitTracker.trackRateLimitHit()
      } else {
        toast.error(errorMessages[errorParam] || "LinkedIn connection failed")
      }
      
      window.history.replaceState({}, document.title, window.location.pathname)
      localStorage.removeItem("linkedin_connecting")
    }
  }, [])

  // Load data on component mount
  useEffect(() => {
    checkLinkedInStatus()
    
    // Check rate limit status
    if (LinkedInRateLimitTracker.shouldShowWarning()) {
      setRateLimitMessage(LinkedInRateLimitTracker.getRateLimitMessage())
    }
  }, [])

  // Load analytics when connected
  useEffect(() => {
    if (status.isConnected && !status.tokenExpired) {
      fetchLinkedInAnalytics()
    }
  }, [status.isConnected, status.tokenExpired])

  // Update rate limit message every minute
  useEffect(() => {
    const interval = setInterval(() => {
      if (LinkedInRateLimitTracker.shouldShowWarning()) {
        setRateLimitMessage(LinkedInRateLimitTracker.getRateLimitMessage())
      } else {
        setRateLimitMessage("")
      }
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M"
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K"
    }
    return num.toString()
  }

  const getEngagementColor = (rate: number) => {
    if (rate >= 5) return "text-green-600"
    if (rate >= 2) return "text-yellow-600"
    return "text-red-600"
  }

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return <ArrowUp className="h-4 w-4 text-green-600" />
      case "down":
        return <ArrowDown className="h-4 w-4 text-red-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading LinkedIn Dashboard</h3>
              <p className="text-gray-600">Fetching your LinkedIn data and analytics...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Rate Limit Warning */}
        {rateLimitMessage && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">LinkedIn API Rate Limit</h3>
                <p className="text-sm text-yellow-700 mt-1">{rateLimitMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Linkedin className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">LinkedIn Dashboard</h1>
                <p className="text-gray-600 text-lg">Manage your LinkedIn presence and track performance</p>
              </div>
            </div>

            {status.isConnected && (
              <div className="flex gap-3">
                <Button
                  onClick={exportAnalytics}
                  variant="outline"
                  className="flex items-center gap-2 bg-white hover:bg-gray-50"
                >
                  <Download className="w-4 h-4" />
                  Export Data
                </Button>
                <Button
                  onClick={syncLinkedInData}
                  variant="outline"
                  className="flex items-center gap-2 bg-white hover:bg-gray-50"
                  disabled={syncing}
                >
                  <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
                  {syncing ? "Syncing..." : "Sync Data"}
                </Button>
              </div>
            )}
          </div>
        </div>

        {!status.isConnected ? (
          /* Not Connected State */
          <div className="max-w-4xl mx-auto">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="text-center pb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Linkedin className="h-12 w-12 text-blue-600" />
                </div>
                <CardTitle className="text-3xl mb-4">Connect Your LinkedIn Account</CardTitle>
                <CardDescription className="text-lg max-w-2xl mx-auto">
                  Unlock the power of automated LinkedIn posting and comprehensive analytics. Connect your account to
                  start tracking your professional content performance.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Benefits Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl text-center border border-blue-100">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Zap className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Auto-Post</h3>
                    <p className="text-sm text-gray-600">Automatically publish your approved content to LinkedIn</p>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl text-center border border-green-100">
                    <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <BarChart3 className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Analytics</h3>
                    <p className="text-sm text-gray-600">Track likes, comments, shares, and impressions</p>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl text-center border border-purple-100">
                    <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Insights</h3>
                    <p className="text-sm text-gray-600">Get detailed performance insights and trends</p>
                  </div>
                </div>

                {/* Service Status */}
                {status.serviceStatus === "offline" && (
                  <div className="p-6 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex items-center justify-center mb-2">
                      <AlertCircle className="h-6 w-6 text-red-600 mr-3" />
                      <span className="text-red-700 font-semibold text-lg">LinkedIn Services Unavailable</span>
                    </div>
                    <p className="text-red-600 text-center">
                      LinkedIn is experiencing service issues. Please try again later.
                    </p>
                  </div>
                )}

                {/* Connect Button */}
                <div className="text-center">
                  <Button
                    onClick={connectLinkedIn}
                    disabled={connecting || status.serviceStatus === "offline"}
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-12 py-4 text-lg h-auto"
                  >
                    {connecting ? (
                      <>
                        <Loader2 className="h-6 w-6 mr-3 animate-spin" />
                        Connecting to LinkedIn...
                      </>
                    ) : status.serviceStatus === "offline" ? (
                      <>
                        <AlertCircle className="h-6 w-6 mr-3" />
                        LinkedIn Services Down
                      </>
                    ) : (
                      <>
                        <Linkedin className="h-6 w-6 mr-3" />
                        Connect LinkedIn Account
                      </>
                    )}
                  </Button>
                </div>

                {/* Security Note */}
                <div className="text-center">
                  <p className="text-sm text-gray-500 max-w-2xl mx-auto">
                    🔒 Your data is secure. We only access the data you authorize and never store your LinkedIn
                    password. You can disconnect at any time.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Connected State */
          <div className="space-y-8">
            {/* Profile Overview Card */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-8">
                <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6">
                  <div className="flex items-center gap-6">
                    <Avatar className="w-20 h-20 ring-4 ring-blue-100">
                      <AvatarImage src={status.profilePicture || "/placeholder.svg"} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-2xl font-bold">
                        {status.linkedinName?.charAt(0) || "L"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-2xl font-bold text-gray-900">{status.linkedinName || "LinkedIn User"}</h2>
                        <Badge className="bg-green-100 text-green-700 border-green-200">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Connected
                        </Badge>
                        {status.tokenExpired && (
                          <Badge variant="destructive">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Token Expired
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-600 mb-2">{status.linkedinEmail}</p>
                      {status.linkedinProfileUrl && (
                        <a
                          href={status.linkedinProfileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm font-medium"
                        >
                          View LinkedIn Profile <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 lg:ml-8">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
                        <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-gray-900">
                          {formatNumber(status.connectionsCount || 0)}
                        </div>
                        <div className="text-sm text-gray-600">Connections</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                        <Activity className="h-6 w-6 text-green-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-gray-900">{analytics?.totalPosts || 0}</div>
                        <div className="text-sm text-gray-600">Posts</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                        <Users className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-gray-900">
                          {formatNumber(status.followersCount || 0)}
                        </div>
                        <div className="text-sm text-gray-600">Followers</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg">
                        <Eye className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-gray-900">{formatNumber(status.profileViews || 0)}</div>
                        <div className="text-sm text-gray-600">Profile Views</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      onClick={disconnectLinkedIn}
                      disabled={disconnecting}
                      className="border-red-200 text-red-600 hover:bg-red-50 bg-transparent"
                    >
                      {disconnecting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Disconnecting...
                        </>
                      ) : (
                        "Disconnect"
                      )}
                    </Button>
                    <div className="text-xs text-gray-500 text-center">
                      Connected {status.connectedAt ? formatDate(status.connectedAt) : "Recently"}
                    </div>
                  </div>
                </div>

                {/* Token Expired Warning */}
                {status.tokenExpired && (
                  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
                      <div>
                        <span className="text-sm font-medium text-red-800">Access Token Expired</span>
                        <p className="text-sm text-red-700 mt-1">
                          Your LinkedIn access token has expired. Please reconnect your account to continue posting and
                          fetching analytics.
                        </p>
                      </div>
                      <Button onClick={connectLinkedIn} size="sm" className="ml-auto bg-red-600 hover:bg-red-700">
                        Reconnect
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Analytics Dashboard */}
            {analytics && (
              <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
                  <TabsTrigger value="overview" className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="posts" className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Posts
                  </TabsTrigger>
                  <TabsTrigger value="insights" className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Insights
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-blue-700">Total Posts</CardTitle>
                        <Activity className="h-5 w-5 text-blue-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-blue-900">{analytics.totalPosts}</div>
                        <p className="text-xs text-blue-600 mt-1">Published via LinkZup</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-red-700">Total Likes</CardTitle>
                        <Heart className="h-5 w-5 text-red-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-red-900">{formatNumber(analytics.totalLikes)}</div>
                        <p className="text-xs text-red-600 mt-1">Across all posts</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-green-700">Total Comments</CardTitle>
                        <MessageCircle className="h-5 w-5 text-green-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-green-900">{formatNumber(analytics.totalComments)}</div>
                        <p className="text-xs text-green-600 mt-1">Engagement conversations</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-purple-700">Avg. Engagement</CardTitle>
                        <TrendingUp className="h-5 w-5 text-purple-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-purple-900">
                          {analytics.averageEngagement.toFixed(1)}%
                        </div>
                        <p className="text-xs text-purple-600 mt-1">Engagement rate</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Additional Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Share2 className="h-5 w-5 text-blue-600" />
                          Total Shares
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-gray-900">{formatNumber(analytics.totalShares)}</div>
                        <p className="text-sm text-gray-600 mt-1">Content amplification</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Eye className="h-5 w-5 text-gray-600" />
                          Total Impressions
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-gray-900">
                          {formatNumber(analytics.totalImpressions)}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">Total reach</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="h-5 w-5 text-orange-600" />
                          Total Clicks
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-gray-900">{formatNumber(analytics.totalClicks)}</div>
                        <p className="text-sm text-gray-600 mt-1">Link clicks</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Top Performing Post */}
                  {analytics.topPost && (
                    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Award className="h-5 w-5 text-yellow-600" />
                          Top Performing Post
                        </CardTitle>
                        <CardDescription>Your best performing content</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
                            <p className="text-gray-900 mb-4 text-lg leading-relaxed">{analytics.topPost.text}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-6">
                                <div className="flex items-center gap-2 text-red-600">
                                  <Heart className="h-5 w-5" />
                                  <span className="font-semibold">{formatNumber(analytics.topPost.likes)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-green-600">
                                  <MessageCircle className="h-5 w-5" />
                                  <span className="font-semibold">{formatNumber(analytics.topPost.comments)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-blue-600">
                                  <Share2 className="h-5 w-5" />
                                  <span className="font-semibold">{formatNumber(analytics.topPost.shares)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Eye className="h-5 w-5" />
                                  <span className="font-semibold">{formatNumber(analytics.topPost.impressions)}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => copyPostUrl(analytics.topPost!.url)}>
                                  <Copy className="h-4 w-4 mr-1" />
                                  Copy
                                </Button>
                                <a
                                  href={analytics.topPost.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                                >
                                  View Post <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="posts" className="space-y-6">
                  {/* Posts Filter and Search */}
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-blue-600" />
                        All Posts ({analytics.totalPosts})
                      </CardTitle>
                      <CardDescription>Manage and analyze your LinkedIn posts</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <div className="flex-1">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                              placeholder="Search posts..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="pl-10"
                            />
                          </div>
                        </div>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                          <SelectTrigger className="w-full sm:w-[180px]">
                            <Filter className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Filter by status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Posts</SelectItem>
                            <SelectItem value="posted">Posted</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={sortBy} onValueChange={setSortBy}>
                          <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Sort by" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="date">Date</SelectItem>
                            <SelectItem value="engagement">Engagement</SelectItem>
                            <SelectItem value="likes">Likes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Posts List */}
                      {filteredPosts.length > 0 ? (
                        <div className="space-y-4">
                          {filteredPosts.map((post, index) => (
                            <div
                              key={post.id}
                              className="p-6 border border-gray-200 rounded-xl hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex-1 pr-4">
                                  <p className="text-gray-900 text-lg leading-relaxed mb-3">{post.text}</p>
                                  {post.imageUrl && (
                                    <div className="mb-3">
                                      <img
                                        src={post.imageUrl || "/placeholder.svg"}
                                        alt="Post image"
                                        className="rounded-lg max-w-sm h-auto"
                                      />
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant={
                                      post.status === "posted"
                                        ? "default"
                                        : post.status === "failed"
                                          ? "destructive"
                                          : "secondary"
                                    }
                                    className="capitalize"
                                  >
                                    {post.status}
                                  </Badge>
                                  <Badge variant="outline" className="capitalize">
                                    {post.type}
                                  </Badge>
                                </div>
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-6">
                                  <div className="flex items-center gap-2 text-red-600">
                                    <Heart className="h-4 w-4" />
                                    <span className="font-medium">{formatNumber(post.likes)}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-green-600">
                                    <MessageCircle className="h-4 w-4" />
                                    <span className="font-medium">{formatNumber(post.comments)}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-blue-600">
                                    <Share2 className="h-4 w-4" />
                                    <span className="font-medium">{formatNumber(post.shares)}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <Eye className="h-4 w-4" />
                                    <span className="font-medium">{formatNumber(post.impressions)}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-purple-600">
                                    <Target className="h-4 w-4" />
                                    <span className="font-medium">{formatNumber(post.clicks)}</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                  <div className={`flex items-center gap-1 ${getEngagementColor(post.engagementRate)}`}>
                                    <TrendingUp className="h-3 w-3" />
                                    {post.engagementRate.toFixed(1)}%
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {formatDate(post.createdAt)}
                                  </div>
                                  <Button variant="ghost" size="sm" onClick={() => copyPostUrl(post.url)}>
                                    <Copy className="h-3 w-3 mr-1" />
                                    Copy
                                  </Button>
                                  <a
                                    href={post.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                  >
                                    <LinkIcon className="h-3 w-3" />
                                  </a>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <Activity className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts found</h3>
                          <p className="text-gray-500 mb-4">
                            {searchTerm || filterStatus !== "all"
                              ? "Try adjusting your search or filter criteria"
                              : "Posts published through LinkZup will appear here"}
                          </p>
                          <Link href="/dashboard/approved-content">
                            <Button>View Approved Content</Button>
                          </Link>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="insights" className="space-y-6">
                  {/* Performance Insights */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-green-600" />
                          Performance Trends
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="text-sm text-gray-600">Engagement Trend</p>
                            <p className="font-semibold text-gray-900">
                              {analytics.performanceMetrics.engagementTrend === "up"
                                ? "Increasing"
                                : analytics.performanceMetrics.engagementTrend === "down"
                                  ? "Decreasing"
                                  : "Stable"}
                            </p>
                          </div>
                          {getTrendIcon(analytics.performanceMetrics.engagementTrend)}
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Best Performing Day</p>
                          <p className="font-semibold text-gray-900">
                            {analytics.performanceMetrics.bestPerformingDay}
                          </p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Best Posting Time</p>
                          <p className="font-semibold text-gray-900">
                            {analytics.performanceMetrics.bestPerformingTime}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5 text-blue-600" />
                          Monthly Overview
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600">Posts This Month</span>
                              <span className="font-medium">{analytics.monthlyStats.posts}</span>
                            </div>
                            <Progress
                              value={(analytics.monthlyStats.posts / analytics.totalPosts) * 100}
                              className="h-2"
                            />
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600">Monthly Engagement</span>
                              <span className="font-medium">{formatNumber(analytics.monthlyStats.engagement)}</span>
                            </div>
                            <Progress value={75} className="h-2" />
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600">Monthly Reach</span>
                              <span className="font-medium">{formatNumber(analytics.monthlyStats.reach)}</span>
                            </div>
                            <Progress value={60} className="h-2" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Additional Insights */}
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5 text-purple-600" />
                        Content Insights
                      </CardTitle>
                      <CardDescription>Understand what works best for your audience</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                          <div className="text-2xl font-bold text-blue-900 mb-2">
                            {analytics.performanceMetrics.averagePostsPerWeek.toFixed(1)}
                          </div>
                          <div className="text-sm text-blue-700">Average Posts/Week</div>
                        </div>
                        <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                          <div className="text-2xl font-bold text-green-900 mb-2">
                            {(
                              ((analytics.totalLikes + analytics.totalComments + analytics.totalShares) /
                                analytics.totalImpressions) *
                              100
                            ).toFixed(1)}
                            %
                          </div>
                          <div className="text-sm text-green-700">Overall Engagement Rate</div>
                        </div>
                        <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
                          <div className="text-2xl font-bold text-purple-900 mb-2">
                            {((analytics.totalClicks / analytics.totalImpressions) * 100).toFixed(1)}%
                          </div>
                          <div className="text-sm text-purple-700">Click-Through Rate</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
