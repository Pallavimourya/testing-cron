"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"

import {
  Save,
  Sparkles,
  FileText,
  Settings,
  User,
  Target,
  CheckCircle,
  X,
  Edit,
  Loader2,
  ArrowRight,
  Mic,
  MicOff,
} from "lucide-react"
import { toast } from "sonner"
import AudioRecorder from "@/components/audio-recorder"

interface BaseStoryData {
  childhood: string
  schoolLife: string
  collegeEducation: string
  careerJourney: string
  personalLife: string
  awardsRecognition: string
  aspirationsGoals: string
  additionalInsights: string
}

interface CustomizationData {
  content_language: string
  target_audience: string
  audience_age: string
  content_goal: string
  content_tone: string
  content_length: string
  content_differentiation: string
}

interface GeneratedTopic {
  id: string
  title: string
  status: "pending" | "approved" | "rejected"
  approvedAt?: string
}

export default function UnifiedProfilePage() {
  const [activeTab, setActiveTab] = useState("base-story")
  const [language, setLanguage] = useState<"english" | "hindi">("english")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isGeneratingStory, setIsGeneratingStory] = useState(false)
  const [generationStep, setGenerationStep] = useState<string>("")
  const [isEditingStory, setIsEditingStory] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [activeRecordingField, setActiveRecordingField] = useState<string | null>(null)

  // Form data
  const [baseStoryData, setBaseStoryData] = useState<BaseStoryData>({
    childhood: "",
    schoolLife: "",
    collegeEducation: "",
    careerJourney: "",
    personalLife: "",
    awardsRecognition: "",
    aspirationsGoals: "",
    additionalInsights: "",
  })

  const [customizationData, setCustomizationData] = useState<CustomizationData>({
    content_language: "",
    target_audience: "",
    audience_age: "",
    content_goal: "",
    content_tone: "",
    content_length: "",
    content_differentiation: "",
  })

  // Story data
  const [currentStoryId, setCurrentStoryId] = useState("")
  const [generatedStory, setGeneratedStory] = useState("")
  const [editedStory, setEditedStory] = useState("")
  const [storyStatus, setStoryStatus] = useState("")
  const [generatedTopics, setGeneratedTopics] = useState<GeneratedTopic[]>([])

  // Load profile data on component mount
  useEffect(() => {
    loadProfileData()
    loadLatestStory()
  }, [])

  const loadProfileData = async () => {
    setIsLoading(true)
    try {
      console.log("📤 Loading profile data...")
      const response = await fetch("/api/profile")
      console.log("📡 Profile response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("📊 Loaded profile data:", data)

        if (data.baseStoryData) {
          console.log("✅ Setting base story data")
          setBaseStoryData(data.baseStoryData)
        }
        if (data.customizationData) {
          console.log("✅ Setting customization data")
          setCustomizationData(data.customizationData)
        }
      } else {
        console.log("⚠️ No profile data found or error loading")
      }
    } catch (error) {
      console.error("❌ Error loading profile data:", error)
      toast.error("Failed to load profile data")
    } finally {
      setIsLoading(false)
    }
  }

  const loadLatestStory = async () => {
    try {
      console.log("🔍 Loading latest story...")
      const response = await fetch("/api/story/latest")

      if (response.ok) {
        const data = await response.json()
        console.log("📦 API Response:", data)

        if (data.success && data.story) {
          console.log("✅ Latest story loaded:", data.story._id)
          setCurrentStoryId(data.story._id)
          setStoryStatus(data.story.status)
          setGeneratedStory(data.story.generatedStory || "")
          setEditedStory(data.story.editedStory || "")
          setGeneratedTopics(data.story.generatedTopics || [])
        } else {
          console.log("📝 No story found")
          resetStoryState()
        }
      } else {
        console.error("❌ Failed to load latest story:", response.status)
      }
    } catch (error) {
      console.error("❌ Error loading latest story:", error)
    }
  }

  const resetStoryState = () => {
    setCurrentStoryId("")
    setStoryStatus("")
    setGeneratedStory("")
    setEditedStory("")
    setGeneratedTopics([])
    setIsGeneratingStory(false)
  }

  // Handle form changes
  const handleBaseStoryChange = (field: keyof BaseStoryData, value: string) => {
    setBaseStoryData((prev) => ({ ...prev, [field]: value }))
  }

  const handleCustomizationChange = (field: keyof CustomizationData, value: string | string[]) => {
    setCustomizationData((prev) => ({ ...prev, [field]: value }))
  }

  // Handle voice recording and transcription
  const handleVoiceRecording = async (audioBlob: Blob, duration: number, fieldId: string) => {
    if (!activeRecordingField) return

    setIsTranscribing(true)
    try {
      const formData = new FormData()
      formData.append("audio", audioBlob, "recording.wav")

      const response = await fetch("/api/transcribe-audio", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        if (data.transcription) {
          // Update the appropriate field based on activeRecordingField
          if (activeRecordingField.startsWith("base-")) {
            const fieldName = activeRecordingField.replace("base-", "") as keyof BaseStoryData
            handleBaseStoryChange(fieldName, data.transcription)
          } else if (activeRecordingField.startsWith("custom-")) {
            const fieldName = activeRecordingField.replace("custom-", "") as keyof CustomizationData
            handleCustomizationChange(fieldName, data.transcription)
          } else if (activeRecordingField === "story-edit") {
            setEditedStory(data.transcription)
          }
          toast.success("Voice input transcribed successfully!")
        } else {
          toast.error("Failed to transcribe audio")
        }
      } else {
        toast.error("Failed to transcribe audio")
      }
    } catch (error) {
      console.error("Error transcribing audio:", error)
      toast.error("Error transcribing audio")
    } finally {
      setIsTranscribing(false)
      setActiveRecordingField(null)
    }
  }

  // Save profile data
  const saveProfileData = async () => {
    setIsSaving(true)
    try {
      console.log("💾 Saving profile data...")
      console.log("📊 Base story data:", baseStoryData)
      console.log("📊 Customization data:", customizationData)

      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseStoryData,
          customizationData,
        }),
      })

      console.log("📡 Response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("✅ Profile saved successfully:", data)
        toast.success("Profile saved successfully!")
      } else {
        const errorData = await response.json()
        console.error("❌ Failed to save profile:", errorData)
        toast.error(`Failed to save profile: ${errorData.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error("❌ Error saving profile:", error)
      toast.error("Error saving profile")
    } finally {
      setIsSaving(false)
    }
  }

  // Generate story using ChatGPT - This will create a unique story every time
  const generateStory = async () => {
    // Validate required fields
    const requiredBaseFields = ["childhood", "careerJourney", "personalLife"]
    const requiredCustomFields = ["content_language", "target_audience", "content_goal", "content_tone"]

    const missingBaseFields = requiredBaseFields.filter((field) => !baseStoryData[field as keyof BaseStoryData])
    const missingCustomFields = requiredCustomFields.filter(
      (field) => !customizationData[field as keyof CustomizationData],
    )

    if (missingBaseFields.length > 0 || missingCustomFields.length > 0) {
      toast.error("Please fill in the required fields before generating story")
      return
    }

    setIsGeneratingStory(true)
    setGenerationStep("Starting generation...")
    resetStoryState()

    // Show initial loading notification
    toast.info("🎯 Starting story generation... This may take 1-2 minutes", {
      duration: 3000,
    })

    try {
      console.log("🎯 Generating unique story with base story + customization data")
      setGenerationStep("Analyzing your story data...")

      const response = await fetch("/api/story/generate-unique", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseStoryData,
          customizationData,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setGenerationStep("Finalizing your story and topics...")
        setCurrentStoryId(data.story._id)
        setStoryStatus(data.story.status)
        setGeneratedStory(data.story.generatedStory)
        setGeneratedTopics(data.story.generatedTopics || [])
        toast.success("✨ Unique story generated successfully with 5 related topics!", {
          duration: 5000,
        })
        console.log("✅ Story generated with", data.story.generatedTopics?.length || 0, "topics")
      } else {
        toast.error(data.message || "Failed to generate story")
      }
    } catch (error) {
      console.error("Error generating story:", error)
      toast.error("❌ Error generating story. Please try again.")
    } finally {
      setIsGeneratingStory(false)
      setGenerationStep("")
    }
  }

  // Update story
  const updateStory = async () => {
    if (!currentStoryId) return

    try {
      const response = await fetch("/api/story/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storyId: currentStoryId,
          editedStory,
          finalStory: editedStory,
        }),
      })

      if (response.ok) {
        toast.success("Story updated successfully!")
        setIsEditingStory(false)
        setStoryStatus("approved")
      } else {
        toast.error("Failed to update story")
      }
    } catch (error) {
      toast.error("Error updating story")
    }
  }

  // Approve topic - This will add the topic to Topic Bank
  const approveTopic = async (topicId: string) => {
    try {
      const response = await fetch("/api/story/topics/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storyId: currentStoryId,
          topicId,
        }),
      })

      if (response.ok) {
        setGeneratedTopics((prev) =>
          prev.map((topic) =>
            topic.id === topicId ? { ...topic, status: "approved", approvedAt: new Date().toISOString() } : topic,
          ),
        )
        toast.success("Topic approved and added to Topic Bank!")
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Failed to approve topic")
      }
    } catch (error) {
      toast.error("Error approving topic")
    }
  }

  // Reject topic
  const rejectTopic = (topicId: string) => {
    setGeneratedTopics((prev) => prev.map((topic) => (topic.id === topicId ? { ...topic, status: "rejected" } : topic)))
    toast.success("Topic rejected")
  }

  const baseStoryQuestions = [
    {
      id: "childhood",
      label: "1. Childhood and Early Life: What are some of your fondest memories from your childhood?",
      labelHindi: "1. बचपन और प्रारंभिक जीवन: आपके बचपन की कौन सी यादें सबसे प्यारी हैं?",
      placeholder: "Share your fondest childhood memories...",
      placeholderHindi: "अपनी सबसे प्यारी बचपन की यादें साझा करें...",
      required: true,
    },
    {
      id: "schoolLife",
      label: "2. School Life: How would you describe your school years, and were there any significant experiences that shaped who you are today?",
      labelHindi: "2. स्कूल जीवन: आप अपने स्कूल के वर्षों का वर्णन कैसे करेंगे, और क्या कोई महत्वपूर्ण अनुभव थे जिन्होंने आज के आपको आकार दिया?",
      placeholder: "Describe your school years and significant experiences...",
      placeholderHindi: "अपने स्कूल के वर्षों और महत्वपूर्ण अनुभवों का वर्णन करें...",
    },
    {
      id: "collegeEducation",
      label: "3. College and Higher Education: What was your college experience like, and how did it influence your career path?",
      labelHindi: "3. कॉलेज और उच्च शिक्षा: आपका कॉलेज का अनुभव कैसा था, और इसने आपके करियर पथ को कैसे प्रभावित किया?",
      placeholder: "Share your college experience and its impact on your career...",
      placeholderHindi: "अपना कॉलेज अनुभव और करियर पर इसका प्रभाव साझा करें...",
    },
    {
      id: "careerJourney",
      label: "4. Career Journey: Can you walk me through your professional journey, including key milestones and challenges you've faced?",
      labelHindi: "4. करियर यात्रा: क्या आप मुझे अपनी पेशेवर यात्रा के बारे में बता सकते हैं, जिसमें महत्वपूर्ण मील के पत्थर और चुनौतियां शामिल हैं?",
      placeholder: "Walk through your professional journey, milestones, and challenges...",
      placeholderHindi: "अपनी पेशेवर यात्रा, मील के पत्थर और चुनौतियों के बारे में बताएं...",
      required: true,
    },
    {
      id: "personalLife",
      label: "5. Personal Life and Lifestyle: How do you like to spend your time outside of work, and what are your hobbies or passions?",
      labelHindi: "5. व्यक्तिगत जीवन और जीवनशैली: आप काम के बाहर अपना समय कैसे बिताना पसंद करते हैं, और आपके शौक या जुनून क्या हैं?",
      placeholder: "Share your personal life, hobbies, and passions...",
      placeholderHindi: "अपना व्यक्तिगत जीवन, शौक और जुनून साझा करें...",
      required: true,
    },
    {
      id: "awardsRecognition",
      label: "6. Awards and Recognitions: What are some of the awards or recognitions you've received, and what do they mean to you?",
      labelHindi: "6. पुरस्कार और मान्यता: आपको कौन से पुरस्कार या मान्यता मिली हैं, और वे आपके लिए क्या मतलब रखते हैं?",
      placeholder: "Share your awards, recognitions, and what they mean to you...",
      placeholderHindi: "अपने पुरस्कार, मान्यता और उनका आपके लिए क्या मतलब है साझा करें...",
    },
    {
      id: "aspirationsGoals",
      label: "7. Aspirations and Goals: What are your short-term and long-term goals, both personally and professionally?",
      labelHindi: "7. आकांक्षाएं और लक्ष्य: आपके अल्पकालिक और दीर्घकालिक लक्ष्य क्या हैं, व्यक्तिगत और पेशेवर दोनों?",
      placeholder: "Share your short-term and long-term goals...",
      placeholderHindi: "अपने अल्पकालिक और दीर्घकालिक लक्ष्य साझा करें...",
    },
    {
      id: "additionalInsights",
      label: "8. Additional Insights: Is there anything else about you that you'd like people to know, or a unique story that you'd like to share?",
      labelHindi: "8. अतिरिक्त अंतर्दृष्टि: क्या आपके बारे में कुछ और है जो आप चाहते हैं कि लोग जानें, या कोई अनूठी कहानी जो आप साझा करना चाहते हैं?",
      placeholder: "Share any additional insights or unique stories about yourself...",
      placeholderHindi: "अपने बारे में कोई अतिरिक्त अंतर्दृष्टि या अनूठी कहानियां साझा करें...",
    },
  ]

  const customizationQuestions = [
    {
      id: "content_language",
      label: "1. In which language should the content be generated?",
      labelHindi: "1. सामग्री किस भाषा में उत्पन्न की जानी चाहिए?",
      type: "radio",
      options: ["English", "Hindi"],
      optionsHindi: ["अंग्रेजी", "हिंदी"],
      required: true,
    },
    {
      id: "target_audience",
      label: "2. Who is your primary target audience?",
      labelHindi: "2. आपका मुख्य लक्षित दर्शक कौन है?",
      type: "radio",
      options: ["Founders / Entrepreneurs", "Working Professionals", "Students", "Freelancers", "General Public"],
      optionsHindi: ["संस्थापक / उद्यमी", "कामकाजी पेशेवर", "छात्र", "फ्रीलांसर", "सामान्य जनता"],
      required: true,
    },
    {
      id: "audience_age",
      label: "3. What is their age range?",
      labelHindi: "3. उनकी आयु सीमा क्या है?",
      type: "radio",
      options: ["18–24", "25–34", "35–44", "45+"],
      optionsHindi: ["18–24", "25–34", "35–44", "45+"],
    },
    {
      id: "content_goal",
      label: "4. What is your main goal for content?",
      labelHindi: "4. सामग्री के लिए आपका मुख्य लक्ष्य क्या है?",
      type: "radio",
      options: ["Build Authority", "Generate Leads", "Educate Audience", "Entertain", "Personal Branding"],
      optionsHindi: ["प्राधिकार बनाएं", "लीड जनरेट करें", "दर्शकों को शिक्षित करें", "मनोरंजन", "व्यक्तिगत ब्रांडिंग"],
      required: true,
    },
    {
      id: "content_tone",
      label: "5. What is the content tone you prefer?",
      labelHindi: "5. आप किस प्रकार की सामग्री का स्वर पसंद करते हैं?",
      type: "radio",
      options: ["Conversational", "Bold", "Professional", "Witty", "Inspirational"],
      optionsHindi: ["बातचीत जैसा", "साहसी", "पेशेवर", "चतुर", "प्रेरणादायक"],
      required: true,
    },
    {
      id: "content_length",
      label: "6. What content length do you prefer?",
      labelHindi: "6. आप किस लंबाई की सामग्री पसंद करते हैं?",
      type: "radio",
      options: ["Short-form (100–200 words)", "Medium (200–400 words)", "Long-form (400+ words)"],
      optionsHindi: ["छोटी (100–200 शब्द)", "मध्यम (200–400 शब्द)", "लंबी (400+ शब्द)"],
    },
    {
      id: "content_differentiation",
      label: "7. How unique should your content be?",
      labelHindi: "7. आपकी सामग्री कितनी अनूठी होनी चाहिए?",
      type: "radio",
      options: ["Very unique & contrarian", "Balanced", "Safe & mainstream"],
      optionsHindi: ["बहुत अनूठी और विरोधी", "संतुलित", "सुरक्षित और मुख्यधारा"],
    },
  ]

  if (isLoading) {
    return (
      <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8 max-w-7xl">
      <div className="mb-6 flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">
            Create your unique brand story and automatically generate 5 story-related content topics
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button onClick={saveProfileData} disabled={isSaving} variant="outline" className="w-full sm:w-auto">
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Profile
              </>
            )}
          </Button>
          <Button
            onClick={generateStory}
            disabled={isGeneratingStory}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 w-full sm:w-auto"
          >
            {isGeneratingStory ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Generating Story & Topics...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Unique Story
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
        {/* Main Content - Profile Form */}
        <div className="xl:col-span-2 order-2 xl:order-1">
          {/* Language Toggle */}
          <div className="mb-6 flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">Language:</span>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setLanguage("english")}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    language === "english" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setLanguage("hindi")}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    language === "hindi" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  हिंदी
                </button>
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="base-story" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Base Story
              </TabsTrigger>
              <TabsTrigger value="customization" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Customization
              </TabsTrigger>
            </TabsList>

            {/* Base Story Tab */}
            <TabsContent value="base-story" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Base Story Questions
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Tell your authentic story - these questions will help create your unique narrative
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 gap-6">
                    {baseStoryQuestions.map((question) => (
                      <div key={question.id} className="space-y-2">
                        <div className="space-y-1">
                          {language === "english" && (
                            <Label htmlFor={question.id} className="text-sm font-medium">
                              {question.label}
                              {question.required && <span className="text-red-500 ml-1">*</span>}
                            </Label>
                          )}
                          {language === "hindi" && (
                            <Label htmlFor={question.id} className="text-sm font-medium">
                              {question.labelHindi}
                              {question.required && <span className="text-red-500 ml-1">*</span>}
                            </Label>
                          )}
                        </div>
                        <div className="relative">
                          <Textarea
                            id={question.id}
                            value={baseStoryData[question.id as keyof BaseStoryData]}
                            onChange={(e) => handleBaseStoryChange(question.id as keyof BaseStoryData, e.target.value)}
                            placeholder={language === "english" ? question.placeholder : question.placeholderHindi}
                            className="min-h-[80px] sm:min-h-[100px] resize-none pr-12 text-sm sm:text-base"
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="absolute right-2 top-2 h-8 w-8 p-0 bg-transparent"
                            onClick={() => setActiveRecordingField(`base-${question.id}`)}
                            disabled={isTranscribing}
                          >
                            {activeRecordingField === `base-${question.id}` ? (
                              <MicOff className="h-4 w-4 text-red-500" />
                            ) : (
                              <Mic className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        {activeRecordingField === `base-${question.id}` && (
                          <div className="mt-2">
                            <AudioRecorder
                              onRecordingComplete={(audioBlob, duration) =>
                                handleVoiceRecording(audioBlob, duration, `base-${question.id}`)
                              }
                              disabled={isTranscribing}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Customization Tab */}
            <TabsContent value="customization" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Content Customization
                  </CardTitle>
                  <p className="text-sm text-gray-600">Customize how your content should be created and presented</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                    {customizationQuestions.map((question) => (
                      <div key={question.id} className="space-y-3">
                        <div className="space-y-1">
                          {language === "english" && (
                            <Label className="text-sm font-medium">
                              {question.label}
                              {question.required && <span className="text-red-500 ml-1">*</span>}
                            </Label>
                          )}
                          {language === "hindi" && (
                            <Label className="text-sm font-medium">
                              {question.labelHindi}
                              {question.required && <span className="text-red-500 ml-1">*</span>}
                            </Label>
                          )}
                        </div>

                        {question.type === "radio" && (
                          <RadioGroup
                            value={customizationData[question.id as keyof CustomizationData] as string}
                            onValueChange={(value) =>
                              handleCustomizationChange(question.id as keyof CustomizationData, value)
                            }
                          >
                            {question.options.map((option, index) => (
                              <div key={option} className="flex items-center space-x-2">
                                <RadioGroupItem value={option} id={`${question.id}-${option}`} />
                                <Label htmlFor={`${question.id}-${option}`} className="text-sm cursor-pointer">
                                  {language === "english" ? option : question.optionsHindi?.[index] || option}
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar - Generated Story and Topics */}
        <div className="lg:col-span-1 space-y-6 order-1 xl:order-2">
          {/* Generated Story Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Generated Unique Story
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isGeneratingStory && (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center max-w-md">
                    <div className="relative mb-6">
                      <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-6 w-6 bg-white rounded-full"></div>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">🎯 Generating Your Unique Story</h3>
                    <p className="text-sm text-gray-600 mb-3">Creating your personalized brand story with AI</p>
                    {generationStep && (
                      <div className="mb-3 p-2 bg-blue-100 rounded-lg">
                        <p className="text-xs text-blue-700 font-medium">Current Step: {generationStep}</p>
                      </div>
                    )}
                    <div className="space-y-2 text-xs text-gray-500">
                      <p>✓ Analyzing your base story data</p>
                      <p>✓ Applying customization preferences</p>
                      <p>✓ Generating unique narrative</p>
                      <p>✓ Creating 5 story-related topics</p>
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-700">
                        ⏱️ This usually takes 1-2 minutes. Please don't close this page.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {generatedStory && !isGeneratingStory && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        Unique Story Generated
                      </Badge>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setIsEditingStory(!isEditingStory)}>
                      <Edit className="h-3 w-3 mr-1" />
                      {isEditingStory ? "Cancel" : "Edit"}
                    </Button>
                  </div>

                  {isEditingStory ? (
                    <div className="space-y-3">
                      <div className="relative">
                        <Textarea
                          value={editedStory || generatedStory}
                          onChange={(e) => setEditedStory(e.target.value)}
                          className="min-h-[200px] pr-12"
                          placeholder="Edit your brand story..."
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="absolute right-2 top-2 h-8 w-8 p-0 bg-transparent"
                          onClick={() => setActiveRecordingField("story-edit")}
                          disabled={isTranscribing}
                        >
                          {activeRecordingField === "story-edit" ? (
                            <MicOff className="h-4 w-4 text-red-500" />
                          ) : (
                            <Mic className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      {activeRecordingField === "story-edit" && (
                        <div className="mt-2">
                          <AudioRecorder
                            onRecordingComplete={(audioBlob, duration) =>
                              handleVoiceRecording(audioBlob, duration, "story-edit")
                            }
                            disabled={isTranscribing}
                          />
                        </div>
                      )}
                      <Button onClick={updateStory} size="sm" className="w-full">
                        <Save className="h-3 w-3 mr-1" />
                        Save Changes
                      </Button>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg max-h-80 sm:max-h-96 overflow-y-auto">
                      <div className="prose prose-sm max-w-none">
                        <pre className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans">
                          {editedStory || generatedStory}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}



              {!generatedStory && isGeneratingStory && (
                <div className="text-center py-8">
                  <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">Generating New Story</h3>
                  <p className="text-gray-500 mb-4 text-sm">Generating new story please wait...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Generated Topics Section */}
          {(generatedTopics.length > 0 || isGeneratingStory) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {isGeneratingStory ? "Generating Topics..." : `Generated Topics (${generatedTopics.length})`}
                </CardTitle>
                <p className="text-sm text-gray-600">
                  {isGeneratingStory
                    ? "Creating 5 story-related topics..."
                    : "Approve topics to add them to your Topic Bank"}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {isGeneratingStory ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3 text-green-600" />
                      <p className="text-sm text-gray-600">Creating story-related topics...</p>
                      <p className="text-xs text-gray-500 mt-1">This will appear shortly</p>
                    </div>
                  </div>
                ) : (
                  generatedTopics.map((topic) => (
                    <div key={topic.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-start justify-between">
                        <p className="text-sm font-medium leading-tight flex-1 pr-2">{topic.title}</p>
                        <div className="flex flex-col sm:flex-row gap-1">
                          {topic.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => approveTopic(topic.id)}
                                className="h-6 px-2 text-xs bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => rejectTopic(topic.id)}
                                className="h-6 px-2 text-xs w-full sm:w-auto"
                              >
                                <X className="h-3 w-3 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          {topic.status === "approved" && (
                            <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approved
                            </Badge>
                          )}
                          {topic.status === "rejected" && (
                            <Badge variant="secondary" className="bg-red-100 text-red-700 text-xs">
                              <X className="h-3 w-3 mr-1" />
                              Rejected
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {generatedTopics.filter((t) => t.status === "approved").length > 0 && (
                  <div className="pt-3 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full bg-transparent"
                      onClick={() => (window.location.href = "/dashboard/topic-bank")}
                    >
                      View Topic Bank
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Instructions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How it works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                  1
                </div>
                <p>Fill in your base story and customization preferences</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <p>
                  Click &quot;Generate Unique Story&quot; to create your personalized story with 5 automatically
                  generated story-related topics
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                  3
                </div>
                <p>Review your generated story and 5 automatically generated story-related topics</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                  4
                </div>
                <p>Edit the story if needed and approve topics for your Topic Bank</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                  5
                </div>
                <p>Generate content from approved topics in Topic Bank</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
