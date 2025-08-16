"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Sparkles,
  Search,
  Plus,
  Copy,
  Trash2,
  CheckCircle,
  X,
  Loader2,
  MessageSquare,
  BarChart3,
  Zap,
  RefreshCw,
  Clock,
} from "lucide-react"
import { toast } from "sonner"
import { useSubscription } from "@/hooks/use-subscription"

interface Topic {
  id: string
  title: string
  status: "pending" | "approved" | "dismissed"
  source: "auto" | "manual" | "story"
  generationType?: string
  userPrompt?: string
  createdAt: string
  hasContent?: boolean
  contentStatus?: "not_generated" | "generating" | "generated" | "failed"
}

interface TopicStats {
  total: number
  pending: number
  approved: number
  dismissed: number
}

interface MonthlyUsage {
  topics: {
    used: number
    limit: number
    remaining: number
  }
  content: {
    used: number
    limit: number
    remaining: number
  }
  resetInfo: {
    daysUntilReset: number
    nextResetDate: string
  }
}

export default function TopicBankPage() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [filteredTopics, setFilteredTopics] = useState<Topic[]>([])
  const [stats, setStats] = useState<TopicStats>({ total: 0, pending: 0, approved: 0, dismissed: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [isGeneratingAuto, setIsGeneratingAuto] = useState(false)
  const [isGeneratingManual, setIsGeneratingManual] = useState(false)
  const [isGeneratingContent, setIsGeneratingContent] = useState<string | null>(null)
  const [isCleaningUp, setIsCleaningUp] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Filters and search
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sourceFilter, setSourceFilter] = useState("all")

  // Manual generation
  const [manualPrompt, setManualPrompt] = useState("")
  const [isManualDialogOpen, setIsManualDialogOpen] = useState(false)

  // Content generation - per topic format selection
  const [contentFormats, setContentFormats] = useState<{[topicId: string]: string}>({})
  const [monthlyUsage, setMonthlyUsage] = useState<MonthlyUsage | null>(null)

  // Subscription hook
  const {
    isActive,
    canGenerateTopics,
    canGenerateContent,
    handleApiError,
    SubscriptionAlertComponent
  } = useSubscription()

  useEffect(() => {
    loadTopics()
    loadMonthlyUsage()
  }, [])

  // Update current time every second
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timeInterval)
  }, [])

  useEffect(() => {
    filterTopics()
  }, [topics, searchTerm, statusFilter, sourceFilter])

  const loadTopics = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/topics")
      if (response.ok) {
        const data = await response.json()
        setTopics(data.topics || [])
        calculateStats(data.topics || [])
      } else {
        const errorData = await response.json()
        if (!handleApiError(errorData, "topic bank")) {
          toast.error("Failed to load topics")
        }
      }
    } catch (error) {
      console.error("Error loading topics:", error)
      toast.error("Failed to load topics")
    } finally {
      setIsLoading(false)
    }
  }

  const calculateStats = (topicList: Topic[]) => {
    const stats = {
      total: topicList.length,
      pending: topicList.filter(t => t.status === "pending").length,
      approved: topicList.filter(t => t.status === "approved").length,
      dismissed: topicList.filter(t => t.status === "dismissed").length,
    }
    setStats(stats)
  }

  // Helper functions for per-topic content format
  const getContentFormat = (topicId: string) => {
    return contentFormats[topicId] || "story"
  }

  const setContentFormat = (topicId: string, format: string) => {
    setContentFormats(prev => ({
      ...prev,
      [topicId]: format
    }))
  }

  const filterTopics = () => {
    let filtered = topics

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(topic =>
        topic.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(topic => topic.status === statusFilter)
    }

    // Source filter
    if (sourceFilter !== "all") {
      filtered = filtered.filter(topic => topic.source === sourceFilter)
    }

    setFilteredTopics(filtered)
  }

  const cleanupOldTopics = async () => {
    if (!isActive) {
      toast.error("You need an active subscription to perform this action")
      return
    }

    try {
      setIsCleaningUp(true)
      const response = await fetch("/api/topics/clear-old", {
        method: "POST",
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`Cleaned up ${data.cleanedCount} old topics`)
        loadTopics() // Reload topics
      } else {
        const errorData = await response.json()
        if (!handleApiError(errorData, "cleanup")) {
          toast.error("Failed to cleanup old topics")
        }
      }
    } catch (error) {
      console.error("Error cleaning up topics:", error)
      toast.error("Failed to cleanup old topics")
    } finally {
      setIsCleaningUp(false)
    }
  }

  const generateAutoTopics = async () => {
    if (!isActive) {
      toast.error("You need an active subscription to generate topics")
      return
    }

    try {
      setIsGeneratingAuto(true)
      const response = await fetch("/api/topics/generate-auto", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.message || "Auto topics generation started!")
        loadTopics() // Reload topics after a delay
        setTimeout(loadTopics, 5000)
      } else {
        const errorData = await response.json()
        if (!handleApiError(errorData, "auto topic generation")) {
          toast.error("Failed to generate auto topics")
        }
      }
    } catch (error) {
      console.error("Error generating auto topics:", error)
      toast.error("Failed to generate auto topics")
    } finally {
      setIsGeneratingAuto(false)
    }
  }

  const generateManualTopics = async () => {
    if (!isActive) {
      toast.error("You need an active subscription to generate topics")
      return
    }

    if (!manualPrompt.trim()) {
      toast.error("Please enter a prompt")
      return
    }

    try {
      setIsGeneratingManual(true)
      const response = await fetch("/api/topics/generate-manual", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: manualPrompt.trim() }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.message || "Manual topics generation started!")
        setManualPrompt("")
        setIsManualDialogOpen(false)
        loadTopics() // Reload topics after a delay
        setTimeout(loadTopics, 5000)
      } else {
        const errorData = await response.json()
        if (!handleApiError(errorData, "manual topic generation")) {
          toast.error("Failed to generate manual topics")
        }
      }
    } catch (error) {
      console.error("Error generating manual topics:", error)
      toast.error("Failed to generate manual topics")
    } finally {
      setIsGeneratingManual(false)
    }
  }

  const updateTopicStatus = async (topicId: string, status: "approved" | "dismissed") => {
    try {
      const response = await fetch(`/api/topics/${status}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topicId }),
      })

      if (response.ok) {
        toast.success(`Topic ${status} successfully`)
        loadTopics() // Reload topics
      } else {
        const errorData = await response.json()
        if (!handleApiError(errorData, "topic status update")) {
          toast.error(`Failed to ${status} topic`)
        }
      }
    } catch (error) {
      console.error(`Error ${status} topic:`, error)
      toast.error(`Failed to ${status} topic`)
    }
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

  const generateContent = async (topicId: string) => {
    if (!isActive) {
      toast.error("You need an active subscription to generate content")
      return
    }

    const selectedFormat = getContentFormat(topicId)
    if (!selectedFormat || selectedFormat.trim() === "") {
      toast.error("Please select a content format first")
      return
    }

    try {
      setIsGeneratingContent(topicId)
      const response = await fetch("/api/topics/generate-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          topicId,
          contentType: selectedFormat 
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.message || "Content generation started!")
        loadTopics() // Reload topics after a delay
        setTimeout(loadTopics, 5000)
      } else {
        const errorData = await response.json()
        if (!handleApiError(errorData, "content generation")) {
          toast.error("Failed to generate content")
        }
      }
    } catch (error) {
      console.error("Error generating content:", error)
      toast.error("Failed to generate content")
    } finally {
      setIsGeneratingContent(null)
    }
  }

  const copyTopic = (title: string) => {
    navigator.clipboard.writeText(title)
    toast.success("Topic copied to clipboard")
  }

  const deleteTopic = async (topicId: string) => {
    try {
      const response = await fetch(`/api/topics/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topicId }),
      })

      if (response.ok) {
        toast.success("Topic deleted successfully")
        loadTopics() // Reload topics
      } else {
        const errorData = await response.json()
        if (!handleApiError(errorData, "topic deletion")) {
          toast.error("Failed to delete topic")
        }
      }
    } catch (error) {
      console.error("Error deleting topic:", error)
      toast.error("Failed to delete topic")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-700"
      case "pending":
        return "bg-yellow-100 text-yellow-700"
      case "dismissed":
        return "bg-red-100 text-red-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const getSourceIcon = (source: string) => {
    return source === "auto" ? <Zap className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />
  }

  const loadMonthlyUsage = async () => {
    try {
      const response = await fetch("/api/topics/monthly-usage")
      if (response.ok) {
        const data = await response.json()
        setMonthlyUsage(data.usage)
      }
    } catch (error) {
      console.error("Error loading monthly usage:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading topics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-4">
      {/* Subscription Alert Component */}
      <SubscriptionAlertComponent />

      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Topic Bank</h1>
            <p className="text-gray-600">Generate and manage your content topics with AI (2 topics per generation)</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={cleanupOldTopics} disabled={isCleaningUp} variant="outline" size="sm">
              {isCleaningUp ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Clean Up
            </Button>
            <Button onClick={loadTopics} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Current Time Display */}
      <div className="mb-6 bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-lg border border-orange-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600" />
            <span className="text-sm font-medium text-gray-700">Current Time (IST):</span>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-orange-600">
              {formatCurrentTimeIST(currentTime)}
            </div>
            <div className="text-xs text-gray-500">Live Clock</div>
          </div>
        </div>
      </div>

      {/* Monthly Usage Stats */}
      {monthlyUsage && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {monthlyUsage.topics.used}/{monthlyUsage.topics.limit}
              </div>
              <div className="text-sm text-gray-600">Monthly Topics</div>
              <div className="text-xs text-gray-500">{monthlyUsage.topics.remaining} remaining</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {monthlyUsage.content.used}/{monthlyUsage.content.limit}
              </div>
              <div className="text-sm text-gray-600">Monthly Content</div>
              <div className="text-xs text-gray-500">{monthlyUsage.content.remaining} remaining</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{monthlyUsage.resetInfo.daysUntilReset}</div>
              <div className="text-sm text-gray-600">Days Until Reset</div>
              <div className="text-xs text-gray-500">{monthlyUsage.resetInfo.nextResetDate}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Generation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Auto Generate */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Zap className="h-5 w-5" />
              Auto Generate
            </CardTitle>
            <p className="text-sm text-blue-600">Generate 2 topics based on your base story and customization data</p>
          </CardHeader>
          <CardContent>
            <Button
              onClick={generateAutoTopics}
              disabled={isGeneratingAuto || !isActive}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isGeneratingAuto ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Generating Auto Topics...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Auto Topics
                </>
              )}
            </Button>
            {!isActive && (
              <p className="text-xs text-red-500 mt-2">Active subscription required</p>
            )}
          </CardContent>
        </Card>

        {/* Manual Generate */}
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <MessageSquare className="h-5 w-5" />
              Manual Generate
            </CardTitle>
            <p className="text-sm text-purple-600">
              Generate 2 topics with your custom prompt + base story + customization
            </p>
          </CardHeader>
          <CardContent>
            <Dialog open={isManualDialogOpen} onOpenChange={setIsManualDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  disabled={!isActive}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Custom Prompt
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Generate Topics with Custom Prompt</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Your Custom Prompt</label>
                    <Textarea
                      value={manualPrompt}
                      onChange={(e) => setManualPrompt(e.target.value)}
                      placeholder="Enter your custom prompt (e.g., 'leadership challenges', 'startup lessons', 'career growth tips')..."
                      className="mt-1"
                      rows={4}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This will be combined with your base story and customization data to generate personalized topics
                    </p>
                  </div>
                  <Button
                    onClick={generateManualTopics}
                    disabled={
                      isGeneratingManual || !manualPrompt.trim() || !isActive
                    }
                    className="w-full"
                  >
                    {isGeneratingManual ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Topics
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            {!isActive && (
              <p className="text-xs text-red-500 mt-2">Active subscription required</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Topics</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <div className="text-sm text-gray-600">Approved</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.dismissed}</div>
            <div className="text-sm text-gray-600">Dismissed</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search topics..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="All Sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="auto">Auto</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Topics List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Your Topics
            <Badge variant="secondary">{filteredTopics.length} topics</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTopics.length === 0 ? (
            <div className="text-center py-8">
              <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Topics Found</h3>
              <p className="text-gray-500 mb-4">
                {topics.length === 0 ? "Generate some topics to get started" : "Try adjusting your filters"}
              </p>
              {topics.length === 0 && (
                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={generateAutoTopics}
                    disabled={isGeneratingAuto || !isActive}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Auto Topics
                  </Button>
                  <Button
                    onClick={() => setIsManualDialogOpen(true)}
                    variant="outline"
                    disabled={!isActive}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Custom Prompt
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTopics.map((topic) => (
                <div key={topic.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 pr-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className={getStatusColor(topic.status)}>
                          {topic.status}
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          {getSourceIcon(topic.source)}
                          {topic.source}
                        </Badge>
                        <span className="text-xs text-gray-500">{new Date(topic.createdAt).toLocaleDateString()}</span>
                        {topic.contentStatus === "generated" && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                            Content Generated
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-medium text-gray-900 mb-1">{topic.title}</h3>
                      {topic.userPrompt && (
                        <p className="text-xs text-gray-500 mb-2">Prompt: &ldquo;{topic.userPrompt}&rdquo;</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {topic.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => updateTopicStatus(topic.id, "approved")}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => updateTopicStatus(topic.id, "dismissed")}>
                            <X className="h-3 w-3 mr-1" />
                            Dismiss
                          </Button>
                        </>
                      )}
                      {topic.status === "approved" && topic.contentStatus !== "generated" && (
                        <div className="flex items-center gap-2">
                          <Select 
                            value={getContentFormat(topic.id)} 
                            onValueChange={(value) => setContentFormat(topic.id, value)}
                          >
                            <SelectTrigger className="w-24 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="story">Story</SelectItem>
                              <SelectItem value="tips">Tips</SelectItem>
                              <SelectItem value="insight">Insight</SelectItem>
                              <SelectItem value="question">Question</SelectItem>
                              <SelectItem value="list">List</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              generateContent(topic.id)
                            }}
                            disabled={
                              isGeneratingContent === topic.id || 
                              !isActive ||
                              !getContentFormat(topic.id) ||
                              getContentFormat(topic.id).trim() === ""
                            }
                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isGeneratingContent === topic.id ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : (
                              <Sparkles className="h-3 w-3 mr-1" />
                            )}
                            {isGeneratingContent === topic.id ? "Generating..." : "Generate"}
                          </Button>
                          {(!getContentFormat(topic.id) || getContentFormat(topic.id).trim() === "") && (
                            <span className="text-xs text-orange-600">
                              Select format first
                            </span>
                          )}
                        </div>
                      )}
                      {topic.contentStatus === "generated" && (
                        <Button size="sm" variant="outline" asChild>
                          <a href="/dashboard/approved-content">View Content</a>
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => copyTopic(topic.title)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteTopic(topic.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {!isActive && topic.status === "approved" && (
                    <p className="text-xs text-red-500 mt-2">Active subscription required for content generation</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
