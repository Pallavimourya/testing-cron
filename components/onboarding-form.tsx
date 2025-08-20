"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowRight, ArrowLeft, User, Users, Target, Link, Globe, Mic, Square, Upload } from "lucide-react"

interface OnboardingFormProps {
  onComplete: (data: any) => void
}

interface FormData {
  niche: string
  targetAudience: string
  targetAudienceDetails: string
  contentTone: string
  monthlyTopics: string
  referenceLinks: string
  postFrequency: string
  preferredPlatforms: string
  contentGoals: string
  bio: string
  website: string
  socialLinks: {
    instagram: string
    twitter: string
    linkedin: string
    youtube: string
  }
  voiceNote?: Blob
}

export default function OnboardingForm({ onComplete }: OnboardingFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    niche: "",
    targetAudience: "",
    targetAudienceDetails: "",
    contentTone: "",
    monthlyTopics: "",
    referenceLinks: "",
    postFrequency: "",
    preferredPlatforms: "",
    contentGoals: "",
    bio: "",
    website: "",
    socialLinks: {
      instagram: "",
      twitter: "",
      linkedin: "",
      youtube: "",
    },
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const steps = [
    { number: 1, title: "Basic Info", icon: User },
    { number: 2, title: "Audience", icon: Users },
    { number: 3, title: "Strategy", icon: Target },
    { number: 4, title: "Links", icon: Link },
    { number: 5, title: "Profile", icon: Globe },
  ]

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {}

    switch (step) {
      case 1:
        if (!formData.niche.trim()) newErrors.niche = "Niche is required"
        if (!formData.contentTone.trim()) newErrors.contentTone = "Content tone is required"
        break
      case 2:
        if (!formData.targetAudience.trim()) newErrors.targetAudience = "Target audience is required"
        if (!formData.targetAudienceDetails.trim()) newErrors.targetAudienceDetails = "Audience details are required"
        break
      case 3:
        if (!formData.monthlyTopics.trim()) newErrors.monthlyTopics = "Monthly topics are required"
        if (!formData.postFrequency.trim()) newErrors.postFrequency = "Post frequency is required"
        if (!formData.preferredPlatforms.trim()) newErrors.preferredPlatforms = "Preferred platforms are required"
        if (!formData.contentGoals.trim()) newErrors.contentGoals = "Content goals are required"
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length))
    }
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return

    setIsSubmitting(true)
    try {
      // First save the voice note if it exists
      let voiceNoteId = null
      if (formData.voiceNote) {
        const formDataVoice = new FormData()
        formDataVoice.append("audio", formData.voiceNote)
        formDataVoice.append("title", "Voice Biography")

        const voiceResponse = await fetch("/api/voice-notes", {
          method: "POST",
          body: formDataVoice,
        })

        if (voiceResponse.ok) {
          const voiceData = await voiceResponse.json()
          voiceNoteId = voiceData._id
        }
      }

      // Then save the profile data
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          voiceNoteId,
        }),
      })

      if (response.ok) {
        const savedProfile = await response.json()
        onComplete(savedProfile)
      } else {
        throw new Error("Failed to save profile")
      }
    } catch (error) {
      console.error("Error saving profile:", error)
      alert("Failed to save profile. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateFormData = (field: string, value: string) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".")
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof FormData] as Record<string, string>),
          [child]: value,
        },
      }))
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }))
    }

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' })
        const audioUrl = URL.createObjectURL(audioBlob)
        setAudioUrl(audioUrl)
        setFormData(prev => ({
          ...prev,
          voiceNote: audioBlob
        }))
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error accessing microphone:', error)
      alert('Could not access microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const audioUrl = URL.createObjectURL(file)
      setAudioUrl(audioUrl)
      setFormData(prev => ({
        ...prev,
        voiceNote: file
      }))
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-white shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-slate-900">
            Welcome to LinkZup! Let's set up your profile
          </CardTitle>
          <p className="text-slate-600">Tell us about yourself to personalize your experience</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isCompleted = currentStep > step.number
              const isCurrent = currentStep === step.number

              return (
                <div key={step.number} className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                      isCompleted
                        ? "bg-blue-600 text-white"
                        : isCurrent
                          ? "bg-blue-100 text-blue-600 border-2 border-blue-600"
                          : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-xs font-medium ${isCurrent ? "text-blue-600" : "text-slate-400"}`}>
                    {step.title}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Step Content */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">Basic Information</h3>
              <div>
                <Label htmlFor="niche">Your Niche *</Label>
                <Input
                  id="niche"
                  value={formData.niche}
                  onChange={(e) => updateFormData("niche", e.target.value)}
                  placeholder="e.g., Technology, Fashion, Health"
                  className={errors.niche ? "border-red-500" : ""}
                />
                {errors.niche && <p className="text-red-500 text-sm mt-1">{errors.niche}</p>}
              </div>
              <div>
                <Label htmlFor="contentTone">Content Tone *</Label>
                <Input
                  id="contentTone"
                  value={formData.contentTone}
                  onChange={(e) => updateFormData("contentTone", e.target.value)}
                  placeholder="e.g., Professional, Casual, Humorous"
                  className={errors.contentTone ? "border-red-500" : ""}
                />
                {errors.contentTone && <p className="text-red-500 text-sm mt-1">{errors.contentTone}</p>}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">Target Audience</h3>
              <div>
                <Label htmlFor="targetAudience">Primary Target Audience *</Label>
                <Input
                  id="targetAudience"
                  value={formData.targetAudience}
                  onChange={(e) => updateFormData("targetAudience", e.target.value)}
                  placeholder="e.g., Young professionals, Students"
                  className={errors.targetAudience ? "border-red-500" : ""}
                />
                {errors.targetAudience && <p className="text-red-500 text-sm mt-1">{errors.targetAudience}</p>}
              </div>
              <div>
                <Label htmlFor="targetAudienceDetails">Detailed Audience Profile *</Label>
                <Textarea
                  id="targetAudienceDetails"
                  value={formData.targetAudienceDetails}
                  onChange={(e) => updateFormData("targetAudienceDetails", e.target.value)}
                  placeholder="Describe your target audience in detail (age, interests, pain points, etc.)"
                  className={errors.targetAudienceDetails ? "border-red-500" : ""}
                />
                {errors.targetAudienceDetails && (
                  <p className="text-red-500 text-sm mt-1">{errors.targetAudienceDetails}</p>
                )}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">Content Strategy</h3>
              <div>
                <Label htmlFor="monthlyTopics">Monthly Topics *</Label>
                <Input
                  id="monthlyTopics"
                  value={formData.monthlyTopics}
                  onChange={(e) => updateFormData("monthlyTopics", e.target.value)}
                  placeholder="e.g., AI Trends, Digital Marketing Tips"
                  className={errors.monthlyTopics ? "border-red-500" : ""}
                />
                {errors.monthlyTopics && <p className="text-red-500 text-sm mt-1">{errors.monthlyTopics}</p>}
              </div>
              <div>
                <Label htmlFor="postFrequency">Post Frequency *</Label>
                <Input
                  id="postFrequency"
                  value={formData.postFrequency}
                  onChange={(e) => updateFormData("postFrequency", e.target.value)}
                  placeholder="e.g., Daily, 3 times a week"
                  className={errors.postFrequency ? "border-red-500" : ""}
                />
                {errors.postFrequency && <p className="text-red-500 text-sm mt-1">{errors.postFrequency}</p>}
              </div>
              <div>
                <Label htmlFor="preferredPlatforms">Preferred Platforms *</Label>
                <Input
                  id="preferredPlatforms"
                  value={formData.preferredPlatforms}
                  onChange={(e) => updateFormData("preferredPlatforms", e.target.value)}
                  placeholder="e.g., Instagram, LinkedIn, Twitter"
                  className={errors.preferredPlatforms ? "border-red-500" : ""}
                />
                {errors.preferredPlatforms && <p className="text-red-500 text-sm mt-1">{errors.preferredPlatforms}</p>}
              </div>
              <div>
                <Label htmlFor="contentGoals">Content Goals *</Label>
                <Input
                  id="contentGoals"
                  value={formData.contentGoals}
                  onChange={(e) => updateFormData("contentGoals", e.target.value)}
                  placeholder="e.g., Brand Awareness, Lead Generation"
                  className={errors.contentGoals ? "border-red-500" : ""}
                />
                {errors.contentGoals && <p className="text-red-500 text-sm mt-1">{errors.contentGoals}</p>}
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">Reference Links</h3>
              <div>
                <Label htmlFor="referenceLinks">Inspiration Links</Label>
                <Textarea
                  id="referenceLinks"
                  value={formData.referenceLinks}
                  onChange={(e) => updateFormData("referenceLinks", e.target.value)}
                  placeholder="Add links to competitors' content or past content that inspires you (one per line)"
                />
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => updateFormData("website", e.target.value)}
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">Voice Biography</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`flex items-center gap-2 ${
                      isRecording ? "bg-red-500 hover:bg-red-600" : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {isRecording ? (
                      <>
                        <Square className="w-4 h-4" />
                        Stop Recording
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4" />
                        Start Recording
                      </>
                    )}
                  </Button>
                  <div className="relative">
                    <Input
                      type="file"
                      accept="audio/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="audio-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('audio-upload')?.click()}
                      className="flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Upload MP3
                    </Button>
                  </div>
                </div>

                {audioUrl && (
                  <div className="mt-4">
                    <audio controls src={audioUrl} className="w-full" />
                  </div>
                )}

                <div>
                  <Label htmlFor="bio">Text Bio (Optional)</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => updateFormData("bio", e.target.value)}
                    placeholder="You can also type your bio here"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            <Button type="button" variant="outline" onClick={handleBack} disabled={currentStep === 1}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            {currentStep === steps.length ? (
              <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                {isSubmitting ? "Saving..." : "Complete Setup"}
              </Button>
            ) : (
              <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700">
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
