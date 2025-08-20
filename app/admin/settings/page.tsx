"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, XCircle, Settings, Shield, DollarSign, Webhook, Key, Globe, Activity } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PaymentSettings {
  razorpayKeyId?: string
  taxPercentage: number
  currency: string
  paymentsEnabled: boolean
  couponEngineEnabled: boolean
  lastWebhookTime?: string
}

interface ReadinessChecks {
  razorpayKeys: boolean
  webhookSecret: boolean
  activePlans: boolean
  currencySet: boolean
  couponEngine: boolean
  lastWebhook: boolean
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<PaymentSettings | null>(null)
  const [readiness, setReadiness] = useState<{ ready: boolean; checks: ReadinessChecks } | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    razorpayKeyId: "",
    razorpayKeySecret: "",
    razorpayWebhookSecret: "",
    taxPercentage: "0",
    currency: "INR",
    paymentsEnabled: false,
    couponEngineEnabled: true,
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings")
      if (response.ok) {
        const data = await response.json()
        
        // Ensure data has the expected structure
        if (data && typeof data === 'object') {
          setSettings(data.settings || null)
          setReadiness(data.readiness || null)

          // Ensure settings object exists with fallback values
          const settings = data.settings || {}
          
          setFormData({
            razorpayKeyId: settings.razorpayKeyId || "",
            razorpayKeySecret: "", // Never populate secret fields
            razorpayWebhookSecret: "",
            taxPercentage: (settings.taxPercentage ?? 0).toString(),
            currency: settings.currency || "INR",
            paymentsEnabled: settings.paymentsEnabled ?? false,
            couponEngineEnabled: settings.couponEngineEnabled ?? true,
          })
        } else {
          throw new Error("Invalid response format")
        }
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error)
      toast({
        title: "Error",
        description: "Failed to fetch settings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      const updateData: any = {
        razorpayKeyId: formData.razorpayKeyId,
        taxPercentage: Number.parseFloat(formData.taxPercentage) || 0,
        currency: formData.currency,
        paymentsEnabled: formData.paymentsEnabled,
        couponEngineEnabled: formData.couponEngineEnabled,
      }

      // Only include secrets if they're provided
      if (formData.razorpayKeySecret) {
        updateData.razorpayKeySecret = formData.razorpayKeySecret
      }
      if (formData.razorpayWebhookSecret) {
        updateData.razorpayWebhookSecret = formData.razorpayWebhookSecret
      }

      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
        setReadiness(data.readiness)

        // Clear secret fields after successful save
        setFormData((prev) => ({
          ...prev,
          razorpayKeySecret: "",
          razorpayWebhookSecret: "",
        }))

        toast({
          title: "Success",
          description: "Settings saved successfully",
        })
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to save settings")
      }
    } catch (error) {
      console.error("Save settings error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save settings",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const getCheckIcon = (passed: boolean) => {
    return passed ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />
  }

  const getStatusBadge = (passed: boolean) => {
    return (
      <Badge className={passed ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
        {passed ? "Ready" : "Not Ready"}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Payment Settings</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Payment Settings</h1>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Readiness Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Payment Readiness
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Overall Status</span>
                {readiness && (
                  <Badge className={readiness.ready ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {readiness.ready ? "System Ready" : "Setup Required"}
                  </Badge>
                )}
              </div>

              {readiness && readiness.checks && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      <span>Razorpay Keys</span>
                    </div>
                    {getStatusBadge(readiness.checks.razorpayKeys)}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Webhook className="h-4 w-4" />
                      <span>Webhook Secret</span>
                    </div>
                    {getStatusBadge(readiness.checks.webhookSecret)}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      <span>Active Plans</span>
                    </div>
                    {getStatusBadge(readiness.checks.activePlans)}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <span>Currency Set</span>
                    </div>
                    {getStatusBadge(readiness.checks.currencySet)}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      <span>Recent Webhook</span>
                    </div>
                    {getStatusBadge(readiness.checks.lastWebhook)}
                  </div>
                </div>
              )}

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Enable Payments</p>
                  <p className="text-sm text-gray-600">Only enable when all checks pass</p>
                </div>
                <Switch
                  checked={formData.paymentsEnabled}
                  onCheckedChange={(checked) => handleInputChange("paymentsEnabled", checked)}
                  disabled={!readiness?.ready}
                />
              </div>

              {settings?.lastWebhookTime && (
                <div className="text-xs text-gray-500">
                  Last webhook: {new Date(settings.lastWebhookTime).toLocaleString()}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Razorpay Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Razorpay Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="razorpayKeyId">Key ID</Label>
                <Input
                  id="razorpayKeyId"
                  value={formData.razorpayKeyId}
                  onChange={(e) => handleInputChange("razorpayKeyId", e.target.value)}
                  placeholder="rzp_test_..."
                />
              </div>

              <div>
                <Label htmlFor="razorpayKeySecret">Key Secret</Label>
                <Input
                  id="razorpayKeySecret"
                  type="password"
                  value={formData.razorpayKeySecret}
                  onChange={(e) => handleInputChange("razorpayKeySecret", e.target.value)}
                  placeholder="Leave empty to keep current"
                />
              </div>

              <div>
                <Label htmlFor="razorpayWebhookSecret">Webhook Secret</Label>
                <Input
                  id="razorpayWebhookSecret"
                  type="password"
                  value={formData.razorpayWebhookSecret}
                  onChange={(e) => handleInputChange("razorpayWebhookSecret", e.target.value)}
                  placeholder="Leave empty to keep current"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              General Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => handleInputChange("currency", e.target.value.toUpperCase())}
                  placeholder="INR"
                />
              </div>

              <div>
                <Label htmlFor="taxPercentage">Tax Percentage (%)</Label>
                <Input
                  id="taxPercentage"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.taxPercentage}
                  onChange={(e) => handleInputChange("taxPercentage", e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Coupon Engine</p>
                  <p className="text-sm text-gray-600">Enable coupon functionality</p>
                </div>
                <Switch
                  checked={formData.couponEngineEnabled}
                  onCheckedChange={(checked) => handleInputChange("couponEngineEnabled", checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Webhook Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              Webhook Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Webhook URL</Label>
                <div className="p-3 bg-gray-50 rounded-lg font-mono text-sm">
                  {typeof window !== "undefined"
                    ? `${window.location.origin}/api/payment/webhook`
                    : "/api/payment/webhook"}
                </div>
                <p className="text-xs text-gray-600 mt-1">Configure this URL in your Razorpay dashboard</p>
              </div>

              <div>
                <Label>Supported Events</Label>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>payment.authorized</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>payment.captured</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>payment.failed</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
