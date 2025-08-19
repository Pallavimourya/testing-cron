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
    if (isOverdue && status === "pending") {
      return "bg-orange-100 text-orange-800 border-orange-200"
    }

    const colors = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      posted: "bg-green-100 text-green-800 border-green-200",
      failed: "bg-red-100 text-red-800 border-red-200",
      cancelled: "bg-gray-100 text-gray-800 border-gray-200",
    }
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const getStatusIcon = (status: string, isOverdue: boolean) => {
    if (isOverdue && status === "pending") {
      return <AlertCircle className="w-3 h-3" />
    }

    const icons = {
      pending: <Clock className="w-3 h-3" />,
      posted: <CheckCircle className="w-3 h-3" />,
      failed: <XCircle className="w-3 h-3" />,
      cancelled: <XCircle className="w-3 h-3" />,
    }
    return icons[status as keyof typeof icons] || <Clock className="w-3 h-3" />
  }

  const pendingPosts = scheduledPosts.filter((post) => post.status === "pending")
  const completedPosts = scheduledPosts.filter((post) => post.status !== "pending")

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading scheduled posts...</span>
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
                    const response = await fetch('/api/test-cron');
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
                <Button className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Create Post
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Scheduled</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{scheduledPosts.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{pendingPosts.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Posted</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {scheduledPosts.filter((post) => post.status === "posted").length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Failed</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {scheduledPosts.filter((post) => post.status === "failed").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Posts */}
        {pendingPosts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Pending Posts</h2>
            <div className="grid gap-4">
              {pendingPosts.map((post) => (
                <Card key={post._id} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getStatusColor(post.status, post.isOverdue)}>
                            {getStatusIcon(post.status, post.isOverdue)}
                            <span className="ml-1 capitalize">{post.isOverdue ? "Overdue" : post.status}</span>
                          </Badge>
                          <span className="text-sm text-gray-500">Scheduled for {post.scheduledTimeDisplay}</span>
                        </div>

                        <p className="text-gray-800 mb-3 line-clamp-2">
                          {post.content.substring(0, 200)}
                          {post.content.length > 200 && "..."}
                        </p>

                        {post.imageUrl && (
                          <div className="flex items-center gap-1 text-sm text-blue-600 mb-2">
                            <Eye className="w-3 h-3" />
                            Image attached
                          </div>
                        )}

                        {post.isOverdue && (
                          <div className="flex items-center gap-1 text-sm text-orange-600">
                            <AlertCircle className="w-3 h-3" />
                            This post is overdue and will be posted soon
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {/* View Content Dialog */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Scheduled Post Content</DialogTitle>
                              <DialogDescription>Scheduled for {post.scheduledTimeDisplay}</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="whitespace-pre-wrap">{post.content}</p>
                              </div>
                              {post.imageUrl && (
                                <div>
                                  <p className="text-sm font-medium mb-2">Attached Image:</p>
                                  <img
                                    src={post.imageUrl || "/placeholder.svg"}
                                    alt="Post image"
                                    className="max-w-full h-auto rounded-lg border"
                                  />
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>

                        {/* Delete Post */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 bg-transparent"
                              disabled={deletingId === post._id}
                            >
                              {deletingId === post._id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
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
                              <AlertDialogCancel>Keep Post</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeletePost(post._id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Cancel Post
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Completed Posts */}
        {completedPosts.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Completed Posts</h2>
            <div className="grid gap-4">
              {completedPosts.map((post) => (
                <Card key={post._id} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getStatusColor(post.status, post.isOverdue)}>
                            {getStatusIcon(post.status, post.isOverdue)}
                            <span className="ml-1 capitalize">{post.status}</span>
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {post.status === "posted" && post.postedAt
                              ? `Posted on ${new Date(post.postedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`
                              : `Scheduled for ${post.scheduledTimeDisplay}`}
                          </span>
                        </div>

                        <p className="text-gray-800 mb-3 line-clamp-2">
                          {post.content.substring(0, 200)}
                          {post.content.length > 200 && "..."}
                        </p>

                        {post.error && (
                          <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700 mb-2">
                            <strong>Error:</strong> {post.error}
                          </div>
                        )}

                        {post.linkedinUrl && (
                          <Link
                            href={post.linkedinUrl}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                          >
                            <ExternalLink className="w-3 h-3" />
                            View on LinkedIn
                          </Link>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {/* View Content Dialog */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Post Content</DialogTitle>
                              <DialogDescription>
                                {post.status === "posted" && post.postedAt
                                  ? `Posted on ${new Date(post.postedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`
                                  : `Was scheduled for ${post.scheduledTimeDisplay}`}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="whitespace-pre-wrap">{post.content}</p>
                              </div>
                              {post.imageUrl && (
                                <div>
                                  <p className="text-sm font-medium mb-2">Attached Image:</p>
                                  <img
                                    src={post.imageUrl || "/placeholder.svg"}
                                    alt="Post image"
                                    className="max-w-full h-auto rounded-lg border"
                                  />
                                </div>
                              )}
                              {post.linkedinUrl && (
                                <div className="pt-2 border-t">
                                  <Link
                                    href={post.linkedinUrl}
                                    target="_blank"
                                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                    View on LinkedIn
                                  </Link>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {scheduledPosts.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Scheduled Posts</h3>
            <p className="text-gray-500 mb-6">You haven't scheduled any posts yet.</p>
            <Link href="/dashboard/approved-content">
              <Button className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Schedule Your First Post
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
