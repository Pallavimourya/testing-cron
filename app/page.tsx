"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, TrendingUp, CheckCircle2, Zap, Lightbulb, Users, Target, Award, Star, MessageSquare, BarChart, Check, Calendar, Rocket, Shield, X as XIcon } from "lucide-react"
import Link from "next/link"
import { useEffect, useState, useRef } from "react"

export default function HomePage() {
  const [stats, setStats] = useState({
    users: 0,
    messages: 0,
    posts: 0,
    successRate: 0,
  })

  const [impactStats, setImpactStats] = useState({
    monthsSinceLaunch: 3,
    countriesServed: 0,
    clientsServed: 0,
    projectsCompleted: 0,
    teamMembers: 0,
    industriesServed: 0,
    successRate: 0,
    awardsWon: 0
  })

  const [animatedStats, setAnimatedStats] = useState({
    monthsSinceLaunch: 0,
    countriesServed: 0,
    clientsServed: 0,
    successRate: 0
  })

  const [isImpactVisible, setIsImpactVisible] = useState(false)
  const impactRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => setStats(data))
    
    fetch("/api/impact-stats")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.stats.professional) {
          setImpactStats(data.stats.professional)
        }
      })
      .catch((error) => {
        console.error("Error fetching impact stats:", error)
        // Set fallback values if API fails
        setImpactStats({
          monthsSinceLaunch: 3,
          countriesServed: 5,
          clientsServed: 50,
          projectsCompleted: 100,
          teamMembers: 10,
          industriesServed: 8,
          successRate: 95,
          awardsWon: 3
        })
      })
  }, [])

  // Intersection Observer for scroll animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isImpactVisible) {
          setIsImpactVisible(true)
          animateCounts()
        }
      },
      { threshold: 0.3 }
    )

    if (impactRef.current) {
      observer.observe(impactRef.current)
    }

    return () => observer.disconnect()
  }, [isImpactVisible])

  // Simple and working counting animation
  const animateCounts = () => {
    const targetMonths = impactStats.monthsSinceLaunch || 3
    const targetCountries = impactStats.countriesServed || 5
    const targetUsers = impactStats.clientsServed || 50
    const targetSuccess = impactStats.successRate || 95

    let currentMonths = 0
    let currentCountries = 0
    let currentUsers = 0
    let currentSuccess = 0

    const interval = setInterval(() => {
      // Animate months
      if (currentMonths < targetMonths) {
        currentMonths = Math.min(currentMonths + 1, targetMonths)
      }
      
      // Animate countries
      if (currentCountries < targetCountries) {
        currentCountries = Math.min(currentCountries + 1, targetCountries)
      }
      
      // Animate users (faster increment)
      if (currentUsers < targetUsers) {
        currentUsers = Math.min(currentUsers + Math.ceil(targetUsers / 20), targetUsers)
      }
      
      // Animate success rate
      if (currentSuccess < targetSuccess) {
        currentSuccess = Math.min(currentSuccess + 5, targetSuccess)
      }

      setAnimatedStats({
        monthsSinceLaunch: currentMonths,
        countriesServed: currentCountries,
        clientsServed: currentUsers,
        successRate: currentSuccess
      })

      // Stop when all animations are complete
      if (currentMonths >= targetMonths && 
          currentCountries >= targetCountries && 
          currentUsers >= targetUsers && 
          currentSuccess >= targetSuccess) {
        clearInterval(interval)
      }
    }, 50) // Fast 50ms intervals
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-48 h-48 sm:w-72 sm:h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-32 right-20 w-64 h-64 sm:w-96 sm:h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 right-10 w-40 h-40 sm:w-64 sm:h-64 bg-pink-400/20 rounded-full blur-3xl"></div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 text-center text-white max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="pt-20 sm:pt-32">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black mb-6 sm:mb-8 leading-tight tracking-tighter animate-slide-up">
               Grow on LinkedIn.
              <span className="block bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent mt-2 pb-3">
                Without the hassle.
              </span>
            </h1>
          </div>

          <p className="text-lg sm:text-xl lg:text-2xl mb-8 sm:mb-12 text-slate-300 max-w-3xl mx-auto leading-relaxed animate-fade-in px-4">
            Your profile, content, engagement — managed end-to-end so you can focus on business.
          </p>

          {/* Video Section */}
          <div className="mb-8 sm:mb-12 max-w-4xl mx-auto animate-fade-in">
            <div className="aspect-video rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border border-white/10 backdrop-blur-sm">
              <video className="w-full h-full object-cover" autoPlay loop muted playsInline poster="/video-poster.jpg">
                <source src="/video.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center animate-slide-up px-4">
            <Link href="/signin">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 sm:px-10 py-4 sm:py-6 text-base sm:text-lg font-bold rounded-full transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                👉 Get Started Now
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Section 1: The Problem */}
      <section className="py-12 sm:py-16 lg:py-20 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-48 h-48 sm:w-72 sm:h-72 bg-red-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-32 right-20 w-64 h-64 sm:w-96 sm:h-96 bg-orange-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12 sm:mb-16 lg:mb-20">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-black mb-4 sm:mb-6 leading-tight tracking-tight">
              <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                Most professionals are invisible on LinkedIn.
              </span>
            </h2>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 border border-slate-700/50">
              <div className="text-center mb-8">
                <div className="text-4xl sm:text-6xl font-bold text-blue-400 mb-4">1 Billion users, but less than 3% post content.</div>
              </div>
              
              <div className="grid sm:grid-cols-1 gap-6 mb-8">
                <div className="text-center">
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-4">Founders & CXOs don't have the time to:</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-center text-slate-300 text-lg">
                      <XIcon className="w-6 h-6 text-red-400 mr-3" />
                      <span>Write content consistently</span>
                    </div>
                    <div className="flex items-center justify-center text-slate-300 text-lg">
                      <XIcon className="w-6 h-6 text-red-400 mr-3" />
                      <span>Engage with prospects daily</span>
                    </div>
                    <div className="flex items-center justify-center text-slate-300 text-lg">
                      <XIcon className="w-6 h-6 text-red-400 mr-3" />
                      <span>Optimize their profile for visibility</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-red-400 mb-2">Result:</div>
                <div className="text-lg sm:text-xl text-slate-300">Missed leads. Poor visibility. Weak personal brand.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: The LinkZup Solution */}
      <section className="py-12 sm:py-16 lg:py-20 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-48 h-48 sm:w-72 sm:h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-32 right-20 w-64 h-64 sm:w-96 sm:h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12 sm:mb-16 lg:mb-20">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-black mb-4 sm:mb-6 leading-tight tracking-tight">
              <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                We make you a thought leader, while you focus on business.
              </span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-12">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl sm:rounded-2xl p-6 sm:p-8 border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 transform hover:scale-105">
              <div className="text-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-3">Profile Revamp</h3>
                <p className="text-sm sm:text-base text-slate-300">Authority-driven design & copy.</p>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl sm:rounded-2xl p-6 sm:p-8 border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 transform hover:scale-105">
              <div className="text-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-3">Content Calendar</h3>
                <p className="text-sm sm:text-base text-slate-300">Weekly posts crafted for visibility.</p>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl sm:rounded-2xl p-6 sm:p-8 border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 transform hover:scale-105">
              <div className="text-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-3">Engagement & DMs</h3>
                <p className="text-sm sm:text-base text-slate-300">Daily interactions that build trust.</p>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl sm:rounded-2xl p-6 sm:p-8 border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 transform hover:scale-105">
              <div className="text-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-4">
                  <BarChart className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-3">Growth Insights</h3>
                <p className="text-sm sm:text-base text-slate-300">Monthly analytics & strategy tweaks.</p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link href="/signin">
              <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-full transition-all duration-300 hover:shadow-lg text-lg">
                Try LinkZup Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>



      {/* Section 3: Why Now? */}
      <section className="py-12 sm:py-16 lg:py-20 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-48 h-48 sm:w-72 sm:h-72 bg-green-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-32 right-20 w-64 h-64 sm:w-96 sm:h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12 sm:mb-16 lg:mb-20">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-black mb-4 sm:mb-6 leading-tight tracking-tight">
              <span className="bg-gradient-to-r from-green-500 to-blue-600 bg-clip-text text-transparent">
                LinkedIn is the #1 platform for professionals.
              </span>
            </h2>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 border border-slate-700/50">
              <div className="space-y-6">
                <div className="flex items-center text-slate-300 text-lg sm:text-xl">
                  <CheckCircle2 className="w-6 h-6 text-green-400 mr-3 flex-shrink-0" />
                  <span>Organic reach on LinkedIn is 10x higher than other platforms.</span>
                </div>
                <div className="flex items-center text-slate-300 text-lg sm:text-xl">
                  <CheckCircle2 className="w-6 h-6 text-green-400 mr-3 flex-shrink-0" />
                  <span>CXOs & founders are shifting to personal brand-led growth.</span>
                </div>
                <div className="flex items-center text-slate-300 text-lg sm:text-xl">
                  <CheckCircle2 className="w-6 h-6 text-green-400 mr-3 flex-shrink-0" />
                  <span>Early movers in LinkedIn management will dominate.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* Section 5: Results & Case Studies */}
      <section className="py-12 sm:py-16 lg:py-20 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-48 h-48 sm:w-72 sm:h-72 bg-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-32 right-20 w-64 h-64 sm:w-96 sm:h-96 bg-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12 sm:mb-16 lg:mb-20">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-black mb-4 sm:mb-6 leading-tight tracking-tight">
              <span className="bg-gradient-to-r from-purple-500 to-pink-600 bg-clip-text text-transparent">
                From invisible to industry leader.
              </span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl sm:rounded-2xl p-6 sm:p-8 border border-slate-700/50 hover:border-purple-500/50 transition-all duration-300 transform hover:scale-105">
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-purple-400 mb-4">120+</div>
                <p className="text-lg sm:text-xl text-white font-semibold mb-2">entrepreneurs on our waitlist</p>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl sm:rounded-2xl p-6 sm:p-8 border border-slate-700/50 hover:border-purple-500/50 transition-all duration-300 transform hover:scale-105">
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-purple-400 mb-4">3x</div>
                <p className="text-lg sm:text-xl text-white font-semibold mb-2">engagement in 30 days for early clients</p>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl sm:rounded-2xl p-6 sm:p-8 border border-slate-700/50 hover:border-purple-500/50 transition-all duration-300 transform hover:scale-105">
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-purple-400 mb-4">₹3.5L</div>
                <p className="text-lg sm:text-xl text-white font-semibold mb-2">client closed via LinkedIn in 2 months</p>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* Section 6: About Us */}
      <section className="py-12 sm:py-16 lg:py-20 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-48 h-48 sm:w-72 sm:h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-32 right-20 w-64 h-64 sm:w-96 sm:h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12 sm:mb-16 lg:mb-20">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-black mb-4 sm:mb-6 leading-tight tracking-tight">
              <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                Built by entrepreneurs, for entrepreneurs.
              </span>
            </h2>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 border border-slate-700/50">
              <div className="text-center">
                <p className="text-lg sm:text-xl text-slate-300 mb-6">
                  Founded by Prashant Kulkarni, LinkZup was born out of a simple belief:
                </p>
                <blockquote className="text-2xl sm:text-3xl font-bold text-blue-400 mb-6 italic">
                  "Every entrepreneur deserves a powerful LinkedIn presence."
                </blockquote>
                <p className="text-lg sm:text-xl text-slate-300">
                  Backed by LinkedIn growth strategists, content experts, and a scalable ops team, we help professionals turn profiles into profit.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
