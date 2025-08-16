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

    await connectDB()
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get request data
    const { baseStoryData, customizationData } = await req.json()

    // Generate story using simple template
    const story = generateBasicStory(baseStoryData, customizationData)

    // Save to database
    const storyRecord = new GeneratedStory({
      userId: user._id,
      status: "generated",
      generatedStory: story,
      baseStoryData: baseStoryData,
      customizationData: customizationData,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    await storyRecord.save()

    return NextResponse.json({
      success: true,
      story: {
        _id: storyRecord._id.toString(),
        status: storyRecord.status,
        generatedStory: storyRecord.generatedStory,
        baseStoryData: storyRecord.baseStoryData,
        customizationData: storyRecord.customizationData,
        createdAt: storyRecord.createdAt,
        updatedAt: storyRecord.updatedAt,
      },
    })
  } catch (error) {
    console.error("Error generating basic story:", error)
    return NextResponse.json({ error: "Failed to generate story" }, { status: 500 })
  }
}

function generateBasicStory(baseStory: any, customization: any) {
  // Extract base story elements
  const {
    name = "Professional",
    industry = "business",
    experience = "10 years",
    achievement = "successful projects",
    challenge = "complex problems",
    learning = "continuous improvement",
    goal = "help others grow"
  } = baseStory

  // Extract customization preferences
  const {
    tone = "professional",
    length = "medium",
    audience = "professionals",
    focus = "career journey"
  } = customization

  // Create story based on tone and length
  let story = ""

  if (tone === "professional") {
    story = `# Professional Journey: ${name}'s Path to Success

## Introduction
With over ${experience} in the ${industry} sector, I've had the privilege of working on ${achievement} that have shaped my understanding of what it takes to succeed in today's competitive landscape.

## Key Challenges
Throughout my career, I've faced ${challenge} that tested my resilience and problem-solving abilities. These experiences have been instrumental in developing my approach to ${learning}.

## Achievements
My most significant accomplishment has been ${achievement}, which demonstrated the importance of strategic thinking and collaborative effort in achieving organizational goals.

## Current Focus
Today, my mission is to ${goal} by sharing insights and experiences that can benefit ${audience} in their own professional development.

## Looking Forward
I believe in the power of ${learning} and am committed to helping others navigate their career paths with confidence and purpose.`
  } else if (tone === "personal") {
    story = `# My Story: A Personal Journey

## How It All Started
My name is ${name}, and I've spent ${experience} working in ${industry}. It's been quite a journey filled with ups and downs, but every experience has taught me something valuable.

## The Tough Times
I've faced my share of ${challenge}, and honestly, there were moments when I wondered if I was on the right path. But looking back, those difficult times were actually the moments that shaped me the most.

## What I'm Proud Of
${achievement} stands out as something I'm really proud of. It wasn't just about the success itself, but about the team effort and the lessons learned along the way.

## What Drives Me
These days, I'm focused on ${goal}. I want to help ${audience} avoid some of the mistakes I made and find their own path to success.

## My Philosophy
I've learned that ${learning} is the key to staying relevant and fulfilled in your career. It's not always easy, but it's always worth it.`
  } else {
    // Casual tone
    story = `# Hey there! Here's my story...

## The Beginning
So, I'm ${name}, and I've been in the ${industry} game for about ${experience}. Crazy how time flies, right?

## The Real Talk
Let me be honest - it hasn't always been smooth sailing. I've dealt with ${challenge} that really tested my limits. But you know what? Those tough times were actually the best teachers.

## The Wins
${achievement} is probably what I'm most proud of. It wasn't just about hitting targets - it was about the people, the process, and everything I learned along the way.

## What I'm Up To Now
Right now, I'm all about ${goal}. I want to help ${audience} figure out their own path and maybe avoid some of the bumps I hit along the way.

## My Take
Here's what I've learned: ${learning} is everything. Stay curious, stay hungry, and never stop growing. That's the secret sauce.`
  }

  // Add length variations
  if (length === "short") {
    story = story.split('\n\n').slice(0, 3).join('\n\n') + '\n\n*This is a brief overview of my professional journey.*'
  } else if (length === "long") {
    story += `

## Additional Insights
Based on my experience in ${industry}, I've developed several key principles that guide my work:

1. **Continuous Learning**: The industry is always evolving, so staying updated is crucial
2. **Collaboration**: Success is rarely achieved alone - teamwork is essential
3. **Adaptability**: Being flexible and open to change has been key to my growth
4. **Mentorship**: Both giving and receiving guidance has been invaluable

## Future Vision
Looking ahead, I'm excited about the opportunities to ${goal} and contribute to the growth of ${audience} in meaningful ways.

*This story reflects my journey in ${industry} and my commitment to ${learning}.*`
  }

  return story
}
