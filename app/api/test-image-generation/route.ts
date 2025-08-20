import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { prompt, content, style, theme } = await request.json()

    // Test the enhanced prompt generation
    const enhancedPrompt = generateEnhancedImagePrompt(prompt, content, style, theme)
    
    return NextResponse.json({
      success: true,
      originalPrompt: prompt,
      enhancedPrompt: enhancedPrompt,
      style: style,
      theme: theme,
      message: "Enhanced prompt generated successfully!"
    })

  } catch (error) {
    console.error('Error testing image generation:', error)
    return NextResponse.json(
      { 
        error: 'Failed to test image generation',
        code: 'TEST_ERROR'
      },
      { status: 500 }
    )
  }
}

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
