import { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { ArrowRight, Users, Target, Zap, Award, Star, Brain, Rocket, Shield, Sparkles, MessageSquare, BarChart, Check, Calendar, User, Eye, TrendingUp, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export const metadata: Metadata = {
  title: "About - LinkZup",
  description: "Learn about our mission, values, and the team behind LinkZup",
}

export default function AboutPage() {
  const teamMembers = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: "LinkedIn Growth Strategists",
      description: "Who know the algorithm inside out",
    },
    {
      icon: <MessageSquare className="w-8 h-8" />,
      title: "Content Creators",
      description: "Who craft posts that drive engagement and leads",
    },
    {
      icon: <User className="w-8 h-8" />,
      title: "Personal Branding Experts",
      description: "Who position you as a thought leader",
    },
    {
      icon: <BarChart className="w-8 h-8" />,
      title: "Tech & Analytics Specialists",
      description: "Who ensure your growth is measurable",
    },
  ]

  const whyChooseUs = [
    {
      icon: <Target className="w-8 h-8" />,
      title: "100% LinkedIn-focused",
      description: "We specialize exclusively in LinkedIn growth and optimization.",
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Done-for-you, end-to-end management",
      description: "Complete service from profile optimization to content creation and engagement.",
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: "Human creativity + AI efficiency",
      description: "The perfect blend of human expertise and AI-powered optimization.",
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Proven results in weeks, not months",
      description: "Quick, measurable results that help you achieve your goals faster.",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-32 right-20 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <span className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full text-sm font-semibold mb-6 shadow-lg hover:shadow-xl transition-all duration-300">
              <Star className="w-4 h-4 mr-2 animate-spin-slow" />
              About LinkZup
            </span>
            <h1 className="text-5xl md:text-7xl font-black mb-8 leading-tight tracking-tight">
              <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                About Us – LinkZup
              </span>
            </h1>
          </div>
        </div>
      </section>

      {/* Our Mission Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-black mb-4 sm:mb-6 leading-tight tracking-tight">
              <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                Our Mission
              </span>
            </h2>
            <div className="max-w-4xl mx-auto">
              <p className="text-xl text-slate-300 mb-8 leading-relaxed">
                At LinkZup, we believe every entrepreneur deserves a powerful LinkedIn presence.
              </p>
              <p className="text-lg text-slate-300 mb-8 leading-relaxed">
                LinkedIn is no longer just a job board — it's the world's biggest stage for professionals. It's where business leaders build authority, attract clients, and shape industries. Yet, most founders and CXOs are invisible because they don't have the time to write posts, engage daily, or optimize their profile.
              </p>
              <p className="text-xl text-slate-300 mb-8 leading-relaxed">
                That's where we come in. 🚀
              </p>
              <p className="text-xl text-slate-300 font-semibold">
                We make you visible, credible, and profitable on LinkedIn — while you focus on growing your business.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Who We Are Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-black mb-4 sm:mb-6 leading-tight tracking-tight">
              <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                Who We Are
              </span>
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-12">
              LinkZup is a done-for-you LinkedIn management system built by entrepreneurs, for entrepreneurs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <div
                key={index}
                className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-blue-500/50"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 text-white">
                  {member.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-4">{member.title}</h3>
                <p className="text-slate-300">{member.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-lg text-slate-300 max-w-3xl mx-auto">
              Together, we bring the perfect blend of AI + human creativity to scale your LinkedIn presence.
            </p>
          </div>
        </div>
      </section>

      {/* The Founder's Story Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-black mb-4 sm:mb-6 leading-tight tracking-tight">
              <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                The Founder's Story
              </span>
            </h2>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 lg:p-12 border border-slate-700/50">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <User className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">👤 Prashant Kulkarni – Founder & CEO</h3>
              </div>
              
              <div className="text-lg text-slate-300 leading-relaxed space-y-6">
                <p>
                  As a startup ecosystem builder and branding strategist, I worked closely with founders who had amazing businesses but no visibility. They were too busy running companies to focus on LinkedIn, and they kept missing out on deals, partnerships, and recognition.
                </p>
                <p className="font-semibold text-blue-400">
                  That frustration gave birth to LinkZup — a solution designed to turn every LinkedIn profile into a growth engine.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Vision Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-black mb-4 sm:mb-6 leading-tight tracking-tight">
              <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                Our Vision
              </span>
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8">
              To become the #1 LinkedIn management system globally, empowering professionals to:
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="flex items-center justify-center text-slate-300 text-lg">
                <CheckCircle2 className="w-6 h-6 text-green-400 mr-3 flex-shrink-0" />
                <span>Build authority</span>
              </div>
              <div className="flex items-center justify-center text-slate-300 text-lg">
                <CheckCircle2 className="w-6 h-6 text-green-400 mr-3 flex-shrink-0" />
                <span>Attract clients</span>
              </div>
              <div className="flex items-center justify-center text-slate-300 text-lg">
                <CheckCircle2 className="w-6 h-6 text-green-400 mr-3 flex-shrink-0" />
                <span>Unlock new opportunities</span>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-xl text-slate-300 font-semibold">
                Because in today's world — your LinkedIn is your first impression.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose LinkZup Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-black mb-4 sm:mb-6 leading-tight tracking-tight">
              <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                Why Choose LinkZup?
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {whyChooseUs.map((item, index) => (
              <div
                key={index}
                className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-blue-500/50"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 text-white">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-4">{item.title}</h3>
                <p className="text-slate-300">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-xl text-slate-300 font-semibold">
              We're not just managing LinkedIn — we're building personal brands that last.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl p-12 text-center">
            <h2 className="text-4xl font-bold text-white mb-6">Ready to Transform Your LinkedIn Presence?</h2>
            <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
              Join hundreds of professionals who have elevated their personal brand with LinkZup
            </p>
            <Link href="/linkezup">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100 px-4 sm:px-10 py-4 sm:py-6 text-base sm:text-lg font-bold rounded-full transform transition-all duration-300 hover:scale-105 hover:shadow-lg w-full sm:w-auto"
              >
                Start Your Journey
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
