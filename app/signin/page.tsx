"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signIn, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function SignIn() {
  const router = useRouter()
  const { data: session } = useSession()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setIsLoading(true)
      console.log('🔐 Attempting signin with:', email)
      
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      })

      console.log('🔐 Signin result:', result)

      if (result?.error) {
        console.error('❌ Signin error:', result.error)
        throw new Error(result.error)
      }

      if (result?.ok) {
        console.log('✅ Signin successful, waiting for session to establish...')
        toast.success('Signed in successfully!')
        
        // Wait a bit for session to be established
        setTimeout(() => {
          // Check if user is admin and redirect accordingly
          if (email === 'admin@zuperstudio.com') {
            console.log('🔄 Redirecting to admin dashboard')
            router.push('/admin')
          } else {
            console.log('🔄 Redirecting to user dashboard')
            router.push('/dashboard')
          }
          router.refresh()
        }, 1000)
      } else {
        console.log('❌ Signin failed but no error returned')
        toast.error('Signin failed. Please check your credentials.')
      }
    } catch (error: any) {
      console.error('❌ Signin exception:', error)
      toast.error(error.message || 'Signin failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-slate-800/50 p-8 rounded-2xl backdrop-blur-sm border border-slate-700/50">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-white">
            Welcome back
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            Don't have an account?{" "}
            <Link href="/signup" className="font-medium text-yellow-400 hover:text-yellow-300">
              Sign up
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
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
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-white">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
                placeholder="Enter your password"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 rounded border-slate-700 bg-slate-900/50 text-yellow-400 focus:ring-yellow-400"
                disabled={isLoading}
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-400">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link href="/forgot-password" className="font-medium text-yellow-400 hover:text-yellow-300">
                Forgot your password?
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-bold py-3 rounded-full transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  )
}
