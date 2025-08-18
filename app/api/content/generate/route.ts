import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/auth"
import { checkSubscriptionAccess } from "@/lib/subscription-middleware"
import connectToDatabase from "@/lib/mongodb"
import Content from "@/models/Content"
import User from "@/models/User"
import mongoose from "mongoose"

export async function POST(req: Request) {
  try {
    // Check subscription access for content generation
    const subscriptionCheck = await checkSubscriptionAccess(false)
    
    if (!subscriptionCheck.success) {
      return subscriptionCheck.response!
    }

    const session = await getServerSession(authOptions)
    const { prompt, title, email } = await req.json()
    
    if (!prompt || !title || !email) {
      return NextResponse.json({ 
        error: "Missing required fields",
        code: "MISSING_FIELDS"
      }, { status: 400 })
    }

    // Connect to database
    await connectToDatabase()

    // Get user profile for content generation context
    const user = await User.findOne({ email })
    if (!user) {
      return NextResponse.json({ 
        error: "User not found",
        code: "USER_NOT_FOUND"
      }, { status: 404 })
    }
    if (user.blocked) {
      return NextResponse.json({
        error: "You have been restricted by the admin and cannot generate content.",
        code: "USER_BLOCKED"
      }, { status: 403 })
    }

    // Generate content using the transcription as prompt
    const generatedContent = await generateContent(prompt, user)

    // Save to both collections for compatibility
    const content = await Content.create({
      user_id: user._id,
      title: title,
      content: generatedContent,
      status: "pending",
      platform: user.preferredPlatforms?.[0] || "linkedin",
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Also save in the main collection
    if (!mongoose.connection.db) {
      throw new Error("Database connection not established")
    }

    const collection = mongoose.connection.db.collection("linkdin-content-generation")
    await collection.insertOne({
      "User ID\t": user._id.toString(),
      userId: user._id,
      Topic: title,
      Content: generatedContent,
      content: generatedContent,
      platform: "linkedin",
      status: "pending",
      hashtags: [],
      keyPoints: [],
      Image: "",
      createdAt: new Date(),
      updatedAt: new Date(),
      modifiedTime: new Date(),
      analytics: {
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
      },
    })

    // Increment content generation count
    await User.updateOne(
      { email },
      { $inc: { contentGenerated: 1 } }
    )

    return NextResponse.json({
      ...content.toObject(),
      subscriptionInfo: subscriptionCheck.data
    })
  } catch (error) {
    console.error("Error generating content:", error)
    return NextResponse.json({ 
      error: "Failed to generate content",
      code: "GENERATION_ERROR"
    }, { status: 500 })
  }
}

async function generateContent(prompt: string, user: any) {
  return `
Based on your input, here's the generated content:

${prompt}

Additional Context:
- Niche: ${user.niche || "General"}
- Target Audience: ${user.targetAudience || "Professional Network"}
- Content Tone: ${user.contentTone || "Professional"}
- Platform: ${user.preferredPlatforms?.join(", ") || "LinkedIn"}

This content has been generated and formatted according to your preferences.
  `.trim()
}
