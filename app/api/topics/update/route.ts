import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import Topic from "@/models/Topic"
import GeneratedStory from "@/models/GeneratedStory"

export async function POST(request: Request) {
  try {
    const session = await getServerSession()
    
    // Check for both email and id in session
    if (!session?.user?.email && !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { topicId, status } = await request.json()
    if (!topicId || !status) {
      return NextResponse.json({ error: "Topic ID and status are required" }, { status: 400 })
    }

    if (!["approved", "dismissed", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

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

    if (status === "dismissed") {
      // Delete the dismissed topic
      const deletedTopic = await Topic.findOneAndDelete({
        id: topicId,
        userId: user._id,
      })

      if (!deletedTopic) {
        return NextResponse.json({ error: "Topic not found" }, { status: 404 })
      }

      console.log(`🗑️ Deleted dismissed topic: ${topicId}`)

      // Get current topic count after deletion
      const currentTopicCount = await Topic.countDocuments({
        userId: user._id,
        status: { $in: ["pending", "approved"] },
      })

      // Generate replacement topic if under limit
      if (currentTopicCount < 30) {
        try {
          await generateReplacementTopic(user._id, deletedTopic.storyId)
          console.log("✅ Generated replacement topic")

          return NextResponse.json({
            success: true,
            message: "Topic dismissed and replacement generated",
            currentCount: currentTopicCount + 1,
            maxLimit: 30,
            replacementGenerated: true,
          })
        } catch (error) {
          console.error("Error generating replacement topic:", error)
          return NextResponse.json({
            success: true,
            message: "Topic dismissed",
            currentCount: currentTopicCount,
            maxLimit: 30,
            replacementGenerated: false,
          })
        }
      }

      return NextResponse.json({
        success: true,
        message: "Topic dismissed",
        currentCount: currentTopicCount,
        maxLimit: 30,
        replacementGenerated: false,
      })
    } else if (status === "approved") {
      // Check if user has reached the limit
      const currentTopicCount = await Topic.countDocuments({
        userId: user._id,
        status: { $in: ["pending", "approved"] },
      })

      if (currentTopicCount >= 30) {
        return NextResponse.json(
          {
            error: "You have reached the maximum limit of 30 topics. Please dismiss some topics first.",
            currentCount: currentTopicCount,
            maxLimit: 30,
          },
          { status: 400 },
        )
      }

      // Find and update the topic
      const topic = await Topic.findOneAndUpdate(
        { id: topicId, userId: user._id },
        {
          status,
          updatedAt: new Date(),
        },
        { new: true },
      )

      if (!topic) {
        return NextResponse.json({ error: "Topic not found" }, { status: 404 })
      }

      console.log(`✅ Approved topic: ${topicId}`)

      return NextResponse.json({
        success: true,
        message: "Topic approved and added to Topic Bank",
        currentCount: currentTopicCount,
        maxLimit: 30,
      })
    } else if (status === "rejected") {
      // Find and update the topic
      const topic = await Topic.findOneAndUpdate(
        { id: topicId, userId: user._id },
        {
          status,
          updatedAt: new Date(),
        },
        { new: true },
      )

      if (!topic) {
        return NextResponse.json({ error: "Topic not found" }, { status: 404 })
      }

      console.log(`✅ Rejected topic: ${topicId}`)

      return NextResponse.json({
        success: true,
        message: "Topic rejected",
        topic: {
          id: topic.id,
          title: topic.title,
          status: topic.status,
          updatedAt: topic.updatedAt,
        },
      })
    } else if (status === "pending") {
      // Find and update the topic
      const topic = await Topic.findOneAndUpdate(
        { id: topicId, userId: user._id },
        {
          status,
          updatedAt: new Date(),
        },
        { new: true },
      )

      if (!topic) {
        return NextResponse.json({ error: "Topic not found" }, { status: 404 })
      }

      console.log(`✅ Updated topic ${topicId} status to ${status}`)

      return NextResponse.json({
        success: true,
        message: `Topic ${status} successfully`,
        topic: {
          id: topic.id,
          title: topic.title,
          status: topic.status,
          updatedAt: topic.updatedAt,
        },
      })
    }

    return NextResponse.json({ error: "Invalid status" }, { status: 400 })
  } catch (error) {
    console.error("❌ Error updating topic:", error)
    return NextResponse.json({ error: "Failed to update topic" }, { status: 500 })
  }
}

async function generateReplacementTopic(userId: any, storyId: any) {
  try {
    // Get the story data for context
    const story = await GeneratedStory.findById(storyId)
    if (!story || !story.baseStoryData || !story.customizationData) {
      throw new Error("Story data not found")
    }

    // Generate a single replacement topic
    const replacementTopic = await generateSingleReplacementTopic(story.baseStoryData, story.customizationData)

    // Save the replacement topic
    const topicDocument = {
      id: `topic-${Date.now()}-replacement-${Math.random().toString(36).substr(2, 9)}`,
      userId: userId,
      storyId: storyId,
      title: replacementTopic,
      status: "pending",
      source: "auto_replacement",
      generationType: "auto",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await Topic.create(topicDocument)
    console.log("✅ Created replacement topic:", replacementTopic)
  } catch (error) {
    console.error("Error generating replacement topic:", error)
    throw error
  }
}

async function generateSingleReplacementTopic(baseStoryData: any, customizationData: any) {
  const timestamp = Date.now()
  const randomSeed = Math.floor(Math.random() * 10000)

  try {
    const openaiApiKey = process.env.OPENAI_API_KEY
    if (openaiApiKey) {
      const prompt = `Generate 1 unique and engaging LinkedIn content topic based on this professional profile.

**UNIQUENESS SEED:** ${timestamp}-${randomSeed}

**Professional Background:**
- Current Work: ${baseStoryData.currentWork || "Professional work"}
- Biggest Challenge: ${baseStoryData.biggestChallenge || "Professional challenges"}
- Core Values: ${baseStoryData.coreValues || "Professional values"}
- Unique Approach: ${baseStoryData.uniqueApproach || "Distinctive methods"}

**Content Preferences:**
- Target Audience: ${customizationData.target_audience || "professionals"}
- Content Tone: ${customizationData.content_tone || "professional"}
- Content Goal: ${customizationData.content_goal || "build authority"}

Generate 1 unique, engaging topic that encourages discussion and is relevant to the person's background.

Return only the topic title, no numbering or formatting.`

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 100,
          temperature: 0.9,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const content = data.choices[0]?.message?.content?.trim()
        if (content) {
          return content
        }
      }
    }
  } catch (error) {
    console.error("Error with AI replacement topic generation:", error)
  }

  // Fallback replacement topics
  const fallbackTopics = [
    "The Unexpected Lesson That Changed My Professional Perspective",
    "How I Turned a Career Setback Into My Greatest Opportunity",
    "The Daily Habit That Transformed My Professional Performance",
    "Why I Believe Authenticity Is the Ultimate Professional Advantage",
    "The Conversation That Completely Shifted My Career Direction",
    "How I Learned to Embrace Professional Uncertainty",
    "The Skill That Made All the Difference in My Career",
    "Why I Choose Growth Over Comfort in My Professional Life",
  ]

  const selectedTopic = fallbackTopics[(timestamp + randomSeed) % fallbackTopics.length]
  return selectedTopic
}
