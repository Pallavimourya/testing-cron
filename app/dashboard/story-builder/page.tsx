"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Loader2, Wand2, Eye } from "lucide-react"

export default function StoryBuilderPage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedStory, setGeneratedStory] = useState("")
  const [showPreview, setShowPreview] = useState(false)

  // Base story data
  const [baseStory, setBaseStory] = useState({
    name: "",
    industry: "",
    experience: "",
    achievement: "",
    challenge: "",
    learning: "",
    goal: ""
  })

  // Customization data
  const [customization, setCustomization] = useState({
    tone: "professional",
    length: "medium",
    audience: "professionals",
    focus: "career journey"
  })

  const handleBaseStoryChange = (field: string, value: string) => {
    setBaseStory(prev => ({ ...prev, [field]: value }))
  }

  const handleCustomizationChange = (field: string, value: string) => {
    setCustomization(prev => ({ ...prev, [field]: value }))
  }

  const generateStory = async () => {
    try {
      setIsGenerating(true)
      
      const response = await fetch("/api/story/generate-basic", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          baseStoryData: baseStory,
          customizationData: customization,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setGeneratedStory(data.story.generatedStory)
        toast.success("Story generated successfully!")
      } else {
        toast.error(data.error || "Failed to generate story")
      }
    } catch (error) {
      console.error("Error generating story:", error)
      toast.error("Failed to generate story")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Story Builder</h1>
        <p className="text-gray-600">Create your professional story by combining base story data with customization preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Base Story Data */}
        <Card>
          <CardHeader>
            <CardTitle>Base Story Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={baseStory.name}
                onChange={(e) => handleBaseStoryChange("name", e.target.value)}
                placeholder="Your name"
              />
            </div>

            <div>
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                value={baseStory.industry}
                onChange={(e) => handleBaseStoryChange("industry", e.target.value)}
                placeholder="e.g., Technology, Healthcare, Finance"
              />
            </div>

            <div>
              <Label htmlFor="experience">Experience</Label>
              <Input
                id="experience"
                value={baseStory.experience}
                onChange={(e) => handleBaseStoryChange("experience", e.target.value)}
                placeholder="e.g., 5 years, 10+ years"
              />
            </div>

            <div>
              <Label htmlFor="achievement">Key Achievement</Label>
              <Textarea
                id="achievement"
                value={baseStory.achievement}
                onChange={(e) => handleBaseStoryChange("achievement", e.target.value)}
                placeholder="Describe your biggest professional achievement"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="challenge">Biggest Challenge</Label>
              <Textarea
                id="challenge"
                value={baseStory.challenge}
                onChange={(e) => handleBaseStoryChange("challenge", e.target.value)}
                placeholder="Describe a major challenge you overcame"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="learning">Key Learning</Label>
              <Textarea
                id="learning"
                value={baseStory.learning}
                onChange={(e) => handleBaseStoryChange("learning", e.target.value)}
                placeholder="What's the most important lesson you've learned?"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="goal">Current Goal</Label>
              <Textarea
                id="goal"
                value={baseStory.goal}
                onChange={(e) => handleBaseStoryChange("goal", e.target.value)}
                placeholder="What do you want to achieve now?"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Customization Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Customization Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="tone">Tone</Label>
              <Select value={customization.tone} onValueChange={(value) => handleCustomizationChange("tone", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="length">Length</Label>
              <Select value={customization.length} onValueChange={(value) => handleCustomizationChange("length", value)}>
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

            <div>
              <Label htmlFor="audience">Target Audience</Label>
              <Input
                id="audience"
                value={customization.audience}
                onChange={(e) => handleCustomizationChange("audience", e.target.value)}
                placeholder="e.g., professionals, students, entrepreneurs"
              />
            </div>

            <div>
              <Label htmlFor="focus">Focus Area</Label>
              <Input
                id="focus"
                value={customization.focus}
                onChange={(e) => handleCustomizationChange("focus", e.target.value)}
                placeholder="e.g., career journey, leadership, innovation"
              />
            </div>

            <div className="pt-4">
              <Button 
                onClick={generateStory} 
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate Story
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generated Story Preview */}
      {generatedStory && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Generated Story</CardTitle>
              <Button
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
              >
                <Eye className="w-4 h-4 mr-2" />
                {showPreview ? "Hide" : "Show"} Preview
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showPreview ? (
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap font-mono text-sm bg-gray-50 p-4 rounded-lg">
                  {generatedStory}
                </pre>
              </div>
            ) : (
              <p className="text-gray-600">
                Story generated successfully! Click "Show Preview" to view your story.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
