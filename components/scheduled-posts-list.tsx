"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, ExternalLink, Trash2, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { SchedulePostModal } from "./schedule-post-modal"

interface ScheduledPost {
  _id: string
  content: string
  imageUrl?: string
  scheduledAtDisplay: string
  postedAtDisplay?: string
  status: "pending" | "posted" | "failed" | "cancelled"
  linkedinUrl?: string
  errorMessage?: string
  retries: number
}

interface ScheduledPostsStats {
  pending: number
  posted: number
  failed: number
  cancelled: number
  total: number
}

export function ScheduledPostsList() {
  const [posts, setPosts] = useState<ScheduledPost[]>([])
  const [stats, setStats] = useState<ScheduledPostsStats>({
    pending: 0,
    posted: 0,
    failed: 0,
    cancelled: 0,
    total: 0,
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const { toast } = useToast()

  const fetchPosts = async (status = "all") => {
    try {
      const response = await fetch(`/api/scheduled-posts?status=${status}&limit=20`)
      const data = await response.json()

      if (data.success) {
        setPosts(data.posts)
      }
    } catch (error) {
      console.error("Error fetching posts:", error)
      toast({
        title: "Error",
        description: "Failed to fetch scheduled posts",
        variant: "destructive",
      })
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/scheduled-posts/stats")
      const data = await response.json()

      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  const cancelPost = async (postId: string) => {
    try {
      const response = await fetch(`/api/scheduled-posts/${postId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Post Cancelled",
          description: "The scheduled post has been cancelled",
        })
        fetchPosts(activeTab)
        fetchStats()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to cancel post",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error cancelling post:", error)
      toast({
        title: "Error",
        description: "Failed to cancel post",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchPosts(activeTab), fetchStats()])
      setLoading(false)
    }
    loadData()
  }, [activeTab])

  const getStatusBadge = (status: string, retries: number) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>
      case "posted":
        return (
          <Badge variant="default" className="bg-green-500">
            Posted
          </Badge>
        )
      case "failed":
        return <Badge variant="destructive">Failed {retries > 0 && `(${retries}/3)`}</Badge>
      case "cancelled":
        return <Badge variant="outline">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleScheduled = () => {
    fetchPosts(activeTab)
    fetchStats()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.posted}</div>
            <div className="text-sm text-muted-foreground">Posted</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-sm text-muted-foreground">Failed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-600">{stats.cancelled}</div>
            <div className="text-sm text-muted-foreground">Cancelled</div>
          </CardContent>
        </Card>
      </div>

      {/* Header with Schedule Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Scheduled Posts</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchPosts(activeTab)
              fetchStats()
            }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <SchedulePostModal onScheduled={handleScheduled} />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="posted">Posted</TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {posts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No scheduled posts</h3>
                <p className="text-muted-foreground mb-4">
                  {activeTab === "all" ? "You haven't scheduled any posts yet." : `No ${activeTab} posts found.`}
                </p>
                <SchedulePostModal trigger={<Button>Schedule Your First Post</Button>} onScheduled={handleScheduled} />
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => (
              <Card key={post._id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(post.status, post.retries)}
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="w-4 h-4 mr-1" />
                        {post.status === "posted" && post.postedAtDisplay
                          ? `Posted: ${post.postedAtDisplay}`
                          : `Scheduled: ${post.scheduledAtDisplay}`}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {post.status === "posted" && post.linkedinUrl && (
                        <Button variant="outline" size="sm" onClick={() => window.open(post.linkedinUrl, "_blank")}>
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                      {post.status === "pending" && (
                        <Button variant="outline" size="sm" onClick={() => cancelPost(post._id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm leading-relaxed">{post.content}</p>
                    {post.imageUrl && (
                      <div className="border rounded-lg overflow-hidden">
                        <img
                          src={post.imageUrl || "/placeholder.svg"}
                          alt="Post image"
                          className="w-full h-48 object-cover"
                        />
                      </div>
                    )}
                    {post.errorMessage && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-700">{post.errorMessage}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
