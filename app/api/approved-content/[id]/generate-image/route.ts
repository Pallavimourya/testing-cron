import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../auth/[...nextauth]/auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import mongoose from "mongoose"
import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { id } = await params
    const { isRegenerate = false } = await request.json()

    console.log("🎨 Generating image for approved content:", id)

    // Find the content first
    if (!mongoose.connection.db) {
      throw new Error("Database connection not established")
    }

    const collection = mongoose.connection.db.collection("approvedcontents")
    
    // Build query to handle both ObjectId and string IDs
    const query: any = {
      $and: [
        {
          $or: [
            { id: id },
            { ID: id },
            { _id: id }
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

    const contentData = await collection.findOne(query)

    if (!contentData) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 })
    }

    // Delete old image from Cloudinary if regenerating
    if (isRegenerate && (contentData.imageUrl || contentData.Image)) {
      const oldImageUrl = contentData.imageUrl || contentData.Image
      try {
        const publicIdMatch = oldImageUrl.match(/\/v\d+\/(.+?)\./)
        if (publicIdMatch && publicIdMatch[1]) {
          const publicId = publicIdMatch[1]
          await cloudinary.uploader.destroy(publicId)
          console.log("🗑️ Old image deleted from Cloudinary:", publicId)
        }
      } catch (error) {
        console.warn("Warning: Could not delete old image from Cloudinary:", error)
      }
    }

    // Generate image prompt based on content
    const content = contentData.content || contentData.Content || ""
    const topicTitle = contentData.topicTitle || contentData.Topic || "Business Content"
    
    const imagePrompt = generateImagePrompt(content, topicTitle)
    console.log("🎯 Generated prompt:", imagePrompt)

    // Call OpenAI DALL-E API for image generation
    const openaiResponse = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: imagePrompt,
        n: 1,
        size: "1792x1024", // Better aspect ratio for LinkedIn
        quality: "hd", // Higher quality
        style: "vivid" // More vibrant and engaging
      }),
    })

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error("OpenAI API error:", errorText)
      return NextResponse.json({ error: "Failed to generate image with AI" }, { status: 500 })
    }

    const openaiData = await openaiResponse.json()
    const generatedImageUrl = openaiData.data[0].url

    // Upload to Cloudinary for permanent storage
    let permanentImageUrl: string
    try {
      const uploadResult = await cloudinary.uploader.upload(generatedImageUrl, {
        folder: "linkzup-approved-content",
        resource_type: "image",
        transformation: [
          { width: 1200, height: 630, crop: "fill", gravity: "center" },
          { quality: "auto", fetch_format: "auto" }
        ]
      })
      
      permanentImageUrl = uploadResult.secure_url
      console.log("✅ AI generated image uploaded to Cloudinary:", permanentImageUrl)
    } catch (cloudinaryError) {
      console.error("❌ Cloudinary upload error:", cloudinaryError)
      return NextResponse.json({ error: "Failed to save generated image" }, { status: 500 })
    }

    // Update the content with the new image URL
    const updateResult = await collection.updateOne(
      query, // Use the same query we built above
      {
        $set: {
          imageUrl: permanentImageUrl,
          Image: permanentImageUrl,
          imageGenerated: true,
          image_generated: true,
          aiGenerationUsed: true,
          ai_generation_used: true,
          updatedAt: new Date(),
          updated_at: new Date(),
        },
      }
    )

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: "Content not found for update" }, { status: 404 })
    }

    console.log("✅ AI image generated and saved for content:", id)

    return NextResponse.json({
      success: true,
      imageUrl: permanentImageUrl,
      prompt: imagePrompt,
      isRegenerate,
      message: isRegenerate ? "Image regenerated successfully!" : "Image generated successfully!"
    })

  } catch (error: any) {
    console.error("❌ Error generating image:", error)
    return NextResponse.json(
      {
        error: "Failed to generate image",
        details: error.message,
      },
      { status: 500 }
    )
  }
}

function generateImagePrompt(content: string, topicTitle: string): string {
  // Clean and extract key themes from content
  const cleanContent = content.replace(/[#@]/g, "").substring(0, 300)
  const cleanTitle = topicTitle.substring(0, 100)
  
  // Extract key themes and concepts
  const themes = extractThemes(cleanContent, cleanTitle)
  
  // Create a professional, LinkedIn-appropriate infographic-style image prompt
  const basePrompt = `Create a stunning, professional LinkedIn infographic-style image with the following specifications:

TOPIC: "${cleanTitle}"
CONTENT THEMES: ${themes}

DESIGN REQUIREMENTS:
- Modern infographic layout with clean, professional design
- Use of geometric shapes, icons, and visual elements
- Professional color scheme: deep blues (#1E3A8A), corporate grays (#374151), accent colors (#3B82F6, #10B981)
- Clean typography and visual hierarchy
- Business-appropriate and corporate aesthetic
- High-quality, crisp graphics and icons
- Balanced composition with proper spacing
- Professional gradients and subtle shadows
- Modern flat design with depth

VISUAL ELEMENTS:
- Abstract business icons and symbols
- Geometric patterns and shapes
- Professional charts or data visualization elements
- Clean lines and modern design elements
- Subtle background patterns or textures
- Professional color blocks and sections

STYLE NOTES:
- No text or words in the image
- Focus on visual storytelling
- Professional and trustworthy appearance
- Suitable for LinkedIn business audience
- High-resolution and crisp quality
- Modern, contemporary design aesthetic
- Clean, uncluttered layout

The image should look like a professional business infographic that would be shared on LinkedIn by industry experts.`

  return basePrompt
}

function extractThemes(content: string, title: string): string {
  // Extract key business themes and concepts
  const businessKeywords = [
    'leadership', 'strategy', 'innovation', 'growth', 'success', 'business', 'management',
    'team', 'productivity', 'efficiency', 'marketing', 'sales', 'customer', 'service',
    'technology', 'digital', 'transformation', 'data', 'analytics', 'performance',
    'development', 'skills', 'career', 'professional', 'networking', 'opportunity',
    'challenge', 'solution', 'problem', 'goal', 'objective', 'result', 'outcome',
    'process', 'method', 'approach', 'framework', 'model', 'system', 'platform',
    'tool', 'resource', 'asset', 'value', 'benefit', 'advantage', 'competitive'
  ]
  
  const combinedText = (title + ' ' + content).toLowerCase()
  const foundThemes = businessKeywords.filter(keyword => 
    combinedText.includes(keyword)
  ).slice(0, 5) // Take top 5 themes
  
  if (foundThemes.length > 0) {
    return foundThemes.join(', ')
  }
  
  // Fallback themes based on content length and common business topics
  return 'business strategy, professional development, leadership, innovation, growth'
}
