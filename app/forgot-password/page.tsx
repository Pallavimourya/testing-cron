"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Handle password reset logic here
    setIsSubmitted(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-slate-800/50 p-8 rounded-2xl backdrop-blur-sm border border-slate-700/50">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-white">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            Enter your email address and we'll send you a link to reset your password
          </p>
        </div>

        {!isSubmitted ? (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="email" className="text-white">Email address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
                placeholder="Enter your email"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-bold py-3 rounded-full transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              Send reset link
            </Button>

            <div className="text-center">
              <Link href="/signin" className="text-sm font-medium text-yellow-400 hover:text-yellow-300">
                Back to sign in
              </Link>
            </div>
          </form>
        ) : (
          <div className="mt-8 space-y-6 text-center">
            <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
              <p className="text-white">
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
                className="text-yellow-400 hover:text-yellow-300 hover:bg-slate-800/50"
              >
                Try again
              </Button>
            </div>
            <div className="pt-4 border-t border-slate-700/50">
              <Link href="/signin" className="text-sm font-medium text-yellow-400 hover:text-yellow-300">
                Back to sign in
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
