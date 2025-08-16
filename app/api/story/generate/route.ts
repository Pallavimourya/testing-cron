import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { checkSubscriptionAccess } from "@/lib/subscription-middleware"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import GeneratedStory from "@/models/GeneratedStory"
import UserProfile from "@/models/UserProfile"
import Topic from "@/models/Topic"

export async function POST(request: Request) {
  try {
    // Check subscription access for story generation
    const subscriptionCheck = await checkSubscriptionAccess(false)
    
    if (!subscriptionCheck.success) {
      return subscriptionCheck.response!
    }

    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { baseStoryData, customizationData } = await request.json()

    if (!baseStoryData || !customizationData) {
      return NextResponse.json({ error: "Base story data and customization data are required" }, { status: 400 })
    }

    await connectDB()

    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get user profile for context
    const profile = await UserProfile.findOne({ userId: user._id })

    console.log("🎯 Generating story for user:", user._id)
    console.log("👤 Profile context:", profile ? "Found" : "Not found")

    // Generate story using OpenAI directly
    const generatedStory = await generateStoryWithOpenAI(
      baseStoryData,
      customizationData,
      profile,
      user
    )

    if (!generatedStory) {
      return NextResponse.json({ error: "Failed to generate story" }, { status: 500 })
    }

    // Save the generated story
    const story = await GeneratedStory.create({
      userId: user._id,
      status: "completed",
      generatedStory: generatedStory,
      baseStoryData: baseStoryData,
      customizationData: customizationData,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Generate topics from the story
    const generatedTopics = await generateTopicsFromStory(
      generatedStory,
      customizationData,
      user
    )

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

    console.log(`✅ Successfully created story and ${createdTopics.length} topics`)

    return NextResponse.json({
      success: true,
      message: `Story and ${createdTopics.length} topics generated successfully`,
      storyId: story._id,
      topics: createdTopics.map(t => ({
        id: t.id,
        title: t.title,
        status: t.status
      })),
      subscriptionInfo: subscriptionCheck.data
    })

  } catch (error) {
    console.error("❌ Error generating story:", error)
    return NextResponse.json({ 
      error: "Failed to generate story",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

async function generateStoryWithOpenAI(
  baseStoryData: any,
  customizationData: any,
  profile?: any,
  user?: any
): Promise<string> {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY
    if (!openaiApiKey) {
      console.log("⚠️ OpenAI API key not found, using fallback story")
      return generateFallbackStory(baseStoryData)
    }

    const contentLanguage = customizationData?.content_language || customizationData?.contentLanguage || "English"
    const targetAudience = customizationData?.target_audience || customizationData?.targetAudience || "professionals"
    const industry = user?.industry || "business"

    const prompt = `Create a compelling professional story based on the user's background and preferences. Write in ${contentLanguage} language.

**User Background:**
- Current Work: ${baseStoryData?.currentWork || "Not specified"}
- Biggest Challenge: ${baseStoryData?.biggestChallenge || "Not specified"}
- Turning Point: ${baseStoryData?.turningPoint || "Not specified"}
- Core Values: ${baseStoryData?.coreValues || "Not specified"}
- Unique Approach: ${baseStoryData?.uniqueApproach || "Not specified"}
- Proud Achievement: ${baseStoryData?.proudAchievement || "Not specified"}
- Powerful Lesson: ${baseStoryData?.powerfulLesson || "Not specified"}

**Profile Context:**
- Target Audience: ${targetAudience}
- Industry: ${industry}
- Content Language: ${contentLanguage}
- Experience: ${profile?.experience || "Not specified"}
- Expertise: ${profile?.expertise || "Not specified"}
- Goals: ${profile?.goals || "Not specified"}

**Requirements:**
1. Create a cohesive, engaging professional story
2. Write in ${contentLanguage} language
3. Make it personal and authentic
4. Include specific details and experiences
5. Focus on growth, challenges, and lessons learned
6. Make it relevant to ${targetAudience} in ${industry}
7. Keep it professional but relatable
8. Include a clear narrative arc with beginning, middle, and end

Generate a compelling professional story:`

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
            content: `You are an expert storyteller who creates compelling professional narratives. Always write in ${contentLanguage} language and make stories authentic and engaging.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 800,
        temperature: 0.7,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      const content = data.choices[0]?.message?.content

      if (content && content.trim().length > 0) {
        console.log("✅ Generated story with OpenAI")
        return content.trim()
      }
    }

    return generateFallbackStory(baseStoryData)
  } catch (error) {
    console.error("OpenAI API error:", error)
    return generateFallbackStory(baseStoryData)
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

function generateFallbackStory(baseStoryData: any): string {
  return `My professional journey began with a simple realization: success isn't about avoiding challenges, but about how we respond to them.

Starting in my current role, I faced what seemed like an insurmountable obstacle. The biggest challenge wasn't technical - it was learning to trust my instincts and stay true to my core values when everything around me suggested taking shortcuts.

The turning point came when I realized that my unique approach, though unconventional, was actually my greatest strength. Instead of following the established path, I chose to innovate and think differently.

This led to my proudest achievement: not just the results we achieved, but the way we achieved them - with integrity, creativity, and genuine care for our team and customers.

The most powerful lesson I learned is that authentic leadership isn't about having all the answers, but about asking the right questions and creating an environment where others can thrive.

Today, I continue to build on these foundations, always remembering that the best professional growth comes from staying true to yourself while remaining open to new perspectives and approaches.`
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
