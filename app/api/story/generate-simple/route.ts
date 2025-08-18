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

    // Validate required data
    if (!baseStoryData) {
      return NextResponse.json({ error: "Missing baseStoryData" }, { status: 400 })
    }

    if (!customizationData) {
      return NextResponse.json({ error: "Missing customizationData" }, { status: 400 })
    }

    await connectDB()
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log("📦 Generating simple story for user:", user._id.toString())
    console.log("📝 Base Story Data:", baseStoryData)
    console.log("🎨 Customization Data:", customizationData)

    // Delete any existing generating stories for this user
    await GeneratedStory.deleteMany({
      userId: user._id,
      status: "generating",
    })

    // Generate story immediately
    const generatedStory = await generateStoryLocally(baseStoryData, customizationData)

    // Create a story record
    const storyRecord = new GeneratedStory({
      userId: user._id,
      baseStoryData,
      customizationData,
      generatedStory,
      status: "generated",
      generatedTopics: generateSampleTopics(),
    })
    await storyRecord.save()

    console.log("✅ Story generated successfully")

    return NextResponse.json({
      success: true,
      storyId: storyRecord._id.toString(),
      message: "Story generated successfully!",
      status: "generated",
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
    console.error("❌ Error in simple story generation:", error)
    return NextResponse.json({ error: "Failed to generate story" }, { status: 500 })
  }
}

async function generateStoryLocally(baseStoryData: any, customizationData: any) {
  try {
    // Extract base story information
    const {
      earlyLife = "your early life experiences",
      firstDream = "your childhood dreams",
      firstJob = "your first professional experience",
      careerRealization = "your career realization",
      biggestChallenge = "your biggest challenge",
      almostGaveUp = "moments of doubt",
      turningPoint = "your turning point",
      mentor = "your mentors",
      currentWork = "your current work",
      uniqueApproach = "your unique approach",
      proudAchievement = "your achievements",
      industryMisconception = "industry insights",
      powerfulLesson = "key lessons learned",
      coreValues = "your values",
      desiredImpact = "your desired impact"
    } = baseStoryData

    // Extract customization preferences
    const {
      target_audience = "professionals",
      content_tone = "professional",
      content_goal = "build authority",
      writing_style = "engaging",
      content_length = "medium",
      engagement_style = "conversational",
      personal_anecdotes = "include",
      content_differentiation = "unique perspective"
    } = customizationData

    // Generate tone-appropriate story
    let story = ""
    
    if (content_tone === "professional") {
      story = `# Professional Brand Story: ${baseStoryData.name || "Your Name"}

## Executive Summary
With ${baseStoryData.experience || "extensive experience"} in ${baseStoryData.industry || "the industry"}, I've developed a unique approach to ${currentWork} that combines strategic thinking with practical execution.

## Career Foundation
${earlyLife} shaped my professional perspective. From ${firstDream}, I understood the importance of ${powerfulLesson}. My journey began with ${firstJob}, where I learned fundamental principles that continue to guide my work today.

## Key Milestones
${careerRealization} marked a pivotal moment in my career. This realization led me to focus on ${currentWork}, where I could leverage ${uniqueApproach} to create meaningful impact for ${target_audience}.

## Overcoming Adversity
Every successful career faces challenges. ${biggestChallenge} tested my resilience and problem-solving abilities. There were moments when ${almostGaveUp}, but ${turningPoint} provided the clarity needed to move forward. The guidance from ${mentor} was instrumental in this transformation.

## Professional Achievements
My proudest accomplishment is ${proudAchievement}, which demonstrates the effectiveness of ${uniqueApproach}. I've learned that ${industryMisconception} - this insight has become a cornerstone of my professional philosophy.

## Current Mission
Guided by ${coreValues}, I'm committed to ${desiredImpact}. My ${content_tone} approach enables me to connect with ${target_audience} and achieve my goal to ${content_goal}.

## Value Proposition
This story represents more than personal achievement - it's about the value I bring to ${target_audience} and the collaborative success we can achieve together. Every interaction reflects this authentic journey and the principles that drive my professional approach.

---

*This narrative serves as the foundation for all professional communications, ensuring consistency and authenticity in every engagement.*`
    } else if (content_tone === "personal") {
      story = `# My Personal Journey: ${baseStoryData.name || "Your Name"}

## The Beginning
${earlyLife} taught me that life is about more than just work - it's about purpose. From ${firstDream}, I knew I wanted to make a difference, but I wasn't sure how.

## Finding My Path
${firstJob} was my first real taste of the professional world. It wasn't perfect, but it taught me ${powerfulLesson}. Then came ${careerRealization} - that moment when everything clicked and I understood what I was meant to do.

## The Challenge That Changed Everything
${biggestChallenge} almost broke me. There were times when ${almostGaveUp}, when I questioned everything. But ${turningPoint} showed me that the hardest moments often lead to the greatest growth.

## The People Who Believed in Me
${mentor} saw something in me that I couldn't see in myself. Their guidance helped me understand that ${uniqueApproach} wasn't just a method - it was my authentic way of making a difference.

## What I'm Most Proud Of
${proudAchievement} isn't just about success - it's about proving that ${industryMisconception} and showing that there's always a better way.

## My Mission Today
I'm driven by ${coreValues} and committed to ${desiredImpact}. I want to help ${target_audience} understand that ${content_goal} is possible for everyone.

## The Real Story
This isn't just my story - it's about the people I've met, the lessons I've learned, and the difference we can all make together. Every day, I'm reminded that ${powerfulLesson}, and I'm grateful for the journey that brought me here.

---

*This is my truth, my journey, and my commitment to making a difference.*`
    } else {
      // Casual tone
      story = `# Hey, I'm ${baseStoryData.name || "Your Name"} 👋

## Here's My Story
${earlyLife} was pretty wild, and ${firstDream} seemed impossible at the time. But you know what? ${firstJob} taught me ${powerfulLesson}, and that changed everything.

## The Lightbulb Moment
${careerRealization} hit me like a ton of bricks. I realized that ${currentWork} was where I belonged, and ${uniqueApproach} was my superpower.

## The Tough Times
${biggestChallenge} was rough. Like, really rough. There were days when ${almostGaveUp}, but then ${turningPoint} happened and everything started making sense. Shoutout to ${mentor} for keeping me sane during all of this!

## The Wins
${proudAchievement} is what I'm most proud of. It proved that ${industryMisconception} and showed me that I was on the right track.

## What Drives Me Now
${coreValues} guide everything I do. I'm all about ${desiredImpact} and helping ${target_audience} ${content_goal}. It's not just about me anymore - it's about the community we're building together.

## The Bottom Line
This journey has taught me that ${powerfulLesson}. Whether you're just starting out or you've been at this for years, remember that your story matters and your voice can make a difference.

---

*Thanks for reading my story. Let's connect and make something awesome together!*`
    }

    return story
  } catch (error) {
    console.error("Local story generation error:", error)
    return `# Your Brand Story

Thank you for sharing your journey with us. Your story is unique and powerful, shaped by your experiences and driven by your vision for the future.

From your early experiences to your current work, every step has contributed to who you are today. Your challenges have made you stronger, your mentors have guided you, and your values continue to drive you forward.

This is the foundation of your brand story - authentic, personal, and meaningful. Use this as a starting point to share your message with the world.

*Your story matters. Your voice matters. Your impact matters.*`
  }
}

function generateSampleTopics() {
  return [
    {
      id: `topic-${Date.now()}-1`,
      title: "5 Lessons I Learned from My Biggest Career Challenge",
      status: "pending",
    },
    {
      id: `topic-${Date.now()}-2`,
      title: "Why Your First Job Teaches You More Than Any Degree",
      status: "pending",
    },
    {
      id: `topic-${Date.now()}-3`,
      title: "The Mentor Who Changed My Perspective on Success",
      status: "pending",
    },
    {
      id: `topic-${Date.now()}-4`,
      title: "How I Turned My Biggest Failure into My Greatest Strength",
      status: "pending",
    },
    {
      id: `topic-${Date.now()}-5`,
      title: "The Industry Myth That's Holding You Back",
      status: "pending",
    },
  ]
}
