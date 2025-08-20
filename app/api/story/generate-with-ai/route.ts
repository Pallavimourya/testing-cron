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

    console.log("🔍 Generating AI story for user:", user._id.toString())

    // Create the prompt for ChatGPT
    const prompt = createStoryPrompt(baseStoryData, customizationData)
    
    // Call ChatGPT API
    const story = await generateStoryWithChatGPT(prompt, baseStoryData)

    // Find existing story or create new one
    let existingStory = await GeneratedStory.findOne({ userId: user._id })
    
    if (existingStory) {
      // Update existing story
      existingStory = await GeneratedStory.findOneAndUpdate(
        { userId: user._id },
        {
          baseStoryData,
          customizationData,
          generatedStory: story,
          status: "generated",
          updatedAt: new Date()
        },
        { new: true }
      )
      console.log("✅ Updated existing story:", existingStory._id.toString())
    } else {
      // Create new story
      existingStory = await GeneratedStory.create({
        userId: user._id,
        baseStoryData,
        customizationData,
        generatedStory: story,
        status: "generated"
      })
      console.log("✅ Created new story:", existingStory._id.toString())
    }

    return NextResponse.json({
      success: true,
      story: {
        _id: existingStory._id.toString(),
        status: existingStory.status,
        generatedStory: existingStory.generatedStory,
        baseStoryData: existingStory.baseStoryData,
        customizationData: existingStory.customizationData,
        createdAt: existingStory.createdAt,
        updatedAt: existingStory.updatedAt,
      },
    })
  } catch (error) {
    console.error("Error generating story:", error)
    return NextResponse.json({ error: "Failed to generate story" }, { status: 500 })
  }
}

function createStoryPrompt(baseStoryData: any, customizationData: any) {
  const { name, industry, experience, achievement, challenge, learning, goal } = baseStoryData
  const { tone, length, audience, focus } = customizationData

  return `Create a professional story based on the following details:

**Base Story Data:**
- Name: ${name}
- Industry: ${industry}
- Experience: ${experience}
- Achievement: ${achievement}
- Challenge: ${challenge}
- Learning: ${learning}
- Goal: ${goal}

**Customization Preferences:**
- Tone: ${tone}
- Length: ${length}
- Target Audience: ${audience}
- Focus Area: ${focus}

Please create a compelling professional story that:
1. Uses a ${tone} tone
2. Is ${length} in length
3. Targets ${audience} audience
4. Focuses on ${focus}
5. Incorporates all the base story elements naturally
6. Sounds authentic and personal
7. Is suitable for LinkedIn or professional networking

Make it engaging and memorable while maintaining professionalism.`
}

async function generateStoryWithChatGPT(prompt: string, baseStoryData: any) {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a professional story writer who creates compelling personal and professional narratives for LinkedIn and networking purposes."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  } catch (error) {
    console.error("ChatGPT API error:", error)
    // Fallback story if ChatGPT fails
    return `I am ${baseStoryData.name}, a ${baseStoryData.experience} professional in the ${baseStoryData.industry} industry. Throughout my career, I've learned that ${baseStoryData.learning} is crucial for success. My biggest achievement has been ${baseStoryData.achievement}, which taught me valuable lessons about ${baseStoryData.challenge}. My goal is to ${baseStoryData.goal} and help others grow in their professional journey.`
  }
}
