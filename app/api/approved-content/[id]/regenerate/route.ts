import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../auth/[...nextauth]/auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import mongoose from "mongoose"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check for both email and id in session
    if (!session?.user?.email && !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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

    const { id } = await params
    
    // Safely parse request body with error handling
    let body: any = {}
    let newContentType: string | undefined
    
    try {
      const bodyText = await request.text()
      console.log("📝 Request body text:", bodyText)
      
      if (bodyText.trim()) {
        body = JSON.parse(bodyText)
        newContentType = body.contentType
        console.log("✅ Parsed request body:", body)
      } else {
        console.warn("⚠️ Empty request body")
      }
    } catch (parseError) {
      console.warn("⚠️ Could not parse request body:", parseError)
      // Continue with default values
    }

    console.log("🔄 Regenerating content for approved content:", id, "with type:", newContentType)

    // Find content in approvedcontents collection
    let contentData = null
    let query: any = null
    
    if (mongoose.connection.db) {
      const collection = mongoose.connection.db.collection("approvedcontents")

      // Build query to handle both ObjectId and string IDs
      query = {
        $and: [
          {
            $or: [
              { id: id },
              { ID: id }
            ]
          },
          {
            $or: [
              { email: user.email },
              { "user id": user._id.toString() },
              { user_id: user._id.toString() },
              { userId: user._id.toString() },
              { userId: user._id },
            ],
          },
        ],
      }

      // Only try ObjectId conversion if the ID looks like a valid ObjectId
      if (mongoose.Types.ObjectId.isValid(id) && id.length === 24) {
        query.$and[0].$or.push({ _id: new mongoose.Types.ObjectId(id) })
      }

      contentData = await collection.findOne(query)
    }

    if (!contentData) {
      return NextResponse.json({ error: "Approved content not found" }, { status: 404 })
    }

    const topicTitle = contentData.topicTitle || contentData.Topic || contentData.topic_title || ""
    const currentContent = contentData.content || contentData.Content || contentData["generated content"] || ""
    const contentType = newContentType || contentData.contentType || contentData.content_type || "storytelling"
    
    console.log("🎯 Content type for regeneration:", contentType)
    console.log("📝 Topic title:", topicTitle)

    if (!topicTitle) {
      return NextResponse.json({ error: "No topic title found to regenerate content" }, { status: 400 })
    }

    console.log("🎯 Regenerating content for topic:", topicTitle, "with type:", contentType)

    try {
      // Create a content generation prompt based on content type
      let regenerationPrompt = ""
      
      switch (contentType) {
        case "storytelling":
          regenerationPrompt = `Create a compelling LinkedIn storytelling post about: "${topicTitle}"

Requirements:
- Write a professional LinkedIn post that tells a personal or business story
- Start with an engaging opening that hooks the reader
- Include a personal anecdote or business experience related to the topic
- Share valuable insights or lessons learned
- End with a thought-provoking question or call to action
- Professional tone suitable for LinkedIn business audience
- Include relevant hashtags naturally within the content
- Optimal length for LinkedIn engagement (1300-3000 characters)
- Create completely new content (different from previous version)
- NO labels like [Hook], [Story], [Value], [CTA] - write as a natural flowing post
- NO formatting: NO bold text, NO italics, NO stars, NO special characters
- Write in plain text only - clean and simple`

        case "listicle":
          regenerationPrompt = `Create a LinkedIn listicle post about: "${topicTitle}"

Requirements:
- Write a professional LinkedIn post with numbered or bulleted points
- Start with an engaging introduction
- Present 3-7 actionable and valuable points
- Each point should be practical and business-focused
- Professional tone suitable for LinkedIn
- Include relevant hashtags naturally
- Optimal length for LinkedIn engagement (1300-3000 characters)
- Create completely new content (different from previous version)
- NO labels like [Hook], [Story], [Value], [CTA] - write as a natural flowing post
- NO formatting: NO bold text, NO italics, NO stars, NO special characters
- Write in plain text only - clean and simple
- Make it easy to scan and digest`

        case "quote_based":
          regenerationPrompt = `Create a LinkedIn quote-based post about: "${topicTitle}"

Requirements:
- Start with an inspiring or thought-provoking quote related to the topic
- Provide context and interpretation of the quote
- Connect it to business or professional life in a meaningful way
- Share personal insights or experiences related to the quote
- Professional tone suitable for LinkedIn
- Include relevant hashtags naturally
- Optimal length for LinkedIn engagement (1300-3000 characters)
- Create completely new content (different from previous version)
- NO labels like [Hook], [Story], [Value], [CTA] - write as a natural flowing post
- NO formatting: NO bold text, NO italics, NO stars, NO special characters
- Write in plain text only - clean and simple`

        case "before_after":
          regenerationPrompt = `Create a LinkedIn before/after comparison post about: "${topicTitle}"

Requirements:
- Write a professional LinkedIn post showing transformation or improvement
- Present a clear before and after scenario related to the topic
- Show how change, growth, or improvement occurred
- Make it relatable to business audience
- Share insights about what caused the transformation
- Professional tone suitable for LinkedIn
- Include relevant hashtags naturally
- Optimal length for LinkedIn engagement (1300-3000 characters)
- Create completely new content (different from previous version)
- NO labels like [Hook], [Story], [Value], [CTA] - write as a natural flowing post
- NO formatting: NO bold text, NO italics, NO stars, NO special characters
- Write in plain text only - clean and simple`

        case "question_driven":
          regenerationPrompt = `Create a LinkedIn question-driven post about: "${topicTitle}"

Requirements:
- Start with an engaging question related to the topic
- Provide insights and answers to the question
- Share personal experiences or examples
- Encourage audience engagement and discussion
- Professional tone suitable for LinkedIn
- Include relevant hashtags naturally
- Optimal length for LinkedIn engagement (1300-3000 characters)
- Create completely new content (different from previous version)
- NO labels like [Hook], [Story], [Value], [CTA] - write as a natural flowing post
- NO formatting: NO bold text, NO italics, NO stars, NO special characters
- Write in plain text only - clean and simple`

        default:
          regenerationPrompt = `Create a fresh LinkedIn post about: "${topicTitle}"

Content Type: ${contentType}
Previous content length: ${currentContent.length} characters

Requirements:
- Create completely new content (different from previous version)
- Professional tone suitable for LinkedIn
- Engaging and valuable for business audience
- Include relevant hashtags naturally
- Optimal length for LinkedIn engagement (1300-3000 characters)
- Make it unique and fresh while staying on topic
- NO labels like [Hook], [Story], [Value], [CTA] - write as a natural flowing post
- NO formatting: NO bold text, NO italics, NO stars, NO special characters
- Write in plain text only - clean and simple`
      }

      console.log("🤖 Sending regeneration request to OpenAI...")

      // Generate new content using OpenAI
      const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: "You are a professional LinkedIn content creator. Generate engaging, valuable business content that flows naturally without any labels, formatting instructions, bold text, italics, stars, or special characters. Write in plain text only as if you're a business professional sharing insights directly on LinkedIn.",
            },
            {
              role: "user",
              content: regenerationPrompt,
            },
          ],
          max_tokens: 1500,
          temperature: 0.8, // Higher temperature for more creative variation
        }),
      })

      if (!openaiResponse.ok) {
        const errorData = await openaiResponse.json()
        console.error("❌ OpenAI API error:", errorData)
        throw new Error(`OpenAI API error: ${errorData.error?.message || "Unknown error"}`)
      }

      const openaiData = await openaiResponse.json()
      const newContent = openaiData.choices[0].message.content.trim()

      console.log("✅ New content generated, length:", newContent.length)

      // Extract hashtags from the new content
      const hashtagRegex = /#[\w]+/g
      const extractedHashtags = newContent.match(hashtagRegex) || []
      const cleanHashtags = extractedHashtags.map((tag: string) => tag.replace("#", ""))

      // Update content in approvedcontents collection
      if (mongoose.connection.db && query) {
        const collection = mongoose.connection.db.collection("approvedcontents")

        await collection.updateOne(
          query, // Use the same query we built above
          {
            $set: {
              content: newContent,
              Content: newContent,
              "generated content": newContent,
              contentType: contentType,
              content_type: contentType,
              hashtags: cleanHashtags,
              Hashtags: cleanHashtags,
              regeneratedAt: new Date(),
              regenerated_at: new Date(),
              updatedAt: new Date(),
              updated_at: new Date(),
              status: "approved", // Keep as approved since it's in approvedcontents
            },
          },
        )

        console.log("✅ Updated content with regenerated version")
      }

      return NextResponse.json({
        success: true,
        message: "Content regenerated successfully",
        content: newContent,
        hashtags: cleanHashtags,
        regeneratedAt: new Date(),
      })
    } catch (regenerationError: any) {
      console.error("❌ Error regenerating content:", regenerationError)

      // Check if it's a subscription/quota error
      if (regenerationError.message?.includes("quota") || regenerationError.message?.includes("billing")) {
        return NextResponse.json(
          {
            error: "Content regeneration quota exceeded. Please upgrade your subscription.",
            requiresSubscription: true,
          },
          { status: 402 },
        )
      }

      return NextResponse.json(
        {
          error: regenerationError.message || "Failed to regenerate content",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("❌ Error in content regeneration:", error)
    return NextResponse.json(
      {
        error: "Failed to regenerate content",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
