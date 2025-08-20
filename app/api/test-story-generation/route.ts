import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { baseStoryData, customizationData } = await request.json()

    // Test the enhanced story generation
    const generatedStory = await generateEnhancedStoryWithOpenAI(
      baseStoryData,
      customizationData,
      null,
      null
    )
    
    return NextResponse.json({
      success: true,
      baseStoryData: baseStoryData,
      customizationData: customizationData,
      generatedStory: generatedStory,
      message: "Story generated successfully!"
    })

  } catch (error) {
    console.error('Error testing story generation:', error)
    return NextResponse.json(
      { 
        error: 'Failed to test story generation',
        code: 'TEST_ERROR'
      },
      { status: 500 }
    )
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

function generateFallbackStory(baseStoryData: any): string {
  // Return empty string instead of default content
  return ""
}
