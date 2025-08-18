"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Play, 
  Mic, 
  FileText, 
  Sparkles, 
  CheckCircle, 
  ArrowRight, 
  Video, 
  BookOpen, 
  Users, 
  Settings,
  Lightbulb,
  Zap
} from "lucide-react"

export default function HowToUsePage() {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                How to Use LinkZup ✨
              </h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">Learn how to use our platform effectively</p>
            </div>
            <div className="flex items-center space-x-4 w-full sm:w-auto">
              <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                <Video className="h-4 w-4 mr-2" />
                Video Tutorials
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Start Guide */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="flex items-center text-gray-900">
                  <Zap className="h-6 w-6 mr-3 text-yellow-600" />
                  Quick Start Guide
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Get started with LinkZup in 5 minutes
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                      1
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">Complete Your Profile</h3>
                      <p className="text-gray-600 text-sm">
                        Go to Profile section and fill in your base story details. This helps us understand your background and create personalized content.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                      2
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">Generate Content</h3>
                      <p className="text-gray-600 text-sm">
                        Use Content Generation to record audio or upload files. Our AI will transcribe and create engaging LinkedIn posts based on your requirements.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                      3
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">Manage Topics</h3>
                      <p className="text-gray-600 text-sm">
                        Visit Topic Bank to generate and manage content topics. Approve topics you like and they'll be available for content creation.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold">
                      4
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">Schedule & Post</h3>
                      <p className="text-gray-600 text-sm">
                        Use Calendar to schedule your approved content. Set up automatic posting to LinkedIn or post manually when ready.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Video Tutorials */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="flex items-center text-gray-900">
                  <Video className="h-6 w-6 mr-3 text-red-600" />
                  Video Tutorials
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Watch step-by-step video guides
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-4 mb-6">
                    <TabsTrigger value="overview" className="gap-2">
                      <BookOpen className="h-4 w-4" />
                      Overview
                    </TabsTrigger>
                    <TabsTrigger value="content" className="gap-2">
                      <Mic className="h-4 w-4" />
                      Content
                    </TabsTrigger>
                    <TabsTrigger value="topics" className="gap-2">
                      <Sparkles className="h-4 w-4" />
                      Topics
                    </TabsTrigger>
                    <TabsTrigger value="calendar" className="gap-2">
                      <Settings className="h-4 w-4" />
                      Calendar
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4">
                    <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <Play className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Platform Overview</h3>
                        <p className="text-gray-500 text-sm">Video coming soon...</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900">What you'll learn:</h4>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          Platform navigation and key features
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          Setting up your profile and preferences
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          Understanding the dashboard layout
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          Best practices for content creation
                        </li>
                      </ul>
                    </div>
                  </TabsContent>

                  <TabsContent value="content" className="space-y-4">
                    <div className="aspect-video bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <Mic className="h-16 w-16 text-blue-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Content Generation</h3>
                        <p className="text-gray-500 text-sm">Video coming soon...</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900">Content creation process:</h4>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          Recording audio for content generation
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          Uploading audio files
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          Setting content requirements
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          Reviewing and editing content
                        </li>
                      </ul>
                    </div>
                  </TabsContent>

                  <TabsContent value="topics" className="space-y-4">
                    <div className="aspect-video bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <Sparkles className="h-16 w-16 text-purple-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Topic Management</h3>
                        <p className="text-gray-500 text-sm">Video coming soon...</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900">Topic bank features:</h4>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          Auto-generating topics from your profile
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          Manual topic creation with prompts
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          Approving and rejecting topics
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          Using topics for content generation
                        </li>
                      </ul>
                    </div>
                  </TabsContent>

                  <TabsContent value="calendar" className="space-y-4">
                    <div className="aspect-video bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <Settings className="h-16 w-16 text-green-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Calendar & Scheduling</h3>
                        <p className="text-gray-500 text-sm">Video coming soon...</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900">Scheduling features:</h4>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          Viewing scheduled content calendar
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          Bulk scheduling multiple posts
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          Setting custom posting intervals
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          Managing auto-posting settings
                        </li>
                      </ul>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Tips & FAQ */}
          <div className="space-y-6">
            {/* Pro Tips */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="flex items-center text-gray-900">
                  <Lightbulb className="h-6 w-6 mr-3 text-yellow-600" />
                  Pro Tips
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Best practices for optimal results
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <h4 className="font-semibold text-yellow-800 mb-2">🎯 Content Quality</h4>
                    <p className="text-yellow-700 text-sm">
                      Record clear audio in a quiet environment for better transcription accuracy.
                    </p>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-2">📅 Consistent Posting</h4>
                    <p className="text-blue-700 text-sm">
                      Schedule posts at optimal times (9 AM - 11 AM) for maximum engagement.
                    </p>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-2">🔍 Topic Research</h4>
                    <p className="text-green-700 text-sm">
                      Use the Topic Bank to generate diverse content ideas and maintain variety.
                    </p>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h4 className="font-semibold text-purple-800 mb-2">📊 Analytics</h4>
                    <p className="text-purple-700 text-sm">
                      Monitor your content performance and adjust your strategy accordingly.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* FAQ */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="flex items-center text-gray-900">
                  <Users className="h-6 w-6 mr-3 text-blue-600" />
                  Frequently Asked Questions
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Common questions and answers
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    <div className="border-b border-gray-200 pb-4">
                      <h4 className="font-semibold text-gray-900 mb-2">How do I get started?</h4>
                      <p className="text-gray-600 text-sm">
                        Complete your profile first, then use Content Generation to create your first post. The system will guide you through each step.
                      </p>
                    </div>

                    <div className="border-b border-gray-200 pb-4">
                      <h4 className="font-semibold text-gray-900 mb-2">What audio formats are supported?</h4>
                      <p className="text-gray-600 text-sm">
                        We support MP3, WAV, M4A, and other common audio formats. Files should be under 10MB for optimal processing.
                      </p>
                    </div>

                    <div className="border-b border-gray-200 pb-4">
                      <h4 className="font-semibold text-gray-900 mb-2">How long does content generation take?</h4>
                      <p className="text-gray-600 text-sm">
                        Audio transcription takes 30-60 seconds, and content generation typically takes 1-2 minutes depending on length.
                      </p>
                    </div>

                    <div className="border-b border-gray-200 pb-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Can I edit content?</h4>
                      <p className="text-gray-600 text-sm">
                        Yes! All content can be edited before posting. You can modify the text, hashtags, and other elements.
                      </p>
                    </div>

                    <div className="border-b border-gray-200 pb-4">
                      <h4 className="font-semibold text-gray-900 mb-2">How do I schedule posts?</h4>
                      <p className="text-gray-600 text-sm">
                        Use the Calendar feature to schedule posts. You can set specific times or use bulk scheduling for multiple posts.
                      </p>
                    </div>

                    <div className="pb-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Is my content automatically posted?</h4>
                      <p className="text-gray-600 text-sm">
                        Content is only posted after your approval. You have full control over what gets published to LinkedIn.
                      </p>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Support */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="flex items-center text-gray-900">
                  <FileText className="h-6 w-6 mr-3 text-green-600" />
                  Need Help?
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Get support when you need it
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    <FileText className="h-4 w-4 mr-2" />
                    Documentation
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Users className="h-4 w-4 mr-2" />
                    Contact Support
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Video className="h-4 w-4 mr-2" />
                    Video Library
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
