"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Loader2, Eye, Edit, Plus } from "lucide-react"
import Link from "next/link"

interface Story {
  _id: string
  status: string
  generatedStory: string
  baseStoryData: any
  customizationData: any
  createdAt: string
  updatedAt: string
}

export default function StoriesPage() {
  const [stories, setStories] = useState<Story[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadStories()
  }, [])

  const loadStories = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/story/list")
      const data = await response.json()

      if (data.success) {
        setStories(data.stories)
      } else {
        toast.error("Failed to load stories")
      }
    } catch (error) {
      console.error("Error loading stories:", error)
      toast.error("Failed to load stories")
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "generated":
        return "bg-green-100 text-green-800"
      case "generating":
        return "bg-yellow-100 text-yellow-800"
      case "edited":
        return "bg-blue-100 text-blue-800"
      case "approved":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading stories...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Stories</h1>
            <p className="text-gray-600">View and manage your professional stories</p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/story-builder">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create New Story
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {stories.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-gray-600 mb-4">No stories found. Create your first story!</p>
              <Link href="/dashboard/story-builder">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Story
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {stories.map((story) => (
            <Card key={story._id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <CardTitle className="text-lg">Story #{story._id.slice(-6)}</CardTitle>
                    <Badge className={getStatusColor(story.status)}>
                      {story.status}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/dashboard/stories/${story._id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </Link>
                    <Link href={`/dashboard/stories/${story._id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Created:</span>
                    <p className="text-gray-600">{new Date(story.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="font-medium">Updated:</span>
                    <p className="text-gray-600">{new Date(story.updatedAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="font-medium">Length:</span>
                    <p className="text-gray-600">{story.generatedStory.length} characters</p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <span className="font-medium">Preview:</span>
                  <p className="text-gray-600 mt-1 text-sm">
                    {story.generatedStory.substring(0, 200)}...
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
