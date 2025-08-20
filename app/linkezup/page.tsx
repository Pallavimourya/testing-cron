import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Users, TrendingUp, MessageSquare, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function LinkezupPage() {
  const benefits = [
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: "Increased Visibility",
      description: "Boost your profile views and connection requests by 300%",
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Thought Leadership",
      description: "Establish yourself as an industry expert with strategic content",
    },
    {
      icon: <MessageSquare className="h-8 w-8" />,
      title: "Engagement Growth",
      description: "Drive meaningful conversations and build your network",
    },
  ]

  const pricingPlans = [
    {
      name: "Zuper 15",
      price: "₹9",
      period: "/15 days",
      description: "Perfect for professionals starting their LinkedIn journey",
      features: [
        "8 LinkedIn posts per month",
        "Profile optimization",
        "Content strategy consultation",
        "Basic analytics report",
        "Email support",
      ],
      popular: false,
    },
    {
      name: "Zuper 30",
      price: "₹799",
      period: "/30 days",
      description: "Ideal for established professionals looking to scale",
      features: [
        "12 LinkedIn posts per month",
        "Complete profile revamp",
        "Advanced content strategy",
        "Engagement management",
        "Monthly 1-on-1 strategy call",
        "Priority support",
      ],
      popular: true,
    },
    {
      name: "Zuper 360",
      price: "₹5,999",
      period: "/360 days",
      description: "For executives and thought leaders",
      features: [
        "20 LinkedIn posts per month",
        "Personal brand audit",
        "Custom content themes",
        "Lead generation strategy",
        "Weekly strategy calls",
        "Dedicated account manager",
        "Advanced analytics dashboard",
        "Annual strategy planning",
        "Priority onboarding",
      ],
      popular: false,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.15)_0%,transparent_70%)]"></div>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-indigo-500/10 text-indigo-400 rounded-full text-sm font-bold mb-6">
              ✨ LinkedIn Personal Branding
            </span>
            <h1 className="text-5xl md:text-7xl font-black text-white mb-8 leading-tight">
              BUILD YOUR
              <span className="block text-indigo-400">LINKEDIN AUTHORITY</span>
            </h1>
            <p className="text-xl text-slate-300 mb-10 max-w-3xl mx-auto">
              Transform your LinkedIn presence into a powerful personal brand that attracts opportunities, builds
              credibility, and drives business growth.
            </p>
            <Button
              size="lg"
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-8 py-4 rounded-full"
            >
              START YOUR JOURNEY
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">
              Why Personal Branding
              <span className="block text-indigo-400">Matters</span>
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              In today's digital world, your LinkedIn presence is your professional identity. Make it count with our
              proven strategies.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 hover:border-indigo-500/50 transition-all duration-300"
              >
                <div className="w-16 h-16 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-6 text-indigo-400">
                  {benefit.icon}
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">{benefit.title}</h3>
                <p className="text-slate-300">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">
              Choose Your
              <span className="block text-indigo-400">Growth Plan</span>
            </h2>
            <p className="text-xl text-slate-300">
              Flexible pricing options to match your personal branding goals
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <Card
                key={index}
                className={`relative rounded-2xl border-2 bg-slate-800/50 backdrop-blur-sm ${
                  plan.popular
                    ? "border-indigo-500 transform scale-105"
                    : "border-slate-700/50 hover:border-indigo-500/50"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-indigo-500 text-white px-6 py-2 font-bold">MOST POPULAR</Badge>
                  </div>
                )}
                <CardHeader className="text-center p-8">
                  <CardTitle className="text-2xl font-bold text-white">{plan.name}</CardTitle>
                  <div className="mt-6">
                    <span className="text-5xl font-black text-white">{plan.price}</span>
                    <span className="text-slate-400 text-lg">{plan.period}</span>
                  </div>
                  <CardDescription className="mt-4 text-slate-300">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-0">
                  <ul className="space-y-4 mb-10">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <Check className="h-5 w-5 text-indigo-400 mr-4 flex-shrink-0" />
                        <span className="text-slate-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/signup" passHref legacyBehavior>
                    <Button
                      className={`w-full py-4 rounded-full font-bold text-lg transition-all ${
                        plan.popular
                          ? "bg-indigo-500 hover:bg-indigo-600 text-white"
                          : "bg-slate-700 hover:bg-indigo-500 text-white"
                      }`}
                    >
                      GET STARTED
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form Section (Replaced with LinkedIn Info Section) */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">
              Why LinkedIn is Essential for Your Career
            </h2>
            <p className="text-xl text-slate-300">
              LinkedIn is the world's largest professional network with over 950 million users. Whether you're a job seeker, entrepreneur, or business leader, LinkedIn is the best place to build your personal brand, connect with industry leaders, and unlock new opportunities.
            </p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 text-slate-200 space-y-8">
            <div>
              <h3 className="text-2xl font-bold text-indigo-400 mb-2">Key LinkedIn Benefits</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Grow your professional network and connect with decision-makers worldwide.</li>
                <li>Showcase your expertise, achievements, and thought leadership through posts and articles.</li>
                <li>Attract recruiters and clients with a standout profile and regular, high-quality content.</li>
                <li>Stay updated with industry trends, news, and best practices.</li>
                <li>Build credibility and trust in your domain.</li>
              </ul>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-indigo-400 mb-2">LinkedIn in India</h3>
              <p>India is the second largest market for LinkedIn, with over 100 million users. Top Indian professionals, founders, and creators are using LinkedIn to share their stories, build influence, and drive business growth. Don't miss out on the opportunity to stand out in this thriving ecosystem!</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-indigo-400 mb-2">Tips to Grow on LinkedIn</h3>
              <ul className="list-decimal pl-6 space-y-2">
                <li>Optimize your profile with a professional photo, compelling headline, and detailed experience.</li>
                <li>Post regularly: share insights, achievements, and industry news.</li>
                <li>Engage with others: comment, like, and share relevant content.</li>
                <li>Build relationships: connect with people in your industry and beyond.</li>
                <li>Leverage LinkedIn features: use polls, carousels, and articles to diversify your content.</li>
              </ul>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-indigo-400 mb-2">Why Choose LinkZup for LinkedIn?</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Done-for-you content creation, scheduling, and analytics — all tailored for LinkedIn.</li>
                <li>Profile optimization and personal branding strategies from industry experts.</li>
                <li>Proven results: our clients see 2x-5x growth in profile views, engagement, and opportunities.</li>
                <li>Affordable plans for every stage of your LinkedIn journey.</li>
              </ul>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-indigo-400 mb-2">Did You Know?</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>LinkedIn posts with images get 2x more engagement.</li>
                <li>99% of recruiters use LinkedIn to find talent.</li>
                <li>Consistent posting (at least 1-2 times a week) leads to higher visibility and more connections.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
