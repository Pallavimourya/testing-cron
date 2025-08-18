import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import connectDB from "@/lib/mongodb"

export async function POST(req: Request) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { userId, mcqData, transcription, audioUrl } = await req.json()

    await connectDB()

    // Create comprehensive prompt for content generation
    const promptText = `
Based on the following user preferences and story, generate 3 high-quality ${mcqData.platform} posts.

User Preferences:
- Platform: ${mcqData.platform}
- Industry: ${mcqData.industry}
- Tone: ${mcqData.tone}
- Frequency: ${mcqData.frequency}
- Primary Goal: ${mcqData.primaryGoal}

User Story (from Audio):
${transcription}

Instructions:
Write 3 posts that follow this format:
1. Hook (emotional/engaging/insightful)
2. Story (real, bold, relevant to the ${mcqData.industry} industry)
3. Mindset Shift / Business Insight
4. CTA (Comment, DM, or Share)

Output each post clearly labeled [Post 1], [Post 2], [Post 3].
Keep them optimized for ${mcqData.industry} professionals and ${mcqData.tone} tone.
Each post should be 150-300 words and include relevant hashtags.
`

    console.log("🎯 Generated prompt for content creation")

    // For now, create sample content directly
    const sampleContent = [
      {
        title: `${mcqData.industry} Insights`,
        content: `Based on your story: "${transcription.substring(0, 100)}..." 

Here's a ${mcqData.tone} post for ${mcqData.platform}:

🎯 Your journey in ${mcqData.industry} is inspiring!

Every entrepreneur faces challenges, but your approach shows real wisdom. The way you've navigated your path demonstrates the kind of thinking that drives innovation.

💡 Key insight: Success isn't just about the destination, it's about the lessons learned along the way.

What's one lesson from your journey that you'd share with others?

#${mcqData.industry} #Entrepreneurship #Growth`,
        platform: mcqData.platform,
        status: "pending",
        userId: session.user.email,
        createdAt: new Date(),
      },
      {
        title: `${mcqData.industry} Strategy`,
        content: `Building in ${mcqData.industry} requires both vision and execution.

Your story resonates because it's real. In a world full of highlight reels, authentic experiences like yours cut through the noise.

🚀 The best strategies come from real experience, not just theory.

Here's what I learned: [Your key insight from the transcription]

What's working in your ${mcqData.industry} journey right now?

#${mcqData.industry} #Strategy #RealTalk`,
        platform: mcqData.platform,
        status: "pending",
        userId: session.user.email,
        createdAt: new Date(),
      },
      {
        title: `${mcqData.industry} Community`,
        content: `The ${mcqData.industry} community is incredible.

Your perspective on [insight from transcription] really hits home. It's refreshing to see someone share the real challenges alongside the wins.

🤝 Building together is always better than building alone.

Drop a comment if you've experienced something similar - let's learn from each other!

#${mcqData.industry} #Community #Growth #Networking`,
        platform: mcqData.platform,
        status: "pending",
        userId: session.user.email,
        createdAt: new Date(),
      },
    ]

    // Save sample content to database (in production, this would come from Make.com)
    // For now, we'll return success and let the dashboard show the content

    return NextResponse.json({
      success: true,
      promptText,
      message: "Content generation initiated",
      sampleContent,
    })
  } catch (error: any) {
    console.error("❌ Error generating prompt:", error)
    return NextResponse.json({ error: error.message || "Failed to generate prompt" }, { status: 500 })
  }
}
