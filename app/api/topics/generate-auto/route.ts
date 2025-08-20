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

    console.log("🎯 Generating auto topics for user:", user._id)
    console.log("📖 Story context:", story ? "Found" : "Not found")
    console.log("👤 Profile context:", profile ? "Found" : "Not found")

    const generatedTopics = await generateAutoTopicsWithOpenAI(
      story?.generatedStory,
      story?.baseStoryData,
      story?.customizationData || profile,
      user,
    )

    const createdTopics = []
    for (let i = 0; i < generatedTopics.length; i++) {
      const topic = await Topic.create({
        userId: user._id,
        title: generatedTopics[i],
        source: "auto",
        generationType: "auto",
        status: "pending",
        contentStatus: "not_generated",
        createdAt: new Date(),
      })
      createdTopics.push(topic)
    }

    console.log(`✅ Generated ${createdTopics.length} auto topics successfully`)

    return NextResponse.json({
      success: true,
      message: `Successfully generated ${createdTopics.length} topics based on your story and profile!`,
      topics: createdTopics.map((t) => ({
        id: t._id.toString(),
        title: t.title,
        status: t.status,
      })),
      subscriptionInfo: subscriptionCheck.data,
    })
  } catch (error) {
    console.error("❌ Error generating auto topics:", error)
    return NextResponse.json(
      {
        error: "Failed to generate topics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

async function generateAutoTopicsWithOpenAI(
  baseStory?: string,
  baseStoryData?: any,
  customizationData?: any,
  user?: any,
) {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY
    if (!openaiApiKey) {
      console.log("⚠️ OpenAI API key not found, using fallback")
      return generateFallbackAutoTopics(baseStoryData, customizationData)
    }

    const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`
    const contentLanguage = customizationData?.content_language || customizationData?.contentLanguage || "English"

    const topicPrompt = `Generate exactly 2 unique content topics based SPECIFICALLY on the user's story. Write in ${contentLanguage} language.

**Uniqueness Seed:** ${uniqueId}

**User's Complete Story:**
${baseStory || "Professional story not available"}

**Profile Context:**
- Target Audience: ${customizationData?.target_audience || customizationData?.targetAudience || "professionals"}
- Content Tone: ${customizationData?.content_tone || customizationData?.contentTone || "professional"}
- Content Goal: ${customizationData?.content_goal || customizationData?.contentGoal || "build authority"}
- Content Language: ${contentLanguage}
- Industry: ${user?.industry || "business"}
- Job Title: ${user?.jobTitle || "professional"}

**Story Elements to Use:**
- Current Work: ${baseStoryData?.currentWork || "Not specified"}
- Biggest Challenge: ${baseStoryData?.biggestChallenge || "Not specified"}
- Turning Point: ${baseStoryData?.turningPoint || "Not specified"}
- Core Values: ${baseStoryData?.coreValues || "Not specified"}
- Unique Approach: ${baseStoryData?.uniqueApproach || "Not specified"}
- Proud Achievement: ${baseStoryData?.proudAchievement || "Not specified"}
- Powerful Lesson: ${baseStoryData?.powerfulLesson || "Not specified"}
- Mentor: ${baseStoryData?.mentor || "Not specified"}
- Almost Gave Up: ${baseStoryData?.almostGaveUp || "Not specified"}

**CRITICAL REQUIREMENTS:**
1. Generate exactly 2 topics in ${contentLanguage} language
2. Each topic MUST reference specific elements from the story above
3. Extract actual events, challenges, lessons, or people mentioned in the story
4. Make topics personal and authentic to their exact experience
5. Topics should encourage engagement and discussion
6. Reference specific details from their story (names, situations, outcomes)
7. Make topics actionable and relatable to their target audience
8. Each topic should be unique and focus on different story aspects

**Examples of good story-based topics:**
- If story mentions "mentor Sarah taught me patience" → "The Patience Lesson My Mentor Sarah Taught Me That Changed My Leadership Style"
- If story mentions "failed startup in 2019" → "How My Failed Startup in 2019 Became My Greatest Teacher"
- If story mentions "switched from engineering to marketing" → "Why I Left Engineering for Marketing: The Decision That Defined My Career"

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
            content: `You are an expert content strategist who creates personalized, engaging topics based on user stories and professional experiences. Always respond in ${contentLanguage} language.`,
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
          console.log("✅ Generated auto topics with OpenAI")
          return topics
        }
      }
    }

    return generateFallbackAutoTopics(baseStoryData, customizationData)
  } catch (error) {
    console.error("OpenAI API error:", error)
    return generateFallbackAutoTopics(baseStoryData, customizationData)
  }
}

function generateFallbackAutoTopics(baseStoryData?: any, customizationData?: any) {
  const timestamp = Date.now()
  const randomSeed = Math.floor(Math.random() * 1000)

  const fallbackTopics = [
    `My Journey in ${baseStoryData?.currentWork || "Professional Life"}: Key Lessons`,
    `How I Handle ${baseStoryData?.biggestChallenge || "Challenges"} in My Career`,
  ]

  console.log(`✅ Generated fallback auto topics with seed: ${timestamp}-${randomSeed}`)
  return fallbackTopics
}
