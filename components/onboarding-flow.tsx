"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import {
  Mic,
  MicOff,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Target,
  Users,
  Palette,
  Calendar,
  Zap,
  Volume2,
} from "lucide-react"
import { toast } from "sonner"

interface MCQData {
  platform: string
  tone: string
  industry: string
  frequency: string
  primaryGoal: string
}

interface OnboardingFlowProps {
  onComplete: (data: any) => void
}

const mcqQuestions = [
  {
    id: "platform",
    title: "किस platform पर content चाहिए?",
    icon: Target,
    options: [
      { value: "linkedin", label: "LinkedIn", description: "Professional networking के लिए" },
      { value: "instagram", label: "Instagram", description: "Visual storytelling के लिए" },
      { value: "twitter", label: "Twitter", description: "Quick thoughts और updates" },
      { value: "facebook", label: "Facebook", description: "Community building" },
    ],
  },
  {
    id: "industry",
    title: "आपका industry या niche क्या है?",
    icon: Users,
    options: [
      { value: "technology", label: "Technology & AI", description: "Tech, software, AI related" },
      { value: "business", label: "Business & Entrepreneurship", description: "Startups, business tips" },
      { value: "education", label: "Education & Training", description: "Learning, courses, teaching" },
      { value: "health", label: "Health & Wellness", description: "Fitness, mental health" },
      { value: "finance", label: "Finance & Investment", description: "Money, investing, trading" },
      { value: "entertainment", label: "Entertainment & Lifestyle", description: "Fun, lifestyle content" },
    ],
  },
  {
    id: "tone",
    title: "आपका content tone कैसा होना चाहिए?",
    icon: Palette,
    options: [
      { value: "professional", label: "Professional", description: "Formal, business-like tone" },
      { value: "casual", label: "Casual & Friendly", description: "Dosti वाला, approachable" },
      { value: "inspirational", label: "Inspirational", description: "Motivational, uplifting" },
      { value: "educational", label: "Educational", description: "Teaching, informative" },
      { value: "humorous", label: "Humorous", description: "Funny, light-hearted" },
    ],
  },
  {
    id: "frequency",
    title: "कितनी बार post करना चाहते हैं?",
    icon: Calendar,
    options: [
      { value: "daily", label: "Daily", description: "रोज़ 1 post" },
      { value: "weekly", label: "Weekly", description: "हफ्ते में 2-3 posts" },
      { value: "bi-weekly", label: "Bi-weekly", description: "महीने में 4-6 posts" },
      { value: "monthly", label: "Monthly", description: "महीने में 1-2 posts" },
    ],
  },
  {
    id: "primaryGoal",
    title: "आपका main goal क्या है?",
    icon: Zap,
    options: [
      { value: "brand_awareness", label: "Brand Awareness", description: "अपनी पहचान बनाना" },
      { value: "lead_generation", label: "Lead Generation", description: "Business leads generate करना" },
      { value: "thought_leadership", label: "Thought Leadership", description: "Industry expert बनना" },
      { value: "community_building", label: "Community Building", description: "Audience engage करना" },
      { value: "sales", label: "Direct Sales", description: "Products/services sell करना" },
    ],
  },
]

const audioQuestions = [
  "अपने बारे में बताइए - आप क्या करते हैं और आपका business/work क्या है?",
  "आपकी unique story क्या है? कैसे आपने अपना journey शुरू किया?",
  "आप अपने audience को क्या value provide करना चाहते हैं?",
  "आपके industry में कौन से topics पर आप expert हैं?",
  "आपका content style कैसा होना चाहिए? कोई examples दे सकते हैं?",
]

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [mcqData, setMcqData] = useState<MCQData>({
    platform: "",
    tone: "",
    industry: "",
    frequency: "",
    primaryGoal: "",
  })
  const [currentAudioQuestion, setCurrentAudioQuestion] = useState(0)
  const [audioResponses, setAudioResponses] = useState<string[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const totalSteps = mcqQuestions.length + audioQuestions.length + 1
  const progress = ((currentStep + 1) / totalSteps) * 100

  const handleMCQResponse = (questionId: string, value: string) => {
    setMcqData((prev) => ({
      ...prev,
      [questionId]: value,
    }))
  }

  const nextStep = () => {
    setCurrentStep(currentStep + 1)
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/wav" })
        setRecordedBlob(blob)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      toast.success("Recording शुरू हो गई...")
    } catch (error) {
      console.error("Error starting recording:", error)
      toast.error("Microphone access नहीं मिल सका")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      toast.success("Recording रुक गई")
    }
  }

  const playRecording = () => {
    if (recordedBlob) {
      const audioUrl = URL.createObjectURL(recordedBlob)
      audioRef.current = new Audio(audioUrl)
      audioRef.current.play()
      setIsPlaying(true)

      audioRef.current.onended = () => {
        setIsPlaying(false)
      }
    }
  }

  const pauseRecording = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  const resetRecording = () => {
    setRecordedBlob(null)
    setIsPlaying(false)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
  }

  const saveAudioResponse = async () => {
    if (!recordedBlob) {
      toast.error("पहले recording करें")
      return
    }

    try {
      // Upload audio
      const formData = new FormData()
      formData.append("audio", recordedBlob, `audio_${Date.now()}.wav`)
      formData.append("question", audioQuestions[currentAudioQuestion])

      const uploadResponse = await fetch("/api/upload-audio", {
        method: "POST",
        body: formData,
      })

      if (uploadResponse.ok) {
        const { transcription } = await uploadResponse.json()
        setAudioResponses((prev) => [...prev, transcription])

        if (currentAudioQuestion < audioQuestions.length - 1) {
          setCurrentAudioQuestion(currentAudioQuestion + 1)
          resetRecording()
          nextStep()
          toast.success("Response save हो गया! अगला question...")
        } else {
          nextStep()
          toast.success("सभी audio responses complete!")
        }
      } else {
        throw new Error("Audio upload failed")
      }
    } catch (error) {
      console.error("Error saving audio:", error)
      toast.error("Audio save नहीं हो सका")
    }
  }

  const submitOnboarding = async () => {
    setIsSubmitting(true)
    try {
      // Save user data
      const userData = {
        preferences: mcqData,
        audioResponses,
        onboardingCompleted: true,
      }

      const userResponse = await fetch("/api/user/complete-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      })

      if (userResponse.ok) {
        const user = await userResponse.json()

        // Generate prompt and trigger Make.com
        const promptResponse = await fetch("/api/generate-prompt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.email,
            mcqData,
            audioResponses,
          }),
        })

        if (promptResponse.ok) {
          toast.success("Setup complete! Content generation शुरू हो रहा है...")
          onComplete(user)
        } else {
          throw new Error("Prompt generation failed")
        }
      } else {
        throw new Error("User data save failed")
      }
    } catch (error) {
      console.error("Error submitting onboarding:", error)
      toast.error("Setup complete नहीं हो सका")
    } finally {
      setIsSubmitting(false)
    }
  }

  // MCQ Steps
  if (currentStep < mcqQuestions.length) {
    const question = mcqQuestions[currentStep]
    const Icon = question.icon
    const currentValue = mcqData[question.id as keyof MCQData]

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f172a] flex items-center justify-center p-4">
        <Card className="w-full max-w-3xl bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white text-xl">{question.title}</CardTitle>
                  <p className="text-slate-300 text-sm">
                    Step {currentStep + 1} of {totalSteps}
                  </p>
                </div>
              </div>
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                {Math.round(progress)}% Complete
              </Badge>
            </div>
            <Progress value={progress} className="mt-4 bg-white/10" />
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup value={currentValue} onValueChange={(value) => handleMCQResponse(question.id, value)}>
              <div className="grid gap-4">
                {question.options.map((option) => (
                  <div key={option.value} className="flex items-center space-x-3">
                    <RadioGroupItem value={option.value} id={option.value} className="border-white/30" />
                    <Label
                      htmlFor={option.value}
                      className="flex-1 cursor-pointer p-4 rounded-xl border border-white/20 hover:border-blue-500/50 transition-all bg-white/5 hover:bg-white/10"
                    >
                      <div className="font-medium text-white">{option.label}</div>
                      <div className="text-sm text-slate-300">{option.description}</div>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>

            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="border-white/30 text-white hover:bg-white/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              <Button
                onClick={nextStep}
                disabled={!currentValue}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Audio Recording Steps
  if (currentStep >= mcqQuestions.length && currentStep < mcqQuestions.length + audioQuestions.length) {
    const questionIndex = currentStep - mcqQuestions.length
    const question = audioQuestions[questionIndex]

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f172a] flex items-center justify-center p-4">
        <Card className="w-full max-w-3xl bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <Volume2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white text-xl">Audio Response</CardTitle>
                  <p className="text-slate-300 text-sm">
                    Question {questionIndex + 1} of {audioQuestions.length}
                  </p>
                </div>
              </div>
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                {Math.round(progress)}% Complete
              </Badge>
            </div>
            <Progress value={progress} className="mt-4 bg-white/10" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/30">
              <h3 className="font-semibold text-purple-300 mb-3 text-lg">इस question का जवाब दें:</h3>
              <p className="text-white text-lg leading-relaxed">{question}</p>
            </div>

            <div className="flex flex-col items-center space-y-6">
              {!recordedBlob ? (
                <Button
                  size="lg"
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`w-40 h-40 rounded-full text-white font-semibold ${
                    isRecording
                      ? "bg-red-600 hover:bg-red-700 animate-pulse"
                      : "bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  }`}
                >
                  {isRecording ? (
                    <div className="flex flex-col items-center">
                      <MicOff className="w-10 h-10 mb-2" />
                      <span>Stop</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Mic className="w-10 h-10 mb-2" />
                      <span>Record</span>
                    </div>
                  )}
                </Button>
              ) : (
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={isPlaying ? pauseRecording : playRecording}
                    className="border-white/30 text-white hover:bg-white/10"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={resetRecording}
                    className="border-white/30 text-white hover:bg-white/10"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </Button>
                  <Button
                    onClick={saveAudioResponse}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Save Response
                  </Button>
                </div>
              )}

              <p className="text-slate-300 text-center max-w-md">
                {isRecording
                  ? "🎤 Recording चल रही है... Stop करने के लिए click करें"
                  : recordedBlob
                    ? "✅ Recording complete! Play करके सुनें या save करें"
                    : "🎯 Record button दबाकर अपना जवाब दें"}
              </p>
            </div>

            <div className="flex justify-between pt-6">
              <Button variant="outline" onClick={prevStep} className="border-white/30 text-white hover:bg-white/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              <Button
                onClick={saveAudioResponse}
                disabled={!recordedBlob}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                Next Question
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Final Summary Step
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f172a] flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-white text-xl">Setup Complete! 🎉</CardTitle>
                <p className="text-slate-300 text-sm">आपका content profile तैयार है</p>
              </div>
            </div>
            <Badge className="bg-green-500/20 text-green-300 border-green-500/30">100% Complete</Badge>
          </div>
          <Progress value={100} className="mt-4 bg-white/10" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl border border-blue-500/30">
              <h3 className="font-semibold text-blue-300 mb-3">आपका Content Profile:</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-300">Platform:</span>
                  <span className="text-white ml-2 capitalize">{mcqData.platform}</span>
                </div>
                <div>
                  <span className="text-slate-300">Industry:</span>
                  <span className="text-white ml-2 capitalize">{mcqData.industry}</span>
                </div>
                <div>
                  <span className="text-slate-300">Tone:</span>
                  <span className="text-white ml-2 capitalize">{mcqData.tone}</span>
                </div>
                <div>
                  <span className="text-slate-300">Frequency:</span>
                  <span className="text-white ml-2 capitalize">{mcqData.frequency}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/30">
              <h3 className="font-semibold text-purple-300 mb-2">Audio Responses:</h3>
              <p className="text-slate-300 text-sm">
                {audioResponses.length} audio responses recorded और content generation के लिए ready
              </p>
            </div>
          </div>

          <div className="flex justify-between pt-6">
            <Button variant="outline" onClick={prevStep} className="border-white/30 text-white hover:bg-white/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            <Button
              onClick={submitOnboarding}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Complete Setup
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
