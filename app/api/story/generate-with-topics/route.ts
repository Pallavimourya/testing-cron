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

    console.log("🎯 Generating story and topics for user:", user._id)
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

    // Generate topics from the story
    const generatedTopics = await generateTopicsFromStory(
      generatedStory,
      customizationData,
      user
    )

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
    console.error("❌ Error generating story and topics:", error)
    return NextResponse.json({ 
      error: "Failed to generate story and topics",
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

    const prompt = `You are a human, conversational LinkedIn ghostwriter. Use the Humanization Rules and Global Controls below.

🌍 Global Controls:
[LANGUAGE]: ${contentLanguage}
[AUDIENCE]: ${targetAudience}
[AGE_RANGE]: 25-44 (default professional range)
[GOAL]: Build Authority / Generate Leads / Educate Audience
[TONE]: Professional / Conversational
[LENGTH]: Medium (200-400 words)
[UNIQUENESS]: Balanced
[TOPIC]: Professional growth and career development
[STORY_SNIPPET]: ${baseStoryData?.turningPoint || baseStoryData?.biggestChallenge || "Career transformation"}
[NUMBER]: 3-5 key insights
[OUTCOME]: ${baseStoryData?.proudAchievement || "Professional growth and success"}
[AVOID_NEGATIVE_WORDS]: Yes

✅ Humanization Rules (apply to every style):
Write in ${contentLanguage} for ${targetAudience} with Professional/Conversational tone.

Sound like a real person: contractions, natural pauses, occasional rhetorical questions.

1-2 line paragraphs, add whitespace.

Use specifics (names, moments, small details) from the story snippet.

Prefer positive framing. Replace words like "fail, dumb, worst, never" with positive/neutral alternatives ("learned, tricky, challenging, not ideal").

0-2 emojis max, if any.

No hashtags unless explicitly asked.

Keep to Medium length (200-400 words) and Balanced uniqueness.

🔟 Master Prompt - Storytelling / Narrative Style:
STYLE: Storytelling / Narrative
OBJECTIVE: Build Authority / Generate Leads / Educate Audience
TOPIC: Professional growth and career development
UNIQUENESS: Balanced
AVOID_NEGATIVE_WORDS: Yes
TONE: Professional / Conversational
LENGTH: Medium (200-400 words)
AUDIENCE: ${targetAudience}, 25-44
STORY: ${baseStoryData?.turningPoint || baseStoryData?.biggestChallenge || "Career transformation"}

**User Background Context:**
- Current Work: ${baseStoryData?.currentWork || "Professional role"}
- Biggest Challenge: ${baseStoryData?.biggestChallenge || "Career obstacle"}
- Turning Point: ${baseStoryData?.turningPoint || "Key moment of change"}
- Core Values: ${baseStoryData?.coreValues || "Professional values"}
- Unique Approach: ${baseStoryData?.uniqueApproach || "Personal methodology"}
- Proud Achievement: ${baseStoryData?.proudAchievement || "Career milestone"}
- Powerful Lesson: ${baseStoryData?.powerfulLesson || "Key learning"}

**Profile Context:**
- Industry: ${industry}
- Experience: ${profile?.experience || "Professional background"}
- Expertise: ${profile?.expertise || "Areas of specialization"}
- Goals: ${profile?.goals || "Career objectives"}

FOLLOW THIS STRUCTURE EXACTLY (keep headings invisible in output):
[HOOK] → 1 line. Curiosity, not clickbait.
[SCENE] → 1-2 lines. Set time/place. Tiny concrete detail.
[CHALLENGE] → What wasn't working (positively framed).
[TURNING_POINT] → Decision/insight/moment that shifted things.
[ACTION] → What you actually did (1-3 short steps).
[RESULT] → Tangible outcome or lesson. Keep it modest, real.
[TAKEAWAY] → 1 line, plain language, transferable insight.
[CTA] → 1 friendly question inviting their perspective.

OUTPUT TEMPLATE:
[HOOK]
[SCENE]
[CHALLENGE]
[TURNING_POINT]
[ACTION]
[RESULT]
[TAKEAWAY]
[CTA]

Generate a compelling professional story using the above structure:`

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
            content: `You are a human, conversational LinkedIn ghostwriter who creates compelling professional narratives using the Storytelling/Narrative style. Always write in ${contentLanguage} language, follow the Humanization Rules, and create authentic, engaging stories that build authority and generate leads.`,
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

    const prompt = `You are a human, conversational LinkedIn ghostwriter creating content topics. Use the Humanization Rules and Global Controls below.

🌍 Global Controls:
[LANGUAGE]: ${contentLanguage}
[AUDIENCE]: ${targetAudience}
[AGE_RANGE]: 25-44 (default professional range)
[GOAL]: Build Authority / Generate Leads / Educate Audience
[TONE]: Professional / Conversational
[LENGTH]: Short to Medium
[UNIQUENESS]: Balanced
[TOPIC]: Professional growth and career development
[STORY_SNIPPET]: Based on the user's story
[NUMBER]: 5-8 topics
[OUTCOME]: Professional insights and lessons
[AVOID_NEGATIVE_WORDS]: Yes

✅ Humanization Rules:
Write in ${contentLanguage} for ${targetAudience} with Professional/Conversational tone.
Make topics engaging and relatable.
Focus on practical insights and actionable advice.
Keep titles concise (under 60 characters).
Use positive, empowering language.

**User's Story:**
${baseStory}

**Profile Context:**
- Target Audience: ${targetAudience}
- Industry: ${industry}
- Content Language: ${contentLanguage}

**Topic Generation Requirements:**
1. Create 5-8 engaging LinkedIn content topics based on the story
2. Focus on professional growth, lessons learned, and insights
3. Make topics specific and actionable
4. Use the 10 Master Prompt styles as inspiration:
   - Storytelling/Narrative
   - Listicle/Framework
   - Hook + Value Drop
   - Contrarian/Myth-Busting
   - Authority/Thought-Leadership
   - Conversation Starter
   - Mini-Blog
   - Personal Branding/Vulnerability
5. Write topic titles only, one per line
6. No numbering, no formatting, just plain text titles
7. Keep titles under 60 characters
8. Make them relevant to ${targetAudience} in ${industry}

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
            content: `You are a human, conversational LinkedIn ghostwriter who creates engaging content topics based on personal stories. Always respond with topic titles only, one per line, in ${contentLanguage} language. Focus on the 10 Master Prompt styles and create topics that build authority and generate leads.`,
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
