"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Loader2, Edit, Save, RefreshCw } from "lucide-react"
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

export default function SimpleStoryPage() {
  const [story, setStory] = useState<Story | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editedStory, setEditedStory] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  // Subscription hook
  const {
    isActive,
    handleApiError,
    SubscriptionAlertComponent
  } = useSubscription()

  useEffect(() => {
    loadLatestStory()
  }, [])

  const loadLatestStory = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/story/latest")
      const data = await response.json()

      if (data.success && data.story) {
        setStory(data.story)
        setEditedStory(data.story.generatedStory)
      } else {
        toast.error("No story found. Please create a story first.")
      }
    } catch (error) {
      console.error("Error loading story:", error)
      toast.error("Failed to load story")
    } finally {
      setIsLoading(false)
    }
  }

  const createNewStory = async () => {
    if (!isActive) {
      toast.error("You need an active subscription to create a story")
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch("/api/story/create-simple", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (data.success) {
        setStory(data.story)
        setEditedStory(data.story.generatedStory)
        toast.success("New story created successfully!")
      } else {
        const errorData = await response.json()
        if (!handleApiError(errorData, "story creation")) {
          toast.error(data.error || "Failed to create story")
        }
      }
    } catch (error) {
      console.error("Error creating story:", error)
      toast.error("Failed to create story")
    } finally {
      setIsLoading(false)
    }
  }

  const saveStory = async () => {
    if (!story) return

    try {
      setIsSaving(true)
      const response = await fetch(`/api/story/get/${story._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          editedStory: editedStory,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setStory({ ...story, generatedStory: editedStory })
        setIsEditing(false)
        toast.success("Story saved successfully!")
      } else {
        const errorData = await response.json()
        if (!handleApiError(errorData, "story saving")) {
          toast.error(data.error || "Failed to save story")
        }
      }
    } catch (error) {
      console.error("Error saving story:", error)
      toast.error("Failed to save story")
    } finally {
      setIsSaving(false)
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
          <h1 className="text-2xl font-bold text-gray-900">Simple Story</h1>
          <p className="text-gray-600">Create and manage your professional story</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={loadLatestStory}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={createNewStory}
            disabled={isLoading || !isActive}
            size="sm"
          >
            <Edit className="h-4 w-4 mr-2" />
            Create New Story
          </Button>
        </div>
      </div>

      {/* Story Content */}
      {story ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Your Story</span>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <Button
                      onClick={saveStory}
                      disabled={isSaving}
                      size="sm"
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Save
                    </Button>
                    <Button
                      onClick={() => {
                        setIsEditing(false)
                        setEditedStory(story.generatedStory)
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                    size="sm"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Textarea
                value={editedStory}
                onChange={(e) => setEditedStory(e.target.value)}
                className="min-h-[400px]"
                placeholder="Edit your story here..."
              />
            ) : (
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-gray-700">
                  {story.generatedStory}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-600">No Story Found</h3>
              <p className="text-gray-500">
                Create your first professional story to get started.
              </p>
              <Button
                onClick={createNewStory}
                disabled={!isActive}
                size="lg"
              >
                <Edit className="h-4 w-4 mr-2" />
                Create Your Story
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
