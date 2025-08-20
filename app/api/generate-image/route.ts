import { NextRequest, NextResponse } from 'next/server'
import { checkSubscriptionAccess, incrementImageGeneration } from '@/lib/subscription-middleware'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/auth'
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

// Configure Replicate for SDXL
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN

export async function POST(request: NextRequest) {
  try {
    // Check subscription access for image generation
    const subscriptionCheck = await checkSubscriptionAccess(true)
    
    if (!subscriptionCheck.success) {
      return subscriptionCheck.response!
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { 
      prompt, 
      content, 
      style = "professional", 
      theme = "business",
      generationMethod = "dalle" // "dalle", "sdxl", or "hybrid"
    } = await request.json()

    let generatedImageUrl: string
    let usedPrompt: string

    // Choose generation method
    switch (generationMethod) {
      case "sdxl":
        const sdxlResult = await generateWithSDXL(prompt, content, style, theme)
        generatedImageUrl = sdxlResult.imageUrl
        usedPrompt = sdxlResult.prompt
        break
      
      case "hybrid":
        const hybridResult = await generateHybridImage(prompt, content, style, theme)
        generatedImageUrl = hybridResult.imageUrl
        usedPrompt = hybridResult.prompt
        break
      
      default: // dalle
        const dalleResult = await generateWithDALLE(prompt, content, style, theme)
        generatedImageUrl = dalleResult.imageUrl
        usedPrompt = dalleResult.prompt
        break
    }

    // Upload to Cloudinary for permanent storage
    let permanentImageUrl: string
    try {
      const uploadResult = await cloudinary.uploader.upload(generatedImageUrl, {
        folder: "linkzup-generated-images",
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

    // Increment image generation count
    await incrementImageGeneration(session.user.email)

    // Get updated limits
    const updatedCheck = await checkSubscriptionAccess(true)
    const imageGenerations = updatedCheck.data?.imageGenerations

    return NextResponse.json({ 
      success: true,
      imageUrl: permanentImageUrl,
      prompt: usedPrompt,
      generationMethod,
      imageGenerations: imageGenerations,
      message: "Image generated successfully!"
    })
  } catch (error) {
    console.error('Error generating image:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate image',
        code: 'GENERATION_ERROR'
      },
      { status: 500 }
    )
  }
}

// Approach 1: Simplified DALL-E prompting (quick fix)
async function generateWithDALLE(userPrompt: string, content: string, style: string, theme: string) {
  const enhancedPrompt = generateSimplifiedPrompt(userPrompt, content, style, theme)
  console.log("🎨 Generated simplified DALL-E prompt:", enhancedPrompt)

  const openaiResponse = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt: enhancedPrompt,
      n: 1,
      size: "1792x1024",
      quality: "hd",
      style: "vivid"
    }),
  })

  if (!openaiResponse.ok) {
    const errorText = await openaiResponse.text()
    console.error("OpenAI API error:", errorText)
    throw new Error("Failed to generate image with DALL-E")
  }

  const openaiData = await openaiResponse.json()
  return {
    imageUrl: openaiData.data[0].url,
    prompt: enhancedPrompt
  }
}

// Approach 2: SDXL for better infographics
async function generateWithSDXL(userPrompt: string, content: string, style: string, theme: string) {
  if (!REPLICATE_API_TOKEN) {
    throw new Error("Replicate API token not configured")
  }

  const sdxlPrompt = generateSDXLPrompt(userPrompt, content, style, theme)
  console.log("🎨 Generated SDXL prompt:", sdxlPrompt)

  const replicateResponse = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      "Authorization": `Token ${REPLICATE_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      version: "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b", // SDXL 1.0
      input: {
        prompt: sdxlPrompt,
        width: 1024,
        height: 1024,
        num_outputs: 1,
        scheduler: "K_EULER",
        num_inference_steps: 50,
        guidance_scale: 7.5,
        negative_prompt: "text, words, letters, typography, watermark, signature, blurry, low quality, distorted"
      }
    }),
  })

  if (!replicateResponse.ok) {
    const errorText = await replicateResponse.text()
    console.error("Replicate API error:", errorText)
    throw new Error("Failed to generate image with SDXL")
  }

  const prediction = await replicateResponse.json()
  
  // Poll for completion
  let result
  for (let i = 0; i < 30; i++) { // Max 30 attempts
    await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds
    
    const statusResponse = await fetch(prediction.urls.get, {
      headers: {
        "Authorization": `Token ${REPLICATE_API_TOKEN}`,
      },
    })
    
    result = await statusResponse.json()
    
    if (result.status === "succeeded") {
      break
    } else if (result.status === "failed") {
      throw new Error("SDXL generation failed")
    }
  }

  if (result.status !== "succeeded") {
    throw new Error("SDXL generation timed out")
  }

  return {
    imageUrl: result.output[0],
    prompt: sdxlPrompt
  }
}

// Approach 3: Hybrid approach with template system
async function generateHybridImage(userPrompt: string, content: string, style: string, theme: string) {
  // Generate background with AI
  const backgroundResult = await generateWithSDXL(userPrompt, content, style, theme)
  
  // Apply LinkedIn-style template overlay
  const templateUrl = await applyLinkedInTemplate(backgroundResult.imageUrl, userPrompt, content, style, theme)
  
  return {
    imageUrl: templateUrl,
    prompt: backgroundResult.prompt + " (with LinkedIn template overlay)"
  }
}

// Simplified prompt generation for DALL-E
function generateSimplifiedPrompt(userPrompt: string, content: string, style: string, theme: string): string {
  const cleanPrompt = userPrompt?.replace(/[#@]/g, "").substring(0, 100) || ""
  
  const stylePrompts = {
    professional: "A professional, modern LinkedIn infographic background design. Clean corporate style with geometric shapes, subtle gradients. Deep blue and gray color scheme with accent green/blue. Abstract business icons. Minimal, sleek, uncluttered layout. High-resolution, crisp, social-media ready. No text.",
    creative: "A vibrant, creative LinkedIn infographic background. Modern design with bold colors and dynamic elements. Abstract shapes and creative patterns. Eye-catching composition with artistic elements. No text.",
    minimal: "A clean, minimal LinkedIn infographic background. Neutral tones with plenty of white space. Simple geometric shapes and clean lines. Subtle textures and professional appearance. No text.",
    modern: "A sleek, contemporary LinkedIn infographic background. Modern UI elements with rounded corners and gradient backgrounds. Dark mode friendly with clean layouts. Professional and engaging. No text."
  }

  const selectedStylePrompt = stylePrompts[style as keyof typeof stylePrompts] || stylePrompts.professional
  
  return `${selectedStylePrompt} ${cleanPrompt ? `Inspired by: ${cleanPrompt}` : ''}`
}

// SDXL prompt generation for better infographics
function generateSDXLPrompt(userPrompt: string, content: string, style: string, theme: string): string {
  const cleanPrompt = userPrompt?.replace(/[#@]/g, "").substring(0, 100) || ""
  
  const sdxlStylePrompts = {
    professional: "Professional LinkedIn infographic background, geometric design, clean corporate blue/gray gradients, business icons, minimal layout, high quality, crisp graphics, professional aesthetic, no text, infographic style",
    creative: "Creative LinkedIn infographic background, vibrant colors, modern design, abstract shapes, artistic elements, dynamic composition, professional yet creative, no text, infographic style",
    minimal: "Minimal LinkedIn infographic background, clean design, white space, simple shapes, neutral colors, professional appearance, uncluttered layout, no text, infographic style",
    modern: "Modern LinkedIn infographic background, contemporary design, sleek UI elements, gradient backgrounds, professional appearance, clean layout, no text, infographic style"
  }

  const selectedStylePrompt = sdxlStylePrompts[style as keyof typeof sdxlStylePrompts] || sdxlStylePrompts.professional
  
  return `${selectedStylePrompt} ${cleanPrompt ? `Theme: ${cleanPrompt}` : ''}`
}

// Apply LinkedIn template overlay
async function applyLinkedInTemplate(backgroundUrl: string, userPrompt: string, content: string, style: string, theme: string): Promise<string> {
  try {
    // Extract key content for overlay
    const keyPoints = extractKeyPoints(content, userPrompt)
    const title = generateTitle(userPrompt, theme)
    
    // Create professional LinkedIn template using Cloudinary transformations
    const templateResult = await cloudinary.uploader.upload(backgroundUrl, {
      folder: "linkzup-templates",
      transformation: [
        // Base image with LinkedIn aspect ratio
        { width: 1200, height: 630, crop: "fill", gravity: "center" },
        // Add gradient overlay for better text readability
        { 
          overlay: "gradient:blue:black:0.3", 
          opacity: 40,
          gravity: "north_west",
          width: 1.0,
          height: 1.0
        },
        // Add professional border
        { border: "3px_solid_rgb:3B82F6", radius: 12 },
        // Add subtle shadow
        { shadow: "offset_10,angle_45,blur_20,opacity_30,color_black" },
        // Optimize for web
        { quality: "auto", fetch_format: "auto" }
      ]
    })
    
    // For now, return the enhanced background
    // In a full implementation, you would use a library like Puppeteer or html-to-image
    // to add text overlays, charts, and other LinkedIn-style elements
    
    return templateResult.secure_url
  } catch (error) {
    console.error("Template application error:", error)
    // Fallback to original image if template fails
    return backgroundUrl
  }
}

// Extract key points from content for overlay
function extractKeyPoints(content: string, prompt: string): string[] {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10)
  const keyPoints = sentences.slice(0, 3).map(s => s.trim().substring(0, 60) + "...")
  return keyPoints.length > 0 ? keyPoints : ["Professional insights", "Business strategy", "Growth mindset"]
}

// Generate title from prompt and theme
function generateTitle(prompt: string, theme: string): string {
  const cleanPrompt = prompt?.replace(/[#@]/g, "").substring(0, 50) || ""
  
  const themeTitles = {
    business: "Business Strategy Insights",
    technology: "Tech Innovation Trends", 
    marketing: "Marketing Excellence",
    leadership: "Leadership Development",
    innovation: "Innovation & Growth"
  }
  
  const baseTitle = themeTitles[theme as keyof typeof themeTitles] || "Professional Insights"
  
  return cleanPrompt ? `${baseTitle}: ${cleanPrompt}` : baseTitle
}

// Legacy function for backward compatibility
function generateEnhancedImagePrompt(userPrompt: string, content: string, style: string, theme: string): string {
  // Clean and prepare input
  const cleanPrompt = userPrompt?.replace(/[#@]/g, "").substring(0, 200) || ""
  const cleanContent = content?.replace(/[#@]/g, "").substring(0, 300) || ""
  
  // Extract themes and concepts
  const themes = extractThemes(cleanContent, cleanPrompt)
  
  // Style configurations
  const styleConfigs = {
    professional: {
      colors: "deep blues (#1E3A8A), corporate grays (#374151), accent colors (#3B82F6, #10B981)",
      aesthetic: "clean, modern, corporate aesthetic with professional gradients",
      elements: "geometric shapes, business icons, clean typography, professional charts"
    },
    creative: {
      colors: "vibrant gradients, bold colors (#FF6B6B, #4ECDC4, #45B7D1, #96CEB4)",
      aesthetic: "modern, creative, eye-catching design with dynamic elements",
      elements: "abstract shapes, creative patterns, modern illustrations, artistic elements"
    },
    minimal: {
      colors: "neutral tones, whites, light grays, subtle accents (#F8FAFC, #E2E8F0, #64748B)",
      aesthetic: "clean, minimal, spacious design with subtle details",
      elements: "simple shapes, clean lines, plenty of white space, subtle textures"
    },
    modern: {
      colors: "contemporary palette, dark mode friendly (#1F2937, #374151, #6B7280, #F59E0B)",
      aesthetic: "sleek, contemporary design with modern UI elements",
      elements: "rounded corners, modern icons, gradient backgrounds, clean layouts"
    }
  }

  const selectedStyle = styleConfigs[style as keyof typeof styleConfigs] || styleConfigs.professional

  // Theme-specific enhancements
  const themeEnhancements = {
    business: "business strategy, professional development, corporate environment, leadership concepts",
    technology: "digital innovation, tech trends, modern technology, digital transformation",
    marketing: "brand awareness, marketing strategies, customer engagement, creative campaigns",
    leadership: "team management, strategic thinking, professional growth, leadership skills",
    innovation: "creative problem-solving, breakthrough ideas, forward-thinking, modern solutions"
  }

  const selectedTheme = themeEnhancements[theme as keyof typeof themeEnhancements] || themeEnhancements.business

  // Create comprehensive prompt
  const enhancedPrompt = `Create a stunning, high-quality ${style} LinkedIn infographic-style image with the following specifications:

USER REQUEST: "${cleanPrompt}"
CONTENT THEMES: ${themes}
SELECTED THEME: ${selectedTheme}

DESIGN REQUIREMENTS:
- ${style} infographic layout with ${selectedStyle.aesthetic}
- Use of ${selectedStyle.elements}
- Professional color scheme: ${selectedStyle.colors}
- Clean typography and visual hierarchy
- Business-appropriate and engaging aesthetic
- High-quality, crisp graphics and icons
- Balanced composition with proper spacing
- Professional gradients and subtle shadows
- Modern design with depth and dimension

VISUAL ELEMENTS:
- Abstract business icons and symbols
- Geometric patterns and shapes
- Professional charts or data visualization elements
- Clean lines and modern design elements
- Subtle background patterns or textures
- Professional color blocks and sections
- Modern UI elements and components

STYLE NOTES:
- No text or words in the image
- Focus on visual storytelling and concept representation
- Professional and trustworthy appearance
- Suitable for LinkedIn business audience
- High-resolution and crisp quality (4K ready)
- Modern, contemporary design aesthetic
- Clean, uncluttered layout
- Engaging and eye-catching composition
- Professional color harmony
- Balanced visual weight distribution

TECHNICAL SPECIFICATIONS:
- High contrast for better visibility
- Professional lighting and shadows
- Smooth gradients and transitions
- Crisp edges and clean lines
- Professional color grading
- Modern design trends
- Social media optimized composition

The image should look like a premium, professional business infographic that would be shared by industry experts on LinkedIn. It should be visually striking, modern, and convey the concept clearly without any text.`

  return enhancedPrompt
}

function extractThemes(content: string, prompt: string): string {
  // Comprehensive business and professional keywords
  const businessKeywords = [
    'leadership', 'strategy', 'innovation', 'growth', 'success', 'business', 'management',
    'team', 'productivity', 'efficiency', 'marketing', 'sales', 'customer', 'service',
    'technology', 'digital', 'transformation', 'data', 'analytics', 'performance',
    'development', 'skills', 'career', 'professional', 'networking', 'opportunity',
    'challenge', 'solution', 'problem', 'goal', 'objective', 'result', 'outcome',
    'process', 'method', 'approach', 'framework', 'model', 'system', 'platform',
    'tool', 'resource', 'asset', 'value', 'benefit', 'advantage', 'competitive',
    'collaboration', 'communication', 'creativity', 'critical thinking', 'decision making',
    'emotional intelligence', 'flexibility', 'initiative', 'organization', 'problem solving',
    'teamwork', 'time management', 'adaptability', 'analytical thinking', 'attention to detail',
    'conflict resolution', 'customer service', 'data analysis', 'financial management',
    'human resources', 'information technology', 'logistics', 'operations management',
    'project management', 'quality assurance', 'research', 'risk management', 'strategic planning'
  ]
  
  const combinedText = (prompt + ' ' + content).toLowerCase()
  const foundThemes = businessKeywords.filter(keyword => 
    combinedText.includes(keyword)
  ).slice(0, 6) // Take top 6 themes
  
  if (foundThemes.length > 0) {
    return foundThemes.join(', ')
  }
  
  // Fallback themes based on content analysis
  const contentLength = content.length
  const promptLength = prompt.length
  
  if (contentLength > 200) {
    return 'business strategy, professional development, leadership, innovation, growth, collaboration'
  } else if (promptLength > 50) {
    return 'professional growth, business excellence, strategic thinking, modern solutions, success mindset'
  } else {
    return 'business strategy, professional development, leadership, innovation, growth'
  }
}
