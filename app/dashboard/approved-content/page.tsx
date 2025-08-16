"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { FileText, Copy, Edit, Trash2, CheckCircle, XCircle, Clock, Eye, Share2, RefreshCw, Loader2, Search, MessageSquare, Layout, Quote, ArrowUpDown, HelpCircle, Linkedin, MoreHorizontal, ImageIcon, Plus, Upload, Wand2, X, Calendar } from 'lucide-react'
import { toast } from "sonner"
import Image from "next/image"
import { useSubscription } from "@/hooks/use-subscription"

interface ApprovedContent {
  id: string
  topicId: string
  topicTitle: string
  content: string
  hashtags: string[]
  keyPoints: string[]
  imageUrl?: string
  imageGenerated?: boolean
  contentType: string
  status: "generated" | "approved" | "posted" | "failed"
  generatedAt: string
  approvedAt?: string
  postedAt?: string
  createdAt: string
  updatedAt: string
  aiGenerationUsed?: boolean // Added for AI generation limit tracking
}

export default function ApprovedContentPage() {
  const [content, setContent] = useState<ApprovedContent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [contentTypeFilter, setContentTypeFilter] = useState("all")
  const [currentTime, setCurrentTime] = useState(new Date())
  const [editForm, setEditForm] = useState({
    id: "",
    topicTitle: "",
    content: "",
    hashtags: "",
    keyPoints: "",
  })
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [selectedContent, setSelectedContent] = useState<ApprovedContent | null>(null)
  const [contentLoading, setContentLoading] = useState(false)
  const [showImageDialog, setShowImageDialog] = useState(false)
  const [imageLoading, setImageLoading] = useState(false)
  const [selectedImageContent, setSelectedImageContent] = useState<ApprovedContent | null>(null)
  const [imageAction, setImageAction] = useState<'generate' | 'upload' | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [updatingContentType, setUpdatingContentType] = useState<string | null>(null)
  const [showContentTypeConfirm, setShowContentTypeConfirm] = useState(false)
  const [pendingContentTypeChange, setPendingContentTypeChange] = useState<{contentId: string, newType: string} | null>(null)
  
  // State for scheduling modal
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [selectedContentForSchedule, setSelectedContentForSchedule] = useState<ApprovedContent | null>(null)
  const [scheduleDate, setScheduleDate] = useState("")
  const [scheduleTime, setScheduleTime] = useState("")
  const [schedulingLoading, setSchedulingLoading] = useState(false)

  // Subscription hook
  const {
    isActive,
    canGenerateContent,
    handleApiError,
    SubscriptionAlertComponent
  } = useSubscription()

  const loadApprovedContent = async () => {
    try {
      setLoading(true)
      console.log("🔄 Loading approved content...")

      const response = await fetch("/api/approved-content")
      if (response.ok) {
        const data = await response.json()
        console.log("✅ Loaded content:", data.content?.length || 0, "items")
        
        // Debug image data
        data.content?.forEach((item: any, index: number) => {
          console.log(`📸 Item ${index + 1}:`, {
            id: item.id,
            topicTitle: item.topicTitle,
            imageUrl: item.imageUrl,
            imageGenerated: item.imageGenerated,
            hasImage: !!item.imageUrl
          })
        })
        
        setContent(data.content || [])
      } else {
        console.error("❌ Failed to load approved content:", response.status)
        toast.error("Failed to load approved content")
      }
    } catch (error) {
      console.error("❌ Error loading approved content:", error)
      toast.error("Failed to load approved content")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (item: ApprovedContent) => {
    setEditForm({
      id: item.id,
      topicTitle: item.topicTitle,
      content: item.content,
      hashtags: item.hashtags?.join(", ") || "",
      keyPoints: item.keyPoints?.join(", ") || "",
    })
    setShowEditDialog(true)
  }

  const handleView = (item: ApprovedContent) => {
    setSelectedContent(item)
    setShowViewDialog(true)
  }

  const handleSaveEdit = async () => {
    try {
      const response = await fetch(`/api/approved-content/${editForm.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicTitle: editForm.topicTitle,
          content: editForm.content,
          hashtags: editForm.hashtags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
          keyPoints: editForm.keyPoints
            .split(",")
            .map((point) => point.trim())
            .filter(Boolean),
        }),
      })

      if (response.ok) {
        toast.success("Content updated successfully")
        setShowEditDialog(false)
        loadApprovedContent()
      } else {
        toast.error("Failed to update content")
      }
    } catch (error) {
      console.error("Error updating content:", error)
      toast.error("Failed to update content")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/approved-content/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Content deleted successfully")
        setShowDeleteDialog(false)
        loadApprovedContent()
      } else {
        toast.error("Failed to delete content")
      }
    } catch (error) {
      console.error("Error deleting content:", error)
      toast.error("Failed to delete content")
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      generated: "bg-blue-100 text-blue-800",
      approved: "bg-green-100 text-green-800",
      posted: "bg-purple-100 text-purple-800",
      failed: "bg-red-100 text-red-800",
    }
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const getStatusIcon = (status: string) => {
    const icons = {
      generated: <FileText className="w-3 h-3" />,
      approved: <CheckCircle className="w-3 h-3" />,
      posted: <Share2 className="w-3 h-3" />,
      failed: <XCircle className="w-3 h-3" />,
    }
    return icons[status as keyof typeof icons] || <FileText className="w-3 h-3" />
  }

  const getContentTypeIcon = (contentType: string) => {
    const icons = {
      storytelling: <MessageSquare className="w-3 h-3" />,
      listicle: <Layout className="w-3 h-3" />,
      quote_based: <Quote className="w-3 h-3" />,
      before_after: <ArrowUpDown className="w-3 h-3" />,
      question_driven: <HelpCircle className="w-3 h-3" />,
    }
    return icons[contentType as keyof typeof icons] || <FileText className="w-3 h-3" />
  }

  const getContentTypeColor = (contentType: string) => {
    const colors = {
      storytelling: "bg-blue-100 text-blue-800",
      listicle: "bg-green-100 text-green-800",
      quote_based: "bg-purple-100 text-purple-800",
      before_after: "bg-orange-100 text-orange-800",
      question_driven: "bg-pink-100 text-pink-800",
    }
    return colors[contentType as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const getContentTypeLabel = (contentType: string) => {
    const labels = {
      storytelling: "Story",
      listicle: "List",
      quote_based: "Quote",
      before_after: "B/A",
      question_driven: "Q&A",
    }
    return labels[contentType as keyof typeof labels] || contentType
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Content copied to clipboard")
  }

  const handleSchedule = (content: ApprovedContent) => {
    setSelectedContentForSchedule(content)
    // Set default date to tomorrow and time to 9 AM
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    setScheduleDate(tomorrow.toISOString().split('T')[0])
    setScheduleTime("09:00")
    setShowScheduleModal(true)
  }

  const handleScheduleSubmit = async () => {
    if (!selectedContentForSchedule || !scheduleDate || !scheduleTime) {
      toast.error("Please select date and time")
      return
    }

    setSchedulingLoading(true)
    try {
      // Create a proper date string in IST timezone
      const dateTimeString = `${scheduleDate}T${scheduleTime}:00`
      
      // Create date object and treat it as IST, then convert to UTC
      const scheduledDateTime = new Date(dateTimeString + '+05:30') // Explicitly set IST timezone
      const utcTime = new Date(scheduledDateTime.getTime() - (5.5 * 60 * 60 * 1000)) // Convert to UTC

      console.log(`📅 User selected (IST): ${dateTimeString}`)
      console.log(`📅 UTC time being sent: ${utcTime.toISOString()}`)
      console.log(`📅 Will be posted at (IST): ${utcTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`)

      const response = await fetch(`/api/approved-content/${selectedContentForSchedule.id}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledFor: utcTime.toISOString(),
        }),
      })

      if (response.ok) {
        toast.success("Content scheduled successfully!")
        setShowScheduleModal(false)
        setSelectedContentForSchedule(null)
        loadApprovedContent()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to schedule content")
      }
    } catch (error) {
      console.error("Error scheduling content:", error)
      toast.error("Failed to schedule content")
    } finally {
      setSchedulingLoading(false)
    }
  }

  const handlePostToLinkedIn = async (contentId: string) => {
    try {
      const response = await fetch(`/api/approved-content/${contentId}/post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (response.ok) {
        toast.success("Content posted to LinkedIn successfully")
        loadApprovedContent()
      } else {
        toast.error("Failed to post to LinkedIn")
      }
    } catch (error) {
      console.error("Error posting to LinkedIn:", error)
      toast.error("Failed to post to LinkedIn")
    }
  }

  const handleRegenerateContent = async (contentId: string) => {
    try {
      setContentLoading(true)
      toast.loading("Regenerating content...")

      const response = await fetch(`/api/approved-content/${contentId}/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (response.ok) {
        toast.dismiss()
        toast.success("Content regenerated successfully!")
        loadApprovedContent()
      } else {
        const error = await response.json()
        toast.dismiss()
        toast.error(error.error || "Failed to regenerate content")
      }
    } catch (error) {
      console.error("Error regenerating content:", error)
      toast.dismiss()
      toast.error("Failed to regenerate content")
    } finally {
      setContentLoading(false)
    }
  }

  const handleImageOptions = (item: ApprovedContent) => {
    setSelectedImageContent(item)
    setShowImageDialog(true)
    setImageAction(null)
  }

  const handleGenerateImage = async (contentId: string, isRegenerate = false) => {
    try {
      setImageLoading(true)
      setImageAction('generate')
      
      const response = await fetch(`/api/approved-content/${contentId}/generate-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRegenerate }),
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(result.message || (isRegenerate ? "Image regenerated successfully!" : "Image generated successfully!"))
        setShowImageDialog(false)
        loadApprovedContent()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to generate image")
      }
    } catch (error) {
      console.error("Error generating image:", error)
      toast.error("Failed to generate image")
    } finally {
      setImageLoading(false)
      setImageAction(null)
    }
  }

  const handleUploadImage = async (contentId: string, imageFile: File, isReplace = false) => {
    try {
      setImageLoading(true)
      setImageAction('upload')

      // Validate file size (max 5MB)
      if (imageFile.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB")
        setImageLoading(false)
        setImageAction(null)
        return
      }

      // Validate file type
      if (!imageFile.type.startsWith('image/')) {
        toast.error("Please select a valid image file")
        setImageLoading(false)
        setImageAction(null)
        return
      }

      // Convert file to base64
      const reader = new FileReader()
      reader.readAsDataURL(imageFile)
      
      reader.onload = async () => {
        try {
          const base64Image = reader.result as string

          const response = await fetch(`/api/approved-content/${contentId}/upload-image`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              imageFile: base64Image,
              isReplace 
            }),
          })

          if (response.ok) {
            const result = await response.json()
            toast.success(result.message || (isReplace ? "Image replaced successfully!" : "Image uploaded successfully!"))
            setShowImageDialog(false)
            loadApprovedContent()
          } else {
            const error = await response.json()
            toast.error(error.error || "Failed to upload image")
          }
        } catch (error) {
          console.error("Error uploading image:", error)
          toast.error("Failed to upload image")
        } finally {
          setImageLoading(false)
          setImageAction(null)
        }
      }

      reader.onerror = () => {
        toast.error("Failed to read image file")
        setImageLoading(false)
        setImageAction(null)
      }
    } catch (error) {
      console.error("Error uploading image:", error)
      toast.error("Failed to upload image")
      setImageLoading(false)
      setImageAction(null)
    }
  }

  const handleDeleteImage = async (contentId: string) => {
    try {
      setImageLoading(true)
      console.log("🗑️ Deleting image for content:", contentId)

      const response = await fetch(`/api/approved-content/${contentId}/delete-image`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      })

      if (response.ok) {
        const result = await response.json()
        console.log("✅ Delete image response:", result)
        toast.success(result.message || "Image deleted successfully!")
        setShowImageDialog(false)
        
        // Force reload content to see the change
        console.log("🔄 Reloading content after image deletion...")
        await loadApprovedContent()
        
        // Debug: Check if content was updated
        console.log("📊 Current content after reload:", content.length, "items")
      } else {
        const error = await response.json()
        console.error("❌ Delete image error:", error)
        toast.error(error.error || "Failed to delete image")
      }
    } catch (error) {
      console.error("Error deleting image:", error)
      toast.error("Failed to delete image")
    } finally {
      setImageLoading(false)
    }
  }

  const handleStatusUpdate = async (contentId: string, newStatus: string) => {
    try {
      setUpdatingStatus(contentId)
      
      const response = await fetch(`/api/approved-content/${contentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        toast.success("Status updated successfully")
        loadApprovedContent()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to update status")
      }
    } catch (error) {
      console.error("Error updating status:", error)
      toast.error("Failed to update status")
    } finally {
      setUpdatingStatus(null)
    }
  }

  const handleContentTypeUpdate = async (contentId: string, newContentType: string) => {
    // Show confirmation dialog first
    setPendingContentTypeChange({ contentId, newType: newContentType })
    setShowContentTypeConfirm(true)
  }

  const confirmContentTypeChange = async () => {
    if (!pendingContentTypeChange) return

    // Check subscription for content generation
    if (!isActive || !canGenerateContent) {
      toast.error("You need an active subscription to regenerate content")
      return
    }

    try {
      setUpdatingContentType(pendingContentTypeChange.contentId)
      
      // First update the content type
      const response = await fetch(`/api/approved-content/${pendingContentTypeChange.contentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: pendingContentTypeChange.newType }),
      })

      if (response.ok) {
        // Then regenerate the content with the new type
        const regenerateResponse = await fetch(`/api/approved-content/${pendingContentTypeChange.contentId}/regenerate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contentType: pendingContentTypeChange.newType }),
        })

        if (regenerateResponse.ok) {
          toast.success(`Content type changed to ${getContentTypeLabel(pendingContentTypeChange.newType)} and content regenerated successfully`)
          loadApprovedContent()
        } else {
          const error = await regenerateResponse.json()
          if (!handleApiError(error, "content regeneration")) {
            toast.error(error.error || "Content type updated but failed to regenerate content")
          }
          loadApprovedContent() // Still reload to show the type change
        }
      } else {
        const error = await response.json()
        if (!handleApiError(error, "content type update")) {
          toast.error(error.error || "Failed to update content type")
        }
      }
    } catch (error) {
      console.error("Error updating content type:", error)
      toast.error("Failed to update content type")
    } finally {
      setUpdatingContentType(null)
      setShowContentTypeConfirm(false)
      setPendingContentTypeChange(null)
    }
  }

  // Filter content based on search and filters
  const filteredContent = content.filter((item) => {
    const matchesSearch =
      item.topicTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || item.status === statusFilter
    const matchesType = contentTypeFilter === "all" || item.contentType === contentTypeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  useEffect(() => {
    loadApprovedContent()
  }, [])

  // Update current time every second
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timeInterval)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <SubscriptionAlertComponent />
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Approved Content</h1>
              <p className="text-gray-600 text-sm sm:text-base lg:text-lg">
                Manage your content from approved topics ({content.length} items)
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                onClick={loadApprovedContent}
                variant="outline"
                className="flex items-center gap-2 bg-transparent flex-1 sm:flex-none"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Current Time Display */}
        <div className="mb-4 bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">Current Time (IST):</span>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-purple-600">
                {formatCurrentTimeIST(currentTime)}
              </div>
              <div className="text-xs text-gray-500">Live Clock</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 sm:mb-6">
          <Card>
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex flex-col gap-3 sm:gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search content..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="border rounded-md px-3 py-2 bg-white text-sm flex-1 sm:flex-none"
                  >
                    <option value="all">All Status</option>
                    <option value="generated">Generated</option>
                    <option value="approved">Approved</option>
                    <option value="posted">Posted</option>
                    <option value="failed">Failed</option>
                  </select>
                  <select
                    value={contentTypeFilter}
                    onChange={(e) => setContentTypeFilter(e.target.value as any)}
                    className="border rounded-md px-3 py-2 bg-white text-sm flex-1 sm:flex-none"
                  >
                    <option value="all">All Types</option>
                    <option value="storytelling">Storytelling</option>
                    <option value="listicle">Listicle</option>
                    <option value="quote_based">Quote-Based</option>
                    <option value="before_after">Before vs After</option>
                    <option value="question_driven">Question-Driven</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Table */}
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-blue-100 bg-gradient-to-r from-blue-50 to-blue-100">
            <CardTitle className="text-lg sm:text-xl font-bold text-blue-900 flex items-center gap-2">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
              Content Management
            </CardTitle>
            <CardDescription className="text-blue-700 text-xs sm:text-sm">
              Review and manage your approved content
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Loading content...</span>
              </div>
            ) : filteredContent.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Content Found</h3>
                <p className="text-gray-500">
                  {content.length === 0
                    ? "Generate content from your approved topics to see it here."
                    : "No content matches your current filters."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {/* Mobile Card View */}
                <div className="block sm:hidden">
                  <div className="space-y-4 p-4">
                    {filteredContent.map((item) => (
                      <Card key={item.id} className="border border-blue-100">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3 mb-3">
                            {/* Image Display for Mobile */}
                            <div className="flex-shrink-0">
                              {item.imageUrl ? (
                                <div className="relative">
                                  <Image 
                                    src={item.imageUrl} 
                                    alt="Content image" 
                                    width={60}
                                    height={60}
                                    className="w-15 h-15 object-cover rounded-lg border border-blue-200"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.src = "/placeholder.svg?height=60&width=60&text=Image+Error";
                                    }}
                                  />
                                  {item.imageGenerated && (
                                    <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs px-1 py-0.5 rounded-full font-medium">
                                      AI
                                    </div>
                                  )}
                                  {item.aiGenerationUsed && !item.imageGenerated && (
                                    <div className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs px-1 py-0.5 rounded-full font-medium">
                                      Used
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="relative">
                                  <div className="w-15 h-15 border-2 border-dashed border-blue-300 rounded-lg flex items-center justify-center bg-gray-50">
                                    <ImageIcon className="w-6 h-6 text-blue-400" />
                                  </div>
                                  {item.aiGenerationUsed && (
                                    <div className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs px-1 py-0.5 rounded-full font-medium">
                                      Used
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-blue-900 text-sm mb-1 line-clamp-2">{item.topicTitle}</h4>
                              <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                                {item.content.substring(0, 100)}...
                              </p>
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={`${getStatusColor(item.status)} text-xs`}>
                                  {getStatusIcon(item.status)}
                                  <span className="ml-1">{item.status}</span>
                                </Badge>
                              </div>
                              <div className="mb-2 space-y-2">
                                <select
                                  value={item.status}
                                  onChange={(e) => handleStatusUpdate(item.id, e.target.value)}
                                  disabled={updatingStatus === item.id}
                                  className={`border rounded-md px-2 py-1 text-xs font-medium w-full ${
                                    updatingStatus === item.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                                  } ${
                                    item.status === 'approved' ? 'bg-green-100 text-green-800 border-green-300' :
                                    item.status === 'posted' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                                    item.status === 'failed' ? 'bg-red-100 text-red-800 border-red-300' :
                                    item.status === 'generated' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                                    'bg-gray-100 text-gray-800 border-gray-300'
                                  }`}
                                >
                                  <option value="generated">Generated</option>
                                  <option value="approved">Approved</option>
                                  <option value="posted">Posted</option>
                                  <option value="failed">Failed</option>
                                </select>
                                {updatingStatus === item.id && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                                    <span className="text-xs text-blue-600">Updating...</span>
                                  </div>
                                )}
                                
                                <select
                                  value={item.contentType}
                                  onChange={(e) => handleContentTypeUpdate(item.id, e.target.value)}
                                  disabled={updatingContentType === item.id}
                                  className={`border rounded-md px-2 py-1 text-xs font-medium w-full ${
                                    updatingContentType === item.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                                  } ${
                                    item.contentType === 'storytelling' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                                    item.contentType === 'listicle' ? 'bg-green-100 text-green-800 border-green-300' :
                                    item.contentType === 'quote_based' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                                    item.contentType === 'before_after' ? 'bg-orange-100 text-orange-800 border-orange-300' :
                                    item.contentType === 'question_driven' ? 'bg-pink-100 text-pink-800 border-pink-300' :
                                    'bg-gray-100 text-gray-800 border-gray-300'
                                  }`}
                                >
                                  <option value="storytelling">Story</option>
                                  <option value="listicle">List</option>
                                  <option value="quote_based">Quote</option>
                                  <option value="before_after">Before/After</option>
                                  <option value="question_driven">Q&A</option>
                                </select>
                                {updatingContentType === item.id && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                                    <span className="text-xs text-blue-600">Updating...</span>
                                  </div>
                                )}
                              </div>
                              {item.hashtags && item.hashtags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {item.hashtags.slice(0, 2).map((hashtag, idx) => (
                                    <span
                                      key={idx}
                                      className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full"
                                    >
                                      #{hashtag}
                                    </span>
                                  ))}
                                  {item.hashtags.length > 2 && (
                                    <span className="text-xs text-blue-500">+{item.hashtags.length - 2}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Mobile Actions */}
                          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleView(item)}
                                className="h-8 w-8 p-0"
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(item.content)}
                                className="h-8 w-8 p-0"
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(item)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => handlePostToLinkedIn(item.id)}>
                                  <Linkedin className="w-4 h-4 mr-2" />
                                  Post to LinkedIn
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSchedule(item)}>
                                  <Clock className="w-4 h-4 mr-2" />
                                  Schedule
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedContent(item)
                                    setShowDeleteDialog(true)
                                  }}
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Desktop Table View */}
                <div className="hidden sm:block">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-blue-50 to-blue-100 border-b-2 border-blue-200">
                        <TableHead className="font-bold text-blue-800 py-4 text-sm">CONTENT</TableHead>
                        <TableHead className="font-bold text-blue-800 py-4 text-sm">IMAGE</TableHead>
                        <TableHead className="font-bold text-blue-800 py-4 text-sm">TYPE</TableHead>
                        <TableHead className="font-bold text-blue-800 py-4 text-sm">STATUS</TableHead>
                        <TableHead className="font-bold text-blue-800 py-4 text-sm text-right">ACTIONS</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredContent.map((item, index) => (
                        <TableRow
                          key={item.id}
                          className={`hover:bg-blue-50/70 transition-all duration-300 border-b border-blue-50 ${
                            index % 2 === 0 ? "bg-white" : "bg-blue-25"
                          }`}
                        >
                          <TableCell className="py-6">
                            <div className="max-w-md">
                              <h4 className="font-bold text-blue-900 truncate mb-2 text-sm" title={item.topicTitle}>
                                {item.topicTitle}
                              </h4>
                              <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                                {item.content.substring(0, 120)}
                                {item.content.length > 120 && "..."}
                              </p>
                              {item.hashtags && item.hashtags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-3">
                                  {item.hashtags.slice(0, 2).map((hashtag, idx) => (
                                    <span
                                      key={idx}
                                      className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium"
                                    >
                                      #{hashtag}
                                    </span>
                                  ))}
                                  {item.hashtags.length > 2 && (
                                    <span className="text-xs text-blue-500 font-medium">
                                      +{item.hashtags.length - 2}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-6">
                            <div className="flex items-center justify-center">
                              {item.imageUrl ? (
                                <div className="relative group">
                                  <Image 
                                    src={item.imageUrl} 
                                    alt="Content image" 
                                    width={48}
                                    height={48}
                                    className="w-12 h-12 object-cover rounded-lg border-2 border-blue-200 shadow-sm"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.src = "/placeholder.svg?height=48&width=48&text=Image+Error";
                                      console.log("❌ Image failed to load:", item.imageUrl)
                                    }}
                                    onLoad={() => {
                                      console.log("✅ Image loaded successfully:", item.imageUrl)
                                    }}
                                  />
                                  {item.imageGenerated && (
                                    <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs px-1 py-0.5 rounded-full font-medium">
                                      AI
                                    </div>
                                  )}
                                  {item.aiGenerationUsed && !item.imageGenerated && (
                                    <div className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs px-1 py-0.5 rounded-full font-medium">
                                      Used
                                    </div>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleImageOptions(item)}
                                    className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 bg-black/50 rounded-lg transition-opacity flex items-center justify-center"
                                  >
                                    <Edit className="w-4 h-4 text-white" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="relative">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleImageOptions(item)}
                                    className="h-12 w-12 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center"
                                  >
                                    <Plus className="w-5 h-5 text-blue-500" />
                                  </Button>
                                  {item.aiGenerationUsed && (
                                    <div className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs px-1 py-0.5 rounded-full font-medium">
                                      Used
                                    </div>
                                  )}
                                  <div className="absolute -top-1 -right-1 bg-gray-400 text-white text-xs px-1 py-0.5 rounded-full font-medium">
                                    No
                                  </div>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-6">
                            <div className="flex flex-col gap-2">
                              <select
                                value={item.contentType}
                                onChange={(e) => handleContentTypeUpdate(item.id, e.target.value)}
                                disabled={updatingContentType === item.id}
                                className={`border rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                                  updatingContentType === item.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                                } ${
                                  item.contentType === 'storytelling' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                                  item.contentType === 'listicle' ? 'bg-green-100 text-green-800 border-green-300' :
                                  item.contentType === 'quote_based' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                                  item.contentType === 'before_after' ? 'bg-orange-100 text-orange-800 border-orange-300' :
                                  item.contentType === 'question_driven' ? 'bg-pink-100 text-pink-800 border-pink-300' :
                                  'bg-gray-100 text-gray-800 border-gray-300'
                                }`}
                              >
                                <option value="storytelling">Story</option>
                                <option value="listicle">List</option>
                                <option value="quote_based">Quote</option>
                                <option value="before_after">Before/After</option>
                                <option value="question_driven">Q&A</option>
                              </select>
                              {updatingContentType === item.id && (
                                <div className="flex items-center gap-1 mt-1">
                                  <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                                  <span className="text-xs text-blue-600">Updating...</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-6">
                            <select
                              value={item.status}
                              onChange={(e) => handleStatusUpdate(item.id, e.target.value)}
                              disabled={updatingStatus === item.id}
                              className={`border rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                                updatingStatus === item.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                              } ${
                                item.status === 'approved' ? 'bg-green-100 text-green-800 border-green-300' :
                                item.status === 'posted' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                                item.status === 'failed' ? 'bg-red-100 text-red-800 border-red-300' :
                                item.status === 'generated' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                                'bg-gray-100 text-gray-800 border-gray-300'
                              }`}
                            >
                              <option value="generated">Generated</option>
                              <option value="approved">Approved</option>
                              <option value="posted">Posted</option>
                              <option value="failed">Failed</option>
                            </select>
                            {updatingStatus === item.id && (
                              <div className="flex items-center gap-1 mt-1">
                                <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                                <span className="text-xs text-blue-600">Updating...</span>
                              </div>
                            )}
                          </TableCell>

                          <TableCell className="py-6 text-right">
                            <TooltipProvider>
                              <div className="flex items-center justify-end gap-2">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleView(item)}
                                      className="h-9 w-9 p-0 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>View details</p>
                                  </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => copyToClipboard(item.content)}
                                      className="h-9 w-9 p-0 hover:bg-green-100 hover:text-green-700 transition-colors"
                                    >
                                      <Copy className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Copy content</p>
                                  </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleEdit(item)}
                                      className="h-9 w-9 p-0 hover:bg-orange-100 hover:text-orange-700 transition-colors"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Edit content</p>
                                  </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handlePostToLinkedIn(item.id)}
                                      className="h-9 w-9 p-0 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                                    >
                                      <Linkedin className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Post to LinkedIn</p>
                                  </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleSchedule(item)}
                                      className="h-9 w-9 p-0 hover:bg-purple-100 hover:text-purple-700 transition-colors"
                                    >
                                      <Clock className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Schedule post</p>
                                  </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleRegenerateContent(item.id)}
                                      className="h-9 w-9 p-0 hover:bg-yellow-100 hover:text-yellow-700 transition-colors"
                                      disabled={contentLoading}
                                    >
                                      <RefreshCw className={`w-4 h-4 ${contentLoading ? "animate-spin" : ""}`} />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Regenerate content</p>
                                  </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        setSelectedContent(item)
                                        setShowDeleteDialog(true)
                                      }}
                                      className="h-9 w-9 p-0 hover:bg-red-100 hover:text-red-700 transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Delete content</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </TooltipProvider>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Dialog - Simplified */}
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Content Preview
              </DialogTitle>
            </DialogHeader>
            {selectedContent && (
              <div className="space-y-6">
                {/* Image Section */}
                {selectedContent.imageUrl && (
                  <div className="flex justify-center">
                    <div className="relative">
                      <Image 
                        src={selectedContent.imageUrl || "/placeholder.svg"} 
                        alt="Content image" 
                        width={400}
                        height={250}
                        className="w-full max-w-md h-auto object-cover rounded-xl border shadow-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/placeholder.svg?height=250&width=400&text=Image+Not+Found";
                        }}
                      />
                      {selectedContent.imageGenerated && (
                        <div className="absolute top-3 right-3 bg-blue-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                          AI Generated
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Content Section */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{selectedContent.topicTitle}</h3>
                  <div className="flex items-center gap-3 mb-4">
                    <Badge className={`${getStatusColor(selectedContent.status)} flex items-center gap-1`}>
                      {getStatusIcon(selectedContent.status)}
                      {selectedContent.status}
                    </Badge>
                    <Badge className={`${getContentTypeColor(selectedContent.contentType)} flex items-center gap-1`}>
                      {getContentTypeIcon(selectedContent.contentType)}
                      {getContentTypeLabel(selectedContent.contentType)}
                    </Badge>
                  </div>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-base">
                      {selectedContent.content}
                    </p>
                  </div>
                </div>

                {/* Hashtags */}
                {selectedContent.hashtags && selectedContent.hashtags.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Hashtags</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedContent.hashtags.map((hashtag, idx) => (
                        <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-2 rounded-full text-sm font-medium">
                          #{hashtag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Key Points */}
                {selectedContent.keyPoints && selectedContent.keyPoints.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Key Points</h4>
                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                      {selectedContent.keyPoints.map((point, idx) => (
                        <li key={idx} className="text-base">{point}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <Button onClick={() => copyToClipboard(selectedContent.content)} className="flex-1">
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Content
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handlePostToLinkedIn(selectedContent.id)}
                    className="flex-1"
                  >
                    <Linkedin className="w-4 h-4 mr-2" />
                    Post to LinkedIn
                  </Button>
                  <Button variant="outline" onClick={() => setShowViewDialog(false)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Content</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Topic Title</label>
                <Input
                  value={editForm.topicTitle}
                  onChange={(e) => setEditForm({ ...editForm, topicTitle: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Content</label>
                <Textarea
                  value={editForm.content}
                  onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                  rows={8}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Hashtags (comma separated)</label>
                <Input
                  value={editForm.hashtags}
                  onChange={(e) => setEditForm({ ...editForm, hashtags: e.target.value })}
                  placeholder="hashtag1, hashtag2, hashtag3"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Key Points (comma separated)</label>
                <Input
                  value={editForm.keyPoints}
                  onChange={(e) => setEditForm({ ...editForm, keyPoints: e.target.value })}
                  placeholder="point1, point2, point3"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveEdit} className="flex-1">
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Content</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this content? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-2">
              <Button variant="destructive" onClick={() => selectedContent && handleDelete(selectedContent.id)}>
                Delete
              </Button>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Image Options Dialog - Fixed Loading States */}
        <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Image Options
              </DialogTitle>
              <DialogDescription>
                {selectedImageContent?.imageUrl 
                  ? "Manage the image for this content" 
                  : "Add an image to this content"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedImageContent?.imageUrl && (
                <div className="flex justify-center">
                  <div className="relative">
                    <Image 
                      src={selectedImageContent.imageUrl || "/placeholder.svg"} 
                      alt="Current image" 
                      width={200}
                      height={120}
                      className="w-full max-w-[200px] h-auto object-cover rounded-lg border shadow-sm"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/placeholder.svg?height=120&width=200&text=Image+Error";
                      }}
                    />
                    {selectedImageContent.imageGenerated && (
                      <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                        AI Generated
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="space-y-3">
                {selectedImageContent?.imageUrl ? (
                  <>
                    {/* Only show regenerate if it's NOT an AI generated image, or if AI generation hasn't been used yet */}
                    {(!selectedImageContent.imageGenerated || !selectedImageContent.aiGenerationUsed) && (
                      <Button
                        onClick={() => selectedImageContent && handleGenerateImage(selectedImageContent.id, true)}
                        disabled={imageLoading}
                        className="w-full"
                        variant="outline"
                      >
                        {imageLoading && imageAction === 'generate' ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Wand2 className="w-4 h-4 mr-2" />
                        )}
                        {imageLoading && imageAction === 'generate' ? 'Regenerating...' : 'Regenerate with AI'}
                      </Button>
                    )}
                    
                    {/* Show message if AI generation limit reached */}
                    {selectedImageContent.imageGenerated && selectedImageContent.aiGenerationUsed && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center gap-2 text-yellow-800">
                          <Wand2 className="w-4 h-4" />
                          <span className="text-sm font-medium">AI generation limit reached</span>
                        </div>
                        <p className="text-xs text-yellow-600 mt-1">
                          You can only generate one AI image per post. Please upload your own image instead.
                        </p>
                      </div>
                    )}
                    
                    <Button
                      onClick={() => {
                        const input = document.createElement('input')
                        input.type = 'file'
                        input.accept = 'image/*'
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0]
                          if (file && selectedImageContent) {
                            handleUploadImage(selectedImageContent.id, file, true)
                          }
                        }
                        input.click()
                      }}
                      disabled={imageLoading}
                      className="w-full"
                      variant="outline"
                    >
                      {imageLoading && imageAction === 'upload' ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 mr-2" />
                      )}
                      {imageLoading && imageAction === 'upload' ? 'Uploading...' : 'Replace with Upload'}
                    </Button>
                    
                    <Button
                      onClick={() => selectedImageContent && handleDeleteImage(selectedImageContent.id)}
                      disabled={imageLoading}
                      className="w-full"
                      variant="destructive"
                    >
                      {imageLoading && !imageAction ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <X className="w-4 h-4 mr-2" />
                      )}
                      {imageLoading && !imageAction ? 'Deleting...' : 'Delete Image'}
                    </Button>
                  </>
                ) : (
                  <>
                    {/* Only show generate if AI generation hasn't been used yet */}
                    {!selectedImageContent?.aiGenerationUsed && (
                      <Button
                        onClick={() => selectedImageContent && handleGenerateImage(selectedImageContent.id)}
                        disabled={imageLoading}
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                      >
                        {imageLoading && imageAction === 'generate' ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Wand2 className="w-4 h-4 mr-2" />
                        )}
                        {imageLoading && imageAction === 'generate' ? 'Generating...' : 'Generate with AI'}
                      </Button>
                    )}
                    
                    {/* Show message if AI generation limit reached */}
                    {selectedImageContent?.aiGenerationUsed && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center gap-2 text-yellow-800">
                          <Wand2 className="w-4 h-4" />
                          <span className="text-sm font-medium">AI generation limit reached</span>
                        </div>
                        <p className="text-xs text-yellow-600 mt-1">
                          You can only generate one AI image per post. Please upload your own image instead.
                        </p>
                      </div>
                    )}
                    
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or</span>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => {
                        const input = document.createElement('input')
                        input.type = 'file'
                        input.accept = 'image/*'
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0]
                          if (file && selectedImageContent) {
                            handleUploadImage(selectedImageContent.id, file, false)
                          }
                        }
                        input.click()
                      }}
                      disabled={imageLoading}
                      className="w-full"
                      variant="outline"
                    >
                      {imageLoading && imageAction === 'upload' ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 mr-2" />
                      )}
                      {imageLoading && imageAction === 'upload' ? 'Uploading...' : 'Upload Image'}
                    </Button>
                  </>
                )}
              </div>
              
              <div className="text-xs text-gray-500 text-center">
                Supported formats: JPG, PNG, WebP, GIF (Max 5MB)
              </div>
              
              <Button 
                variant="outline" 
                onClick={() => setShowImageDialog(false)}
                className="w-full"
                disabled={imageLoading}
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Content Type Confirmation Dialog */}
        <Dialog open={showContentTypeConfirm} onOpenChange={setShowContentTypeConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Content Type Change</DialogTitle>
              <DialogDescription>
                Are you sure you want to change the content type of this content to{" "}
                <span className="font-semibold">{getContentTypeLabel(pendingContentTypeChange?.newType || "")}</span>?
                This will regenerate the content.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-2">
              <Button variant="destructive" onClick={confirmContentTypeChange}>
                Confirm
              </Button>
              <Button variant="outline" onClick={() => setShowContentTypeConfirm(false)}>
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Schedule Modal */}
        <Dialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Schedule Post
              </DialogTitle>
              <DialogDescription>
                Choose when you want this post to be published on LinkedIn
              </DialogDescription>
            </DialogHeader>
            
            {selectedContentForSchedule && (
              <div className="space-y-4">
                {/* Content Preview */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">{selectedContentForSchedule.topicTitle}</h4>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {selectedContentForSchedule.content.substring(0, 100)}
                    {selectedContentForSchedule.content.length > 100 && "..."}
                  </p>
                </div>

                {/* Date and Time Selection */}
                <div className="space-y-4">
                  <div>
                    <label htmlFor="schedule-date" className="block text-sm font-medium text-gray-700 mb-2">
                      Date
                    </label>
                    <input
                      id="schedule-date"
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">Select a future date</p>
                  </div>
                  
                  <div>
                    <label htmlFor="schedule-time" className="block text-sm font-medium text-gray-700 mb-2">
                      Time (IST)
                    </label>
                    <input
                      id="schedule-time"
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">Select a time at least 2 minutes from now</p>
                  </div>
                </div>

                {/* Selected DateTime Display */}
                {scheduleDate && scheduleTime && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-800">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm font-medium">Scheduled for:</span>
                    </div>
                    <p className="text-sm text-blue-700 mt-1">
                      {new Date(`${scheduleDate}T${scheduleTime}`).toLocaleString('en-IN', {
                        timeZone: 'Asia/Kolkata',
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowScheduleModal(false)}
                disabled={schedulingLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleScheduleSubmit}
                disabled={schedulingLoading || !scheduleDate || !scheduleTime}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                {schedulingLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 mr-2" />
                    Schedule Post
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  )
}
