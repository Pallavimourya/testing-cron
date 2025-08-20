"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Clock, Send } from "lucide-react"
import { getCurrentISTTime } from "@/lib/timezone-utils"
import { useToast } from "@/hooks/use-toast"

interface SchedulePostModalProps {
  trigger?: React.ReactNode
  onScheduled?: () => void
}

export function SchedulePostModal({ trigger, onScheduled }: SchedulePostModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    content: "",
    imageUrl: "",
    scheduledAtIST: getCurrentISTTime(),
  })

  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/scheduled-posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Post Scheduled",
          description: "Your post has been scheduled successfully!",
        })
        setOpen(false)
        setFormData({
          content: "",
          imageUrl: "",
          scheduledAtIST: getCurrentISTTime(),
        })
        onScheduled?.()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to schedule post",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error scheduling post:", error)
      toast({
        title: "Error",
        description: "Failed to schedule post. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Calendar className="w-4 h-4 mr-2" />
            Schedule Post
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Schedule LinkedIn Post
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="content">Post Content *</Label>
            <Textarea
              id="content"
              placeholder="What would you like to share on LinkedIn?"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
              rows={4}
              className="resize-none"
            />
            <div className="text-sm text-muted-foreground">{formData.content.length}/3000 characters</div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL (Optional)</Label>
            <Input
              id="imageUrl"
              type="url"
              placeholder="https://example.com/image.jpg"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="scheduledAt">Schedule Time (IST) *</Label>
            <Input
              id="scheduledAt"
              type="datetime-local"
              value={formData.scheduledAtIST}
              onChange={(e) => setFormData({ ...formData, scheduledAtIST: e.target.value })}
              required
              min={getCurrentISTTime()}
            />
            <div className="text-sm text-muted-foreground">Time is in Indian Standard Time (IST)</div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.content.trim()}>
              {loading ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Scheduling...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Schedule Post
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
