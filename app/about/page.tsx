import { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { ArrowRight, Users, Target, Zap, Award, Star, Brain, Rocket, Shield, Sparkles, MessageSquare, BarChart, Check } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export const metadata: Metadata = {
  title: "About - linkzup",
  description: "Learn about our mission, values, and the team behind linkzup",
}

export default function AboutPage() {
  const values = [
    {
      icon: <Target className="w-8 h-8" />,
      title: "Innovation First",
      description: "We constantly push boundaries to deliver cutting-edge solutions that set new industry standards.",
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Client Success",
      description: "Your growth is our priority. We measure our success by the results we deliver for our clients.",
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Agile Approach",
      description: "We adapt quickly to market changes and client needs, ensuring optimal results at every step.",
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: "Excellence",
      description: "We maintain the highest standards in everything we do, from strategy to execution.",
    },
  ]

  const services = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: "AI-Powered Personal Branding",
      description: "Our advanced AI algorithms analyze your industry, target audience, and competitors to create a unique personal brand strategy that resonates with your audience.",
      features: [
        "Personalized Content Strategy",
        "Audience Analysis",
        "Competitor Research",
        "Brand Voice Development"
      ]
    },
    {
      icon: <MessageSquare className="w-8 h-8" />,
      title: "Content Creation & Optimization",
      description: "We create engaging, professional content that showcases your expertise and builds your authority in your industry.",
      features: [
        "Professional Post Creation",
        "Content Calendar Management",
        "Engagement Optimization",
        "Trend Analysis"
      ]
    },
    {
      icon: <BarChart className="w-8 h-8" />,
      title: "Growth Analytics & Strategy",
      description: "Track your growth with detailed analytics and receive data-driven recommendations for continuous improvement.",
      features: [
        "Performance Tracking",
        "Growth Analytics",
        "Strategy Optimization",
        "ROI Measurement"
      ]
    }
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
              About linkzup
            </span>
            <h1 className="text-5xl md:text-7xl font-black mb-8 leading-tight tracking-tight">
              <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Transforming LinkedIn Presence
              </span>
            </h1>
            <p className="text-xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              LinkZup is India&apos;s leading LinkedIn personal branding agency. We combine AI technology with human expertise to help professionals and businesses build powerful personal brands on LinkedIn. Our data-driven approach ensures measurable results and sustainable growth.
            </p>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">Our Services</h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Comprehensive solutions powered by AI and human expertise
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div
                key={index}
                className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-blue-500/50"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 text-white">
                  {service.icon}
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">{service.title}</h3>
                <p className="text-slate-300 mb-6">{service.description}</p>
                <ul className="space-y-3">
                  {service.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-slate-300">
                      <Check className="h-5 w-5 text-green-400 mr-2 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">How We Work</h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Our proven process ensures consistent results
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Analysis",
                description: "We analyze your current profile, industry, and target audience to create a customized strategy."
              },
              {
                step: "02",
                title: "Strategy",
                description: "Our team develops a comprehensive content and growth strategy tailored to your goals."
              },
              {
                step: "03",
                title: "Execution",
                description: "We implement the strategy with high-quality content and engagement management."
              },
              {
                step: "04",
                title: "Optimization",
                description: "Continuous monitoring and optimization ensure maximum results and growth."
              }
            ].map((step, index) => (
              <div
                key={index}
                className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300"
              >
                <div className="text-4xl font-bold text-blue-400 mb-4">{step.step}</div>
                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-slate-300">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Values Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">Our Core Values</h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div
                key={index}
                className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-blue-500/50"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 text-white">
                  {value.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-4">{value.title}</h3>
                <p className="text-slate-300">{value.description}</p>
              </div>
            ))}
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
                className="bg-white text-blue-600 hover:bg-gray-100 px-10 py-6 text-lg font-bold rounded-full transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                Start Your Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
