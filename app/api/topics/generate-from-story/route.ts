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
    // Check subscription access for topic generation
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

    // Get user's latest story
    const story = await GeneratedStory.findOne({ userId: user._id }).sort({ createdAt: -1 })
    if (!story) {
      return NextResponse.json({ error: "No story found. Please generate a story first." }, { status: 400 })
    }

    // Get user profile for context
    const profile = await UserProfile.findOne({ userId: user._id })

    console.log("🎯 Generating topics from story for user:", user._id)
    console.log("📖 Story ID:", story._id)
    console.log("👤 Profile context:", profile ? "Found" : "Not found")

    // Generate topics using OpenAI directly
    const generatedTopics = await generateTopicsFromStory(
      story.generatedStory,
      story.customizationData || profile,
      user
    )

    if (!generatedTopics || generatedTopics.length === 0) {
      return NextResponse.json({ error: "Failed to generate topics from story" }, { status: 500 })
    }

    // Create topic records
    const createdTopics = []
    for (const topicTitle of generatedTopics) {
      try {
        const topic = new Topic({
          userId: user._id,
          title: topicTitle,
          description: "Topic generated from your unique story",
          category: "auto",
          difficulty: "medium",
          estimatedTime: "5-10 minutes",
          tags: ["auto-generated", "story-based"],
          language: "English",
          status: "pending",
          generationType: "story-based",
          storyId: story._id,
          contentStatus: "not_generated",
          createdAt: new Date(),
        })
        
        await topic.save()
        createdTopics.push(topic)
        console.log("✅ Topic created:", topic.title)
      } catch (topicError) {
        console.error("❌ Error creating topic:", topicError)
      }
    }

    console.log(`✅ Successfully created ${createdTopics.length} topics from story`)

    return NextResponse.json({
      success: true,
      message: `${createdTopics.length} topics generated from your story successfully`,
      count: createdTopics.length,
      topics: createdTopics.map(t => ({
        id: t.id,
        title: t.title,
        status: t.status
      })),
      storyId: story._id,
      subscriptionInfo: subscriptionCheck.data,
    })
  } catch (error) {
    console.error("❌ Error generating topics from story:", error)
    return NextResponse.json(
      {
        error: "Failed to generate topics from story",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

async function generateTopicsFromStory(
  baseStory: string,
  customizationData?: any,
  user?: any
): Promise<string[]> {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY
    if (!openaiApiKey) {
      console.log("⚠️ OpenAI API key not found, using fallback topics")
      return generateFallbackTopics()
    }

    const contentLanguage = customizationData?.content_language || customizationData?.contentLanguage || "English"
    const targetAudience = customizationData?.target_audience || customizationData?.targetAudience || "professionals"
    const industry = user?.industry || "business"

    const prompt = `Generate 5-8 engaging LinkedIn content topics based on this professional story. Write topic titles only, one per line, in ${contentLanguage} language.

**User's Story:**
${baseStory}

**Profile Context:**
- Target Audience: ${targetAudience}
- Industry: ${industry}
- Content Language: ${contentLanguage}

**Requirements:**
1. Create topics that directly relate to the user's story and experiences
2. Make topics engaging and relevant to ${targetAudience}
3. Focus on professional growth, lessons learned, and insights
4. Write in ${contentLanguage} language
5. Keep topic titles concise (under 60 characters)
6. Make them specific and actionable
7. Return only the topic titles, one per line
8. No numbering, no formatting, just plain text titles

**Example format:**
Leadership lessons from failure
Building resilience in business
The power of authentic networking
Turning challenges into opportunities
Mentorship impact on career growth

Generate 5-8 relevant topics based on the story above:`

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
            content: `You are an expert content strategist who creates engaging LinkedIn topics based on personal stories. Always respond with topic titles only, one per line, in ${contentLanguage} language.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      const content = data.choices[0]?.message?.content

      if (content && content.trim().length > 0) {
        // Parse the response into individual topics
        const topics = content
          .split('\n')
          .map((line: string) => line.trim())
          .filter((line: string) => line.length > 0 && !line.match(/^\d+\./)) // Remove numbered lines
          .slice(0, 8) // Limit to 8 topics

        console.log("✅ Generated topics with OpenAI:", topics.length)
        return topics
      }
    }

    return generateFallbackTopics()
  } catch (error) {
    console.error("OpenAI API error:", error)
    return generateFallbackTopics()
  }
}

function generateFallbackTopics(): string[] {
  return [
    "Leadership lessons from personal challenges",
    "Building resilience in professional life",
    "The power of authentic networking",
    "Turning setbacks into opportunities",
    "Mentorship impact on career growth",
    "Overcoming professional obstacles",
    "Building meaningful connections",
    "Personal growth through adversity"
  ]
}
