"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2, Save, Edit3, Sparkles, User, Settings } from "lucide-react"
import { useSubscription } from "@/hooks/use-subscription"

interface Story {
  _id: string
  status: string
  generatedStory: string
  baseStoryData: any
  customizationData: any
  createdAt: string
  updatedAt: string
}

export default function AIStoryPage() {
  const [story, setStory] = useState<Story | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState<'base' | 'customization'>('base')

  // Subscription hook
  const {
    isActive,
    handleApiError,
    SubscriptionAlertComponent
  } = useSubscription()

  // Base Story Data - Enhanced with more comprehensive fields
  const [baseStoryData, setBaseStoryData] = useState({
    name: "",
    industry: "",
    experience: "",
    childhood: "",
    schoolLife: "",
    collegeEducation: "",
    careerJourney: "",
    personalLife: "",
    awardsRecognition: "",
    aspirationsGoals: "",
    additionalInsights: ""
  })

  // Customization Data - Enhanced with more options
  const [customizationData, setCustomizationData] = useState({
    target_audience: "professionals",
    audience_age: "25-45",
    content_goal: "build authority",
    content_tone: "professional",
    writing_style: "engaging",
    content_length: "medium",
    posting_frequency: "weekly",
    content_formats: ["linkedin-posts", "articles"],
    engagement_style: "conversational",
    personal_anecdotes: "include",
    visual_style: "clean",
    branding_colors: "professional",
    keywords: [],
    content_inspiration: "industry leaders",
    content_differentiation: "unique perspective"
  })

  const loadStory = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/story/latest")
      const data = await response.json()

      if (data.success && data.story) {
        setStory(data.story)
        setBaseStoryData(data.story.baseStoryData || baseStoryData)
        setCustomizationData(data.story.customizationData || customizationData)
      }
    } catch (error) {
      console.error("Error loading story:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStory()
  }, [loadStory])

  const generateStory = async () => {
    if (!isActive) {
      toast.error("You need an active subscription to generate a story")
      return
    }

    try {
      // Validate required fields
      const requiredBaseFields = ['name', 'industry', 'experience', 'earlyLife', 'firstJob', 'biggestChallenge', 'currentWork', 'proudAchievement']
      const missingBaseFields = requiredBaseFields.filter(field => !baseStoryData[field as keyof typeof baseStoryData])
      
      if (missingBaseFields.length > 0) {
        toast.error(`Please fill in all required base story fields: ${missingBaseFields.join(', ')}`)
        return
      }

      setIsGenerating(true)
      const response = await fetch("/api/story/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          baseStoryData,
          customizationData,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Story generation started! Your story will appear shortly.")
        // Reload story after a delay
        setTimeout(loadStory, 5000)
      } else {
        const errorData = await response.json()
        if (!handleApiError(errorData, "story generation")) {
          toast.error(data.error || "Failed to generate story")
        }
      }
    } catch (error) {
      console.error("Error generating story:", error)
      toast.error("Failed to generate story")
    } finally {
      setIsGenerating(false)
    }
  }

  const updateStory = async () => {
    if (!story) return

    try {
      const response = await fetch(`/api/story/update/${story._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          baseStoryData,
          customizationData,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Story updated successfully!")
        loadStory()
      } else {
        const errorData = await response.json()
        if (!handleApiError(errorData, "story update")) {
          toast.error(data.error || "Failed to update story")
        }
      }
    } catch (error) {
      console.error("Error updating story:", error)
      toast.error("Failed to update story")
    }
  }

  const saveFormData = async () => {
    try {
      const response = await fetch("/api/story/save-form", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          baseStoryData,
          customizationData,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Form data saved successfully!")
      } else {
        const errorData = await response.json()
        if (!handleApiError(errorData, "form saving")) {
          toast.error(data.error || "Failed to save form data")
        }
      }
    } catch (error) {
      console.error("Error saving form data:", error)
      toast.error("Failed to save form data")
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Subscription Alert Component */}
      <SubscriptionAlertComponent />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Story Builder</h1>
          <p className="text-gray-600">Create your professional story with AI assistance</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={saveFormData}
            variant="outline"
            size="sm"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Form
          </Button>
          <Button
            onClick={generateStory}
            disabled={isGenerating || !isActive}
            size="sm"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Generate Story
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b">
        <button
          onClick={() => setActiveTab('base')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
            activeTab === 'base'
              ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <User className="h-4 w-4 mr-2 inline" />
          Base Story
        </button>
        <button
          onClick={() => setActiveTab('customization')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
            activeTab === 'customization'
              ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Settings className="h-4 w-4 mr-2 inline" />
          Customization
        </button>
      </div>

      {/* Form Content */}
      <Card>
        <CardContent className="p-6">
          {activeTab === 'base' ? (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Base Story Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={baseStoryData.name}
                    onChange={(e) => setBaseStoryData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Your full name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="industry">Industry *</Label>
                  <Input
                    id="industry"
                    value={baseStoryData.industry}
                    onChange={(e) => setBaseStoryData(prev => ({ ...prev, industry: e.target.value }))}
                    placeholder="e.g., Technology, Healthcare, Finance"
                  />
                </div>
                
                <div>
                  <Label htmlFor="experience">Years of Experience *</Label>
                  <Input
                    id="experience"
                    value={baseStoryData.experience}
                    onChange={(e) => setBaseStoryData(prev => ({ ...prev, experience: e.target.value }))}
                    placeholder="e.g., 10+ years"
                  />
                </div>
                
                <div>
                  <Label htmlFor="careerJourney">Career Journey *</Label>
                  <Input
                    id="careerJourney"
                    value={baseStoryData.careerJourney}
                    onChange={(e) => setBaseStoryData(prev => ({ ...prev, careerJourney: e.target.value }))}
                    placeholder="e.g., My professional journey from intern to senior engineer"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="childhood">Childhood & Early Life</Label>
                  <Textarea
                    id="childhood"
                    value={baseStoryData.childhood}
                    onChange={(e) => setBaseStoryData(prev => ({ ...prev, childhood: e.target.value }))}
                    placeholder="Share your fondest memories from childhood and early experiences..."
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="schoolLife">School Life</Label>
                  <Textarea
                    id="schoolLife"
                    value={baseStoryData.schoolLife}
                    onChange={(e) => setBaseStoryData(prev => ({ ...prev, schoolLife: e.target.value }))}
                    placeholder="Describe your school years and significant experiences that shaped you..."
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="collegeEducation">College & Higher Education</Label>
                  <Textarea
                    id="collegeEducation"
                    value={baseStoryData.collegeEducation}
                    onChange={(e) => setBaseStoryData(prev => ({ ...prev, collegeEducation: e.target.value }))}
                    placeholder="Share your college experience and how it influenced your career path..."
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="personalLife">Personal Life & Lifestyle</Label>
                  <Textarea
                    id="personalLife"
                    value={baseStoryData.personalLife}
                    onChange={(e) => setBaseStoryData(prev => ({ ...prev, personalLife: e.target.value }))}
                    placeholder="How do you spend time outside work and what are your hobbies or passions?"
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="awardsRecognition">Awards & Recognitions</Label>
                  <Textarea
                    id="awardsRecognition"
                    value={baseStoryData.awardsRecognition}
                    onChange={(e) => setBaseStoryData(prev => ({ ...prev, awardsRecognition: e.target.value }))}
                    placeholder="What awards or recognitions have you received and what do they mean to you?"
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="aspirationsGoals">Aspirations & Goals</Label>
                  <Textarea
                    id="aspirationsGoals"
                    value={baseStoryData.aspirationsGoals}
                    onChange={(e) => setBaseStoryData(prev => ({ ...prev, aspirationsGoals: e.target.value }))}
                    placeholder="What are your short-term and long-term goals, both personally and professionally?"
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="additionalInsights">Additional Insights</Label>
                  <Textarea
                    id="additionalInsights"
                    value={baseStoryData.additionalInsights}
                    onChange={(e) => setBaseStoryData(prev => ({ ...prev, additionalInsights: e.target.value }))}
                    placeholder="Is there anything else about you that you'd like people to know, or a unique story to share?"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Content Customization</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="target_audience">Target Audience</Label>
                  <Select
                    value={customizationData.target_audience}
                    onValueChange={(value) => setCustomizationData(prev => ({ ...prev, target_audience: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professionals">Professionals</SelectItem>
                      <SelectItem value="entrepreneurs">Entrepreneurs</SelectItem>
                      <SelectItem value="students">Students</SelectItem>
                      <SelectItem value="executives">Executives</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="content_tone">Content Tone</Label>
                  <Select
                    value={customizationData.content_tone}
                    onValueChange={(value) => setCustomizationData(prev => ({ ...prev, content_tone: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="authoritative">Authoritative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="content_goal">Content Goal</Label>
                  <Select
                    value={customizationData.content_goal}
                    onValueChange={(value) => setCustomizationData(prev => ({ ...prev, content_goal: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="build authority">Build Authority</SelectItem>
                      <SelectItem value="share knowledge">Share Knowledge</SelectItem>
                      <SelectItem value="inspire others">Inspire Others</SelectItem>
                      <SelectItem value="network building">Network Building</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="content_length">Content Length</Label>
                  <Select
                    value={customizationData.content_length}
                    onValueChange={(value) => setCustomizationData(prev => ({ ...prev, content_length: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">Short</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="long">Long</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generated Story Display */}
      {story && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Generated Story</span>
              <Button
                onClick={() => setActiveTab('base')}
                variant="outline"
                size="sm"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Story
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-gray-700">
                {story.generatedStory}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
