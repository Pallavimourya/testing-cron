"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, TrendingUp, Users, Star, CheckCircle2, Zap, MessageSquare, Linkedin, Lightbulb } from "lucide-react"
import Link from "next/link"
import React, { useEffect, useState } from "react";

export default function HomePage() {
  const [stats, setStats] = useState({
    users: 0,
    messages: 0,
    posts: 0,
    successRate: 0,
  });

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => setStats(data));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-32 right-20 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 right-10 w-64 h-64 bg-pink-400/20 rounded-full blur-3xl"></div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 text-center text-white max-w-6xl mx-auto px-4 sm:px-6">
          <div className="pt-20 sm:pt-32">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black mb-6 sm:mb-8 leading-tight tracking-tighter animate-slide-up">
              Elevate Your
              <span className="block bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent mt-2 pb-3">
                Digital Presence
              </span>
            </h1>

          </div>

          {/* Video Section */}
          <div className="mb-12 max-w-4xl mx-auto animate-fade-in">
            <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/10 backdrop-blur-sm">
              <video 
                className="w-full h-full object-cover"
                autoPlay 
                loop 
                muted 
                playsInline
                poster="/video-poster.jpg"
              >
                <source src="/video.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
          <p className="text-xl md:text-2xl mb-12 text-slate-300 max-w-3xl mx-auto leading-relaxed animate-fade-in">
            Transform your professional identity with AI-powered personal branding. We craft compelling content that drives engagement, builds authority, and accelerates your career growth.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-slide-up">
            <Link href="/services">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-10 py-6 text-lg font-bold rounded-full transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                Start Your Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-32 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-32 right-20 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-16 sm:mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black mb-4 sm:mb-6 leading-tight tracking-tight">
              <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                Our Service
              </span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed px-4">
              Elevate your professional brand with our specialized LinkedIn personal branding service
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {/* LinkZup Card */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
              <div className="relative bg-slate-800/50 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center transform transition-transform group-hover:scale-110 flex-shrink-0">
                    <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">LinkZup</h3>
                    <p className="text-lg text-slate-300 mb-8 leading-relaxed">
                      Professional LinkedIn personal branding service that helps you build a strong digital presence. 
                      We create compelling content, optimize your profile, and establish your thought leadership in your industry.
                    </p>
                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                      <div className="space-y-4">
                        <h4 className="text-xl font-semibold text-white mb-4">What We Offer</h4>
                        <ul className="space-y-4">
                          <li className="flex items-center text-slate-300">
                            <CheckCircle2 className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" />
                            <span>Content Creation & Strategy</span>
                          </li>
                          <li className="flex items-center text-slate-300">
                            <CheckCircle2 className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" />
                            <span>Profile Optimization</span>
                          </li>
                          <li className="flex items-center text-slate-300">
                            <CheckCircle2 className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" />
                            <span>Engagement Management</span>
                          </li>
                        </ul>
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-xl font-semibold text-white mb-4">Key Benefits</h4>
                        <ul className="space-y-4">
                          <li className="flex items-center text-slate-300">
                            <CheckCircle2 className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" />
                            <span>Increased Visibility</span>
                          </li>
                          <li className="flex items-center text-slate-300">
                            <CheckCircle2 className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" />
                            <span>Professional Growth</span>
                          </li>
                          <li className="flex items-center text-slate-300">
                            <CheckCircle2 className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" />
                            <span>Networking Opportunities</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                    <Link href="/linkezup">
                      <Button className="w-full md:w-auto bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 hover:shadow-lg">
                        Get Started with LinkZup
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LinkedIn Info Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-32 right-20 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black mb-6 leading-tight tracking-tight">
              <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                Why LinkedIn?
              </span>
            </h2>
            <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              LinkedIn is the world&apos;s largest professional network with over 950 million users. It&apos;s the go-to platform for building your personal brand, connecting with industry leaders, and unlocking new career and business opportunities.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 shadow-lg">
              <h3 className="text-xl font-bold text-white mb-4">Grow Your Network</h3>
              <p className="text-slate-300">Connect with professionals, recruiters, and decision-makers from around the world. Every connection is a new opportunity.</p>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 shadow-lg">
              <h3 className="text-xl font-bold text-white mb-4">Showcase Your Expertise</h3>
              <p className="text-slate-300">Share your achievements, insights, and thought leadership through posts, articles, and engaging content.</p>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 shadow-lg">
              <h3 className="text-xl font-bold text-white mb-4">Unlock Opportunities</h3>
              <p className="text-slate-300">Attract recruiters, clients, and collaborators by maintaining an active and optimized LinkedIn presence.</p>
            </div>
          </div>
          <div className="mt-16 text-center">
            <h3 className="text-2xl font-bold text-white mb-8">Did You Know?</h3>
            <div className="flex flex-wrap justify-center gap-6">
              <div className="flex items-center bg-slate-900/80 border-l-4 border-blue-500 rounded-xl px-6 py-4 shadow-md max-w-xs w-full">
                <Lightbulb className="w-6 h-6 text-blue-400 mr-3 flex-shrink-0" />
                <span className="text-slate-100 font-semibold text-left">99% of recruiters use LinkedIn to find talent.</span>
              </div>
              <div className="flex items-center bg-slate-900/80 border-l-4 border-blue-500 rounded-xl px-6 py-4 shadow-md max-w-xs w-full">
                <Lightbulb className="w-6 h-6 text-blue-400 mr-3 flex-shrink-0" />
                <span className="text-slate-100 font-semibold text-left">Consistent posting (1-2 times a week) leads to higher visibility and more connections.</span>
              </div>
              <div className="flex items-center bg-slate-900/80 border-l-4 border-blue-500 rounded-xl px-6 py-4 shadow-md max-w-xs w-full">
                <Lightbulb className="w-6 h-6 text-blue-400 mr-3 flex-shrink-0" />
                <span className="text-slate-100 font-semibold text-left">LinkedIn is the #1 platform for B2B lead generation.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
              Why Choose
              <span className="block bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                LinkZup?
              </span>
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              We combine expertise, innovation, and dedication to deliver exceptional results for our clients.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-6">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Expert Team</h3>
              <p className="text-slate-300">Our team consists of industry experts with years of experience in digital marketing and personal branding.</p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Fast Results</h3>
              <p className="text-slate-300">We deliver quick, measurable results that help you achieve your business goals faster.</p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-6">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Proven Success</h3>
              <p className="text-slate-300">Our track record speaks for itself, with numerous success stories and satisfied clients.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 right-20 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-5xl mx-auto text-center px-6 relative z-10">
          <h2 className="text-5xl md:text-6xl font-black text-white mb-8 leading-[1.8]">
            Ready to Transform Your
            <span className="block bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent mt-2 pb-3">
              Digital Presence?
            </span>
          </h2>
          <p className="text-xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Join hundreds of professionals and businesses who have elevated their online presence with our services.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/services">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-10 py-6 text-lg font-bold rounded-full transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                GET STARTED TODAY
              </Button>
            </Link>
            <Link href="/about">
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white/20 text-black hover:bg-white/10 px-10 py-6 text-lg font-bold rounded-full backdrop-blur-sm transform transition-all duration-300 hover:scale-105"
              >
                LEARN ABOUT US
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
