import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/auth"
import { checkSubscriptionAccess } from "@/lib/subscription-middleware"
import connectDB from "@/lib/mongodb"
import Topic from "@/models/Topic"
import User from "@/models/User"

export async function POST(req: Request) {
  try {
    // Check subscription access for topic generation
    const subscriptionCheck = await checkSubscriptionAccess(false)
    
    if (!subscriptionCheck.success) {
      return subscriptionCheck.response!
    }

    const session = await getServerSession(authOptions)
    const { niche, count = 10, language = "English" } = await req.json()

    if (!niche) {
      return NextResponse.json({ 
        error: "Niche is required",
        code: "MISSING_NICHE"
      }, { status: 400 })
    }

    await connectDB()

    // Get user for context
    const user = await User.findOne({ email: session!.user!.email })
    if (!user) {
      return NextResponse.json({ 
        error: "User not found",
        code: "USER_NOT_FOUND"
      }, { status: 404 })
    }

    // Generate topics based on niche and user preferences
    const topics = await generateTopicsForNiche(niche, count, language, user)

    // Save topics to database
    const savedTopics = await Promise.all(
      topics.map(async (topic) => {
        return await Topic.create({
          userId: user._id,
          title: topic.title,
          description: topic.description,
          category: topic.category,
          difficulty: topic.difficulty,
          estimatedTime: topic.estimatedTime,
          tags: topic.tags,
          language: language,
          status: "pending",
          createdAt: new Date(),
        })
      })
    )

    return NextResponse.json({
      topics: savedTopics,
      count: savedTopics.length,
      subscriptionInfo: subscriptionCheck.data
    })

  } catch (error) {
    console.error("Error generating topics:", error)
    return NextResponse.json({ 
      error: "Failed to generate topics",
      code: "GENERATION_ERROR"
    }, { status: 500 })
  }
}

async function generateTopicsForNiche(niche: string, count: number, language: string, user: any) {
  // This is a simplified topic generation
  // In a real implementation, you would use AI to generate relevant topics
  
  const baseTopics = [
    {
      title: `Latest trends in ${niche}`,
      description: `Explore the current trends and developments in ${niche}`,
      category: "Trends",
      difficulty: "Intermediate",
      estimatedTime: "5 min read",
      tags: [niche.toLowerCase(), "trends", "industry"]
    },
    {
      title: `Best practices for ${niche} professionals`,
      description: `Essential best practices every ${niche} professional should know`,
      category: "Best Practices",
      difficulty: "Beginner",
      estimatedTime: "7 min read",
      tags: [niche.toLowerCase(), "best-practices", "professional"]
    },
    {
      title: `Future of ${niche} industry`,
      description: `What the future holds for the ${niche} industry`,
      category: "Future Insights",
      difficulty: "Advanced",
      estimatedTime: "10 min read",
      tags: [niche.toLowerCase(), "future", "predictions"]
    },
    {
      title: `Common mistakes in ${niche}`,
      description: `Avoid these common pitfalls in ${niche}`,
      category: "Tips",
      difficulty: "Intermediate",
      estimatedTime: "6 min read",
      tags: [niche.toLowerCase(), "mistakes", "tips"]
    },
    {
      title: `Tools and resources for ${niche}`,
      description: `Essential tools and resources for ${niche} professionals`,
      category: "Resources",
      difficulty: "Beginner",
      estimatedTime: "8 min read",
      tags: [niche.toLowerCase(), "tools", "resources"]
    }
  ]

  // Return the requested number of topics
  return baseTopics.slice(0, Math.min(count, baseTopics.length))
}
