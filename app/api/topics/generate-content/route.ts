import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { checkSubscriptionAccess, incrementContentGeneration } from "@/lib/subscription-middleware"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import Topic from "@/models/Topic"
import ApprovedContent from "@/models/ApprovedContent"
import GeneratedStory from "@/models/GeneratedStory"
import UserProfile from "@/models/UserProfile"

export async function POST(request: Request) {
  let topicId: string | null = null

  try {
    const subscriptionCheck = await checkSubscriptionAccess(false)

    if (!subscriptionCheck.success) {
      return subscriptionCheck.response!
    }

    const session = await getServerSession()
    
    // Check for both email and id in session
    if (!session?.user?.email && !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const requestData = await request.json()
    topicId = requestData.topicId
    const contentType = requestData.contentType || "storytelling" // Default to storytelling if not provided
    
    if (!topicId) {
      return NextResponse.json({ error: "Topic ID is required" }, { status: 400 })
    }

    console.log("🎯 Content generation request:", { topicId, contentType })

    await connectDB()
    
    // Find user by email or id
    let user = null
    if (session.user.email) {
      user = await User.findOne({ email: session.user.email })
    }
    if (!user && session.user.id) {
      user = await User.findById(session.user.id)
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check monthly content generation limit
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const currentContentCount = await ApprovedContent.countDocuments({
      userId: user._id,
      createdAt: { $gte: startOfMonth },
    })

    if (currentContentCount >= 30) {
      return NextResponse.json(
        {
          error: "You have reached the maximum limit of 30 content generations this month. Please wait for next month.",
          currentCount: currentContentCount,
          maxLimit: 30,
        },
        { status: 400 },
      )
    }

    // Find the topic
    const topic = await Topic.findOne({ id: topicId, userId: user._id })
    if (!topic) {
      console.error("❌ Topic not found:", topicId)
      return NextResponse.json({ error: "Topic not found" }, { status: 404 })
    }

    console.log("🎯 Topic found:", {
      id: topic.id,
      title: topic.title,
      status: topic.status,
      contentStatus: topic.contentStatus,
      userId: topic.userId.toString(),
    })

    // Check if content already exists for this topic
    if (topic.contentStatus === "generated") {
      return NextResponse.json({ error: "Content already generated for this topic" }, { status: 400 })
    }

    // Check if content is currently being generated
    if (topic.contentStatus === "generating") {
      return NextResponse.json({ error: "Content is already being generated for this topic" }, { status: 400 })
    }

    // Get user's story and profile for context
    const story = await GeneratedStory.findOne({ userId: user._id }).sort({ createdAt: -1 })
    const profile = await UserProfile.findOne({ userId: user._id })

    console.log("🎯 Generating content for topic:", topicId)
    console.log("📝 Topic title:", topic.title)
    console.log("📖 Story context:", story ? "Found" : "Not found")
    console.log("👤 Profile context:", profile ? "Found" : "Not found")

    await Topic.updateOne(
      { id: topicId },
      {
        $set: {
          contentStatus: "generating",
          updatedAt: new Date(),
        },
      },
    )

    const generatedContent = await generateContentWithOpenAI(
      topic.title,
      story?.generatedStory,
      story?.baseStoryData,
      story?.customizationData || profile,
      user,
      contentType,
    )

    // Map content type to match model enum
    const mappedContentType = contentType === "story" ? "storytelling" : contentType

    const approvedContent = await ApprovedContent.create({
      id: `content-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: user._id,
      topicId: topicId,
      topicTitle: topic.title,
      content: generatedContent,
      hashtags: [],
      keyPoints: [],
      contentType: mappedContentType,
      language: story?.customizationData?.content_language || profile?.contentLanguage || "English", // Added language field
      status: "generated",
      platform: "linkedin",
      createdAt: new Date(),
    })

    await Topic.updateOne(
      { id: topicId },
      {
        $set: {
          contentStatus: "generated",
          hasContent: true,
          updatedAt: new Date(),
        },
      },
    )

    // Increment content generation count
    await incrementContentGeneration(session.user.email || session.user.id || "")

    console.log("✅ Content generated and saved successfully")

    return NextResponse.json({
      success: true,
      message: "Content generated successfully!",
      topicId: topicId,
      contentStatus: "generated",
      contentId: approvedContent.id,
      subscriptionInfo: subscriptionCheck.data,
    })
  } catch (error) {
    console.error("❌ Error generating content:", error)

    // Reset topic status if there was an error
    if (topicId) {
      try {
        await Topic.updateOne(
          { id: topicId },
          {
            $set: {
              contentStatus: "not_generated",
              updatedAt: new Date(),
            },
          },
        )
      } catch (resetError) {
        console.error("Failed to reset topic status:", resetError)
      }
    }

    return NextResponse.json(
      {
        error: "Failed to generate content",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

async function generateContentWithOpenAI(
  topicTitle: string,
  baseStory?: string,
  baseStoryData?: any,
  customizationData?: any,
  user?: any,
  contentType: string = "storytelling",
) {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY
    if (!openaiApiKey) {
      console.log("⚠️ OpenAI API key not found, using fallback")
      return generateFallbackContent(topicTitle, baseStory)
    }

    const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`
    const contentLanguage = customizationData?.content_language || customizationData?.contentLanguage || "English"

    // Create content prompt based on content type
    let contentPrompt = ""
    
    switch (contentType) {
      case "story":
        contentPrompt = `Create a compelling LinkedIn storytelling post based on the topic and user's personal story. Write entirely in ${contentLanguage} language.

**Content Type:** Storytelling Post
**Uniqueness Seed:** ${uniqueId}
**Topic:** ${topicTitle}

**User's Complete Story:**
${baseStory || "Professional story not available"}

**Profile Context:**
- Target Audience: ${customizationData?.target_audience || customizationData?.targetAudience || "professionals"}
- Content Tone: ${customizationData?.content_tone || customizationData?.contentTone || "professional"}
- Content Language: ${contentLanguage}
- Industry: ${user?.industry || "business"}

**Story Elements to Use:**
- Current Work: ${baseStoryData?.currentWork || "Not specified"}
- Biggest Challenge: ${baseStoryData?.biggestChallenge || "Not specified"}
- Turning Point: ${baseStoryData?.turningPoint || "Not specified"}
- Core Values: ${baseStoryData?.coreValues || "Not specified"}
- Unique Approach: ${baseStoryData?.uniqueApproach || "Not specified"}
- Proud Achievement: ${baseStoryData?.proudAchievement || "Not specified"}
- Powerful Lesson: ${baseStoryData?.powerfulLesson || "Not specified"}

**CRITICAL REQUIREMENTS:**
1. Write entirely in ${contentLanguage} language
2. Create a personal story that directly relates to the topic: "${topicTitle}"
3. Start with an engaging opening line from their story
4. Share a specific personal experience or anecdote
5. Include what they learned and how it changed them
6. End with a thought-provoking question or call-to-action
7. Add relevant hashtags in ${contentLanguage} at the end
8. Keep it LinkedIn-appropriate length (1000-1300 characters)
9. Make it personal and authentic to their exact experience
10. DO NOT use any formatting markers like "Hook:", "Personal Story:", "**bold**", or "*asterisks*"
11. Write in plain text without any special formatting or section headers

**Content Structure (internal guidance only, do not include in output):**
- Engaging opening line from their story
- Personal experience/anecdote related to topic
- Insight/lesson learned from experience
- Value/takeaway for others
- Question or call-to-action for engagement
- Hashtags (3-5 relevant hashtags in ${contentLanguage})

Generate the content as a single flowing narrative without any formatting markers or section headers.`

        break

      case "tips":
        contentPrompt = `Create a LinkedIn tips/advice post based on the topic and user's personal story. Write entirely in ${contentLanguage} language.

**Content Type:** Tips/Advice Post
**Uniqueness Seed:** ${uniqueId}
**Topic:** ${topicTitle}

**User's Complete Story:**
${baseStory || "Professional story not available"}

**Profile Context:**
- Target Audience: ${customizationData?.target_audience || customizationData?.targetAudience || "professionals"}
- Content Tone: ${customizationData?.content_tone || customizationData?.contentTone || "professional"}
- Content Language: ${contentLanguage}
- Industry: ${user?.industry || "business"}

**Story Elements to Use:**
- Current Work: ${baseStoryData?.currentWork || "Not specified"}
- Biggest Challenge: ${baseStoryData?.biggestChallenge || "Not specified"}
- Turning Point: ${baseStoryData?.turningPoint || "Not specified"}
- Core Values: ${baseStoryData?.coreValues || "Not specified"}
- Unique Approach: ${baseStoryData?.uniqueApproach || "Not specified"}
- Proud Achievement: ${baseStoryData?.proudAchievement || "Not specified"}
- Powerful Lesson: ${baseStoryData?.powerfulLesson || "Not specified"}

**CRITICAL REQUIREMENTS:**
1. Write entirely in ${contentLanguage} language
2. Create practical tips/advice related to the topic: "${topicTitle}"
3. Start with an engaging opening about the importance of this topic
4. Share 3-5 actionable tips based on their experience
5. Include a brief personal story to illustrate one of the tips
6. End with a call-to-action for engagement
7. Add relevant hashtags in ${contentLanguage} at the end
8. Keep it LinkedIn-appropriate length (1000-1300 characters)
9. Make tips practical and actionable
10. DO NOT use any formatting markers like "Hook:", "Tips:", "**bold**", or "*asterisks*"
11. Write in plain text without any special formatting or section headers
12. DO NOT number the tips with "1.", "2.", etc. - write them naturally in paragraphs

**Content Structure (internal guidance only, do not include in output):**
- Engaging opening about topic importance
- Brief personal story/context
- 3-5 actionable tips woven naturally into the narrative
- Call-to-action for engagement
- Hashtags (3-5 relevant hashtags in ${contentLanguage})

Generate the content as a single flowing narrative without any formatting markers, numbered lists, or section headers.`

        break

      case "insight":
        contentPrompt = `Create a LinkedIn insight/reflection post based on the topic and user's personal story. Write entirely in ${contentLanguage} language.

**Content Type:** Insight/Reflection Post
**Uniqueness Seed:** ${uniqueId}
**Topic:** ${topicTitle}

**User's Complete Story:**
${baseStory || "Professional story not available"}

**Profile Context:**
- Target Audience: ${customizationData?.target_audience || customizationData?.targetAudience || "professionals"}
- Content Tone: ${customizationData?.content_tone || customizationData?.contentTone || "professional"}
- Content Language: ${contentLanguage}
- Industry: ${user?.industry || "business"}

**Story Elements to Use:**
- Current Work: ${baseStoryData?.currentWork || "Not specified"}
- Biggest Challenge: ${baseStoryData?.biggestChallenge || "Not specified"}
- Turning Point: ${baseStoryData?.turningPoint || "Not specified"}
- Core Values: ${baseStoryData?.coreValues || "Not specified"}
- Unique Approach: ${baseStoryData?.uniqueApproach || "Not specified"}
- Proud Achievement: ${baseStoryData?.proudAchievement || "Not specified"}
- Powerful Lesson: ${baseStoryData?.powerfulLesson || "Not specified"}

**CRITICAL REQUIREMENTS:**
1. Write entirely in ${contentLanguage} language
2. Create deep insights/reflections related to the topic: "${topicTitle}"
3. Start with a thought-provoking observation or question
4. Share personal insights and lessons learned
5. Include specific examples from their experience
6. End with a reflection or question for the audience
7. Add relevant hashtags in ${contentLanguage} at the end
8. Keep it LinkedIn-appropriate length (1000-1300 characters)
9. Make it thoughtful and reflective
10. DO NOT use any formatting markers like "Insight:", "Reflection:", "**bold**", or "*asterisks*"
11. Write in plain text without any special formatting or section headers

**Content Structure (internal guidance only, do not include in output):**
- Thought-provoking opening observation/question
- Personal insight/reflection
- Specific examples from experience
- Deeper lesson or realization
- Question for audience reflection
- Hashtags (3-5 relevant hashtags in ${contentLanguage})

Generate the content as a single flowing narrative without any formatting markers or section headers.`

        break

      case "question":
        contentPrompt = `Create a LinkedIn question-driven post based on the topic and user's personal story. Write entirely in ${contentLanguage} language.

**Content Type:** Question-Driven Post
**Uniqueness Seed:** ${uniqueId}
**Topic:** ${topicTitle}

**User's Complete Story:**
${baseStory || "Professional story not available"}

**Profile Context:**
- Target Audience: ${customizationData?.target_audience || customizationData?.targetAudience || "professionals"}
- Content Tone: ${customizationData?.content_tone || customizationData?.contentTone || "professional"}
- Content Language: ${contentLanguage}
- Industry: ${user?.industry || "business"}

**Story Elements to Use:**
- Current Work: ${baseStoryData?.currentWork || "Not specified"}
- Biggest Challenge: ${baseStoryData?.biggestChallenge || "Not specified"}
- Turning Point: ${baseStoryData?.turningPoint || "Not specified"}
- Core Values: ${baseStoryData?.coreValues || "Not specified"}
- Unique Approach: ${baseStoryData?.uniqueApproach || "Not specified"}
- Proud Achievement: ${baseStoryData?.proudAchievement || "Not specified"}
- Powerful Lesson: ${baseStoryData?.powerfulLesson || "Not specified"}

**CRITICAL REQUIREMENTS:**
1. Write entirely in ${contentLanguage} language
2. Create an engaging question-driven post about the topic: "${topicTitle}"
3. Start with a compelling question related to the topic
4. Share personal experience and perspective
5. Ask follow-up questions to encourage discussion
6. End with a call for audience input and engagement
7. Add relevant hashtags in ${contentLanguage} at the end
8. Keep it LinkedIn-appropriate length (1000-1300 characters)
9. Make it conversational and engaging
10. DO NOT use any formatting markers like "Question:", "Discussion:", "**bold**", or "*asterisks*"
11. Write in plain text without any special formatting or section headers

**Content Structure (internal guidance only, do not include in output):**
- Compelling opening question
- Personal experience/perspective
- Follow-up questions for discussion
- Call for audience input
- Hashtags (3-5 relevant hashtags in ${contentLanguage})

Generate the content as a single flowing narrative without any formatting markers or section headers.`

        break

      case "list":
        contentPrompt = `Create a LinkedIn listicle post based on the topic and user's personal story. Write entirely in ${contentLanguage} language.

**Content Type:** Listicle Post
**Uniqueness Seed:** ${uniqueId}
**Topic:** ${topicTitle}

**User's Complete Story:**
${baseStory || "Professional story not available"}

**Profile Context:**
- Target Audience: ${customizationData?.target_audience || customizationData?.targetAudience || "professionals"}
- Content Tone: ${customizationData?.content_tone || customizationData?.contentTone || "professional"}
- Content Language: ${contentLanguage}
- Industry: ${user?.industry || "business"}

**Story Elements to Use:**
- Current Work: ${baseStoryData?.currentWork || "Not specified"}
- Biggest Challenge: ${baseStoryData?.biggestChallenge || "Not specified"}
- Turning Point: ${baseStoryData?.turningPoint || "Not specified"}
- Core Values: ${baseStoryData?.coreValues || "Not specified"}
- Unique Approach: ${baseStoryData?.uniqueApproach || "Not specified"}
- Proud Achievement: ${baseStoryData?.proudAchievement || "Not specified"}
- Powerful Lesson: ${baseStoryData?.powerfulLesson || "Not specified"}

**CRITICAL REQUIREMENTS:**
1. Write entirely in ${contentLanguage} language
2. Create a listicle post about the topic: "${topicTitle}"
3. Start with an engaging introduction about the topic
4. Present 3-7 key points in a clear, scannable format
5. Include personal examples or stories for some points
6. End with a summary or call-to-action
7. Add relevant hashtags in ${contentLanguage} at the end
8. Keep it LinkedIn-appropriate length (1000-1300 characters)
9. Make it easy to scan and digest
10. DO NOT use any formatting markers like "List:", "Points:", "**bold**", or "*asterisks*"
11. Write in plain text without any special formatting or section headers
12. DO NOT number the points with "1.", "2.", etc. - write them naturally in paragraphs

**Content Structure (internal guidance only, do not include in output):**
- Engaging introduction about topic importance
- 3-7 key points woven naturally into the narrative
- Personal examples/stories for some points
- Summary or call-to-action
- Hashtags (3-5 relevant hashtags in ${contentLanguage})

Generate the content as a single flowing narrative without any formatting markers, numbered lists, or section headers.`

        break

      default:
        contentPrompt = `Create engaging LinkedIn content based on the topic and user's personal story. Write entirely in ${contentLanguage} language.

**Uniqueness Seed:** ${uniqueId}
**Topic:** ${topicTitle}

**User's Complete Story:**
${baseStory || "Professional story not available"}

**Profile Context:**
- Target Audience: ${customizationData?.target_audience || customizationData?.targetAudience || "professionals"}
- Content Tone: ${customizationData?.content_tone || customizationData?.contentTone || "professional"}
- Content Goal: ${customizationData?.content_goal || customizationData?.contentGoal || "build authority"}
- Content Language: ${contentLanguage}
- Industry: ${user?.industry || "business"}

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
1. Write entirely in ${contentLanguage} language
2. Create content that directly relates to the topic: "${topicTitle}"
3. Incorporate specific elements and details from the user's story above
4. Make it personal and authentic to their exact experience
5. Use ${customizationData?.content_tone || "professional"} tone
6. Target ${customizationData?.target_audience || "professionals"} audience
7. Include a compelling opening that references their story
8. Add relevant hashtags in ${contentLanguage} at the end
9. Make it engaging and encourage comments
10. Keep it LinkedIn-appropriate length (1000-1300 characters)
11. Include a call-to-action or question for engagement
12. Reference specific people, events, or situations from their story
13. DO NOT use any formatting markers like "Hook:", "Story:", "**bold**", or "*asterisks*"
14. Write in plain text without any special formatting or section headers

**Content Structure (internal guidance only, do not include in output):**
- Engaging opening line from their story
- Personal experience/anecdote related to topic
- Insight/lesson learned from experience
- Value/takeaway for others
- Question or call-to-action for engagement
- Hashtags (3-5 relevant hashtags in ${contentLanguage})

Generate the content as a single flowing narrative without any formatting markers or section headers.`

        break
    }

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
            content: `You are an expert LinkedIn content creator who writes engaging, personal, and valuable posts that drive engagement and build authority. Always write in ${contentLanguage} language and incorporate the user's personal story elements.`,
          },
          {
            role: "user",
            content: contentPrompt,
          },
        ],
        max_tokens: 800,
        temperature: 0.7,
        presence_penalty: 0.6,
        frequency_penalty: 0.3,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      const content = data.choices[0]?.message?.content

      if (content && content.trim().length > 0) {
        console.log("✅ Generated content with OpenAI")
        return content.trim()
      }
    }

    return generateFallbackContent(topicTitle, baseStory)
  } catch (error) {
    console.error("OpenAI API error:", error)
    return generateFallbackContent(topicTitle, baseStory)
  }
}

function generateFallbackContent(topicTitle: string, baseStory?: string) {
  const timestamp = new Date().toLocaleString()
  const uniqueId = Math.floor(Math.random() * 10000)

  return `🚀 ${topicTitle}

${
  baseStory
    ? `From my journey: ${baseStory.substring(0, 200)}...`
    : "Every professional journey has its unique challenges and victories."
}

Here's what I've learned:
✅ Authenticity beats perfection every time
✅ Challenges are opportunities in disguise  
✅ Sharing experiences helps others grow

What's been your biggest learning in your professional journey?

#ProfessionalGrowth #Leadership #CareerDevelopment #Authenticity #Success

Generated: ${timestamp} | ID: ${uniqueId}`
}
