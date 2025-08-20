"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Copy, Linkedin, Twitter, Instagram, Facebook, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ContentApprovalCardProps {
  content: {
    id: string
    linkedinPost?: string
    twitterPost?: string
    facebookPost?: string
    instagramCaption?: string
    hashtags?: string[]
    keyPoints?: string[]
    status: "pending" | "approved" | "rejected"
  }
  onApprove: (contentId: string, updatedContent?: any) => Promise<void>
  onReject: (contentId: string) => Promise<void>
  onUpdate?: (contentId: string, updates: any) => Promise<void>
}

export default function ContentApprovalCard({ content, onApprove, onReject, onUpdate }: ContentApprovalCardProps) {
  const [isApproving, setIsApproving] = useState(false)
  const [editedContent, setEditedContent] = useState({
    linkedinPost: content.linkedinPost || "",
    twitterPost: content.twitterPost || "",
    facebookPost: content.facebookPost || "",
    instagramCaption: content.instagramCaption || "",
  })
  const [statusUpdating, setStatusUpdating] = useState(false)

  const handleApprove = async () => {
    setIsApproving(true)
    try {
      // Check if content was edited
      const wasEdited =
        editedContent.linkedinPost !== content.linkedinPost ||
        editedContent.twitterPost !== content.twitterPost ||
        editedContent.facebookPost !== content.facebookPost ||
        editedContent.instagramCaption !== content.instagramCaption

      await onApprove(content.id, wasEdited ? editedContent : undefined)
      toast.success("Content approved and scheduled for posting!")
    } catch (error) {
      toast.error("Failed to approve content")
    } finally {
      setIsApproving(false)
    }
  }



  const handleStatusChange = async (newStatus: "pending" | "approved" | "rejected") => {
    if (!onUpdate) return
    setStatusUpdating(true)
    try {
      await onUpdate(content.id, { status: newStatus })
      toast.success(`Status updated to ${newStatus}`)
    } catch (error) {
      toast.error("Failed to update status")
    } finally {
      setStatusUpdating(false)
    }
  }

  const copyToClipboard = async (text: string, label = "Content") => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} copied to clipboard!`)
    } catch (error) {
      toast.error("Failed to copy to clipboard")
    }
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <CardTitle>Content</CardTitle>
          </div>
          {content.status === "pending" ? (
            <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pending Approval</Badge>
          ) : (
            <div className="flex items-center gap-2">
              {content.status === "approved" ? (
                <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Approved</Badge>
              ) : (
                <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Rejected</Badge>
              )}
              {/* Status edit dropdown */}
              <Select
                value={content.status}
                onValueChange={handleStatusChange}
                disabled={statusUpdating}
              >
                <SelectTrigger className="w-[120px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <CardDescription>Review and approve content before posting</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="linkedin" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="linkedin" className="gap-2">
              <Linkedin className="h-4 w-4" />
              LinkedIn
            </TabsTrigger>
            <TabsTrigger value="twitter" className="gap-2">
              <Twitter className="h-4 w-4" />
              Twitter
            </TabsTrigger>
            <TabsTrigger value="facebook" className="gap-2">
              <Facebook className="h-4 w-4" />
              Facebook
            </TabsTrigger>
            <TabsTrigger value="instagram" className="gap-2">
              <Instagram className="h-4 w-4" />
              Instagram
            </TabsTrigger>
          </TabsList>

          <TabsContent value="linkedin" className="space-y-4">
            <div className="p-4 bg-white rounded-lg border border-slate-200 min-h-[200px]">
              <Textarea
                value={editedContent.linkedinPost}
                onChange={(e) => {
                  setEditedContent({
                    ...editedContent,
                    linkedinPost: e.target.value,
                  })
                }}
                className="min-h-[200px] border-0 p-0 focus-visible:ring-0 resize-none"
                disabled={content.status !== "pending"}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(editedContent.linkedinPost, "LinkedIn post")}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="twitter" className="space-y-4">
            <div className="p-4 bg-white rounded-lg border border-slate-200 min-h-[200px]">
              <Textarea
                value={editedContent.twitterPost}
                onChange={(e) => {
                  setEditedContent({
                    ...editedContent,
                    twitterPost: e.target.value,
                  })
                }}
                className="min-h-[200px] border-0 p-0 focus-visible:ring-0 resize-none"
                disabled={content.status !== "pending"}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(editedContent.twitterPost, "Twitter post")}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="facebook" className="space-y-4">
            <div className="p-4 bg-white rounded-lg border border-slate-200 min-h-[200px]">
              <Textarea
                value={editedContent.facebookPost}
                onChange={(e) => {
                  setEditedContent({
                    ...editedContent,
                    facebookPost: e.target.value,
                  })
                }}
                className="min-h-[200px] border-0 p-0 focus-visible:ring-0 resize-none"
                disabled={content.status !== "pending"}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(editedContent.facebookPost, "Facebook post")}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="instagram" className="space-y-4">
            <div className="p-4 bg-white rounded-lg border border-slate-200 min-h-[200px]">
              <Textarea
                value={editedContent.instagramCaption}
                onChange={(e) => {
                  setEditedContent({
                    ...editedContent,
                    instagramCaption: e.target.value,
                  })
                }}
                className="min-h-[200px] border-0 p-0 focus-visible:ring-0 resize-none"
                disabled={content.status !== "pending"}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(editedContent.instagramCaption, "Instagram caption")}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            {content.hashtags?.map((tag, index) => (
              <Badge key={`tag-${index}`} variant="secondary" className="bg-purple-50 text-purple-700">
                #{tag}
              </Badge>
            ))}
          </div>

          <div className="flex justify-end mt-4">
            <Button onClick={handleApprove} disabled={isApproving} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              {isApproving ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Posting to LinkedIn...
                </span>
              ) : (
                <>
                  <Linkedin className="h-4 w-4 mr-2" />
                  Post to LinkedIn
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
