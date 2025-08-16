import { Metadata } from "next"
import { ArrowRight, Users, Star, Zap, TrendingUp, CheckCircle2, Target, Award, Rocket, Shield, Sparkles } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "LinkedIn Management Services - linkzup",
  description: "Professional LinkedIn profile management and optimization services to boost your professional presence.",
}

export default function ServicesPage() {
  const features = [
    {
      icon: <Target className="h-6 w-6" />,
      title: "Profile Optimization",
      description: "Transform your LinkedIn profile into a powerful business asset with strategic optimization."
    },
    {
      icon: <Star className="h-6 w-6" />,
      title: "Content Strategy",
      description: "Create engaging content that positions you as a thought leader in your industry."
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Network Growth",
      description: "Build a strong professional network with targeted connection strategies."
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Engagement Management",
      description: "Increase your visibility and engagement through strategic interaction."
    }
  ]

  const benefits = [
    {
      icon: <Rocket className="h-6 w-6" />,
      title: "Increased Visibility",
      description: "Boost your profile views and reach more professionals in your industry"
    },
    {
      icon: <Award className="h-6 w-6" />,
      title: "Enhanced Credibility",
      description: "Build trust and establish yourself as an authority in your field"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Better Opportunities",
      description: "Attract high-quality job offers and business opportunities"
    }
  ]

  return (
    <div className="min-h-screen bg-[#0A0F1C]">
      {/* Hero Section */}
      <section className="pt-20 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-[500px] h-[500px] bg-gradient-to-r from-blue-600/30 to-purple-600/30 rounded-full blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-32 right-20 w-[600px] h-[600px] bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-full blur-[100px]"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-full blur-[120px]"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16 sm:mb-20">
            <div className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-full text-white mb-6 sm:mb-8 backdrop-blur-sm border border-white/10">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-yellow-400" />
              <span className="font-medium text-sm sm:text-base">LinkedIn Management</span>
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-black mb-6 sm:mb-8 leading-tight text-white">
              Elevate Your
              <span className="block bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent mt-2">
                LinkedIn Presence
              </span>
            </h1>
            <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed px-4">
              Transform your LinkedIn profile into a powerful business asset with our expert management services.
            </p>
          </div>

          {/* Main Service Card */}
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-3xl p-6 sm:p-12 mb-20 sm:mb-32 backdrop-blur-xl border border-white/10 transform transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/20">
            <div className="grid md:grid-cols-2 gap-8 sm:gap-12 items-center">
              <div>
                <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full text-white mb-6 backdrop-blur-sm border border-white/10">
                  <span className="font-medium">Linkzup</span>
                </div>
                <h2 className="text-5xl font-bold text-white mb-6">LinkedIn Management</h2>
                <p className="text-slate-200 text-lg mb-8">
                  Our expert team manages your LinkedIn presence, creating engaging content and building your professional network.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/linkezup">
                    <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-6 text-lg font-bold rounded-full shadow-lg shadow-blue-500/20">
                      Get Started
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/case-studies">
                    <Button size="lg" variant="outline" className="border-2 border-white/20 text-black hover:bg-white/10 px-8 py-6 text-lg font-bold rounded-full backdrop-blur-sm">
                      View Case Studies
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                {features.map((feature, index) => (
                  <div key={index} className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-2xl p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/10 border border-white/10">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 text-white shadow-lg shadow-blue-500/20">
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-slate-300 text-sm">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Benefits Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-full text-white mb-8 backdrop-blur-sm border border-white/10">
              <CheckCircle2 className="w-5 h-5 mr-2 text-yellow-400" />
              <span className="font-medium">Why Choose Us</span>
            </div>
            <h2 className="text-5xl font-bold text-white mb-6">Experience the Benefits</h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Join hundreds of professionals who have transformed their LinkedIn presence
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-32">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/10 transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/10">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center mb-6 text-white shadow-lg shadow-yellow-500/20">
                  {benefit.icon}
                </div>
                <h3 className="text-2xl font-semibold text-white mb-3">{benefit.title}</h3>
                <p className="text-slate-300">{benefit.description}</p>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="text-center relative">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-full blur-[120px]"></div>
            </div>
            <div className="relative z-10">
              <h2 className="text-5xl font-bold text-white mb-6">Ready to Transform Your LinkedIn Presence?</h2>
              <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
                Take the first step towards building a powerful professional brand that opens doors to new opportunities.
              </p>
              <Link href="/pricing">
                <Button size="lg" className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-10 py-6 text-lg font-bold rounded-full shadow-lg shadow-yellow-500/20 transform transition-all duration-300 hover:scale-105">
                  Start Your Journey
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
