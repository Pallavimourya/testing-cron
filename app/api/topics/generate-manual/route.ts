import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { checkSubscriptionAccess } from "@/lib/subscription-middleware"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import Topic from "@/models/Topic"
import GeneratedStory from "@/models/GeneratedStory"
import UserProfile from "@/models/UserProfile"

export async function POST(request: Request) {
  try {
    const subscriptionCheck = await checkSubscriptionAccess(false)

    if (!subscriptionCheck.success) {
      return subscriptionCheck.response!
    }

    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { prompt } = await request.json()
    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    await connectDB()

    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check monthly topic limit
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const currentTopicCount = await Topic.countDocuments({
      userId: user._id,
      createdAt: { $gte: startOfMonth },
    })

    if (currentTopicCount >= 30) {
      return NextResponse.json(
        {
          error:
            "You have reached the maximum limit of 30 topics this month. Please wait for next month or dismiss some topics.",
          currentCount: currentTopicCount,
          maxLimit: 30,
        },
        { status: 400 },
      )
    }

    // Get user's latest story and profile for context
    const story = await GeneratedStory.findOne({ userId: user._id }).sort({ createdAt: -1 })
    const profile = await UserProfile.findOne({ userId: user._id })

    console.log("🎯 Generating manual topics for user:", user._id)
    console.log("📝 User prompt:", prompt)

    const generatedTopics = await generateManualTopicsWithOpenAI(
      prompt,
      story?.generatedStory,
      story?.baseStoryData,
      profile,
    )

    const createdTopics = []
    for (let i = 0; i < generatedTopics.length; i++) {
      const topic = await Topic.create({
        userId: user._id,
        title: generatedTopics[i],
        description: `Generated from prompt: "${prompt}"`,
        category: "manual",
        difficulty: "medium",
        estimatedTime: "5-10 minutes",
        tags: ["manual-generated"],
        language: "English",
        status: "pending",
        generationType: "manual",
        userPrompt: prompt,
        contentStatus: "not_generated",
        createdAt: new Date(),
        source: "manual",
      })
      createdTopics.push(topic)
    }

    console.log(`✅ Generated ${createdTopics.length} manual topics successfully`)

    return NextResponse.json({
      success: true,
      message: `Successfully generated ${createdTopics.length} topics based on your prompt!`,
      topics: createdTopics.map((t) => ({
        id: t._id.toString(),
        title: t.title,
        status: t.status,
      })),
      subscriptionInfo: subscriptionCheck.data,
    })
  } catch (error) {
    console.error("❌ Error generating manual topics:", error)
    return NextResponse.json(
      {
        error: "Failed to generate topics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

async function generateManualTopicsWithOpenAI(
  userPrompt: string,
  baseStory?: string,
  baseStoryData?: any,
  customizationData?: any,
) {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY
    if (!openaiApiKey) {
      console.log("⚠️ OpenAI API key not found, using fallback")
      return generateFallbackManualTopics(userPrompt)
    }

    const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`
    const contentLanguage = customizationData?.content_language || customizationData?.contentLanguage || "English"

    const topicPrompt = `Generate exactly 2 unique content topics by combining the user's prompt with their personal story. Write in ${contentLanguage} language.

**Uniqueness Seed:** ${uniqueId}

**User's Custom Prompt:** ${userPrompt}

**User's Complete Story:**
${baseStory || "Professional story not available"}

**Profile Context:**
- Target Audience: ${customizationData?.target_audience || customizationData?.targetAudience || "professionals"}
- Content Tone: ${customizationData?.content_tone || customizationData?.contentTone || "professional"}
- Content Goal: ${customizationData?.content_goal || customizationData?.contentGoal || "build authority"}
- Content Language: ${contentLanguage}

**Story Elements to Integrate:**
- Current Work: ${baseStoryData?.currentWork || "Not specified"}
- Biggest Challenge: ${baseStoryData?.biggestChallenge || "Not specified"}
- Turning Point: ${baseStoryData?.turningPoint || "Not specified"}
- Core Values: ${baseStoryData?.coreValues || "Not specified"}
- Unique Approach: ${baseStoryData?.uniqueApproach || "Not specified"}
- Proud Achievement: ${baseStoryData?.proudAchievement || "Not specified"}
- Powerful Lesson: ${baseStoryData?.powerfulLesson || "Not specified"}

**CRITICAL REQUIREMENTS:**
1. Generate exactly 2 topics in ${contentLanguage} language
2. Combine the user's prompt "${userPrompt}" with specific elements from their story
3. Make topics personal and authentic to their experience
4. Reference actual events, challenges, or insights from their story
5. Topics should be engaging and encourage discussion
6. Make topics actionable and relatable to their audience
7. Each topic should be unique and focus on different aspects
8. Connect the prompt theme with their personal story elements

**Examples of good combined topics:**
- If prompt is "leadership" + story mentions "team crisis" → "The Leadership Lesson I Learned During My Team's Biggest Crisis"
- If prompt is "productivity" + story mentions "work method" → "How I Revolutionized My Productivity Using This Unconventional Method from My Story"
- If prompt is "failure" + story mentions "startup failure" → "What My Failed Startup Taught Me About Resilience and Success"

Return only the topic titles in ${contentLanguage}, one per line, without numbering or bullet points.`

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are an expert content strategist who creates personalized, engaging topics by combining user prompts with their personal stories and professional experiences. Always respond in ${contentLanguage} language.`,
          },
          {
            role: "user",
            content: topicPrompt,
          },
        ],
        max_tokens: 300,
        temperature: 0.8,
        presence_penalty: 0.6,
        frequency_penalty: 0.4,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      const content = data.choices[0]?.message?.content

      if (content) {
        const topics = content
          .split("\n")
          .map((line: string) => line.trim())
          .filter((line: string) => line.length > 0)
          .slice(0, 2) // Ensure exactly 2 topics

        if (topics.length === 2) {
          console.log("✅ Generated manual topics with OpenAI")
          return topics
        }
      }
    }

    return generateFallbackManualTopics(userPrompt)
  } catch (error) {
    console.error("OpenAI API error:", error)
    return generateFallbackManualTopics(userPrompt)
  }
}

function generateFallbackManualTopics(userPrompt: string) {
  const timestamp = Date.now()
  const randomSeed = Math.floor(Math.random() * 1000)

  const fallbackTopics = [
    `My Personal Take on ${userPrompt}: What I've Learned`,
    `The ${userPrompt} Strategy That Changed My Approach`,
  ]

  console.log(`✅ Generated fallback manual topics with seed: ${timestamp}-${randomSeed}`)
  return fallbackTopics
}
