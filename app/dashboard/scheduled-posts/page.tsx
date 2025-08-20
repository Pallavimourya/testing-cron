"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Calendar,
  Clock,
  Trash2,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
} from "lucide-react"
import { toast } from "sonner"
import { ISTTime } from "@/lib/utils/ist-time"
import Link from "next/link"

interface ScheduledPost {
  _id: string
  content: string
  imageUrl?: string
  scheduledTime: string
  scheduledTimeIST: string
  scheduledTimeDisplay: string
  status: "pending" | "posted" | "failed" | "cancelled"
  linkedinPostId?: string
  linkedinUrl?: string
  error?: string
  attempts: number
  maxAttempts: number
  lastAttempt?: string
  postedAt?: string
  createdAt: string
  isOverdue: boolean
}

export default function ScheduledPostsPage() {
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadScheduledPosts = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/scheduled-posts")

      if (response.ok) {
        const data = await response.json()
        setScheduledPosts(data.posts || [])
      } else {
        toast.error("Failed to load scheduled posts")
      }
    } catch (error) {
      console.error("Error loading scheduled posts:", error)
      toast.error("Failed to load scheduled posts")
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      await loadScheduledPosts()
      toast.success("Scheduled posts refreshed")
    } catch (error) {
      toast.error("Failed to refresh")
    } finally {
      setRefreshing(false)
    }
  }

  const handleDeletePost = async (postId: string) => {
    try {
      setDeletingId(postId)
      const response = await fetch(`/api/scheduled-posts/${postId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setScheduledPosts((prev) => prev.filter((post) => post._id !== postId))
        toast.success("Scheduled post cancelled")
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to cancel scheduled post")
      }
    } catch (error) {
      console.error("Error deleting scheduled post:", error)
      toast.error("Failed to cancel scheduled post")
    } finally {
      setDeletingId(null)
    }
  }

  useEffect(() => {
    loadScheduledPosts()

    // Auto-refresh every 30 seconds
    const interval = setInterval(loadScheduledPosts, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string, isOverdue: boolean) => {
    if (isOverdue) return "bg-red-100 text-red-800"
    
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "posted":
        return "bg-green-100 text-green-800"
      case "failed":
        return "bg-red-100 text-red-800"
      case "cancelled":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string, isOverdue: boolean) => {
    if (isOverdue) return <AlertCircle className="h-4 w-4" />
    
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />
      case "posted":
        return <CheckCircle className="h-4 w-4" />
      case "failed":
        return <XCircle className="h-4 w-4" />
      case "cancelled":
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getStatusText = (status: string, isOverdue: boolean) => {
    if (isOverdue) return "Overdue"
    
    switch (status) {
      case "pending":
        return "Pending"
      case "posted":
        return "Posted"
      case "failed":
        return "Failed"
      case "cancelled":
        return "Cancelled"
      default:
        return "Unknown"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Scheduled Posts</h1>
              <p className="text-gray-600">Manage your scheduled LinkedIn posts. All times shown in IST.</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleRefresh}
                variant="outline"
                className="flex items-center gap-2 bg-transparent"
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/cron/external-auto-post', {
                      headers: {
                        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || 'BzbHyiKVrc6rDLWHn4uYLHo+s1WkHp2ucuzsCi/euRI='}`
                      }
                    });
                    const data = await response.json();
                    if (data.success) {
                      toast.success(`Cron job executed: ${data.successCount} successful, ${data.failureCount} failed`);
                      loadScheduledPosts(); // Refresh the list
                    } else {
                      toast.error(data.error || 'Cron job failed');
                    }
                  } catch (error) {
                    toast.error('Failed to trigger cron job');
                  }
                }}
                variant="outline"
                className="flex items-center gap-2 bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
              >
                <Clock className="w-4 h-4" />
                Test Cron Job
              </Button>
              <Link href="/dashboard/approved-content">
                <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
                  <Calendar className="w-4 h-4" />
                  Schedule New Post
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Posts</p>
                  <p className="text-2xl font-bold text-gray-900">{scheduledPosts.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {scheduledPosts.filter(p => p.status === "pending").length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Posted</p>
                  <p className="text-2xl font-bold text-green-600">
                    {scheduledPosts.filter(p => p.status === "posted").length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Failed</p>
                  <p className="text-2xl font-bold text-red-600">
                    {scheduledPosts.filter(p => p.status === "failed").length}
                  </p>
                </div>
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Posts List */}
        {scheduledPosts.length === 0 ? (
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Scheduled Posts</h3>
              <p className="text-gray-600 mb-6">You haven't scheduled any posts yet.</p>
              <Link href="/dashboard/approved-content">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Schedule Your First Post
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {scheduledPosts.map((post) => (
              <Card key={post._id} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Badge className={getStatusColor(post.status, post.isOverdue)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(post.status, post.isOverdue)}
                              {getStatusText(post.status, post.isOverdue)}
                            </div>
                          </Badge>
                          {post.isOverdue && (
                            <Badge className="bg-red-100 text-red-800">
                              Overdue
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {post.linkedinUrl && (
                            <a
                              href={post.linkedinUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                          {post.status === "pending" && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                  disabled={deletingId === post._id}
                                >
                                  {deletingId === post._id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Cancel Scheduled Post</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to cancel this scheduled post? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeletePost(post._id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Cancel Post
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-gray-900 line-clamp-3">{post.content}</p>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Scheduled: {post.scheduledTimeDisplay}</span>
                        </div>
                        {post.postedAt && (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" />
                            <span>Posted: {ISTTime.formatIST(new Date(post.postedAt))}</span>
                          </div>
                        )}
                        {post.error && (
                          <div className="flex items-center gap-1 text-red-600">
                            <AlertCircle className="h-4 w-4" />
                            <span>Error: {post.error}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
