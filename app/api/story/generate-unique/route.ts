import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import GeneratedStory from "@/models/GeneratedStory"

export async function POST(req: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { baseStoryData, customizationData } = await req.json()

    if (!baseStoryData || !customizationData) {
      return NextResponse.json({ error: "Base story and customization data required" }, { status: 400 })
    }

    await connectDB()
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log("🔍 Generating unique story for user:", user._id.toString())

    // Create unique prompt for ChatGPT with timestamp and random elements
    const storyPrompt = createUniqueStoryPrompt(baseStoryData, customizationData)

    // Generate story with ChatGPT
    const generatedStory = await generateUniqueStoryWithChatGPT(storyPrompt)

    // Generate 5 related topics with uniqueness
    const relatedTopics = await generateRelatedTopics(baseStoryData, customizationData, generatedStory)

    // Create story document
    const storyDoc = {
      userId: user._id,
      baseStoryData,
      customizationData,
      generatedStory,
      status: "generated",
      generatedTopics: relatedTopics.map((title: string, index: number) => ({
        id: `topic-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
        title,
        status: "pending",
      })),
    }

    // Find existing story or create new one
    let story = await GeneratedStory.findOne({ userId: user._id })

    if (story) {
      // Update existing story
      story = await GeneratedStory.findOneAndUpdate({ userId: user._id }, storyDoc, { new: true })
      console.log("✅ Updated existing story:", story._id.toString())
    } else {
      // Create new story
      story = await GeneratedStory.create(storyDoc)
      console.log("✅ Created new story:", story._id.toString())
    }

    return NextResponse.json({
      success: true,
      story: {
        _id: story._id.toString(),
        status: story.status,
        generatedStory: story.generatedStory,
        generatedTopics: story.generatedTopics,
        baseStoryData: story.baseStoryData,
        customizationData: story.customizationData,
        createdAt: story.createdAt,
        updatedAt: story.updatedAt,
      },
    })
  } catch (error) {
    console.error("Error generating unique story:", error)
    return NextResponse.json({ error: "Failed to generate unique story" }, { status: 500 })
  }
}

function createUniqueStoryPrompt(baseStoryData: any, customizationData: any) {
  const timestamp = Date.now()
  const randomSeed = Math.floor(Math.random() * 10000)
  const uniqueId = `${timestamp}-${randomSeed}`

  return `Create a completely unique and compelling professional story. Use this uniqueness seed: ${uniqueId}

**IMPORTANT: Make this story different from any previous versions by:**
- Using fresh perspectives and unique angles
- Incorporating different storytelling techniques
- Adding creative elements and metaphors
- Varying the narrative structure
- Including unexpected insights

**Base Story Elements:**
- Early Life: ${baseStoryData.earlyLife || "Not provided"}
- First Dream: ${baseStoryData.firstDream || "Not provided"}
- First Job: ${baseStoryData.firstJob || "Not provided"}
- Career Realization: ${baseStoryData.careerRealization || "Not provided"}
- Biggest Challenge: ${baseStoryData.biggestChallenge || "Not provided"}
- Almost Gave Up: ${baseStoryData.almostGaveUp || "Not provided"}
- Turning Point: ${baseStoryData.turningPoint || "Not provided"}
- Mentor: ${baseStoryData.mentor || "Not provided"}
- Current Work: ${baseStoryData.currentWork || "Not provided"}
- Unique Approach: ${baseStoryData.uniqueApproach || "Not provided"}
- Proud Achievement: ${baseStoryData.proudAchievement || "Not provided"}
- Industry Misconception: ${baseStoryData.industryMisconception || "Not provided"}
- Powerful Lesson: ${baseStoryData.powerfulLesson || "Not provided"}
- Core Values: ${baseStoryData.coreValues || "Not provided"}
- Desired Impact: ${baseStoryData.desiredImpact || "Not provided"}

**Customization Preferences:**
- Content Language: ${customizationData.content_language || "English"}
- Target Audience: ${customizationData.target_audience || "Professionals"}
- Audience Age: ${customizationData.audience_age || "25-34"}
- Content Goal: ${customizationData.content_goal || "Build Authority"}
- Content Tone: ${customizationData.content_tone || "Professional"}
- Content Length: ${customizationData.content_length || "Medium"}
- Content Differentiation: ${customizationData.content_differentiation || "Balanced"}

**Requirements:**
1. Create a UNIQUE narrative that hasn't been told before
2. Use ${customizationData.content_tone || "professional"} tone throughout
3. Target ${customizationData.target_audience || "professionals"} audience
4. Focus on ${customizationData.content_goal || "building authority"}
5. Write in ${customizationData.content_language || "English"} language
6. Make it ${customizationData.content_length || "medium"} length
7. Be ${customizationData.content_differentiation || "balanced"} in approach
8. Include specific details and examples from the base story
9. Create emotional connection with readers
10. End with a powerful message or call to action
11. Make it authentic and relatable
12. Ensure it's engaging and memorable

Generate a completely fresh story that stands out and captures attention from the first sentence. Each generation should be different and unique.`
}

async function generateUniqueStoryWithChatGPT(prompt: string) {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY
    if (!openaiApiKey) {
      console.log("⚠️ OpenAI API key not found, using fallback")
      return generateFallbackStory()
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
            content:
              "You are a professional storyteller who creates unique, compelling personal and professional narratives. Each story you create must be completely different, engaging, and authentic. Never repeat the same story structure or content.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 1500,
        temperature: 0.9, // High temperature for maximum creativity and uniqueness
        presence_penalty: 0.8, // Strongly encourage new topics
        frequency_penalty: 0.6, // Reduce repetition significantly
        top_p: 0.95, // Use nucleus sampling for more diverse outputs
      }),
    })

    if (!response.ok) {
      console.error("OpenAI API error:", response.status)
      return generateFallbackStory()
    }

    const data = await response.json()
    const generatedStory = data.choices[0].message.content

    console.log("✅ Story generated with ChatGPT")
    return generatedStory
  } catch (error) {
    console.error("ChatGPT API error:", error)
    return generateFallbackStory()
  }
}

function generateFallbackStory() {
  const timestamp = new Date().toLocaleString()
  const randomElements = [
    "journey of discovery",
    "path of transformation",
    "adventure of growth",
    "story of resilience",
    "tale of innovation",
    "narrative of success",
    "chronicle of change",
    "saga of determination",
  ]

  const randomElement = randomElements[Math.floor(Math.random() * randomElements.length)]
  const uniqueId = Math.floor(Math.random() * 10000)

  return `This is my unique professional ${randomElement} (Generated: ${timestamp} - ID: ${uniqueId}).

From my early experiences, I've learned that every challenge is an opportunity waiting to be discovered. My path hasn't been conventional, but that's exactly what makes it uniquely mine.

The defining moment came when I realized that success isn't just about reaching the destination—it's about the meaningful impact you create along the way. Today, I'm passionate about helping others discover their own unique paths and unlock their hidden potential.

What sets my approach apart? I believe in authentic storytelling, building genuine connections, and creating lasting value that inspires others. Every day, I work towards building something meaningful that will empower the next generation of professionals.

My mission is clear: to demonstrate that with the right mindset, unwavering dedication, and the courage to be different, anyone can write their own success story.

This story represents my unique perspective and experiences as of ${timestamp}.

#UniqueJourney #ProfessionalGrowth #Inspiration #Authenticity`
}

async function generateRelatedTopics(baseStoryData: any, customizationData: any, generatedStory: string) {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY
    if (!openaiApiKey) {
      return generateStoryRelatedFallbackTopics(baseStoryData, customizationData, generatedStory)
    }

    const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`
    const topicPrompt = `Based on this EXACT professional story, generate exactly 5 content topics that are DIRECTLY related to the story content. Each topic should extract specific elements from the story.

**Uniqueness Seed:** ${uniqueId}

**Generated Story:**
${generatedStory}

**Profile Context:**
- Target Audience: ${customizationData.target_audience || "professionals"}
- Content Tone: ${customizationData.content_tone || "professional"}
- Content Goal: ${customizationData.content_goal || "build authority"}
- Content Language: ${customizationData.content_language || "English"}

**CRITICAL REQUIREMENTS:**
1. Generate exactly 5 topics
2. Each topic MUST be directly related to specific elements in the story above
3. Extract specific details, challenges, lessons, or moments from the story
4. Topics should reference actual events, people, or insights mentioned in the story
5. Make topics personal and authentic to this specific story
6. Avoid generic topics - they must be story-specific
7. Topics should encourage engagement and discussion
8. Each topic should be actionable and relatable

**Examples of good story-related topics:**
- If story mentions "mentor John taught me X" → "The One Lesson My Mentor John Taught Me That Changed Everything"
- If story mentions "failed project in 2020" → "How My Biggest Failure in 2020 Became My Greatest Learning"
- If story mentions "started with $500" → "Starting My Business With Just $500: What I Learned"

Return only the topic titles, one per line, without numbering or bullet points. Make sure each topic directly references something from the story above.`

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
            role: "user",
            content: topicPrompt,
          },
        ],
        max_tokens: 400,
        temperature: 0.9, // High temperature for uniqueness
        presence_penalty: 0.8,
        frequency_penalty: 0.6,
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
          .slice(0, 5) // Ensure exactly 5 topics

        if (topics.length === 5) {
          console.log("✅ Generated unique topics with ChatGPT")
          return topics
        }
      }
    }

    return generateStoryRelatedFallbackTopics(baseStoryData, customizationData, generatedStory)
  } catch (error) {
    console.error("Error generating related topics:", error)
    return generateStoryRelatedFallbackTopics(baseStoryData, customizationData, generatedStory)
  }
}

function generateStoryRelatedFallbackTopics(baseStoryData: any, customizationData: any, generatedStory: string) {
  const timestamp = Date.now()
  const randomSeed = Math.floor(Math.random() * 1000)

  // Extract key elements from the story to create story-related topics
  const storyElements = {
    currentWork: baseStoryData.currentWork || "professional work",
    biggestChallenge: baseStoryData.biggestChallenge || "challenges",
    mentor: baseStoryData.mentor || "mentor",
    turningPoint: baseStoryData.turningPoint || "turning point",
    proudAchievement: baseStoryData.proudAchievement || "achievement",
    coreValues: baseStoryData.coreValues || "values",
    uniqueApproach: baseStoryData.uniqueApproach || "approach",
    powerfulLesson: baseStoryData.powerfulLesson || "lesson",
    earlyLife: baseStoryData.earlyLife || "early experiences",
    firstJob: baseStoryData.firstJob || "first job"
  }

  // Create story-specific topic templates based on actual story elements
  const storyRelatedTemplates = [
    `The Biggest Challenge in My ${storyElements.currentWork} Journey`,
    `How My ${storyElements.mentor} Taught Me the Most Important Lesson`,
    `The ${storyElements.turningPoint} That Changed Everything`,
    `Why I'm Proud of My ${storyElements.proudAchievement}`,
    `How My ${storyElements.uniqueApproach} Sets Me Apart`,
    `The ${storyElements.powerfulLesson} That Shapes My Decisions`,
    `What My ${storyElements.earlyLife} Taught Me About Success`,
    `The ${storyElements.firstJob} That Started It All`,
    `How I Overcame ${storyElements.biggestChallenge}`,
    `Why My ${storyElements.coreValues} Matter in Everything I Do`
  ]

  // Create unique selection based on timestamp and random seed
  const shuffledTopics = storyRelatedTemplates
    .map((topic, index) => ({
      topic,
      score: (timestamp + randomSeed + index * 7) % storyRelatedTemplates.length,
    }))
    .sort((a, b) => a.score - b.score)
    .map((item) => item.topic)
    .slice(0, 5)

  console.log(`✅ Generated story-related fallback topics with uniqueness seed: ${timestamp}-${randomSeed}`)
  return shuffledTopics
}

function generateFallbackTopics(baseStoryData: any, customizationData: any) {
  const timestamp = Date.now()
  const randomSeed = Math.floor(Math.random() * 1000)

  const topicTemplates = [
    "The Moment Everything Changed: My Career Turning Point",
    "Why I Almost Gave Up (And What Kept Me Going)",
    "The Biggest Lesson My Mentor Taught Me",
    "How I Turned My Greatest Challenge Into My Biggest Strength",
    "What I Wish I Knew When I Started My Professional Journey",
    "The Decision That Transformed My Career Path",
    "How I Built Confidence in My Professional Life",
    "The Mistake That Taught Me the Most Valuable Lesson",
    "Why Authenticity Matters More Than Perfection",
    "The Habit That Changed My Professional Game",
    "How I Overcame Imposter Syndrome in My Field",
    "The Network Connection That Changed Everything",
    "Why I Believe in Taking Calculated Risks",
    "The Project That Pushed Me Out of My Comfort Zone",
    "How I Stay Motivated During Challenging Times",
  ]

  // Create unique selection based on timestamp and random seed
  const shuffledTopics = topicTemplates
    .map((topic, index) => ({
      topic,
      score: (timestamp + randomSeed + index * 7) % topicTemplates.length,
    }))
    .sort((a, b) => a.score - b.score)
    .map((item) => item.topic)
    .slice(0, 5)

  console.log(`✅ Generated fallback topics with uniqueness seed: ${timestamp}-${randomSeed}`)
  return shuffledTopics
}
