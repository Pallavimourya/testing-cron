"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Sparkles,
  CheckCircle,
  X,
  FileText,
  Trash2,
  Plus,
  Filter,
  Search,
  Edit,
  Save,
  Copy,
  Loader2,
  Lightbulb,
  Target,
  Users,
  TrendingUp,
  BookOpen,
  Zap,
  Star,
  Clock,
  Tag,
  Calendar,
  BarChart3,
  Download,
  Share2,
  Settings,
  Award,
  Rocket,
  Brain,
  Heart,
  Briefcase,
  GraduationCap,
  Globe,
  MessageSquare,
} from "lucide-react"
import { toast } from "sonner"

interface Topic {
  id: string
  title: string
  status: "pending" | "saved" | "dismissed"
  content?: string
  createdAt: string
  source: "auto" | "manual"
  category?: string
  difficulty?: string
  contentType?: string
  tags?: string[]
  estimatedReadTime?: number
  engagementScore?: number
}

export default function TopicBankEnhancedPage() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [isGeneratingTopics, setIsGeneratingTopics] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "saved" | "dismissed">("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all")
  const [manualPrompt, setManualPrompt] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Leadership")
  const [selectedDifficulty, setSelectedDifficulty] = useState("Intermediate")
  const [selectedContentType, setSelectedContentType] = useState("LinkedIn Post")
  const [isGeneratingManual, setIsGeneratingManual] = useState(false)
  const [editingTopic, setEditingTopic] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [activeTab, setActiveTab] = useState<"all" | "auto" | "manual">("all")
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // Categories and difficulties
  const categories = [
    "Leadership", "Personal Growth", "Networking", "Education", 
    "Content Creation", "Technical", "Business", "Career", "Innovation"
  ]

  const difficulties = ["Beginner", "Intermediate", "Advanced"]

  const contentTypes = [
    "LinkedIn Post", "Article", "Thread", "Video Script", 
    "Podcast Episode", "Webinar", "Workshop", "Book Chapter"
  ]

  // Load topics on component mount
  useEffect(() => {
    loadTopics()
  }, [])

  const loadTopics = async () => {
    try {
      const response = await fetch("/api/topics")
      if (response.ok) {
        const data = await response.json()
        // Add mock data for enhanced features
        const enhancedTopics = (data.topics || []).map((topic: any) => ({
          ...topic,
          category: topic.category || categories[Math.floor(Math.random() * categories.length)],
          difficulty: topic.difficulty || difficulties[Math.floor(Math.random() * difficulties.length)],
          contentType: topic.contentType || contentTypes[0],
          tags: topic.tags || ["professional", "growth"],
          estimatedReadTime: Math.floor(Math.random() * 5) + 2,
          engagementScore: Math.floor(Math.random() * 100) + 20
        }))
        setTopics(enhancedTopics)
      }
    } catch (error) {
      console.error("Error loading topics:", error)
    }
  }

  // Generate enhanced topics
  const generateEnhancedTopics = async () => {
    if (!manualPrompt.trim()) {
      toast.error("Please enter a prompt")
      return
    }

    setIsGeneratingManual(true)
    try {
      const response = await fetch("/api/topics/generate-enhanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: manualPrompt,
          category: selectedCategory,
          difficulty: selectedDifficulty,
          contentType: selectedContentType
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const newTopics = data.topics.map((topic: any, index: number) => ({
            id: `enhanced-${Date.now()}-${index}`,
            title: topic.title,
            status: "pending" as const,
            createdAt: new Date().toISOString(),
            source: "manual" as const,
            category: topic.category,
            difficulty: topic.difficulty,
            contentType: topic.contentType,
            tags: topic.tags,
            estimatedReadTime: Math.floor(Math.random() * 5) + 2,
            engagementScore: Math.floor(Math.random() * 100) + 20
          }))
          setTopics((prev) => [...newTopics, ...prev])
          setManualPrompt("")
          toast.success(data.message || `${newTopics.length} enhanced topics generated!`)
        } else {
          toast.error(data.error || "Failed to generate topics")
        }
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to generate topics")
      }
    } catch (error) {
      console.error("Error generating topics:", error)
      toast.error("Error generating topics")
    } finally {
      setIsGeneratingManual(false)
    }
  }

  // Handle topic actions
  const handleTopicAction = async (topicId: string, action: "save" | "dismiss") => {
    try {
      const response = await fetch("/api/topics/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, status: action === "save" ? "saved" : "dismissed" }),
      })

      if (response.ok) {
        setTopics((prev) =>
          prev.map((topic) =>
            topic.id === topicId ? { ...topic, status: action === "save" ? "saved" : "dismissed" } : topic,
          ),
        )
        toast.success(`Topic ${action === "save" ? "saved" : "dismissed"}`)
      }
    } catch (error) {
      toast.error("Error updating topic")
    }
  }

  // Delete topic
  const deleteTopic = async (topicId: string) => {
    try {
      const response = await fetch("/api/topics/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId }),
      })

      if (response.ok) {
        setTopics((prev) => prev.filter((topic) => topic.id !== topicId))
        toast.success("Topic deleted")
      }
    } catch (error) {
      toast.error("Error deleting topic")
    }
  }

  // Edit topic
  const startEditing = (topic: Topic) => {
    setEditingTopic(topic.id)
    setEditTitle(topic.title)
  }

  const saveEdit = async (topicId: string) => {
    try {
      const response = await fetch("/api/topics/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, title: editTitle }),
      })

      if (response.ok) {
        setTopics((prev) => prev.map((topic) => (topic.id === topicId ? { ...topic, title: editTitle } : topic)))
        setEditingTopic(null)
        setEditTitle("")
        toast.success("Topic updated")
      }
    } catch (error) {
      toast.error("Error updating topic")
    }
  }

  const cancelEdit = () => {
    setEditingTopic(null)
    setEditTitle("")
  }

  // Filter topics based on all filters
  const filteredTopics = topics.filter((topic) => {
    const matchesSearch = topic.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || topic.status === statusFilter
    const matchesTab = activeTab === "all" || topic.source === activeTab
    const matchesCategory = categoryFilter === "all" || topic.category === categoryFilter
    const matchesDifficulty = difficultyFilter === "all" || topic.difficulty === difficultyFilter
    return matchesSearch && matchesStatus && matchesTab && matchesCategory && matchesDifficulty
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "saved":
        return "bg-green-100 text-green-800 border-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "dismissed":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-green-100 text-green-800"
      case "Intermediate":
        return "bg-yellow-100 text-yellow-800"
      case "Advanced":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Leadership":
        return <Award className="w-4 h-4" />
      case "Personal Growth":
        return <Heart className="w-4 h-4" />
      case "Networking":
        return <Users className="w-4 h-4" />
      case "Education":
        return <GraduationCap className="w-4 h-4" />
      case "Content Creation":
        return <FileText className="w-4 h-4" />
      case "Technical":
        return <Brain className="w-4 h-4" />
      case "Business":
        return <Briefcase className="w-4 h-4" />
      case "Career":
        return <Rocket className="w-4 h-4" />
      case "Innovation":
        return <Lightbulb className="w-4 h-4" />
      default:
        return <Tag className="w-4 h-4" />
    }
  }

  const getSourceColor = (source: string) => {
    switch (source) {
      case "auto":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "manual":
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "auto":
        return <Sparkles className="w-3 h-3" />
      case "manual":
        return <Target className="w-3 h-3" />
      default:
        return <Tag className="w-3 h-3" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Enhanced Topic Bank</h1>
              <p className="text-gray-600 text-lg">Advanced topic generation with categories, difficulty levels, and analytics</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} variant="outline" className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Advanced Filters
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Enhanced Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <Sparkles className="w-5 h-5" />
                    Auto Generate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-blue-700 text-sm mb-4">
                    Generate topics based on your profile and story data
                  </p>
                  <Button 
                    onClick={() => {}} 
                    disabled={isGeneratingTopics}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {isGeneratingTopics ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Generate Auto Topics
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-purple-800">
                    <Target className="w-5 h-5" />
                    Enhanced Generate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-purple-700 text-sm mb-4">
                    Generate topics with categories, difficulty, and content type
                  </p>
                  <Button 
                    onClick={() => setActiveTab("manual")}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    <Lightbulb className="w-4 h-4 mr-2" />
                    Enhanced Prompt
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Manual Prompt Section */}
            {activeTab === "manual" && (
              <Card className="border-purple-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-800">
                    <Target className="w-5 h-5" />
                    Enhanced Topic Generation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="manualPrompt" className="text-sm font-medium">
                      Describe what kind of topics you want to generate
                    </Label>
                    <Textarea
                      id="manualPrompt"
                      value={manualPrompt}
                      onChange={(e) => setManualPrompt(e.target.value)}
                      placeholder="e.g., I want topics about leadership in tech, or Help me create content about career growth..."
                      className="mt-2 min-h-[100px] resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="category" className="text-sm font-medium">Category</Label>
                      <select
                        id="category"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="mt-1 w-full border rounded-md px-3 py-2 bg-white text-sm"
                      >
                        {categories.map((category) => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="difficulty" className="text-sm font-medium">Difficulty</Label>
                      <select
                        id="difficulty"
                        value={selectedDifficulty}
                        onChange={(e) => setSelectedDifficulty(e.target.value)}
                        className="mt-1 w-full border rounded-md px-3 py-2 bg-white text-sm"
                      >
                        {difficulties.map((difficulty) => (
                          <option key={difficulty} value={difficulty}>{difficulty}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="contentType" className="text-sm font-medium">Content Type</Label>
                      <select
                        id="contentType"
                        value={selectedContentType}
                        onChange={(e) => setSelectedContentType(e.target.value)}
                        className="mt-1 w-full border rounded-md px-3 py-2 bg-white text-sm"
                      >
                        {contentTypes.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={generateEnhancedTopics}
                      disabled={isGeneratingManual || !manualPrompt.trim()}
                      className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
                    >
                      {isGeneratingManual ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Generate Enhanced Topics
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => setActiveTab("all")}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Enhanced Topics List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Your Enhanced Topics
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {filteredTopics.length} topics
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Enhanced Tabs */}
                <div className="flex gap-1 mb-6 p-1 bg-gray-100 rounded-lg">
                  <Button
                    variant={activeTab === "all" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab("all")}
                    className="flex items-center gap-2"
                  >
                    <BookOpen className="w-4 h-4" />
                    All
                  </Button>
                  <Button
                    variant={activeTab === "auto" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab("auto")}
                    className="flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Auto
                  </Button>
                  <Button
                    variant={activeTab === "manual" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab("manual")}
                    className="flex items-center gap-2"
                  >
                    <Target className="w-4 h-4" />
                    Manual
                  </Button>
                </div>

                {/* Enhanced Search and Filters */}
                <div className="space-y-4 mb-6">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search topics..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as "all" | "pending" | "saved" | "dismissed")}
                      className="border rounded-md px-3 py-2 bg-white text-sm"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="saved">Saved</option>
                      <option value="dismissed">Dismissed</option>
                    </select>
                  </div>

                  {showAdvancedFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <Label className="text-sm font-medium">Category</Label>
                        <select
                          value={categoryFilter}
                          onChange={(e) => setCategoryFilter(e.target.value)}
                          className="mt-1 w-full border rounded-md px-3 py-2 bg-white text-sm"
                        >
                          <option value="all">All Categories</option>
                          {categories.map((category) => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Difficulty</Label>
                        <select
                          value={difficultyFilter}
                          onChange={(e) => setDifficultyFilter(e.target.value)}
                          className="mt-1 w-full border rounded-md px-3 py-2 bg-white text-sm"
                        >
                          <option value="all">All Difficulties</option>
                          {difficulties.map((difficulty) => (
                            <option key={difficulty} value={difficulty}>{difficulty}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Enhanced Topics Grid */}
                <div className="space-y-4">
                  {filteredTopics.map((topic) => (
                    <div key={topic.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        {editingTopic === topic.id ? (
                          <div className="flex-1 flex gap-2">
                            <Input 
                              value={editTitle} 
                              onChange={(e) => setEditTitle(e.target.value)} 
                              className="flex-1" 
                            />
                            <Button size="sm" onClick={() => saveEdit(topic.id)} className="flex items-center gap-1">
                              <Save className="w-3 h-3" />
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelEdit}>
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <>
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900 mb-2">{topic.title}</h3>
                              <div className="flex items-center gap-3 text-sm mb-2">
                                <Badge className={`${getSourceColor(topic.source)} flex items-center gap-1`}>
                                  {getSourceIcon(topic.source)}
                                  {topic.source === "auto" ? "Auto" : "Manual"}
                                </Badge>
                                <Badge className={getStatusColor(topic.status)}>
                                  {topic.status === "saved" && <CheckCircle className="w-3 h-3 mr-1" />}
                                  {topic.status === "dismissed" && <X className="w-3 h-3 mr-1" />}
                                  {topic.status === "pending" && <Clock className="w-3 h-3 mr-1" />}
                                  {topic.status}
                                </Badge>
                                {topic.category && (
                                  <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1">
                                    {getCategoryIcon(topic.category)}
                                    {topic.category}
                                  </Badge>
                                )}
                                {topic.difficulty && (
                                  <Badge className={getDifficultyColor(topic.difficulty)}>
                                    {topic.difficulty}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span>{new Date(topic.createdAt).toLocaleDateString()}</span>
                                {topic.estimatedReadTime && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {topic.estimatedReadTime} min read
                                  </span>
                                )}
                                {topic.engagementScore && (
                                  <span className="flex items-center gap-1">
                                    <BarChart3 className="w-3 h-3" />
                                    {topic.engagementScore}% engagement
                                  </span>
                                )}
                              </div>
                              {topic.tags && topic.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {topic.tags.map((tag, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-1">
                              {topic.status === "pending" && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleTopicAction(topic.id, "save")}
                                    className="h-8 px-3 text-xs bg-green-600 hover:bg-green-700"
                                  >
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleTopicAction(topic.id, "dismiss")}
                                    className="h-8 px-3 text-xs"
                                  >
                                    <X className="w-3 h-3 mr-1" />
                                    Dismiss
                                  </Button>
                                </>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Enhanced Topic Actions */}
                      {editingTopic !== topic.id && (
                        <div className="flex gap-2 mt-3 pt-3 border-t">
                          <Button size="sm" variant="outline" onClick={() => startEditing(topic)} className="text-xs">
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              navigator.clipboard.writeText(topic.title)
                              toast.success("Topic copied to clipboard!")
                            }}
                            className="text-xs"
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Copy
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteTopic(topic.id)}
                            className="text-xs text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                          <Button size="sm" variant="outline" className="text-xs">
                            <Calendar className="w-3 h-3 mr-1" />
                            Schedule
                          </Button>
                          <Button size="sm" variant="outline" className="text-xs">
                            <Share2 className="w-3 h-3 mr-1" />
                            Share
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {filteredTopics.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                      {topics.length === 0 ? "No Topics Generated" : "No Topics Match Your Filters"}
                    </h3>
                    <p className="text-gray-500 mb-6">
                      {topics.length === 0
                        ? "Generate topics from your profile data or add custom prompts to get started."
                        : "Try adjusting your search or filter criteria."}
                    </p>
                    {topics.length === 0 && (
                      <div className="flex gap-3 justify-center">
                        <Button onClick={() => {}} disabled={isGeneratingTopics} className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4" />
                          Generate Auto Topics
                        </Button>
                        <Button onClick={() => setActiveTab("manual")} variant="outline" className="flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          Enhanced Prompt
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Sidebar Stats */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">{topics.length}</div>
                    <div className="text-sm text-blue-600">Total Topics</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {topics.filter((t) => t.status === "saved").length}
                    </div>
                    <div className="text-sm text-green-600">Saved</div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {topics.filter((t) => t.status === "pending").length}
                    </div>
                    <div className="text-sm text-yellow-600">Pending</div>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {topics.filter((t) => t.status === "dismissed").length}
                    </div>
                    <div className="text-sm text-red-600">Dismissed</div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-3">Category Breakdown</h4>
                  <div className="space-y-2">
                    {categories.slice(0, 5).map((category) => (
                      <div key={category} className="flex justify-between items-center text-sm">
                        <span className="flex items-center gap-2">
                          {getCategoryIcon(category)}
                          {category}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {topics.filter(t => t.category === category).length}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-3">Quick Actions</h4>
                  <div className="space-y-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setStatusFilter("pending")}
                      className="w-full justify-start"
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      View Pending
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setStatusFilter("saved")}
                      className="w-full justify-start"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      View Saved
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setActiveTab("auto")}
                      className="w-full justify-start"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Auto Topics
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setActiveTab("manual")}
                      className="w-full justify-start"
                    >
                      <Target className="w-4 h-4 mr-2" />
                      Enhanced Topics
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
