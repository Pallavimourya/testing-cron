"use client"

import { ChevronDown } from "lucide-react"
import { useState } from "react"

export default function FAQsPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  const faqs = [
    {
      question: "What services does Linkzup offer?",
      answer: "Linkzup offers comprehensive LinkedIn branding and marketing services, including profile optimization, content strategy, lead generation, and social media management. We help professionals and businesses build a strong digital presence on LinkedIn."
    },
    {
      question: "How long does it take to see results?",
      answer: "Results typically start becoming visible within 2-3 months of consistent implementation. However, building a strong LinkedIn presence is a long-term strategy, and we recommend at least 6 months of engagement for optimal results."
    },
    {
      question: "Do you offer customized packages?",
      answer: "Yes, we understand that every client has unique needs. We offer customized packages that can be tailored to your specific goals, budget, and timeline. Contact us to discuss your requirements."
    },
    {
      question: "What makes Linkzup different from other agencies?",
      answer: "We specialize exclusively in LinkedIn marketing and branding, bringing deep expertise and proven strategies. Our data-driven approach, personalized service, and focus on measurable results set us apart from general marketing agencies."
    },
    {
      question: "How do you measure success?",
      answer: "We track various metrics including profile views, connection growth, engagement rates, lead generation, and conversion rates. We provide regular reports and analytics to help you understand your progress and ROI."
    },
    {
      question: "What industries do you work with?",
      answer: "We work with professionals and businesses across various industries, including technology, finance, healthcare, education, and more. Our strategies are adaptable to different sectors and target audiences."
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
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight tracking-tight">
              <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Frequently Asked Questions
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Find answers to common questions about our services, process, and how we can help you achieve your goals.
            </p>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between focus:outline-none"
                  aria-expanded={openIndex === index}
                >
                  <span className="text-lg font-medium text-white">{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${
                      openIndex === index ? "transform rotate-180" : ""
                    }`}
                  />
                </button>
                <div
                  className={`px-6 transition-all duration-300 ease-in-out ${
                    openIndex === index ? "max-h-96 pb-4" : "max-h-0"
                  } overflow-hidden`}
                >
                  <p className="text-slate-300 leading-relaxed">{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
