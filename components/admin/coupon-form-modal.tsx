"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"

interface Coupon {
  _id: string
  code: string
  name: string
  description?: string
  type: "percentage" | "fixed"
  value: number
  minAmount?: number
  maxDiscount?: number
  usageLimit?: number
  perUserLimit?: number
  usageCount?: number
  validFrom: string | Date
  validUntil: string | Date
  applicablePlans: string[]
  isActive: boolean
  createdAt?: string | Date
  updatedAt?: string | Date
}

interface CouponFormModalProps {
  open: boolean
  onClose: (shouldRefresh?: boolean) => void
  coupon?: Coupon | null
}

const planOptions = [
  { value: "zuper15", label: "Starter" },
  { value: "zuper30", label: "Most Popular" },
  { value: "zuper360", label: "Professional" },
]

export function CouponFormModal({ open, onClose, coupon }: CouponFormModalProps) {
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    type: "percentage" as "percentage" | "fixed",
    value: "",
    minAmount: "",
    maxDiscount: "",
    usageLimit: "",
    perUserLimit: "1",
    validFrom: "",
    validUntil: "",
    applicablePlans: [] as string[],
  })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (coupon) {
      const validFrom = new Date(coupon.validFrom)
      const validUntil = new Date(coupon.validUntil)

      setFormData({
        code: coupon.code,
        name: coupon.name,
        description: coupon.description || "",
        type: coupon.type,
        value: coupon.value.toString(),
        minAmount: coupon.minAmount ? coupon.minAmount.toString() : "",
        maxDiscount: coupon.maxDiscount ? coupon.maxDiscount.toString() : "",
        usageLimit: coupon.usageLimit ? coupon.usageLimit.toString() : "",
        perUserLimit: coupon.perUserLimit ? coupon.perUserLimit.toString() : "1",
        validFrom: validFrom.toISOString().slice(0, 16),
        validUntil: validUntil.toISOString().slice(0, 16),
        applicablePlans: coupon.applicablePlans || [],
      })
    } else {
      const now = new Date()
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

      setFormData({
        code: "",
        name: "",
        description: "",
        type: "percentage",
        value: "",
        minAmount: "",
        maxDiscount: "",
        usageLimit: "",
        perUserLimit: "1",
        validFrom: now.toISOString().slice(0, 16),
        validUntil: nextWeek.toISOString().slice(0, 16),
        applicablePlans: [],
      })
    }
  }, [coupon, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        code: formData.code.toUpperCase(),
        name: formData.name,
        description: formData.description,
        type: formData.type,
        value: Number.parseFloat(formData.value),
        minAmount: formData.minAmount ? Number.parseFloat(formData.minAmount) : undefined,
        maxDiscount: formData.maxDiscount ? Number.parseFloat(formData.maxDiscount) : undefined,
        usageLimit: formData.usageLimit ? Number.parseInt(formData.usageLimit) : undefined,
        perUserLimit: Number.parseInt(formData.perUserLimit),
        validFrom: formData.validFrom,
        validUntil: formData.validUntil,
        applicablePlans: formData.applicablePlans,
      }

      const url = coupon ? `/api/coupons/${coupon._id}` : "/api/coupons"
      const method = coupon ? "PUT" : "POST"

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
          description: `Coupon ${coupon ? "updated" : "created"} successfully`,
        })
        onClose(true)
      } else {
        const data = await response.json()
        throw new Error(data.error || "Failed to save coupon")
      }
    } catch (error) {
      console.error("Save coupon error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save coupon",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePlanToggle = (planValue: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      applicablePlans: checked
        ? [...prev.applicablePlans, planValue]
        : prev.applicablePlans.filter((p) => p !== planValue),
    }))
  }

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{coupon ? "Edit Coupon" : "Create New Coupon"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="code">Coupon Code</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                placeholder="e.g., FIRST50"
                required
              />
            </div>
            <div>
              <Label htmlFor="name">Coupon Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., First Time User Discount"
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
              placeholder="Optional description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Discount Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: "percentage" | "fixed") => setFormData((prev) => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="value">{formData.type === "percentage" ? "Percentage (%)" : "Amount (₹)"}</Label>
              <Input
                id="value"
                type="number"
                value={formData.value}
                onChange={(e) => setFormData((prev) => ({ ...prev, value: e.target.value }))}
                placeholder={formData.type === "percentage" ? "e.g., 50" : "e.g., 100"}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="minAmount">Minimum Order Amount (₹)</Label>
              <Input
                id="minAmount"
                type="number"
                value={formData.minAmount}
                onChange={(e) => setFormData((prev) => ({ ...prev, minAmount: e.target.value }))}
                placeholder="Optional"
              />
            </div>
            {formData.type === "percentage" && (
              <div>
                <Label htmlFor="maxDiscount">Maximum Discount (₹)</Label>
                <Input
                  id="maxDiscount"
                  type="number"
                  value={formData.maxDiscount}
                  onChange={(e) => setFormData((prev) => ({ ...prev, maxDiscount: e.target.value }))}
                  placeholder="Optional"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="usageLimit">Total Usage Limit</Label>
              <Input
                id="usageLimit"
                type="number"
                value={formData.usageLimit}
                onChange={(e) => setFormData((prev) => ({ ...prev, usageLimit: e.target.value }))}
                placeholder="Optional (unlimited if empty)"
              />
            </div>
            <div>
              <Label htmlFor="perUserLimit">Per User Limit</Label>
              <Input
                id="perUserLimit"
                type="number"
                value={formData.perUserLimit}
                onChange={(e) => setFormData((prev) => ({ ...prev, perUserLimit: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="validFrom">Valid From</Label>
              <Input
                id="validFrom"
                type="datetime-local"
                value={formData.validFrom}
                onChange={(e) => setFormData((prev) => ({ ...prev, validFrom: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="validUntil">Valid Until</Label>
              <Input
                id="validUntil"
                type="datetime-local"
                value={formData.validUntil}
                onChange={(e) => setFormData((prev) => ({ ...prev, validUntil: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <Label>Applicable Plans (leave empty for all plans)</Label>
            <div className="grid grid-cols-3 gap-4 mt-2">
              {planOptions.map((plan) => (
                <div key={plan.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={plan.value}
                    checked={formData.applicablePlans.includes(plan.value)}
                    onCheckedChange={(checked) => handlePlanToggle(plan.value, checked as boolean)}
                  />
                  <Label htmlFor={plan.value} className="text-sm">
                    {plan.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onClose()}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : coupon ? "Update Coupon" : "Create Coupon"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
