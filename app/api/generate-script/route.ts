import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

export async function POST(req: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { baseStory, customization } = await req.json()

    // Generate script based on base story and customization
    const script = generateBrandScript(baseStory, customization)

    return NextResponse.json({
      success: true,
      script,
    })
  } catch (error) {
    console.error("Error generating script:", error)
    return NextResponse.json({ error: "Failed to generate script" }, { status: 500 })
  }
}

function generateBrandScript(baseStory: any, customization: any) {
  // Create a comprehensive brand script based on the story and preferences
  return `
# Your Brand Story Script

## Background & Journey
From ${baseStory.earlyLife || "your early experiences"} to ${baseStory.currentWork || "where you are today"}, your journey has been shaped by ${baseStory.biggestChallenge || "significant challenges"} and guided by ${baseStory.coreValues || "your core values"}.

## Your Unique Approach
What sets you apart: ${baseStory.uniqueApproach || "Your distinctive methodology and perspective"}

## Target Audience & Tone
You serve ${customization.target_audience || "your ideal clients"} with a ${customization.content_tone || "professional"} tone, focusing on ${customization.content_goal || "building authority"}.

## Content Strategy
- Writing Style: ${customization.writing_style || "Informative"}
- Content Length: ${customization.content_length || "Medium-form"}
- Posting Frequency: ${customization.posting_frequency || "Weekly"}
- Formats: ${customization.content_formats?.join(", ") || "Mixed content"}

## Key Messages
1. ${baseStory.powerfulLesson || "Your most important lesson learned"}
2. ${baseStory.industryMisconception || "Industry insights you challenge"}
3. ${baseStory.desiredImpact || "The impact you want to create"}

## Personal Touch
${customization.personal_anecdotes === "Yes" ? "Include personal stories and experiences" : "Focus on professional insights"} with ${customization.engagement_style || "balanced engagement"}.

This script serves as your content creation foundation, ensuring consistency across all your communications.
  `.trim()
}
