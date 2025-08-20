"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  User,
  Mail,
  Calendar,
  Crown,
  Target,
  FileText,
  Edit,
  CheckCircle,
  Clock,
  Loader2,
  Upload,
  Camera,
  Palette,
  Save,
  X,
  Building,
  MapPin,
  Globe,
  Award,
  Star,
  Trash2,
  MoreVertical,
  Sparkles,
  Zap,
  Heart,
  Shield,
  Phone,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface UserProfileData {
  userId: string
  email: string
  name?: string
  mobile?: string
  city?: string
  bio?: string
  company?: string
  jobTitle?: string
  industry?: string
  location?: string
  website?: string
  profilePhoto?: string
  image?: string
  baseStoryData?: {
    childhood: string
    schoolLife: string
    collegeEducation: string
    careerJourney: string
    personalLife: string
    awardsRecognition: string
    aspirationsGoals: string
    additionalInsights: string
  }
  customizationData?: {
    content_language: string
    target_audience: string
    audience_age: string
    content_goal: string
    content_tone: string
    content_length: string
    content_differentiation: string
  }
  generatedScript?: string
  onboardingCompleted: boolean
  linkedinConnected: boolean
  linkedinProfile?: {
    firstName: string
    lastName: string
    headline: string
  }
  subscriptionStatus: string
  subscriptionPlan?: string
  contentGenerated: number
  topicsGenerated: number
  postsScheduled: number
  createdAt: string
  updatedAt: string
}

export default function ViewProfilePage() {
  const { data: session } = useSession()
  const [profileData, setProfileData] = useState<UserProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Profile picture states
  const [profilePicture, setProfilePicture] = useState<string>("")
  const [isUploadingPicture, setIsUploadingPicture] = useState(false)
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false)
  const [showProfileOptions, setShowProfileOptions] = useState(false)
  const [showAvatarOptions, setShowAvatarOptions] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Editable form data
  const [editableBaseStory, setEditableBaseStory] = useState<any>({})
  const [editableCustomization, setEditableCustomization] = useState<any>({})

  useEffect(() => {
    loadProfileData()
  }, [])

  const loadProfileData = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/profile")

      if (response.ok) {
        const data = await response.json()
        setProfileData(data)
        // Initialize editable data
        setEditableBaseStory(data.baseStoryData || {})
        setEditableCustomization(data.customizationData || {})
        // Set profile picture - prioritize profilePhoto over image, but don't set empty string
        const profilePic = data.profilePhoto || data.image || session?.user?.image || ""
        setProfilePicture(profilePic)
        console.log("Loaded profile picture:", profilePic)
      } else {
        toast.error("Failed to load profile data")
      }
    } catch (error) {
      console.error("Error loading profile:", error)
      toast.error("Failed to load profile data")
    } finally {
      setLoading(false)
    }
  }

  const handleEditClick = () => {
    setIsEditing(true)
    // Initialize editable data with current profile data
    setEditableBaseStory(profileData?.baseStoryData || {})
    setEditableCustomization(profileData?.customizationData || {})
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    // Reset editable data to original values
    setEditableBaseStory(profileData?.baseStoryData || {})
    setEditableCustomization(profileData?.customizationData || {})
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseStoryData: editableBaseStory,
          customizationData: editableCustomization,
          mobile: profileData?.mobile,
          city: profileData?.city,
          location: profileData?.location,
          website: profileData?.website,
          bio: profileData?.bio,
          company: profileData?.company,
          jobTitle: profileData?.jobTitle,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setProfileData(prev => ({ ...prev, ...data }))
        setIsEditing(false)
        toast.success("Profile updated successfully!")
      } else {
        const errorData = await response.json()
        toast.error(`Failed to update profile: ${errorData.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error("Error saving profile:", error)
      toast.error("Error saving profile")
    } finally {
      setIsSaving(false)
    }
  }

  const handleBaseStoryChange = (field: string, value: string) => {
    setEditableBaseStory((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleCustomizationChange = (field: string, value: string) => {
    setEditableCustomization((prev: any) => ({ ...prev, [field]: value }))
  }

  // Profile picture functions
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file")
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB")
      return
    }

    setIsUploadingPicture(true)
    try {
      const formData = new FormData()
      formData.append("profilePicture", file)

      const response = await fetch("/api/profile/upload-picture", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        console.log("Upload response:", data)
        const newProfilePic = data.profilePictureUrl
        setProfilePicture(newProfilePic)
        setProfileData(prev => prev ? { ...prev, profilePhoto: newProfilePic } : null)
        toast.success("Profile picture uploaded successfully!")
        setShowProfileOptions(false)
        
        // Simple page reload to refresh the session
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Failed to upload profile picture")
      }
    } catch (error) {
      console.error("Error uploading profile picture:", error)
      toast.error("Error uploading profile picture")
    } finally {
      setIsUploadingPicture(false)
    }
  }

  const handleGenerateAvatar = async (style: string) => {
    setIsGeneratingAvatar(true)
    try {
      const response = await fetch("/api/profile/generate-avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          style,
          name: session?.user?.name || "User",
          email: session?.user?.email || "user@example.com",
        }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log("Avatar generation response:", data)
        const newAvatarUrl = data.avatarUrl
        setProfilePicture(newAvatarUrl)
        setProfileData(prev => prev ? { ...prev, profilePhoto: newAvatarUrl } : null)
        setShowAvatarOptions(false)
        toast.success("Avatar generated successfully!")
        
        // Simple page reload to refresh the session
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Failed to generate avatar")
      }
    } catch (error) {
      console.error("Error generating avatar:", error)
      toast.error("Error generating avatar")
    } finally {
      setIsGeneratingAvatar(false)
    }
  }

  const triggerFileUpload = () => {
    fileInputRef.current?.click()
  }

  const handleRemovePhoto = async () => {
    try {
      const response = await fetch("/api/profile/upload-picture", {
        method: "DELETE",
      })

      if (response.ok) {
        // Clear the profile picture from state
        setProfilePicture("")
        setProfileData(prev => prev ? { ...prev, profilePhoto: "" } : null)
        toast.success("Profile picture removed successfully!")
        
        // Simple page reload to refresh the session
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Failed to remove profile picture")
      }
    } catch (error) {
      console.error("Error removing profile picture:", error)
      toast.error("Error removing profile picture")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getSubscriptionBadge = (status: string) => {
    const badges = {
      free: { label: "Free Plan", color: "bg-gray-100 text-gray-800" },
      active: { label: "Premium", color: "bg-blue-100 text-blue-800" },
      expired: { label: "Expired", color: "bg-red-100 text-red-800" },
      cancelled: { label: "Cancelled", color: "bg-yellow-100 text-yellow-800" },
    }
    return badges[status as keyof typeof badges] || badges.free
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <span className="ml-2 text-gray-600">Loading profile...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Profile Not Found</h3>
            <p className="text-gray-500 mb-4">Unable to load your profile information.</p>
            <Link href="/dashboard/profile">
              <Button>
                <Edit className="h-4 w-4 mr-2" />
                Complete Profile Setup
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-16">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="text-center lg:text-left">
              <h1 className="text-5xl lg:text-6xl font-bold text-white mb-4">
                {isEditing ? "Edit Profile" : "My Profile"}
              </h1>
              <p className="text-xl text-indigo-100 max-w-2xl">
                {isEditing 
                  ? "Update your profile information and preferences" 
                  : "Manage your profile, content preferences, and account settings"
                }
              </p>
            </div>
            <div className="flex gap-3">
              {isEditing ? (
                <>
                  <Button 
                    variant="secondary" 
                    onClick={handleCancelEdit}
                    className="flex items-center gap-2 px-6 bg-white/20 hover:bg-white/30 text-white border-white/30"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSaveProfile} 
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 bg-white text-indigo-600 hover:bg-gray-100"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={handleEditClick}
                  className="flex items-center gap-2 px-6 bg-white text-indigo-600 hover:bg-gray-100"
                >
                  <Edit className="h-4 w-4" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-8 space-y-8">
            {/* Profile Card */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10"></div>
                <CardContent className="relative p-8">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    {/* Profile Picture */}
                    <div className="relative">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <div className="relative cursor-pointer group">
                            <Avatar className="h-24 w-24 ring-4 ring-white shadow-2xl transition-all duration-300 group-hover:scale-105">
                              <AvatarImage 
                                src={profilePicture || session?.user?.image || ""} 
                                alt={session?.user?.name || "User"}
                              />
                              <AvatarFallback className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold text-2xl">
                                {session?.user?.name?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Camera className="h-8 w-8 text-white" />
                            </div>
                          </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => setShowProfileOptions(true)}>
                            <Camera className="h-4 w-4 mr-2" />
                            Change Photo
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={triggerFileUpload}>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Photo
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setShowAvatarOptions(true)
                          }}>
                            <Palette className="h-4 w-4 mr-2" />
                            Generate Avatar
                          </DropdownMenuItem>
                          {profilePicture && (
                            <DropdownMenuItem onClick={handleRemovePhoto} className="text-red-600 focus:text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove Photo
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* User Info */}
                    <div className="flex-1">
                      <h2 className="text-3xl font-bold text-gray-900 mb-2">{session?.user?.name || "User"}</h2>
                      <p className="text-xl text-gray-600 mb-3">{profileData.jobTitle || "Professional"}</p>
                      {profileData.company && (
                        <p className="text-gray-500 flex items-center gap-2 mb-4">
                          <Building className="h-4 w-4" />
                          {profileData.company}
                        </p>
                      )}
                      {profileData.bio && (
                        <p className="text-gray-700 leading-relaxed">{profileData.bio}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>

            {/* Contact Information */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-2xl rounded-3xl">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="p-3 bg-indigo-100 rounded-xl">
                    <Sparkles className="h-6 w-6 text-indigo-600" />
                  </div>
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="mobile" className="text-sm font-medium text-gray-700">Mobile Number</Label>
                      <Input
                        id="mobile"
                        type="tel"
                        placeholder="Enter your mobile number"
                        value={profileData.mobile || ""}
                        onChange={(e) => setProfileData(prev => prev ? { ...prev, mobile: e.target.value } : null)}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-sm font-medium text-gray-700">City</Label>
                      <Input
                        id="city"
                        type="text"
                        placeholder="Enter your city"
                        value={profileData.city || ""}
                        onChange={(e) => setProfileData(prev => prev ? { ...prev, city: e.target.value } : null)}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location" className="text-sm font-medium text-gray-700">Location</Label>
                      <Input
                        id="location"
                        type="text"
                        placeholder="Enter your location"
                        value={profileData.location || ""}
                        onChange={(e) => setProfileData(prev => prev ? { ...prev, location: e.target.value } : null)}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website" className="text-sm font-medium text-gray-700">Website</Label>
                      <Input
                        id="website"
                        type="url"
                        placeholder="Enter your website URL"
                        value={profileData.website || ""}
                        onChange={(e) => setProfileData(prev => prev ? { ...prev, website: e.target.value } : null)}
                        className="w-full"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl">
                      <div className="p-3 bg-indigo-100 rounded-xl">
                        <Mail className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 font-medium">Email</p>
                        <p className="text-gray-900 font-semibold">{profileData.email}</p>
                      </div>
                    </div>
                    
                    {profileData.mobile && (
                      <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl">
                        <div className="p-3 bg-purple-100 rounded-xl">
                          <Phone className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 font-medium">Mobile</p>
                          <p className="text-gray-900 font-semibold">{profileData.mobile}</p>
                        </div>
                      </div>
                    )}
                    
                    {profileData.city && (
                      <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl">
                        <div className="p-3 bg-pink-100 rounded-xl">
                          <MapPin className="h-5 w-5 text-pink-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 font-medium">City</p>
                          <p className="text-gray-900 font-semibold">{profileData.city}</p>
                        </div>
                      </div>
                    )}
                    
                    {profileData.location && (
                      <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-rose-50 to-red-50 rounded-2xl">
                        <div className="p-3 bg-rose-100 rounded-xl">
                          <MapPin className="h-5 w-5 text-rose-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 font-medium">Location</p>
                          <p className="text-gray-900 font-semibold">{profileData.location}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-red-50 to-indigo-50 rounded-2xl">
                      <div className="p-3 bg-red-100 rounded-xl">
                        <Calendar className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 font-medium">Joined</p>
                        <p className="text-gray-900 font-semibold">{formatDate(profileData.createdAt)}</p>
                      </div>
                    </div>
                    
                    {profileData.website && (
                      <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl">
                        <div className="p-3 bg-indigo-100 rounded-xl">
                          <Globe className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 font-medium">Website</p>
                          <a href={profileData.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-semibold hover:underline">
                            {profileData.website}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Content Preferences */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-2xl rounded-3xl">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <Target className="h-6 w-6 text-green-600" />
                  </div>
                  Content Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <Label className="text-base font-medium text-gray-700">Content Language</Label>
                      <RadioGroup
                        value={editableCustomization.content_language || ""}
                        onValueChange={(value) => handleCustomizationChange("content_language", value)}
                      >
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="English" id="lang-english" />
                          <Label htmlFor="lang-english" className="text-base">English</Label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="Hindi" id="lang-hindi" />
                          <Label htmlFor="lang-hindi" className="text-base">Hindi</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div className="space-y-4">
                      <Label className="text-base font-medium text-gray-700">Target Audience</Label>
                      <RadioGroup
                        value={editableCustomization.target_audience || ""}
                        onValueChange={(value) => handleCustomizationChange("target_audience", value)}
                      >
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="Founders / Entrepreneurs" id="audience-founders" />
                          <Label htmlFor="audience-founders" className="text-base">Founders / Entrepreneurs</Label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="Working Professionals" id="audience-professionals" />
                          <Label htmlFor="audience-professionals" className="text-base">Working Professionals</Label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="Students" id="audience-students" />
                          <Label htmlFor="audience-students" className="text-base">Students</Label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="Freelancers" id="audience-freelancers" />
                          <Label htmlFor="audience-freelancers" className="text-base">Freelancers</Label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="General Public" id="audience-general" />
                          <Label htmlFor="audience-general" className="text-base">General Public</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div className="space-y-4">
                      <Label className="text-base font-medium text-gray-700">Content Goal</Label>
                      <RadioGroup
                        value={editableCustomization.content_goal || ""}
                        onValueChange={(value) => handleCustomizationChange("content_goal", value)}
                      >
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="Build Authority" id="goal-authority" />
                          <Label htmlFor="goal-authority" className="text-base">Build Authority</Label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="Generate Leads" id="goal-leads" />
                          <Label htmlFor="goal-leads" className="text-base">Generate Leads</Label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="Educate Audience" id="goal-educate" />
                          <Label htmlFor="goal-educate" className="text-base">Educate Audience</Label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="Entertain" id="goal-entertain" />
                          <Label htmlFor="goal-entertain" className="text-base">Entertain</Label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="Personal Branding" id="goal-branding" />
                          <Label htmlFor="goal-branding" className="text-base">Personal Branding</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div className="space-y-4">
                      <Label className="text-base font-medium text-gray-700">Content Tone</Label>
                      <RadioGroup
                        value={editableCustomization.content_tone || ""}
                        onValueChange={(value) => handleCustomizationChange("content_tone", value)}
                      >
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="Conversational" id="tone-conversational" />
                          <Label htmlFor="tone-conversational" className="text-base">Conversational</Label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="Bold" id="tone-bold" />
                          <Label htmlFor="tone-bold" className="text-base">Bold</Label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="Professional" id="tone-professional" />
                          <Label htmlFor="tone-professional" className="text-base">Professional</Label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="Witty" id="tone-witty" />
                          <Label htmlFor="tone-witty" className="text-base">Witty</Label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="Inspirational" id="tone-inspirational" />
                          <Label htmlFor="tone-inspirational" className="text-base">Inspirational</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl">
                      <p className="text-sm text-gray-500 font-medium mb-1">Content Language</p>
                      <p className="text-lg text-gray-900 font-semibold">
                        {profileData.customizationData?.content_language || "Not specified"}
                      </p>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl">
                      <p className="text-sm text-gray-500 font-medium mb-1">Target Audience</p>
                      <p className="text-lg text-gray-900 font-semibold">
                        {profileData.customizationData?.target_audience || "Not specified"}
                      </p>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl">
                      <p className="text-sm text-gray-500 font-medium mb-1">Content Goal</p>
                      <p className="text-lg text-gray-900 font-semibold">{profileData.customizationData?.content_goal || "Not specified"}</p>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl">
                      <p className="text-sm text-gray-500 font-medium mb-1">Content Tone</p>
                      <p className="text-lg text-gray-900 font-semibold">{profileData.customizationData?.content_tone || "Not specified"}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Brand Story */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-2xl rounded-3xl">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <FileText className="h-6 w-6 text-purple-600" />
                  </div>
                  Brand Story
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                {isEditing ? (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label className="text-base font-medium text-gray-700">Career Journey</Label>
                      <Textarea
                        value={editableBaseStory.careerJourney || ""}
                        onChange={(e) => handleBaseStoryChange("careerJourney", e.target.value)}
                        placeholder="Can you walk me through your professional journey, including key milestones and challenges you've faced?"
                        className="min-h-[120px] text-base"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-base font-medium text-gray-700">Personal Life & Lifestyle</Label>
                      <Textarea
                        value={editableBaseStory.personalLife || ""}
                        onChange={(e) => handleBaseStoryChange("personalLife", e.target.value)}
                        placeholder="How do you like to spend your time outside of work, and what are your hobbies or passions?"
                        className="min-h-[120px] text-base"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-base font-medium text-gray-700">Aspirations & Goals</Label>
                      <Textarea
                        value={editableBaseStory.aspirationsGoals || ""}
                        onChange={(e) => handleBaseStoryChange("aspirationsGoals", e.target.value)}
                        placeholder="What are your short-term and long-term goals, both personally and professionally?"
                        className="min-h-[120px] text-base"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {profileData.baseStoryData?.careerJourney && (
                      <div className="p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Career Journey</h3>
                        <p className="text-gray-700 leading-relaxed">{profileData.baseStoryData.careerJourney}</p>
                      </div>
                    )}
                    {profileData.baseStoryData?.personalLife && (
                      <div className="p-6 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Personal Life & Lifestyle</h3>
                        <p className="text-gray-700 leading-relaxed">{profileData.baseStoryData.personalLife}</p>
                      </div>
                    )}
                    {profileData.baseStoryData?.aspirationsGoals && (
                      <div className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Aspirations & Goals</h3>
                        <p className="text-gray-700 leading-relaxed">{profileData.baseStoryData.aspirationsGoals}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            {/* Account Status */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-2xl rounded-3xl">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Shield className="h-6 w-6 text-blue-600" />
                  </div>
                  Account Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl">
                    <p className="text-sm text-gray-500 font-medium mb-2">Subscription Plan</p>
                    <Badge className={`${getSubscriptionBadge(profileData.subscriptionStatus).color} text-sm px-3 py-1`}>
                      <Crown className="h-3 w-3 mr-1" />
                      {getSubscriptionBadge(profileData.subscriptionStatus).label}
                    </Badge>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl">
                    <p className="text-sm text-gray-500 font-medium mb-2">Profile Status</p>
                    <Badge
                      className={
                        profileData.onboardingCompleted
                          ? "bg-green-100 text-green-800 text-sm px-3 py-1"
                          : "bg-yellow-100 text-yellow-800 text-sm px-3 py-1"
                      }
                    >
                      {profileData.onboardingCompleted ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Complete
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3 mr-1" />
                          Incomplete
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profile Summary */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-2xl rounded-3xl">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <Heart className="h-6 w-6 text-purple-600" />
                  </div>
                  Profile Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Member Since</span>
                    <span className="text-lg font-semibold text-purple-600">{formatDate(profileData.createdAt)}</span>
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Profile Status</span>
                    <Badge
                      className={
                        profileData.onboardingCompleted
                          ? "bg-green-100 text-green-800 text-sm px-3 py-1"
                          : "bg-yellow-100 text-yellow-800 text-sm px-3 py-1"
                      }
                    >
                      {profileData.onboardingCompleted ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Complete
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3 mr-1" />
                          Incomplete
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-r from-rose-50 to-red-50 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Last Updated</span>
                    <span className="text-lg font-semibold text-rose-600">{formatDate(profileData.updatedAt)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Profile Picture Options Modal - Step 1 */}
        {showProfileOptions && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999]" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
            <div className="bg-white rounded-xl shadow-2xl w-80 p-6 mx-4 relative" style={{ zIndex: 100000 }}>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-xl font-semibold text-gray-900">Change Profile Picture</h4>
                  <Button
                    onClick={() => setShowProfileOptions(false)}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {/* Upload Option */}
                  <Button
                    onClick={triggerFileUpload}
                    disabled={isUploadingPicture}
                    variant="outline"
                    className="w-full justify-start h-14 text-base hover:bg-blue-50 hover:border-blue-300"
                  >
                    {isUploadingPicture ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-3" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-5 w-5 mr-3" />
                        Upload Photo
                      </>
                    )}
                  </Button>

                  {/* Avatar Option */}
                  <Button
                    onClick={() => {
                      setShowProfileOptions(false)
                      setShowAvatarOptions(true)
                    }}
                    variant="outline"
                    className="w-full justify-start h-14 text-base hover:bg-purple-50 hover:border-purple-300"
                  >
                    <Palette className="h-5 w-5 mr-3" />
                    Generate Avatar
                  </Button>
                </div>

                <p className="text-sm text-gray-500 text-center">
                  Choose how you'd like to update your profile picture
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Avatar Options Modal - Step 2 */}
        {showAvatarOptions && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999]" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
            <div className="bg-white rounded-xl shadow-2xl w-96 max-h-[90vh] overflow-y-auto p-6 mx-4 relative" style={{ zIndex: 100000 }}>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-xl font-semibold text-gray-900">Choose Avatar Style</h4>
                  <Button
                    onClick={() => setShowAvatarOptions(false)}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    onClick={() => handleGenerateAvatar("initials")}
                    disabled={isGeneratingAvatar}
                    variant="outline"
                    className="flex flex-col items-center gap-3 h-24 py-4 hover:bg-blue-50 hover:border-blue-300"
                  >
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-lg font-bold">
                      U
                    </div>
                    <span className="text-sm font-medium">Initials</span>
                  </Button>

                  <Button
                    onClick={() => handleGenerateAvatar("geometric")}
                    disabled={isGeneratingAvatar}
                    variant="outline"
                    className="flex flex-col items-center gap-3 h-24 py-4 hover:bg-green-50 hover:border-green-300"
                  >
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center text-white text-lg">
                      ◇
                    </div>
                    <span className="text-sm font-medium">Geometric</span>
                  </Button>

                  <Button
                    onClick={() => handleGenerateAvatar("gradient")}
                    disabled={isGeneratingAvatar}
                    variant="outline"
                    className="flex flex-col items-center gap-3 h-24 py-4 hover:bg-pink-50 hover:border-pink-300"
                  >
                    <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full flex items-center justify-center text-white text-lg font-bold">
                      U
                    </div>
                    <span className="text-sm font-medium">Gradient</span>
                  </Button>

                  <Button
                    onClick={() => handleGenerateAvatar("minimal")}
                    disabled={isGeneratingAvatar}
                    variant="outline"
                    className="flex flex-col items-center gap-3 h-24 py-4 hover:bg-gray-50 hover:border-gray-300"
                  >
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 text-lg font-bold">
                      U
                    </div>
                    <span className="text-sm font-medium">Minimal</span>
                  </Button>
                </div>

                {isGeneratingAvatar && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin mr-2 text-blue-600" />
                    <span className="text-sm text-gray-600">Generating avatar...</span>
                  </div>
                )}

                <div className="border-t pt-4">
                  <Button
                    onClick={() => {
                      setShowAvatarOptions(false)
                      setShowProfileOptions(true)
                    }}
                    variant="ghost"
                    className="w-full"
                  >
                    ← Back to Options
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
    </div>
  )
}

