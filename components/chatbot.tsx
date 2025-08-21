"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  MessageCircle, 
  X, 
  Send, 
  Bot, 
  User, 
  ChevronDown, 
  ChevronUp,
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
  Shield
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"

interface Message {
  id: string
  type: "user" | "bot"
  content: string
  timestamp: Date
  suggestions?: string[]
}

interface ChatbotProps {
  className?: string
}

const SYSTEM_KNOWLEDGE = {
  overview: {
    name: "LinkZup",
    description: "India's leading LinkedIn personal branding agency that combines AI technology with human expertise to help professionals and businesses build powerful personal brands on LinkedIn.",
    tagline: "Transforming LinkedIn Presence"
  },
  features: {
    core: [
      "AI-Powered Personal Branding",
      "Content Creation & Optimization", 
      "Growth Analytics & Strategy",
      "LinkedIn Automation",
      "Topic Bank Management",
      "Approved Content System",
      "Scheduled Posting",
      "Performance Tracking"
    ],
    ai: [
      "Personalized Content Strategy",
      "Audience Analysis", 
      "Competitor Research",
      "Brand Voice Development",
      "Trend Analysis",
      "Engagement Optimization"
    ],
    automation: [
      "Auto-pilot Posts Generator",
      "Scheduled Content Publishing",
      "LinkedIn Auto-posting",
      "Content Approval Workflow",
      "Performance Monitoring"
    ]
  },
  pricing: {
    plans: [] // Will be populated from API
  },
  workflow: {
    steps: [
      {
        step: "01",
        title: "Analysis",
        description: "Analyze your current profile, industry, and target audience"
      },
      {
        step: "02", 
        title: "Strategy",
        description: "Develop comprehensive content and growth strategy"
      },
      {
        step: "03",
        title: "Execution", 
        description: "Implement strategy with high-quality content"
      },
      {
        step: "04",
        title: "Optimization",
        description: "Continuous monitoring and optimization"
      }
    ]
  },
  dashboard: {
    sections: [
      "Dashboard Overview",
      "Topic Bank", 
      "Approved Content",
      "Scheduled Posts",
      "LinkedIn Analytics",
      "Profile Management",
      "Billing & Plans",
      "Help & Guides"
    ]
  }
}

const QUICK_ACTIONS = [
  "What is LinkZup?",
  "How does it work?",
  "What are the pricing plans?",
  "What features are included?",
  "How to get started?",
  "LinkedIn integration",
  "Content generation process",
  "Dashboard features"
]

export default function Chatbot({ className }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "bot",
      content: "Hi! I'm your LinkZup assistant. I can help you learn about our LinkedIn personal branding platform, features, pricing, and how to get started. What would you like to know?",
      timestamp: new Date(),
      suggestions: QUICK_ACTIONS.slice(0, 4)
    }
  ])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [pricingPlans, setPricingPlans] = useState<any[]>([])
  const [plansLoaded, setPlansLoaded] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const isMobile = useIsMobile()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Fetch pricing plans from API
  const fetchPricingPlans = async () => {
    try {
      const response = await fetch("/api/plans/active")
      if (response.ok) {
        const data = await response.json()
        setPricingPlans(data.plans || [])
        setPlansLoaded(true)
      }
    } catch (error) {
      console.error("Failed to fetch pricing plans:", error)
      setPlansLoaded(true) // Set to true even on error to avoid infinite loading
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    fetchPricingPlans()
  }, [])

  // Handle mobile viewport and prevent body scroll when chatbot is open
  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobile, isOpen])

  const generateResponse = async (userMessage: string): Promise<string> => {
    const lowerMessage = userMessage.toLowerCase()
    
    // Overview and general questions
    if (lowerMessage.includes("what is") || lowerMessage.includes("linkzup") || lowerMessage.includes("overview")) {
      return `**LinkZup** is ${SYSTEM_KNOWLEDGE.overview.description}

**Key Highlights:**
• ${SYSTEM_KNOWLEDGE.overview.tagline}
• AI-powered personal branding
• LinkedIn automation and optimization
• Data-driven growth strategies
• Professional content creation

We help professionals build powerful personal brands on LinkedIn through intelligent automation and expert guidance.`
    }

    // How it works
    if (lowerMessage.includes("how does it work") || lowerMessage.includes("process") || lowerMessage.includes("workflow")) {
      return `**How LinkZup Works:**

${SYSTEM_KNOWLEDGE.workflow.steps.map(step => 
  `**${step.step}. ${step.title}**\n${step.description}`
).join('\n\n')}

**The Complete Process:**
1. **Profile Analysis** - We analyze your current LinkedIn presence
2. **Strategy Development** - Create personalized content strategy
3. **Content Generation** - AI-powered content creation
4. **Approval & Scheduling** - Review and schedule posts
5. **Automated Publishing** - Post to LinkedIn automatically
6. **Performance Tracking** - Monitor engagement and growth`
    }

    // Pricing questions
    if (lowerMessage.includes("pricing") || lowerMessage.includes("cost") || lowerMessage.includes("price") || lowerMessage.includes("plans")) {
      if (!plansLoaded) {
        return `**Loading Pricing Plans...**

I'm fetching the latest pricing information for you. Please wait a moment and ask again.`
      }

      if (pricingPlans.length === 0) {
        return `**LinkZup Pricing Plans:**

**Zuper 15** - ₹499/15 days
• Profile Optimization
• Basic Content Strategy
• Weekly Post Creation (2 posts)
• Engagement Monitoring
• Basic Analytics Report
• Email Support

**Zuper 30** - ₹799/30 days *(Most Popular)*
• Everything in Zuper 15
• Advanced Profile Optimization
• Weekly Post Creation (4 posts)
• Network Growth Strategy
• Engagement Management
• Detailed Analytics Report
• Priority Email Support
• Monthly Strategy Call

**Zuper 360** - ₹5,999/360 days
• Everything in Zuper 30
• Premium Profile Optimization
• Weekly Post Creation (6 posts)
• Advanced Network Growth
• Thought Leadership Strategy
• Competitor Analysis
• Custom Analytics Dashboard
• 24/7 Priority Support
• Weekly Strategy Calls
• Annual Strategy Planning
• Priority Onboarding

*Prices are in Indian Rupees (INR)*`
      }

      const formatPrice = (price: number) => {
        return `₹${price.toLocaleString("en-IN")}`
      }

      return `**LinkZup Pricing Plans:**

${pricingPlans.map(plan => 
  `**${plan.name}** - ${formatPrice(plan.price)}/${plan.durationDays} days
${plan.badge ? `*${plan.badge}*` : ''}
${plan.features.map((feature: string) => `• ${feature}`).join('\n')}`
).join('\n\n')}

**All plans include:**
• LinkedIn integration
• AI content generation
• Topic bank access
• Basic analytics
• Email support

*Prices are in Indian Rupees (INR)*`
    }

    // Features
    if (lowerMessage.includes("features") || lowerMessage.includes("what's included") || lowerMessage.includes("capabilities")) {
      return `**LinkZup Features:**

**🤖 AI-Powered Features:**
${SYSTEM_KNOWLEDGE.features.ai.map(feature => `• ${feature}`).join('\n')}

**⚡ Automation Features:**
${SYSTEM_KNOWLEDGE.features.automation.map(feature => `• ${feature}`).join('\n')}

**📊 Core Platform Features:**
${SYSTEM_KNOWLEDGE.features.core.map(feature => `• ${feature}`).join('\n')}

**🎯 Key Benefits:**
• Save 10+ hours per week on content creation
• Increase LinkedIn engagement by 300%
• Build professional authority
• Generate consistent, high-quality content
• Track performance with detailed analytics`
    }

    // Dashboard
    if (lowerMessage.includes("dashboard") || lowerMessage.includes("interface") || lowerMessage.includes("platform")) {
      return `**LinkZup Dashboard Features:**

**📊 Main Sections:**
${SYSTEM_KNOWLEDGE.dashboard.sections.map(section => `• ${section}`).join('\n')}

**🎯 Key Dashboard Capabilities:**
• **Topic Bank** - Manage and organize content topics
• **Approved Content** - Review and approve generated content
• **Scheduled Posts** - Schedule and manage LinkedIn posts
• **LinkedIn Analytics** - Track engagement and growth metrics
• **Profile Management** - Update your personal brand story
• **Performance Tracking** - Monitor content performance
• **Billing & Plans** - Manage subscription and payments

**📱 User Experience:**
• Responsive design for all devices
• Intuitive navigation
• Real-time updates
• Quick action buttons
• Search and filter capabilities`
    }

    // LinkedIn integration
    if (lowerMessage.includes("linkedin") || lowerMessage.includes("integration") || lowerMessage.includes("connect")) {
      return `**LinkedIn Integration:**

**🔗 Connection Process:**
1. Click "Connect LinkedIn" in dashboard
2. Authorize LinkZup access to your LinkedIn
3. Grant necessary permissions
4. Start posting automatically

**📤 Posting Capabilities:**
• **Text Posts** - Professional LinkedIn posts
• **Image Posts** - Posts with generated images
• **Scheduled Posts** - Schedule content in advance
• **Auto-posting** - Automatic content publishing

**📊 Analytics & Tracking:**
• Post performance metrics
• Engagement rates
• Follower growth
• Profile views
• Connection requests

**🛡️ Security:**
• Secure OAuth authentication
• Read-only access by default
• No password sharing required
• Easy disconnect anytime`
    }

    // Content generation
    if (lowerMessage.includes("content generation") || lowerMessage.includes("create content") || lowerMessage.includes("generate")) {
      return `**Content Generation Process:**

**🎯 Topic Generation:**
1. **AI Analysis** - Analyze your industry and audience
2. **Topic Suggestions** - Generate relevant topics
3. **Topic Bank** - Save and organize topics
4. **Approval Workflow** - Review and approve topics

**📝 Content Creation:**
1. **Base Story** - Use your personal brand story
2. **AI Generation** - Create content using AI
3. **Customization** - Apply your preferences
4. **Review & Edit** - Review generated content
5. **Approval** - Approve for publishing

**🔧 Content Types:**
• LinkedIn posts
• Professional articles
• Storytelling content
• Industry insights
• Thought leadership pieces

**⚡ Automation:**
• Batch content generation
• Scheduled publishing
• Performance optimization
• Engagement tracking`
    }

    // Getting started
    if (lowerMessage.includes("get started") || lowerMessage.includes("start") || lowerMessage.includes("begin") || lowerMessage.includes("sign up")) {
      return `**Getting Started with LinkZup:**

**🚀 Quick Start Guide:**

1. **Sign Up** - Create your account at linkzup.com
2. **Choose Plan** - Select your preferred pricing plan
3. **Complete Profile** - Fill in your personal brand story
4. **Connect LinkedIn** - Link your LinkedIn account
5. **Generate Topics** - Create your first content topics
6. **Review Content** - Approve generated content
7. **Start Posting** - Begin your LinkedIn journey

**📋 What You'll Need:**
• LinkedIn account
• Professional photo
• Industry information
• Target audience details
• Content preferences

**⏱️ Time to First Post:** 15-30 minutes

**🎯 Next Steps:**
• Explore the dashboard
• Generate your first topics
• Review and approve content
• Schedule your first posts

*Need help? Our support team is available 24/7!*`
    }

    // Support and help
    if (lowerMessage.includes("help") || lowerMessage.includes("support") || lowerMessage.includes("contact")) {
      return `**LinkZup Support:**

**📞 Contact Options:**
• **Email:** support@linkzup.com
• **Live Chat:** Available in dashboard
• **Help Center:** Comprehensive guides and tutorials

**📚 Resources:**
• **Getting Started Guide** - Step-by-step setup
• **Video Tutorials** - Visual learning resources
• **FAQ Section** - Common questions answered
• **Best Practices** - Tips for success

**🛠️ Self-Service:**
• Dashboard help section
• In-app tutorials
• Knowledge base
• Community forum

**⏰ Support Hours:**
• **24/7** - Automated support
• **Business Hours** - Live chat and email
• **Priority Support** - Available for premium plans`
    }

    // Default response
    return `I understand you're asking about "${userMessage}". Let me help you with that!

**Here are some topics I can help with:**
• LinkZup overview and features
• Pricing plans and costs
• How the platform works
• LinkedIn integration
• Content generation process
• Dashboard features
• Getting started guide
• Support and help

**Quick Actions:**
${QUICK_ACTIONS.slice(0, 4).map(action => `• ${action}`).join('\n')}

Feel free to ask me anything specific about LinkZup!`
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue("")
    setIsTyping(true)

    // Generate bot response
    const response = await generateResponse(inputValue)
    
    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: "bot",
      content: response,
      timestamp: new Date(),
      suggestions: QUICK_ACTIONS.slice(0, 3)
    }

    setTimeout(() => {
      setMessages(prev => [...prev, botMessage])
      setIsTyping(false)
    }, 1000)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion)
    inputRef.current?.focus()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Chatbot Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed z-50 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300",
          // Mobile: larger button, bottom center
          isMobile 
            ? "bottom-4 left-1/2 transform -translate-x-1/2 h-16 w-16 sm:h-14 sm:w-14" 
            : "bottom-6 right-6 h-14 w-14",
          isOpen && "scale-110"
        )}
        aria-label={isOpen ? "Close chatbot" : "Open chatbot"}
      >
        {isOpen ? <X className="h-6 w-6 sm:h-5 sm:w-5" /> : <MessageCircle className="h-6 w-6 sm:h-5 sm:w-5" />}
      </Button>

      {/* Chatbot Interface */}
      {isOpen && (
        <div className={cn(
          "fixed z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col",
          // Mobile: full screen with proper spacing
          isMobile 
            ? "inset-1 bottom-20 max-h-[calc(100vh-5rem)] sm:inset-2" // Better mobile sizing with responsive margins
            : "bottom-24 right-6 w-96 h-[600px]"
        )}>
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-2xl flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={cn(
                  "bg-white/20 rounded-full flex items-center justify-center",
                  isMobile ? "w-10 h-10" : "w-12 h-12"
                )}>
                  <Bot className={isMobile ? "h-6 w-6" : "h-8 w-8"} />
                </div>
                <div>
                  <h3 className={cn(
                    "font-semibold",
                    isMobile ? "text-sm" : "text-base"
                  )}>LinkZup Assistant</h3>
                  {isMobile && (
                    <p className="text-xs text-white/80 mt-1">Tap outside to close</p>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size={isMobile ? "sm" : "sm"}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "text-white hover:bg-white/20",
                  isMobile ? "h-10 w-10 p-0" : ""
                )}
              >
                <X className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.type === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "rounded-2xl px-4 py-3",
                    message.type === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-900",
                    // Mobile: adjust max width for better readability
                    isMobile ? "max-w-[85%] sm:max-w-[80%]" : "max-w-[80%]"
                  )}
                >
                  <div className="flex items-start space-x-2">
                    {message.type === "bot" && (
                      <Bot className="h-4 w-4 mt-1 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <div 
                        className={cn(
                          "prose max-w-none",
                          isMobile ? "prose-xs sm:prose-sm" : "prose-sm"
                        )}
                        dangerouslySetInnerHTML={{
                          __html: message.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\n/g, '<br>')
                        }}
                      />
                    </div>
                    {message.type === "user" && (
                      <User className="h-4 w-4 mt-1 flex-shrink-0" />
                    )}
                  </div>
                  
                  {/* Suggestions */}
                  {message.suggestions && message.type === "bot" && (
                    <div className="mt-3 space-y-2">
                      {message.suggestions.map((suggestion, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => handleSuggestionClick(suggestion)}
                          className={cn(
                            "w-full text-left justify-start bg-white/50 hover:bg-white/80 transition-colors",
                            isMobile 
                              ? "text-xs h-auto py-3 px-3 sm:py-2" // Larger touch target on mobile
                              : "text-xs h-auto py-2 px-3"
                          )}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <Bot className="h-4 w-4" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 flex-shrink-0">
            <div className="flex space-x-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about LinkZup..."
                className={cn(
                  "flex-1",
                  isMobile ? "h-12 text-base sm:h-10" : "h-10" // Larger input on mobile
                )}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                className={cn(
                  "bg-blue-600 hover:bg-blue-700 transition-colors",
                  isMobile ? "h-12 w-12 p-0 sm:h-10 sm:w-auto sm:px-4" : "h-10" // Larger button on mobile
                )}
              >
                <Send className={isMobile ? "h-5 w-5 sm:h-4 sm:w-4" : "h-4 w-4"} />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
