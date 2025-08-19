"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  CalendarIcon,
  Clock,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Settings,
  Activity,
  Plus,
  Eye,
  ExternalLink,
  CalendarDays,
  TrendingUp,
} from "lucide-react"
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
  userId: string
  userEmail: string
  content: string
  imageUrl?: string
  scheduledFor: string
  scheduledAtIST: string
  status: string
  attempts: number
  postedAt?: string
  linkedinPostId?: string
  linkedinUrl?: string
  error?: string
  lastAttempt?: string
  createdAt: string
  updatedAt: string
  // Legacy fields for compatibility
  topicTitle?: string
  platform?: string
  contentType?: string
  scheduledTime?: string
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
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("calendar")

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
  }, [])

  const fetchPosts = async () => {
    setLoading(true)
    try {
      // Fetch approved content
      const approvedRes = await fetch("/api/approved-content?status=approved&limit=100")
      const approvedData = await approvedRes.json()
      setApprovedPosts(approvedData.content || [])

      // Fetch scheduled posts from existing collections
      const [scheduledRes, postedRes, failedRes] = await Promise.all([
        fetch("/api/approved-content?status=scheduled&limit=100"),
        fetch("/api/approved-content?status=posted&limit=100"),
        fetch("/api/approved-content?status=failed&limit=100"),
      ])

      const scheduledData = await scheduledRes.json()
      const postedData = await postedRes.json()
      const failedData = await failedRes.json()

      setScheduledPosts(scheduledData.content || [])
      setPostedPosts([...(postedData.content || []), ...(failedData.content || [])])
    } catch (error) {
      console.error("Error fetching posts:", error)
      toast.error("Failed to load posts")
    } finally {
      setLoading(false)
    }
  }

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
      // Create proper IST datetime string
      const year = individualScheduleDate.getFullYear()
      const month = String(individualScheduleDate.getMonth() + 1).padStart(2, "0")
      const day = String(individualScheduleDate.getDate()).padStart(2, "0")
      const [hours, minutes] = individualScheduleTime.split(":")

      // Format as IST datetime string: YYYY-MM-DDTHH:MM
      const scheduledIST = `${year}-${month}-${day}T${hours}:${minutes}`

      console.log(`📅 Date selected: ${individualScheduleDate.toDateString()}`)
      console.log(`📅 Time selected: ${individualScheduleTime}`)
      console.log(`📅 IST datetime string: ${scheduledIST}`)

      const response = await fetch(`/api/approved-content/${selectedApprovedPost._id}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledFor: scheduledIST,
        }),
      })

      if (response.ok) {
        toast.success("Post scheduled successfully!")
        setShowIndividualScheduleModal(false)
        setSelectedApprovedPost(null)
        fetchPosts()
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
      // Create proper IST datetime string
      const year = editDate.getFullYear()
      const month = String(editDate.getMonth() + 1).padStart(2, "0")
      const day = String(editDate.getDate()).padStart(2, "0")
      const [hours, minutes] = editTime.split(":")

      // Format as IST datetime string: YYYY-MM-DDTHH:MM
      const scheduledIST = `${year}-${month}-${day}T${hours}:${minutes}`

      console.log(`📅 Edit date selected: ${editDate.toDateString()}`)
      console.log(`📅 Edit time selected: ${editTime}`)
      console.log(`📅 IST datetime string: ${scheduledIST}`)

      const response = await fetch(`/api/content/${selectedPost._id}/schedule`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledFor: scheduledIST,
        }),
      })

      if (response.ok) {
        toast.success("Post schedule updated successfully")
        setShowEditModal(false)
        setSelectedPost(null)
        fetchPosts()
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
      case "posted":
        return "bg-green-100 text-green-800 border-green-200"
      case "failed":
        return "bg-red-100 text-red-800 border-red-200"
      case "scheduled":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "approved":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
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

    if (diffMs <= 0) return "Scheduled time passed"

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
    return date.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Helper function to format current time in IST

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/30 via-white to-emerald-50/30">
      <div className="bg-white/95 backdrop-blur-md border-b border-green-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent mb-2">
                  Content Calendar
                </h1>
                <p className="text-base sm:text-lg text-muted-foreground max-w-2xl">
                  Schedule and track your LinkedIn content posting with intelligent automation
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-700">{approvedPosts.length}</p>
                    <p className="text-sm text-green-600 font-medium">Ready to Schedule</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-700">{scheduledPosts.length}</p>
                    <p className="text-sm text-blue-600 font-medium">Scheduled Posts</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl border border-purple-200">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-700">{postedPosts.length}</p>
                    <p className="text-sm text-purple-600 font-medium">Published</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 w-full lg:w-auto">
              <Button
                onClick={() => setShowScheduleModal(true)}
                disabled={!approvedPosts.length}
                size="lg"
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all flex-1 lg:flex-none"
              >
                <Settings className="w-5 h-5 mr-2" />
                <span className="hidden sm:inline">Bulk Schedule</span>
                <span className="sm:hidden">Schedule</span>
                <Badge variant="secondary" className="ml-2 bg-white/20 text-white border-0">
                  {approvedPosts.length}
                </Badge>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-8 h-auto bg-white/80 backdrop-blur-sm border border-green-100 shadow-sm">
            <TabsTrigger
              value="calendar"
              className="flex items-center gap-2 text-sm p-4 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white"
            >
              <CalendarIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Calendar View</span>
              <span className="sm:hidden">Calendar</span>
            </TabsTrigger>
            <TabsTrigger
              value="approved"
              className="flex items-center gap-2 text-sm p-4 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white"
            >
              <CheckCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Ready</span>
              <span className="sm:hidden">Ready</span>
              <Badge variant="secondary" className="ml-1 text-xs">
                {approvedPosts.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="scheduled"
              className="flex items-center gap-2 text-sm p-4 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white"
            >
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Scheduled</span>
              <span className="sm:hidden">Scheduled</span>
              <Badge variant="secondary" className="ml-1 text-xs">
                {scheduledPosts.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="posted"
              className="flex items-center gap-2 text-sm p-4 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white"
            >
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Published</span>
              <span className="sm:hidden">Published</span>
              <Badge variant="secondary" className="ml-1 text-xs">
                {postedPosts.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* Calendar Tab */}
          <TabsContent value="calendar">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <Card className="xl:col-span-2 shadow-xl border-0 bg-white/95 backdrop-blur-sm overflow-hidden">
                <CardHeader className="border-b border-green-100 bg-gradient-to-r from-green-50 to-emerald-50 p-6">
                  <CardTitle className="flex items-center gap-3 text-green-800">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CalendarIcon className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">
                        {selectedDate
                          ? selectedDate.toLocaleString("default", { month: "long", year: "numeric" })
                          : "Calendar Overview"}
                      </h3>
                      <p className="text-sm text-green-600 font-normal">Click any date to view scheduled content</p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    modifiers={{
                      scheduled: scheduledPosts
                        .map((post) => (post.scheduledFor ? new Date(post.scheduledFor) : null))
                        .filter(Boolean) as Date[],
                      posted: postedPosts
                        .map((post) => (post.postedAt ? new Date(post.postedAt) : null))
                        .filter(Boolean) as Date[],
                    }}
                    modifiersClassNames={{
                      scheduled:
                        "bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-900 font-semibold border-2 border-blue-300 rounded-lg shadow-sm hover:shadow-md transition-all",
                      posted:
                        "bg-gradient-to-r from-purple-100 to-violet-100 text-purple-900 font-semibold border-2 border-purple-300 rounded-lg shadow-sm hover:shadow-md transition-all",
                    }}
                    className="rounded-xl border-0 w-full [&_.rdp-day]:h-12 [&_.rdp-day]:w-12 [&_.rdp-day]:text-sm [&_.rdp-day]:font-medium"
                  />

                  <div className="flex justify-center mt-6">
                    <div className="flex items-center gap-6 bg-gradient-to-r from-gray-50 to-slate-50 px-6 py-3 rounded-full border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-lg bg-gradient-to-r from-blue-100 to-cyan-100 border-2 border-blue-300 shadow-sm"></div>
                        <span className="text-sm font-medium text-gray-700">Scheduled</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-lg bg-gradient-to-r from-purple-100 to-violet-100 border-2 border-purple-300 shadow-sm"></div>
                        <span className="text-sm font-medium text-gray-700">Published</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm overflow-hidden">
                <CardHeader className="border-b border-green-100 bg-gradient-to-r from-green-50 to-emerald-50 p-6">
                  <CardTitle className="flex items-center gap-3 text-green-800">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CalendarDays className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">
                        {selectedDate
                          ? selectedDate.toLocaleDateString("en-US", {
                              weekday: "long",
                              month: "short",
                              day: "numeric",
                            })
                          : "Select Date"}
                      </h3>
                      <p className="text-sm text-green-600 font-normal">Content for this day</p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 max-h-96 overflow-y-auto">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-10 w-10 border-3 border-green-600 border-t-transparent"></div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Scheduled Posts */}
                      {scheduledPosts.filter((post) => {
                        if (!post.scheduledFor || !selectedDate) return false
                        const postDate = new Date(post.scheduledFor)
                        return postDate.toDateString() === selectedDate.toDateString()
                      }).length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm text-blue-900 mb-3 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Scheduled Posts (
                            {
                              scheduledPosts.filter((post) => {
                                if (!post.scheduledFor || !selectedDate) return false
                                const postDate = new Date(post.scheduledFor)
                                return postDate.toDateString() === selectedDate.toDateString()
                              }).length
                            }
                            )
                          </h4>
                          <div className="space-y-3">
                            {scheduledPosts
                              .filter((post) => {
                                if (!post.scheduledFor || !selectedDate) return false
                                const postDate = new Date(post.scheduledFor)
                                return postDate.toDateString() === selectedDate.toDateString()
                              })
                              .map((post) => (
                                <div key={post._id} className="p-3 border rounded-lg bg-blue-50 border-blue-200">
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
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
                                      <h4 className="font-medium text-sm text-gray-900 line-clamp-2 mb-1">
                                        {post.content.substring(0, 50) || "Untitled Post"}
                                      </h4>
                                      <p className="text-xs text-gray-600 capitalize">LinkedIn</p>
                                    </div>
                                    <div className="flex gap-1 ml-2 flex-shrink-0">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => openPreviewModal(post)}
                                        className="h-9 w-9 sm:h-8 sm:w-8 p-0"
                                      >
                                        <Eye className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => openEditModal(post)}
                                        className="h-9 w-9 sm:h-8 sm:w-8 p-0"
                                      >
                                        <Edit className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => openDeleteModal(post)}
                                        className="h-9 w-9 sm:h-8 sm:w-8 p-0 text-red-600 hover:text-red-700"
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
                      {postedPosts.filter((post) => {
                        if (!post.postedAt || !selectedDate) return false
                        const postDate = new Date(post.postedAt)
                        return postDate.toDateString() === selectedDate.toDateString()
                      }).length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm text-gray-900 mb-3 flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            Posted/Failed (
                            {
                              postedPosts.filter((post) => {
                                if (!post.postedAt || !selectedDate) return false
                                const postDate = new Date(post.postedAt)
                                return postDate.toDateString() === selectedDate.toDateString()
                              }).length
                            }
                            )
                          </h4>
                          <div className="space-y-3">
                            {postedPosts
                              .filter((post) => {
                                if (!post.postedAt || !selectedDate) return false
                                const postDate = new Date(post.postedAt)
                                return postDate.toDateString() === selectedDate.toDateString()
                              })
                              .map((post) => (
                                <div
                                  key={post._id}
                                  className={`p-3 border rounded-lg ${post.status === "posted" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <Badge
                                          className={
                                            post.status === "posted"
                                              ? "bg-green-100 text-green-800 border-green-200"
                                              : "bg-red-100 text-red-800 border-red-200"
                                          }
                                        >
                                          {post.status === "posted" ? (
                                            <>
                                              <CheckCircle className="w-3 h-3 mr-1" />
                                              Posted at{" "}
                                              {new Date(post.postedAt!).toLocaleTimeString("en-IN", {
                                                timeZone: "Asia/Kolkata",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                              })}
                                            </>
                                          ) : (
                                            <>
                                              <XCircle className="w-3 h-3 mr-1" />
                                              Failed
                                            </>
                                          )}
                                        </Badge>
                                      </div>
                                      <h4 className="font-medium text-sm text-gray-900 line-clamp-2">
                                        {post.content.substring(0, 50) || "Untitled Post"}
                                      </h4>
                                      <p className="text-xs text-gray-600 capitalize">LinkedIn</p>
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
                      {scheduledPosts.filter((post) => {
                        if (!post.scheduledFor || !selectedDate) return false
                        const postDate = new Date(post.scheduledFor)
                        return postDate.toDateString() === selectedDate.toDateString()
                      }).length === 0 &&
                        postedPosts.filter((post) => {
                          if (!post.postedAt || !selectedDate) return false
                          const postDate = new Date(post.postedAt)
                          return postDate.toDateString() === selectedDate.toDateString()
                        }).length === 0 && (
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
            <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm overflow-hidden">
              <CardHeader className="border-b border-green-100 bg-gradient-to-r from-green-50 to-emerald-50 p-6">
                <CardTitle className="flex items-center gap-3 text-green-800">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Ready to Schedule ({approvedPosts.length})</h3>
                    <p className="text-sm text-green-600 font-normal">Approved content waiting for scheduling</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {approvedPosts.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="p-4 bg-green-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                      <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No approved posts available</h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                      Create and approve content first to schedule posts for your LinkedIn audience
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {approvedPosts.map((post) => (
                      <div
                        key={post._id}
                        className="group p-6 border border-green-100 rounded-xl bg-gradient-to-br from-white to-green-50/30 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-green-200"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <Badge className={getStatusColor(post.status)}>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                          </Badge>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openPreviewModal(post)}
                              className="h-9 w-9 p-0 group-hover:bg-green-50 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => openIndividualScheduleModal(post)}
                              className="h-9 w-9 p-0 bg-green-600 hover:bg-green-700 text-white transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        {post.imageUrl && (
                          <div className="mb-4">
                            <img
                              src={post.imageUrl || "/placeholder.svg"}
                              alt="Post image"
                              className="w-full h-32 object-cover rounded-xl shadow-sm"
                              onError={(e) => {
                                e.currentTarget.style.display = "none"
                              }}
                            />
                          </div>
                        )}
                        <h4 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-green-800 transition-colors">
                          {post.topicTitle || "Untitled Post"}
                        </h4>
                        <p className="text-sm text-gray-600 line-clamp-3 mb-3">{post.content.substring(0, 100)}...</p>
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
            <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm overflow-hidden">
              <CardHeader className="border-b border-blue-100 bg-gradient-to-r from-blue-50 to-cyan-50 p-6">
                <CardTitle className="flex items-center gap-3 text-blue-800">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Scheduled Posts ({scheduledPosts.length})</h3>
                    <p className="text-sm text-blue-600 font-normal">Content queued for automatic posting</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {scheduledPosts.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="p-4 bg-blue-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                      <Clock className="w-10 h-10 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No scheduled posts</h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                      Schedule approved posts to see them here with automatic posting times
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {scheduledPosts
                      .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime())
                      .map((post) => (
                        <div
                          key={post._id}
                          className="group p-6 border border-blue-100 rounded-xl bg-gradient-to-br from-white to-blue-50/30 shadow-sm hover:shadow-lg transition-all duration-300"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
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
                                <div className="mb-4">
                                  <img
                                    src={post.imageUrl || "/placeholder.svg"}
                                    alt="Post image"
                                    className="w-full h-32 object-cover rounded-xl shadow-sm"
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none"
                                    }}
                                  />
                                </div>
                              )}
                              <h4 className="font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-800 transition-colors">
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
                                className="h-8 w-8 p-0 group-hover:bg-blue-50 transition-colors"
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditModal(post)}
                                className="h-8 w-8 p-0 group-hover:bg-blue-50 transition-colors"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openDeleteModal(post)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 group-hover:bg-blue-50 transition-colors"
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
            <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm overflow-hidden">
              <CardHeader className="border-b border-purple-100 bg-gradient-to-r from-purple-50 to-violet-50 p-6">
                <CardTitle className="flex items-center gap-3 text-purple-800">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Activity className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Published Content ({postedPosts.length})</h3>
                    <p className="text-sm text-purple-600 font-normal">Successfully posted and failed attempts</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {postedPosts.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="p-4 bg-purple-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                      <Activity className="w-10 h-10 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No published content yet</h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                      Scheduled posts will appear here after being automatically posted to LinkedIn
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {postedPosts
                      .sort((a, b) => new Date(b.postedAt || 0).getTime() - new Date(a.postedAt || 0).getTime())
                      .map((post) => (
                        <div
                          key={post._id}
                          className="group p-6 border border-purple-100 rounded-xl bg-gradient-to-br from-white to-purple-50/30 shadow-sm hover:shadow-lg transition-all duration-300"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <Badge
                                  className={
                                    post.status === "posted"
                                      ? "bg-green-100 text-green-800 border-green-200"
                                      : "bg-red-100 text-red-800 border-red-200"
                                  }
                                >
                                  {post.status === "posted" ? (
                                    <>
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
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="w-3 h-3 mr-1" />
                                      Failed
                                    </>
                                  )}
                                </Badge>
                                {post.linkedinUrl && (
                                  <Badge variant="outline" className="text-xs text-blue-600">
                                    <ExternalLink className="w-3 h-3 mr-1" />
                                    View on LinkedIn
                                  </Badge>
                                )}
                              </div>
                              {post.imageUrl && (
                                <div className="mb-4">
                                  <img
                                    src={post.imageUrl || "/placeholder.svg"}
                                    alt="Post image"
                                    className="w-full h-32 object-cover rounded-xl shadow-sm"
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none"
                                    }}
                                  />
                                </div>
                              )}
                              <h4 className="font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-purple-800 transition-colors">
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
                                className="h-8 w-8 p-0 group-hover:bg-purple-50 transition-colors"
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                              {post.linkedinUrl && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(post.linkedinUrl, "_blank")}
                                  className="h-8 w-8 p-0 text-blue-600 group-hover:bg-purple-50 transition-colors"
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
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))} // Allow today and future dates
              />
              <p className="text-xs text-gray-500 mt-1">📅 You can schedule for today or future dates</p>
            </div>
            <div>
              <Label>Time (IST)</Label>
              <Input
                type="time"
                value={individualScheduleTime}
                onChange={(e) => setIndividualScheduleTime(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">⏰ Minimum scheduling time: 5 minutes from now (IST)</p>
              <p className="text-xs text-blue-600 mt-1">
                💡 Current time: {new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour12: false })}{" "}
                IST
              </p>
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
                      e.currentTarget.style.display = "none"
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
              Are you sure you want to unschedule this post? It will remain approved but won&apos;t be automatically
              posted.
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
