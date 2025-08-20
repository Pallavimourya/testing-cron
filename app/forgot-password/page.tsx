"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, ArrowLeft, Loader2 } from "lucide-react"

export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        console.log("✅ Password reset email sent successfully")
        setIsSubmitted(true)
      } else {
        setError(data.error || "Failed to send reset email")
      }
    } catch (error) {
      console.error("❌ Error:", error)
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white/10 backdrop-blur-lg p-8 rounded-2xl border border-white/20 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
            <Mail className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white">Reset your password</h2>
          <p className="mt-2 text-sm text-slate-300">
            Enter your email address and we'll send you a link to reset your password
          </p>
        </div>

        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div>
              <Label htmlFor="email" className="text-white flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-blue-400 focus:ring-blue-400"
                placeholder="Enter your email"
                disabled={isLoading}
              />
            </div>

            {error && (
              <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-400">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 rounded-xl transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending reset link...
                </>
              ) : (
                "Send reset link"
              )}
            </Button>

            <div className="text-center">
              <Link href="/signin" className="text-sm font-medium text-yellow-400 hover:text-yellow-300 transition-colors flex items-center justify-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </Link>
            </div>
          </form>
        ) : (
          <div className="mt-8 space-y-6 text-center">
            <div className="p-6 bg-green-500/10 rounded-xl border border-green-500/20">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Check your email!</h3>
              <p className="text-green-400">
                If an account exists with {email}, you will receive a password reset link shortly.
              </p>
            </div>
            
            <div className="space-y-4">
              <p className="text-slate-400 text-sm">
                Didn't receive the email? Check your spam folder or
              </p>
              <Button
                onClick={() => setIsSubmitted(false)}
                variant="ghost"
                className="text-yellow-400 hover:text-yellow-300 hover:bg-transparent"
              >
                Try again
              </Button>
            </div>
            
            <div className="pt-4 border-t border-white/20">
              <Link href="/signin" className="text-sm font-medium text-yellow-400 hover:text-yellow-300 transition-colors flex items-center justify-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
