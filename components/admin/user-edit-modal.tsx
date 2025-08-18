"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface User {
  _id: string
  name: string
  email: string
  mobile?: string
  city?: string
  bio?: string
  company?: string
  subscriptionStatus: string
  subscriptionPlan?: string
  subscriptionExpiry?: string
  contentGenerated: number
  imagesGenerated: number
  isBlocked: boolean
  createdAt: string
  profilePhoto?: string
}

interface UserEditModalProps {
  open: boolean
  onClose: (shouldRefresh?: boolean) => void
  user?: User | null
}

export function UserEditModal({ open, onClose, user }: UserEditModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    city: "",
    bio: "",
    company: "",
    subscriptionStatus: "free",
    subscriptionPlan: "",
    isBlocked: false,
  })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        mobile: user.mobile || "",
        city: user.city || "",
        bio: user.bio || "",
        company: user.company || "",
        subscriptionStatus: user.subscriptionStatus,
        subscriptionPlan: user.subscriptionPlan || "",
        isBlocked: user.isBlocked,
      })
    } else {
      setFormData({
        name: "",
        email: "",
        mobile: "",
        city: "",
        bio: "",
        company: "",
        subscriptionStatus: "free",
        subscriptionPlan: "",
        isBlocked: false,
      })
    }
  }, [user, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)

    try {
      const response = await fetch(`/api/admin/users/${user._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "User updated successfully",
        })
        onClose(true)
      } else {
        const data = await response.json()
        throw new Error(data.error || "Failed to update user")
      }
    } catch (error) {
      console.error("Update user error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update user",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="mobile">Mobile</Label>
              <Input
                id="mobile"
                value={formData.mobile}
                onChange={(e) => setFormData((prev) => ({ ...prev, mobile: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => setFormData((prev) => ({ ...prev, company: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="subscriptionStatus">Subscription Status</Label>
              <Select
                value={formData.subscriptionStatus}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, subscriptionStatus: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="subscriptionPlan">Subscription Plan</Label>
              <Input
                id="subscriptionPlan"
                value={formData.subscriptionPlan}
                onChange={(e) => setFormData((prev) => ({ ...prev, subscriptionPlan: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="isBlocked">Account Status</Label>
            <Select
              value={formData.isBlocked ? "blocked" : "active"}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, isBlocked: value === "blocked" }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onClose()}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update User"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
