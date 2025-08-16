"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, Clock, Edit, Trash2, CheckCircle, Zap, Settings, Activity, Plus, Eye, ExternalLink, CalendarDays } from 'lucide-react'
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

interface ApprovedPost {
  _id: string
  id: string
  topicTitle: string
  content: string
  hashtags: string[]
  status: "approved" | "scheduled" | "posted"
  scheduledFor?: string
  postedAt?: string
  platform: string
  contentType: string
  linkedinUrl?: string
  imageUrl?: string
}

interface ScheduledPost {
  _id: string
  id: string
  topicTitle: string
  content: string
  platform: string
  scheduledFor: string
  status: string
  contentType: string
  postedAt?: string
  linkedinUrl?: string
  imageUrl?: string
}

interface CronStatus {
  stats: {
    totalScheduled: number
    dueNow: number
    futureScheduled: number
    totalPosted: number
    totalApproved: number
  }
  nextScheduledPosts: Array<{
    id: string
    topic: string
    scheduledFor: string
    timeUntilPost: number
  }>
  cronJobInfo: {
    frequency: string
    nextRun: string
    status: string
  }
}

const SCHEDULE_OPTIONS = [
  {
    label: "Every 15 Minutes",
    value: "15min",
    description: "Posts will be scheduled every 15 minutes starting from selected time",
    icon: "⚡",
  },
  {
    label: "Every 30 Minutes",
    value: "30min",
    description: "Posts will be scheduled every 30 minutes starting from selected time",
    icon: "🔄",
  },
  {
    label: "Every Hour",
    value: "hourly",
    description: "Posts will be scheduled every hour starting from selected time",
    icon: "⏰",
  },
  {
    label: "Twice a Day",
    value: "twice-daily",
    description: "Posts will be scheduled twice daily (morning & evening)",
    icon: "🌅",
  },
  {
    label: "Once a Day",
    value: "daily",
    description: "Posts will be scheduled daily at selected time",
    icon: "📅",
  },
  {
    label: "Every 3 Days",
    value: "3days",
    description: "Posts will be scheduled every 3 days",
    icon: "📆",
  },
  {
    label: "Once a Week",
    value: "weekly",
    description: "Posts will be scheduled weekly on the same day",
    icon: "📊",
  },
]

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [approvedPosts, setApprovedPosts] = useState<ApprovedPost[]>([])
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([])
  const [postedPosts, setPostedPosts] = useState<ScheduledPost[]>([])
  const [cronStatus, setCronStatus] = useState<CronStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [testLoading, setTestLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("calendar")
  const [currentTime, setCurrentTime] = useState(new Date())

  // Modal states
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [showIndividualScheduleModal, setShowIndividualScheduleModal] = useState(false)

  // Selected items
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null)
  const [selectedApprovedPost, setSelectedApprovedPost] = useState<ApprovedPost | null>(null)

  // Form states
  const [editDate, setEditDate] = useState<Date | null>(null)
  const [editTime, setEditTime] = useState<string>("10:00")
  const [scheduleOption, setScheduleOption] = useState<string>("")
  const [customStartDate, setCustomStartDate] = useState<Date>(new Date())
  const [customStartTime, setCustomStartTime] = useState<string>("10:00")
  const [individualScheduleDate, setIndividualScheduleDate] = useState<Date>(new Date())
  const [individualScheduleTime, setIndividualScheduleTime] = useState<string>("10:00")

  // Fetch data on component mount
  useEffect(() => {
    fetchPosts()
    fetchCronStatus()

    // Refresh cron status every 30 seconds
    const interval = setInterval(fetchCronStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  // Update current time every second
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timeInterval)
  }, [])

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const [approvedRes, scheduledRes, postedRes] = await Promise.all([
        fetch("/api/approved-content?status=approved&limit=100"),
        fetch("/api/approved-content?status=scheduled&limit=100"),
        fetch("/api/approved-content?status=posted&limit=100"),
      ])

      const approvedData = await approvedRes.json()
      const scheduledData = await scheduledRes.json()
      const postedData = await postedRes.json()

      setApprovedPosts(approvedData.content || [])
      setScheduledPosts(scheduledData.content || [])
      setPostedPosts(postedData.content || [])
    } catch (error) {
      console.error("Error fetching posts:", error)
      toast.error("Failed to load posts")
    } finally {
      setLoading(false)
    }
  }

  const fetchCronStatus = async () => {
    try {
      const response = await fetch("/api/cron/status")
      if (response.ok) {
        const data = await response.json()
        setCronStatus(data)
      }
    } catch (error) {
      console.error("Error fetching cron status:", error)
    }
  }

  // Test auto-post functionality
  const testAutoPost = async () => {
    setTestLoading(true)
    try {
      const response = await fetch("/api/test-auto-post", {
        method: "POST",
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`Auto-post test completed! ${data.posted || 0} posts successful, ${data.errors || 0} errors.`)
        fetchPosts()
        fetchCronStatus()
      } else {
        const error = await response.json()
        toast.error(error.message || "Auto-post test failed")
      }
    } catch (error) {
      console.error("Error testing auto-post:", error)
      toast.error("Failed to test auto-post")
    } finally {
      setTestLoading(false)
    }
  }

  // Get scheduled dates for calendar highlighting
  const scheduledDates = scheduledPosts
    .map((post) => (post.scheduledFor ? new Date(post.scheduledFor) : null))
    .filter(Boolean) as Date[]

  const postedDates = postedPosts
    .map((post) => (post.postedAt ? new Date(post.postedAt) : null))
    .filter(Boolean) as Date[]

  // Posts for selected date
  const postsForSelectedDate = scheduledPosts.filter((post) => {
    if (!post.scheduledFor || !selectedDate) return false
    const postDate = new Date(post.scheduledFor)
    return postDate.toDateString() === selectedDate.toDateString()
  })

  const postedPostsForSelectedDate = postedPosts.filter((post) => {
    if (!post.postedAt || !selectedDate) return false
    const postDate = new Date(post.postedAt)
    return postDate.toDateString() === selectedDate.toDateString()
  })

  // Handle bulk scheduling
  const handleBulkSchedule = async () => {
    if (!approvedPosts.length) {
      toast.error("No approved posts to schedule")
      return
    }

    if (!scheduleOption) {
      toast.error("Please select a scheduling option")
      return
    }

    setLoading(true)
    try {
      const scheduleData = {
        posts: approvedPosts.map((post) => post._id),
        scheduleType: scheduleOption,
        startDate: customStartDate.toISOString(),
        startTime: customStartTime,
      }

      const response = await fetch("/api/content/schedule-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scheduleData),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`🎉 ${data.successCount} posts scheduled!`)
        setShowScheduleModal(false)
        fetchPosts()
        toast.success(`🎉 ${data.successCount} posts scheduled! Auto-posting will happen at scheduled times.`)
        setShowScheduleModal(false)
        fetchPosts()
        fetchCronStatus()
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to schedule posts")
      }
    } catch (error) {
      console.error("Error scheduling posts:", error)
      toast.error("Failed to schedule posts")
    } finally {
      setLoading(false)
    }
  }

  // Handle individual post scheduling
  const handleIndividualSchedule = async () => {
    if (!selectedApprovedPost) return

    setLoading(true)
    try {
      const scheduledDateTime = new Date(individualScheduleDate)
      const [hours, minutes] = individualScheduleTime.split(":")
      scheduledDateTime.setHours(Number.parseInt(hours), Number.parseInt(minutes))

      // Convert to IST timezone
      const istOffset = 5.5 * 60 * 60 * 1000 // IST is UTC+5:30
      const scheduledDateTimeIST = new Date(scheduledDateTime.getTime() - istOffset)

      console.log(`📅 Scheduling for IST: ${scheduledDateTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`)
      console.log(`📅 UTC time being sent: ${scheduledDateTimeIST.toISOString()}`)

      const response = await fetch(`/api/approved-content/${selectedApprovedPost._id}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledFor: scheduledDateTimeIST.toISOString(),
        }),
      })

      if (response.ok) {
        toast.success("Post scheduled successfully!")
        setShowIndividualScheduleModal(false)
        setSelectedApprovedPost(null)
        fetchPosts()
        fetchCronStatus()
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to schedule post")
      }
    } catch (error) {
      console.error("Error scheduling post:", error)
      toast.error("Failed to schedule post")
    } finally {
      setLoading(false)
    }
  }

  // Handle individual post edit
  const handleEditPost = async () => {
    if (!selectedPost || !editDate) return

    setLoading(true)
    try {
      const scheduledDateTime = new Date(editDate)
      const [hours, minutes] = editTime.split(":")
      scheduledDateTime.setHours(Number.parseInt(hours), Number.parseInt(minutes))

      // Convert to IST timezone
      const istOffset = 5.5 * 60 * 60 * 1000 // IST is UTC+5:30
      const scheduledDateTimeIST = new Date(scheduledDateTime.getTime() - istOffset)

      console.log(`📅 Editing schedule for IST: ${scheduledDateTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`)
      console.log(`📅 UTC time being sent: ${scheduledDateTimeIST.toISOString()}`)

      const response = await fetch(`/api/content/${selectedPost._id}/schedule`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledFor: scheduledDateTimeIST.toISOString(),
        }),
      })

      if (response.ok) {
        toast.success("Post schedule updated successfully")
        setShowEditModal(false)
        setSelectedPost(null)
        fetchPosts()
        fetchCronStatus()
      } else {
        toast.error("Failed to update post schedule")
      }
    } catch (error) {
      console.error("Error updating post:", error)
      toast.error("Failed to update post schedule")
    } finally {
      setLoading(false)
    }
  }

  // Handle post deletion
  const handleDeletePost = async () => {
    if (!selectedPost) return

    setLoading(true)
    try {
      const response = await fetch(`/api/content/${selectedPost._id}/unschedule`, {
        method: "PUT",
      })

      if (response.ok) {
        toast.success("Post unscheduled successfully")
        setShowDeleteModal(false)
        setSelectedPost(null)
        fetchPosts()
        fetchCronStatus()
      } else {
        toast.error("Failed to unschedule post")
      }
    } catch (error) {
      console.error("Error deleting post:", error)
      toast.error("Failed to unschedule post")
    } finally {
      setLoading(false)
    }
  }

  const openEditModal = (post: ScheduledPost) => {
    setSelectedPost(post)
    setEditDate(new Date(post.scheduledFor))
    const date = new Date(post.scheduledFor)
    setEditTime(`${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`)
    setShowEditModal(true)
  }

  const openDeleteModal = (post: ScheduledPost) => {
    setSelectedPost(post)
    setShowDeleteModal(true)
  }

  const openPreviewModal = (post: ApprovedPost | ScheduledPost) => {
    setSelectedApprovedPost(post as ApprovedPost)
    setShowPreviewModal(true)
  }

  const openIndividualScheduleModal = (post: ApprovedPost) => {
    setSelectedApprovedPost(post)
    setIndividualScheduleDate(new Date())
    setIndividualScheduleTime("10:00")
    setShowIndividualScheduleModal(true)
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800 border-green-200"
      case "scheduled":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "posted":
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getTimeUntilPost = (scheduledFor: string) => {
    const now = new Date()
    const scheduled = new Date(scheduledFor)
    
    // Convert to IST for accurate time calculation
    const istOffset = 5.5 * 60 * 60 * 1000 // IST is UTC+5:30
    const nowIST = new Date(now.getTime() + istOffset)
    const scheduledIST = new Date(scheduled.getTime() + istOffset)
    
    const diffMs = scheduledIST.getTime() - nowIST.getTime()

    if (diffMs <= 0) return "Due now"

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    if (diffHours > 24) {
      const diffDays = Math.floor(diffHours / 24)
      return `in ${diffDays} day${diffDays > 1 ? "s" : ""}`
    } else if (diffHours > 0) {
      return `in ${diffHours}h ${diffMinutes}m`
    } else {
      return `in ${diffMinutes}m`
    }
  }

  // Helper function to format time in IST
  const formatTimeIST = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-IN', { 
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Helper function to format current time in IST
  const formatCurrentTimeIST = (date: Date) => {
    return date.toLocaleString('en-IN', { 
      timeZone: 'Asia/Kolkata',
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Content Calendar</h1>
              <p className="text-gray-600">Schedule and track your LinkedIn content posting</p>
              <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>{approvedPosts.length} Ready to Schedule</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>{scheduledPosts.length} Scheduled</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-600" />
                  <span>{postedPosts.length} Posted</span>
                </div>

                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-600" />
                  <span>{cronStatus?.stats.dueNow || 0} Due Now</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={testAutoPost}
                disabled={testLoading}
                className="bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg hover:shadow-xl transition-all"
              >
                {testLoading ? (
                  <>
                    <Zap className="w-4 h-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Test Auto-Post
                  </>
                )}
              </Button>
              <Button
                onClick={() => setShowScheduleModal(true)}
                disabled={!approvedPosts.length}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all"
              >
                <Settings className="w-4 h-4 mr-2" />
                Bulk Schedule ({approvedPosts.length})
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* CRON Status Card */}
        {cronStatus && (
          <Card className="mb-8 shadow-xl border-0 bg-gradient-to-r from-green-50 to-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Activity className="w-5 h-5 text-green-600" />
                Auto-Posting System Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{cronStatus.stats.totalScheduled}</div>
                  <div className="text-xs text-gray-600">Total Scheduled</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{cronStatus.stats.dueNow}</div>
                  <div className="text-xs text-gray-600">Due Now</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{cronStatus.stats.futureScheduled}</div>
                  <div className="text-xs text-gray-600">Future Scheduled</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{cronStatus.stats.totalPosted}</div>
                  <div className="text-xs text-gray-600">Posted</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">{cronStatus.stats.totalApproved}</div>
                  <div className="text-xs text-gray-600">Approved</div>
                </div>
              </div>

              <div className="bg-white/60 p-3 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">Auto-Post Status:</span>
                  <Badge className="bg-green-100 text-green-800">Active - Every 5 minutes</Badge>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Current Time (IST):</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-600">
                      {formatCurrentTimeIST(currentTime)}
                    </div>
                    <div className="text-xs text-gray-500">Live Clock</div>
                  </div>
                </div>
              </div>

              {cronStatus.nextScheduledPosts && cronStatus.nextScheduledPosts.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">⏰ Next Posts to be Auto-Posted:</h4>
                  <div className="space-y-2">
                    {cronStatus.nextScheduledPosts.slice(0, 3).map((post) => (
                      <div
                        key={post.id}
                        className="flex items-center justify-between bg-white/60 p-3 rounded-lg text-sm"
                      >
                        <div className="flex-1">
                          <span className="font-medium truncate block">{post.topic}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(post.scheduledFor).toLocaleString("en-IN", {
                              timeZone: "Asia/Kolkata",
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <Badge
                          className={`ml-2 ${post.timeUntilPost <= 0 ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"}`}
                        >
                          {post.timeUntilPost > 0 ? `in ${post.timeUntilPost}m` : "Due now"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              Calendar View
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Approved ({approvedPosts.length})
            </TabsTrigger>
            <TabsTrigger value="scheduled" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Scheduled ({scheduledPosts.length})
            </TabsTrigger>
            <TabsTrigger value="posted" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Posted ({postedPosts.length})
            </TabsTrigger>
          </TabsList>

          {/* Calendar Tab */}
          <TabsContent value="calendar">
            {/* Current Time Display for Calendar */}
            <div className="mb-6 bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">Current Time (IST):</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">
                    {formatCurrentTimeIST(currentTime)}
                  </div>
                  <div className="text-xs text-gray-500">Live Clock</div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Calendar View */}
              <Card className="lg:col-span-2 shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                <CardHeader className="border-b border-gray-200/50">
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <CalendarIcon className="w-5 h-5 text-blue-600" />
                    {selectedDate
                      ? selectedDate.toLocaleString("default", { month: "long", year: "numeric" })
                      : "Calendar"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    modifiers={{
                      scheduled: scheduledDates,
                      posted: postedDates,
                    }}
                    modifiersClassNames={{
                      scheduled: "bg-blue-100 text-blue-900 font-semibold border border-blue-300 rounded-full",
                      posted: "bg-purple-100 text-purple-900 font-semibold border border-purple-300 rounded-full",
                    }}
                    className="rounded-md border-0"
                  />

                  {/* Legend */}
                  <div className="flex justify-center mt-4">
                    <div className="flex items-center gap-6 bg-gray-50 px-4 py-2 rounded-full">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-100 border border-blue-300"></div>
                        <span className="text-xs text-gray-600">Scheduled</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-purple-100 border border-purple-300"></div>
                        <span className="text-xs text-gray-600">Posted</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Posts for Selected Date */}
              <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                <CardHeader className="border-b border-gray-200/50">
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <CalendarDays className="w-5 h-5 text-blue-600" />
                    {selectedDate
                      ? selectedDate.toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        })
                      : "Select Date"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 max-h-96 overflow-y-auto">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Scheduled Posts */}
                      {postsForSelectedDate.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm text-blue-900 mb-3 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Scheduled Posts ({postsForSelectedDate.length})
                          </h4>
                          <div className="space-y-3">
                            {postsForSelectedDate.map((post) => (
                              <div key={post._id} className="p-3 border rounded-lg bg-blue-50 border-blue-200">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                                                      <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {new Date(post.scheduledFor).toLocaleTimeString("en-IN", {
                                    timeZone: "Asia/Kolkata",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </Badge>
                                      <Badge variant="outline" className="text-xs">
                                        {getTimeUntilPost(post.scheduledFor)}
                                      </Badge>
                                    </div>
                                    <h4 className="font-medium text-sm text-gray-900 line-clamp-2">
                                      {post.topicTitle || "Untitled Post"}
                                    </h4>
                                    <p className="text-xs text-gray-600 capitalize">{post.platform}</p>
                                  </div>
                                  <div className="flex gap-1 ml-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => openPreviewModal(post)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Eye className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => openEditModal(post)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Edit className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => openDeleteModal(post)}
                                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Posted Posts */}
                      {postedPostsForSelectedDate.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm text-purple-900 mb-3 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Posted ({postedPostsForSelectedDate.length})
                          </h4>
                          <div className="space-y-3">
                            {postedPostsForSelectedDate.map((post) => (
                              <div key={post._id} className="p-3 border rounded-lg bg-purple-50 border-purple-200">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                                                      <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Posted at{" "}
                                  {new Date(post.postedAt!).toLocaleTimeString("en-IN", {
                                    timeZone: "Asia/Kolkata",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </Badge>
                                    </div>
                                    <h4 className="font-medium text-sm text-gray-900 line-clamp-2">
                                      {post.topicTitle || "Untitled Post"}
                                    </h4>
                                    <p className="text-xs text-gray-600 capitalize">{post.platform}</p>
                                  </div>
                                  <div className="flex gap-1 ml-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => openPreviewModal(post)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Eye className="w-3 h-3" />
                                    </Button>
                                    {post.linkedinUrl && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => window.open(post.linkedinUrl, "_blank")}
                                        className="h-8 w-8 p-0 text-blue-600"
                                      >
                                        <ExternalLink className="w-3 h-3" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* No posts message */}
                      {postsForSelectedDate.length === 0 && postedPostsForSelectedDate.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p>No posts for this date</p>
                          <p className="text-sm mt-2">Select a different date or schedule new posts</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Approved Posts Tab */}
          <TabsContent value="approved">
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="border-b border-gray-200/50">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Approved Posts Ready for Scheduling ({approvedPosts.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {approvedPosts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No approved posts available for scheduling</p>
                    <p className="text-sm mt-2">Create and approve content first to schedule posts</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {approvedPosts.map((post) => (
                      <div
                        key={post._id}
                        className="p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <Badge className={getStatusColor(post.status)}>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                          </Badge>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openPreviewModal(post)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => openIndividualScheduleModal(post)}
                              className="h-8 w-8 p-0 bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        {post.imageUrl && (
                          <div className="mb-3">
                            <img
                              src={post.imageUrl || "/placeholder.svg"}
                              alt="Post image"
                              className="w-full h-32 object-cover rounded-lg"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          </div>
                        )}
                        <h4 className="font-medium text-sm text-gray-900 mb-2 line-clamp-2">
                          {post.topicTitle || "Untitled Post"}
                        </h4>
                        <p className="text-xs text-gray-600 line-clamp-3 mb-2">{post.content.substring(0, 100)}...</p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className="capitalize">{post.platform}</span>
                          <span className="capitalize">{post.contentType}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scheduled Posts Tab */}
          <TabsContent value="scheduled">
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="border-b border-gray-200/50">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Scheduled Posts ({scheduledPosts.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {/* Current Time Display */}
                <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">Current Time (IST):</span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600">
                        {formatCurrentTimeIST(currentTime)}
                      </div>
                      <div className="text-xs text-gray-500">Live Clock</div>
                    </div>
                  </div>
                </div>
                {scheduledPosts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No scheduled posts</p>
                    <p className="text-sm mt-2">Schedule approved posts to see them here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {scheduledPosts
                      .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime())
                      .map((post) => (
                        <div
                          key={post._id}
                          className="p-4 border rounded-lg bg-blue-50 border-blue-200 hover:shadow-md transition-shadow"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {new Date(post.scheduledFor).toLocaleString("en-IN", {
                                    timeZone: "Asia/Kolkata",
                                    weekday: "short",
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {getTimeUntilPost(post.scheduledFor)}
                                </Badge>
                              </div>
                              {post.imageUrl && (
                                <div className="mb-3">
                                  <img
                                    src={post.imageUrl || "/placeholder.svg"}
                                    alt="Post image"
                                    className="w-full h-32 object-cover rounded-lg"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none'
                                    }}
                                  />
                                </div>
                              )}
                              <h4 className="font-medium text-gray-900 mb-1 line-clamp-2">
                                {post.topicTitle || "Untitled Post"}
                              </h4>
                              <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                                {post.content.substring(0, 150)}...
                              </p>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span className="capitalize">{post.platform}</span>
                                <span className="capitalize">{post.contentType}</span>
                              </div>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openPreviewModal(post)}
                                className="h-8 w-8 p-0"
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditModal(post)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openDeleteModal(post)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Posted Posts Tab */}
          <TabsContent value="posted">
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="border-b border-gray-200/50">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Activity className="w-5 h-5 text-purple-600" />
                  Posted Content ({postedPosts.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {postedPosts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No posted content yet</p>
                    <p className="text-sm mt-2">Scheduled posts will appear here after being posted</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {postedPosts
                      .sort((a, b) => new Date(b.postedAt || 0).getTime() - new Date(a.postedAt || 0).getTime())
                      .map((post) => (
                        <div
                          key={post._id}
                          className="p-4 border rounded-lg bg-purple-50 border-purple-200 hover:shadow-md transition-shadow"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Posted{" "}
                                  {post.postedAt &&
                                    new Date(post.postedAt).toLocaleString("en-IN", {
                                      timeZone: "Asia/Kolkata",
                                      weekday: "short",
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                </Badge>
                                {post.linkedinUrl && (
                                  <Badge variant="outline" className="text-xs text-blue-600">
                                    <ExternalLink className="w-3 h-3 mr-1" />
                                    View on LinkedIn
                                  </Badge>
                                )}
                              </div>
                              {post.imageUrl && (
                                <div className="mb-3">
                                  <img
                                    src={post.imageUrl || "/placeholder.svg"}
                                    alt="Post image"
                                    className="w-full h-32 object-cover rounded-lg"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none'
                                    }}
                                  />
                                </div>
                              )}
                              <h4 className="font-medium text-gray-900 mb-1 line-clamp-2">
                                {post.topicTitle || "Untitled Post"}
                              </h4>
                              <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                                {post.content.substring(0, 150)}...
                              </p>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span className="capitalize">{post.platform}</span>
                                <span className="capitalize">{post.contentType}</span>
                              </div>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openPreviewModal(post)}
                                className="h-8 w-8 p-0"
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                              {post.linkedinUrl && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(post.linkedinUrl, "_blank")}
                                  className="h-8 w-8 p-0 text-blue-600"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Bulk Schedule Modal */}
      <Dialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Bulk Schedule Posts ({approvedPosts.length} posts)
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">🚀 Automatic LinkedIn Posting</h4>
              <div className="space-y-2 text-sm text-blue-800">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span>{approvedPosts.length} approved posts ready</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span>Auto-posting runs every 5 minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span>Posts automatically at exact scheduled time</span>
                </div>
              </div>
            </div>

            {/* Start Date & Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Start Date</Label>
                <Calendar
                  mode="single"
                  selected={customStartDate}
                  onSelect={(date) => date && setCustomStartDate(date)}
                  className="rounded-md border mt-2"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Start Time</Label>
                <Input
                  type="time"
                  value={customStartTime}
                  onChange={(e) => setCustomStartTime(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>

            {/* Scheduling Options */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Choose Posting Frequency</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {SCHEDULE_OPTIONS.map((option) => (
                  <div
                    key={option.value}
                    className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      scheduleOption === option.value
                        ? "border-blue-500 bg-blue-50 shadow-md"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setScheduleOption(option.value)}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xl">{option.icon}</span>
                      <div className="font-medium text-sm">{option.label}</div>
                    </div>
                    <div className="text-xs text-gray-600">{option.description}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview */}
            {scheduleOption && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-900 mb-2">📊 Scheduling Preview</h4>
                <div className="text-sm text-green-800">
                  <p>✅ {approvedPosts.length} posts will be scheduled</p>
                  <p>
                    📅 Starting: {customStartDate.toLocaleDateString("en-US")} at {customStartTime}
                  </p>
                  <p>🔄 Frequency: {SCHEDULE_OPTIONS.find((opt) => opt.value === scheduleOption)?.label}</p>
                  <p>🤖 Auto-posting will happen at exact scheduled times</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkSchedule}
              disabled={!scheduleOption || loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "Scheduling..." : "Schedule Posts"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Individual Schedule Modal */}
      <Dialog open={showIndividualScheduleModal} onOpenChange={setShowIndividualScheduleModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Individual Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedApprovedPost && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-sm mb-1">{selectedApprovedPost.topicTitle}</h4>
                <p className="text-xs text-gray-600 line-clamp-2">
                  {selectedApprovedPost.content.substring(0, 100)}...
                </p>
              </div>
            )}
            <div>
              <Label>Date</Label>
              <Calendar
                mode="single"
                selected={individualScheduleDate}
                onSelect={(date) => date && setIndividualScheduleDate(date)}
                className="rounded-md border"
              />
            </div>
            <div>
              <Label>Time</Label>
              <Input
                type="time"
                value={individualScheduleTime}
                onChange={(e) => setIndividualScheduleTime(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowIndividualScheduleModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleIndividualSchedule} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? "Scheduling..." : "Schedule Post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Content Preview</DialogTitle>
          </DialogHeader>
          {selectedApprovedPost && (
            <div className="space-y-4">
              {selectedApprovedPost.imageUrl && (
                <div className="w-full">
                  <img
                    src={selectedApprovedPost.imageUrl || "/placeholder.svg"}
                    alt="Post image"
                    className="w-full max-h-64 object-cover rounded-lg"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              )}
              <div>
                <h4 className="font-semibold mb-2">{selectedApprovedPost.topicTitle}</h4>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <Textarea
                    value={selectedApprovedPost.content}
                    readOnly
                    className="min-h-[200px] border-0 bg-transparent resize-none"
                  />
                </div>
              </div>
              {selectedApprovedPost.hashtags && selectedApprovedPost.hashtags.length > 0 && (
                <div>
                  <h5 className="font-medium mb-2">Hashtags</h5>
                  <div className="flex flex-wrap gap-2">
                    {selectedApprovedPost.hashtags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>Platform: {selectedApprovedPost.platform}</span>
                <span>Type: {selectedApprovedPost.contentType}</span>
                <span>Status: {selectedApprovedPost.status}</span>
                {selectedApprovedPost.scheduledFor && (
                  <span>Scheduled: {new Date(selectedApprovedPost.scheduledFor).toLocaleString()}</span>
                )}
                {selectedApprovedPost.postedAt && (
                  <span>Posted: {new Date(selectedApprovedPost.postedAt).toLocaleString()}</span>
                )}
              </div>
              {selectedApprovedPost.linkedinUrl && (
                <div className="pt-2">
                  <Button
                    onClick={() => window.open(selectedApprovedPost.linkedinUrl, "_blank")}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View on LinkedIn
                  </Button>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowPreviewModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Scheduled Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Date</Label>
              <Calendar
                mode="single"
                selected={editDate || undefined}
                onSelect={(date) => setEditDate(date || null)}
                className="rounded-md border"
              />
            </div>
            <div>
              <Label>Time</Label>
              <Input type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditPost} disabled={!editDate || loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? "Updating..." : "Update Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Unschedule Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-700">
              Are you sure you want to unschedule this post? It will remain approved but won&apos;t be automatically posted.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleDeletePost} disabled={loading} className="bg-red-600 hover:bg-red-700 text-white">
              {loading ? "Unscheduling..." : "Unschedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
