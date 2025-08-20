"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Plan {
  _id: string
  name: string
  slug: string
  description: string
  price: number
  durationDays: number
  features: string[]
  imageLimit: number
  contentLimit: number
  badge?: string
  color?: string
  icon?: string
  displayOrder: number
  isActive: boolean
}

interface PlanFormModalProps {
  open: boolean
  onClose: (shouldRefresh?: boolean) => void
  plan?: Plan | null
}

const iconOptions = [
  { value: "Star", label: "Star" },
  { value: "Zap", label: "Zap" },
  { value: "Crown", label: "Crown" },
]

const colorOptions = [
  { value: "from-blue-500 to-blue-600", label: "Blue" },
  { value: "from-purple-500 to-purple-600", label: "Purple" },
  { value: "from-orange-500 to-orange-600", label: "Orange" },
  { value: "from-green-500 to-green-600", label: "Green" },
  { value: "from-red-500 to-red-600", label: "Red" },
]

export function PlanFormModal({ open, onClose, plan }: PlanFormModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    price: "",
    durationDays: "",
    features: [""],
    imageLimit: "",
    contentLimit: "",
    badge: "",
    color: "from-blue-500 to-blue-600",
    icon: "Star",
    displayOrder: "",
  })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name,
        slug: plan.slug,
        description: plan.description,
        price: plan.price.toString(),
        durationDays: plan.durationDays.toString(),
        features: plan.features.length > 0 ? plan.features : [""],
        imageLimit: plan.imageLimit.toString(),
        contentLimit: plan.contentLimit === -1 ? "-1" : plan.contentLimit.toString(),
        badge: plan.badge || "",
        color: plan.color || "from-blue-500 to-blue-600",
        icon: plan.icon || "Star",
        displayOrder: plan.displayOrder.toString(),
      })
    } else {
      setFormData({
        name: "",
        slug: "",
        description: "",
        price: "",
        durationDays: "",
        features: [""],
        imageLimit: "",
        contentLimit: "",
        badge: "",
        color: "from-blue-500 to-blue-600",
        icon: "Star",
        displayOrder: "",
      })
    }
  }, [plan, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        price: Number.parseFloat(formData.price),
        durationDays: Number.parseInt(formData.durationDays),
        features: formData.features.filter((f) => f.trim() !== ""),
        imageLimit: Number.parseInt(formData.imageLimit) || 0,
        contentLimit: formData.contentLimit === "-1" ? -1 : Number.parseInt(formData.contentLimit) || 0,
        badge: formData.badge,
        color: formData.color,
        icon: formData.icon,
        displayOrder: Number.parseInt(formData.displayOrder) || 0,
      }

      const url = plan ? `/api/plans/${plan._id}` : "/api/plans"
      const method = plan ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Plan ${plan ? "updated" : "created"} successfully`,
        })
        onClose(true)
      } else {
        const data = await response.json()
        throw new Error(data.error || "Failed to save plan")
      }
    } catch (error) {
      console.error("Save plan error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save plan",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const addFeature = () => {
    setFormData((prev) => ({
      ...prev,
      features: [...prev.features, ""],
    }))
  }

  const removeFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }))
  }

  const updateFeature = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.map((f, i) => (i === index ? value : f)),
    }))
  }

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{plan ? "Edit Plan" : "Create New Plan"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Plan Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="slug">Plan Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                placeholder="e.g., starter-plan"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="price">Price (₹)</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="durationDays">Duration (Days)</Label>
              <Input
                id="durationDays"
                type="number"
                value={formData.durationDays}
                onChange={(e) => setFormData((prev) => ({ ...prev, durationDays: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="displayOrder">Display Order</Label>
              <Input
                id="displayOrder"
                type="number"
                value={formData.displayOrder}
                onChange={(e) => setFormData((prev) => ({ ...prev, displayOrder: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="imageLimit">Image Limit</Label>
              <Input
                id="imageLimit"
                type="number"
                value={formData.imageLimit}
                onChange={(e) => setFormData((prev) => ({ ...prev, imageLimit: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="contentLimit">Content Limit (-1 for unlimited)</Label>
              <Input
                id="contentLimit"
                type="number"
                value={formData.contentLimit}
                onChange={(e) => setFormData((prev) => ({ ...prev, contentLimit: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="badge">Badge</Label>
              <Input
                id="badge"
                value={formData.badge}
                onChange={(e) => setFormData((prev) => ({ ...prev, badge: e.target.value }))}
                placeholder="e.g., Most Popular"
              />
            </div>
            <div>
              <Label htmlFor="color">Color</Label>
              <Select
                value={formData.color}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, color: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="icon">Icon</Label>
              <Select
                value={formData.icon}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, icon: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {iconOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Features</Label>
              <Button type="button" variant="outline" size="sm" onClick={addFeature}>
                <Plus className="h-4 w-4 mr-1" />
                Add Feature
              </Button>
            </div>
            <div className="space-y-2">
              {formData.features.map((feature, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={feature}
                    onChange={(e) => updateFeature(index, e.target.value)}
                    placeholder="Enter feature"
                  />
                  {formData.features.length > 1 && (
                    <Button type="button" variant="outline" size="sm" onClick={() => removeFeature(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onClose()}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : plan ? "Update Plan" : "Create Plan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
