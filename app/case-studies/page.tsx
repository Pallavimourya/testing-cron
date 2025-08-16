import { CheckCircle2 } from "lucide-react";

export default function CaseStudiesPage() {
  const caseStudies = [
    {
      title: "LinkedIn Profile Transformation",
      excerpt: "Learn how we helped a professional increase their LinkedIn engagement by 300% through strategic profile optimization and content creation.",
      image: "/case-study-1.jpg",
      category: "LinkedIn Personal Branding",
      duration: "6 months",
      results: [
        "300% increase in engagement",
        "200% growth in profile views",
        "150% more connection requests"
      ]
    },
    {
      title: "Thought Leadership Success",
      excerpt: "Discover how we helped an industry expert establish themselves as a thought leader on LinkedIn, leading to speaking opportunities and business growth.",
      image: "/case-study-2.jpg",
      category: "LinkedIn Strategy",
      duration: "4 months",
      results: [
        "500% increase in content engagement",
        "3x growth in speaking opportunities",
        "200% increase in business inquiries"
      ]
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-32">
        <h1 className="text-4xl font-bold mb-8 text-white">
          Case Studies
        </h1>
        <div className="grid md:grid-cols-2 gap-8">
          {caseStudies.map((study, index) => (
            <div 
              key={index}
              className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 transform transition-all duration-300 hover:shadow-xl border border-slate-700/50"
            >
              <div className="mb-6">
                <span className="text-sm font-medium text-indigo-400">{study.category}</span>
                <span className="mx-2 text-slate-500">•</span>
                <span className="text-sm text-slate-400">{study.duration}</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">{study.title}</h3>
              <p className="text-slate-300 mb-6">{study.excerpt}</p>
              <div className="space-y-2">
                {study.results.map((result: string, resultIndex: number) => (
                  <div key={resultIndex} className="flex items-center text-slate-300">
                    <CheckCircle2 className="h-5 w-5 text-yellow-400 mr-3" />
                    {result}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
