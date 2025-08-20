"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Linkedin,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  User,
  Calendar,
  TrendingUp,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"

interface LinkedInConnectProps {
  userEmail: string
}

interface LinkedInStatus {
  isConnected: boolean
  linkedinName?: string
  linkedinEmail?: string
  linkedinProfileUrl?: string
  connectedAt?: string
  lastSync?: string
  serviceStatus?: "online" | "offline" | "unknown"
  linkedinId?: string
  tokenExpired?: boolean
}

export default function LinkedInConnect({ userEmail }: LinkedInConnectProps) {
  const [status, setStatus] = useState<LinkedInStatus>({ isConnected: false })
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  // Check LinkedIn connection status
  const checkLinkedInStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/linkedin/status", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setStatus(data)

        // Show appropriate messages based on status
        if (data.tokenExpired) {
          toast.error("LinkedIn token expired. Please reconnect your account.")
        } else if (data.isConnected && data.serviceStatus === "offline") {
          toast.warning("LinkedIn services are currently unavailable.")
        }
      } else {
        const errorData = await response.json()
        console.error("Failed to check LinkedIn status:", errorData)
        setStatus({ isConnected: false, serviceStatus: "unknown" })
      }
    } catch (error) {
      console.error("Error checking LinkedIn status:", error)
      setStatus({ isConnected: false, serviceStatus: "offline" })
      toast.error("Unable to check LinkedIn connection status")
    } finally {
      setLoading(false)
    }
  }

  // Connect LinkedIn account
  const connectLinkedIn = async () => {
    try {
      setConnecting(true)

      const response = await fetch("/api/auth/linkedin", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()

        if (data.authUrl) {
          // Store connection attempt in localStorage for callback handling
          localStorage.setItem("linkedin_connecting", "true")

          // Redirect to LinkedIn OAuth
          window.location.href = data.authUrl
        } else {
          toast.error("Failed to get LinkedIn authorization URL")
        }
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to connect LinkedIn")
      }
    } catch (error) {
      console.error("Error connecting LinkedIn:", error)
      toast.error("Failed to connect LinkedIn account. Please try again later.")
    } finally {
      setConnecting(false)
    }
  }

  // Disconnect LinkedIn account
  const disconnectLinkedIn = async () => {
    try {
      setDisconnecting(true)

      const response = await fetch("/api/linkedin/disconnect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        setStatus({ isConnected: false })
        toast.success("LinkedIn account disconnected successfully")
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Failed to disconnect LinkedIn account")
      }
    } catch (error) {
      console.error("Error disconnecting LinkedIn:", error)
      toast.error("Failed to disconnect LinkedIn account")
    } finally {
      setDisconnecting(false)
    }
  }

  // Sync LinkedIn data
  const syncLinkedInData = async () => {
    try {
      setSyncing(true)

      const response = await fetch("/api/linkedin/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        toast.success("LinkedIn data synced successfully")
        await checkLinkedInStatus() // Refresh status
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Failed to sync LinkedIn data")
      }
    } catch (error) {
      console.error("Error syncing LinkedIn data:", error)
      toast.error("Failed to sync LinkedIn data")
    } finally {
      setSyncing(false)
    }
  }

  // Check for connection success from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const linkedinParam = urlParams.get("linkedin")
    const errorParam = urlParams.get("error")

    if (linkedinParam === "connected") {
      toast.success("LinkedIn account connected successfully!")
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
      // Remove connecting flag
      localStorage.removeItem("linkedin_connecting")
    } else if (errorParam) {
      const errorMessages: { [key: string]: string } = {
        linkedin_auth_failed: "LinkedIn authorization failed",
        missing_params: "Missing authorization parameters",
        invalid_state: "Invalid authorization state",
        token_exchange_failed: "Failed to exchange authorization code",
        profile_fetch_failed: "Failed to fetch LinkedIn profile",
        callback_failed: "LinkedIn callback failed",
      }

      toast.error(errorMessages[errorParam] || "LinkedIn connection failed")
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
      // Remove connecting flag
      localStorage.removeItem("linkedin_connecting")
    }
  }, [])

  // Check status on component mount and when coming back from OAuth
  useEffect(() => {
    checkLinkedInStatus()

    // Check if we're returning from LinkedIn OAuth
    const wasConnecting = localStorage.getItem("linkedin_connecting")
    if (wasConnecting) {
      // Wait a bit for the callback to process
      setTimeout(() => {
        checkLinkedInStatus()
        localStorage.removeItem("linkedin_connecting")
      }, 2000)
    }
  }, [])

  if (loading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-3" />
            <span className="text-gray-600">Checking LinkedIn connection...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (status.isConnected) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="flex items-center text-gray-900">
            <Linkedin className="h-6 w-6 mr-3 text-blue-600" />
            LinkedIn Connected
            <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700">
              <CheckCircle className="h-3 w-3 mr-1" />
              Connected
            </Badge>
            {status.serviceStatus === "offline" && (
              <Badge variant="secondary" className="ml-2 bg-yellow-100 text-yellow-700">
                <AlertCircle className="h-3 w-3 mr-1" />
                Service Issues
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Profile Info */}
            <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{status.linkedinName || "LinkedIn User"}</h3>
                <p className="text-sm text-gray-600">{status.linkedinEmail || userEmail}</p>
                {status.linkedinProfileUrl && (
                  <a
                    href={status.linkedinProfileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center mt-1"
                  >
                    View Profile <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                )}
              </div>
            </div>

            {/* Connection Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">Connected Since</span>
                </div>
                <p className="text-sm text-gray-600">
                  {status.connectedAt ? new Date(status.connectedAt).toLocaleDateString() : "Unknown"}
                </p>
              </div>

              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-gray-700">Last Sync</span>
                </div>
                <p className="text-sm text-gray-600">
                  {status.lastSync ? new Date(status.lastSync).toLocaleDateString() : "Never"}
                </p>
              </div>
            </div>

            {/* Service Status Warning */}
            {status.serviceStatus === "offline" && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
                  <span className="text-sm text-yellow-800">
                    LinkedIn services are currently experiencing issues. Some features may not work properly.
                  </span>
                </div>
              </div>
            )}

            {/* Token Expired Warning */}
            {status.tokenExpired && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                  <span className="text-sm text-red-800">
                    Your LinkedIn access token has expired. Please reconnect your account.
                  </span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <Button
                onClick={syncLinkedInData}
                disabled={syncing || status.serviceStatus === "offline" || status.tokenExpired}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {syncing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync Data
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={disconnectLinkedIn}
                disabled={disconnecting}
                className="border-red-200 text-red-600 hover:bg-red-50 bg-transparent"
              >
                {disconnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Disconnecting...
                  </>
                ) : (
                  "Disconnect"
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader className="border-b border-gray-100">
        <CardTitle className="flex items-center text-gray-900">
          <Linkedin className="h-6 w-6 mr-3 text-blue-600" />
          Connect LinkedIn Account
          <Badge variant="secondary" className="ml-2 bg-gray-100 text-gray-600">
            <AlertCircle className="h-3 w-3 mr-1" />
            Not Connected
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="text-center space-y-6">
          {/* Icon */}
          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto">
            <Linkedin className="h-10 w-10 text-blue-600" />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">Connect Your LinkedIn Account</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Connect your LinkedIn account to automatically post your approved content and sync your profile data for
              better content personalization.
            </p>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
              <div className="font-medium text-gray-900 mb-1">🚀 Auto-Post</div>
              <div className="text-gray-600">Publish content directly</div>
            </div>
            <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
              <div className="font-medium text-gray-900 mb-1">📊 Analytics</div>
              <div className="text-gray-600">Track post performance</div>
            </div>
            <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
              <div className="font-medium text-gray-900 mb-1">🎯 Personalized</div>
              <div className="text-gray-600">Content tailored to you</div>
            </div>
          </div>

          {/* Service Status */}
          {status.serviceStatus === "offline" && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm">
              <div className="flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                <span className="text-red-700 font-medium">LinkedIn Services Unavailable</span>
              </div>
              <p className="text-red-600 mt-1">LinkedIn is experiencing service issues. Please try again later.</p>
            </div>
          )}

          {/* Connect Button */}
          <Button
            onClick={connectLinkedIn}
            disabled={connecting || status.serviceStatus === "offline"}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-8 py-3"
          >
            {connecting ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Connecting...
              </>
            ) : status.serviceStatus === "offline" ? (
              <>
                <AlertCircle className="h-5 w-5 mr-2" />
                LinkedIn Services Down
              </>
            ) : (
              <>
                <Linkedin className="h-5 w-5 mr-2" />
                Connect LinkedIn Account
              </>
            )}
          </Button>

          {/* Security Note */}
          <div className="text-xs text-gray-500 max-w-sm mx-auto space-y-2">
            <p>🔒 Your data is secure. We only access the data you authorize and never store your LinkedIn password.</p>
            <p>
              <button onClick={checkLinkedInStatus} className="text-blue-600 hover:text-blue-700 underline">
                Refresh Connection Status
              </button>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
