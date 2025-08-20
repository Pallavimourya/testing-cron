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
    console.log("📝 Base story data:", Object.keys(baseStoryData))
    console.log("🎨 Customization data:", Object.keys(customizationData))

    // Generate story using enhanced OpenAI prompt
    const generatedStory = await generateEnhancedStoryWithOpenAI(
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

    // Generate topics directly from the story
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

async function generateEnhancedStoryWithOpenAI(
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
    const writingStyle = customizationData?.writing_style || customizationData?.writingStyle || "conversational"
    const contentTone = customizationData?.content_tone || customizationData?.contentTone || "professional"

    // Create a comprehensive prompt that properly combines base story + customization
    const prompt = `Create a professional story based on the user's specific information. Write in ${contentLanguage} language only.

**USER'S SPECIFIC INFORMATION (USE THESE EXACT DETAILS):**
- Current Work/Role: "${baseStoryData?.currentWork || baseStoryData?.current_work || "Not specified"}"
- Biggest Challenge: "${baseStoryData?.biggestChallenge || baseStoryData?.biggest_challenge || "Not specified"}"
- Turning Point: "${baseStoryData?.turningPoint || baseStoryData?.turning_point || "Not specified"}"
- Core Values: "${baseStoryData?.coreValues || baseStoryData?.core_values || "Not specified"}"
- Unique Approach: "${baseStoryData?.uniqueApproach || baseStoryData?.unique_approach || "Not specified"}"
- Proud Achievement: "${baseStoryData?.proudAchievement || baseStoryData?.proud_achievement || "Not specified"}"
- Powerful Lesson: "${baseStoryData?.powerfulLesson || baseStoryData?.powerful_lesson || "Not specified"}"

**CUSTOMIZATION PREFERENCES:**
- Target Audience: ${targetAudience}
- Content Language: ${contentLanguage}
- Writing Style: ${writingStyle}
- Content Tone: ${contentTone}
- Industry: ${industry}

**CRITICAL REQUIREMENTS:**
1. Write ONLY in ${contentLanguage} language - no mixing of languages
2. Use the specific details provided above - do not create generic content
3. Write in simple, clean text - no bold formatting, no special characters
4. Create a natural, flowing narrative that sounds authentic
5. Keep the tone ${contentTone} and style ${writingStyle}
6. Make it relevant to ${targetAudience} in ${industry}
7. Write 3-4 paragraphs maximum
8. Focus on the user's actual experiences and lessons learned
9. Make it personal and engaging
10. Avoid clichés and generic statements

**STORY STRUCTURE:**
- Start with the user's current work situation
- Describe the challenge they faced
- Explain the turning point that changed things
- Show how their values and approach helped
- Highlight their achievement
- End with the lesson learned

Write a clean, professional story using the user's specific information:`

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are a professional storyteller. Write clean, simple stories in the specified language only. Use the exact details provided by the user. No mixed languages, no bold formatting, no special characters. Write natural, authentic content.`,
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
        console.log("✅ Generated enhanced story with OpenAI")
        // Clean the content to remove any formatting issues
        const cleanedContent = content
          .replace(/\*\*/g, '') // Remove bold formatting
          .replace(/\*/g, '') // Remove asterisks
          .replace(/\[.*?\]/g, '') // Remove brackets
          .replace(/\n\s*\n/g, '\n\n') // Clean up extra line breaks
          .trim()
        
        return cleanedContent
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

    const prompt = `Generate 5-8 engaging LinkedIn content topics that are DIRECTLY derived from this specific story. 

**USER'S STORY:**
${baseStory}

**CONTEXT:**
- Target Audience: ${targetAudience}
- Industry: ${industry}
- Content Language: ${contentLanguage}

**REQUIREMENTS:**
1. **MUST BE DERIVED** from the specific story above - do not create generic topics
2. Extract key themes, lessons, and insights from the story
3. Create topics that the user can write about based on their actual experiences
4. Make topics engaging and relevant to ${targetAudience}
5. Write in ${contentLanguage} language
6. Keep topic titles concise (under 60 characters)
7. Make them specific and actionable
8. Focus on professional growth, challenges, and insights from the story

**EXAMPLES OF GOOD TOPICS (based on story elements):**
- If story mentions "team leadership" → "Leading teams through challenging times"
- If story mentions "career transition" → "How I navigated my career pivot"
- If story mentions "innovation" → "Innovating in traditional industries"

**OUTPUT:** Return only the topic titles, one per line, no numbering or formatting.`

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an expert content strategist who creates LinkedIn topics directly from personal stories. You MUST extract topics from the specific story provided, not create generic ones. Always respond with topic titles only, one per line.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 400,
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

        console.log("✅ Generated story-based topics with OpenAI:", topics.length)
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
  // Return empty string instead of default content
  return ""
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
