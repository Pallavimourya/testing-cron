import { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  MessageCircle, 
  Bot, 
  Sparkles, 
  Target, 
  FileText, 
  Calendar, 
  Linkedin, 
  BarChart3, 
  Crown, 
  Zap, 
  CheckCircle, 
  Lightbulb, 
  Users, 
  TrendingUp, 
  Brain, 
  MessageSquare, 
  Award, 
  Star, 
  HelpCircle, 
  BookOpen, 
  Settings, 
  CreditCard, 
  Shield,
  ArrowRight,
  Play
} from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "LinkZup Chatbot Demo - AI Assistant",
  description: "Experience our AI-powered chatbot that provides comprehensive information about LinkZup's LinkedIn personal branding platform",
}

const chatbotFeatures = [
  {
    icon: <Brain className="w-8 h-8" />,
    title: "AI-Powered Responses",
    description: "Intelligent responses based on comprehensive knowledge of LinkZup's platform and features",
    color: "from-blue-500 to-purple-600"
  },
  {
    icon: <Target className="w-8 h-8" />,
    title: "Comprehensive Knowledge",
    description: "Covers all aspects: features, pricing, workflow, LinkedIn integration, and more",
    color: "from-green-500 to-blue-600"
  },
  {
    icon: <MessageSquare className="w-8 h-8" />,
    title: "Interactive Suggestions",
    description: "Smart suggestion buttons for quick navigation and common questions",
    color: "from-purple-500 to-pink-600"
  },
  {
    icon: <Zap className="w-8 h-8" />,
    title: "Instant Help",
    description: "Get immediate answers to your questions about LinkZup's platform",
    color: "from-yellow-500 to-orange-600"
  },
  {
    icon: <Shield className="w-8 h-8" />,
    title: "Always Available",
    description: "24/7 assistance for users exploring or using the LinkZup platform",
    color: "from-indigo-500 to-purple-600"
  },
  {
    icon: <TrendingUp className="w-8 h-8" />,
    title: "Growth Guidance",
    description: "Expert advice on LinkedIn personal branding and content strategy",
    color: "from-emerald-500 to-teal-600"
  }
]

const topicsCovered = [
  {
    category: "Platform Overview",
    topics: [
      "What is LinkZup?",
      "How does it work?",
      "Key features and benefits",
      "Platform capabilities"
    ]
  },
  {
    category: "Pricing & Plans",
    topics: [
      "Pricing plans and costs",
      "Feature comparisons",
      "Subscription details",
      "Payment options"
    ]
  },
  {
    category: "Features & Functionality",
    topics: [
      "AI content generation",
      "LinkedIn automation",
      "Topic bank management",
      "Analytics and tracking"
    ]
  },
  {
    category: "Getting Started",
    topics: [
      "Sign up process",
      "Profile setup",
      "LinkedIn connection",
      "First content creation"
    ]
  },
  {
    category: "Support & Help",
    topics: [
      "Contact information",
      "Help resources",
      "Tutorials and guides",
      "FAQ answers"
    ]
  }
]

export default function ChatbotDemoPage() {
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
            <Badge className="mb-6 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full text-sm font-semibold">
              <Bot className="w-4 h-4 mr-2" />
              AI Assistant Demo
            </Badge>
            <h1 className="text-5xl md:text-7xl font-black mb-8 leading-tight tracking-tight">
              <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Meet Your LinkZup Assistant
              </span>
            </h1>
            <p className="text-xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Experience our AI-powered chatbot that provides comprehensive information about LinkZup's LinkedIn personal branding platform. Get instant answers to all your questions!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold rounded-full"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Try the Chatbot
              </Button>
              <Link href="/">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white/20 text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold rounded-full"
                >
                  <ArrowRight className="w-5 h-5 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Chatbot Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">Chatbot Features</h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Our AI assistant is designed to provide comprehensive support and information about LinkZup
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {chatbotFeatures.map((feature, index) => (
              <Card
                key={index}
                className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 hover:scale-105"
              >
                <CardHeader>
                  <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-4 text-white`}>
                    {feature.icon}
                  </div>
                  <CardTitle className="text-white text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Topics Covered */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">Topics Covered</h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Our chatbot can answer questions about all aspects of the LinkZup platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {topicsCovered.map((category, index) => (
              <Card
                key={index}
                className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50 hover:border-blue-500/50 transition-all duration-300"
              >
                <CardHeader>
                  <CardTitle className="text-white text-xl flex items-center">
                    <Sparkles className="w-5 h-5 mr-2 text-blue-400" />
                    {category.category}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {category.topics.map((topic, topicIndex) => (
                      <li key={topicIndex} className="flex items-center text-slate-300">
                        <CheckCircle className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
                        <span className="text-sm">{topic}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How to Use */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">How to Use the Chatbot</h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Simple steps to get the most out of your AI assistant
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Click the Chat Icon",
                description: "Look for the chat bubble icon in the bottom-right corner of any page"
              },
              {
                step: "02",
                title: "Ask Your Question",
                description: "Type your question about LinkZup, features, pricing, or anything else"
              },
              {
                step: "03",
                title: "Get Instant Answers",
                description: "Receive comprehensive, AI-powered responses with helpful suggestions"
              },
              {
                step: "04",
                title: "Explore Further",
                description: "Use suggestion buttons to explore related topics and features"
              }
            ].map((step, index) => (
              <div
                key={index}
                className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 text-center"
              >
                <div className="text-4xl font-bold text-blue-400 mb-4">{step.step}</div>
                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-slate-300">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl p-12 text-center">
            <h2 className="text-4xl font-bold text-white mb-6">Ready to Experience LinkZup?</h2>
            <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
              Try our chatbot to learn more, or start your LinkedIn personal branding journey today
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-bold rounded-full"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/pricing">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold rounded-full"
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
