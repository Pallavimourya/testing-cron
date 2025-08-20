import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import mongoose from "mongoose"
import { AutoPostService } from "@/lib/services/auto-post-service"

// Track last run time to prevent multiple simultaneous executions
let lastRunTime: Date | null = null
let isAutoPostingRunning = false

function shouldRunAutoPosting() {
  if (!lastRunTime) {
    return true
  }
  
  const timeSinceLastRun = new Date().getTime() - lastRunTime.getTime()
  const oneMinute = 1 * 60 * 1000
  
  return timeSinceLastRun >= oneMinute
}

export async function GET(request: Request) {
  try {
    // Security check for Vercel cron jobs
    const authHeader = request.headers.get('Authorization')
    const userAgent = request.headers.get('User-Agent')
    
    // Allow requests from Vercel cron jobs or manual testing
    const isVercelCron = userAgent === 'vercel-cron/1.0'
    const hasValidSecret = process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`
    const isManualTest = !authHeader && !userAgent // Allow manual testing
    
    if (!isVercelCron && !hasValidSecret && !isManualTest) {
      console.log('🚫 Unauthorized cron job access attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('✅ Authorized cron job request', { isVercelCron, hasValidSecret, isManualTest })
    
    // Check if we should run auto-posting
    if (!shouldRunAutoPosting()) {
      const timeUntilNextRun = lastRunTime ? 1 * 60 * 1000 - (new Date().getTime() - lastRunTime.getTime()) : 0
      const secondsUntilNextRun = Math.floor(timeUntilNextRun / 1000)
      
      return NextResponse.json({
        success: true,
        message: `Auto-posting is running. Next check in ${secondsUntilNextRun} seconds.`,
        lastRun: lastRunTime?.toISOString(),
        nextRun: lastRunTime ? new Date(lastRunTime.getTime() + 1 * 60 * 1000).toISOString() : null,
        isRunning: isAutoPostingRunning,
      })
    }

    // Prevent multiple simultaneous runs
    if (isAutoPostingRunning) {
      return NextResponse.json({
        success: true,
        message: "Auto-posting already in progress",
        isRunning: true,
      })
    }

    isAutoPostingRunning = true
    lastRunTime = new Date()

    console.log("🚀 CRON Job: Auto-post started at", new Date().toISOString())

    await connectDB()

    if (!mongoose.connection.db) {
      throw new Error("Database connection not established")
    }

    // Use the improved auto-post service
    const autoPostService = new AutoPostService(mongoose.connection.db)
    const results = await autoPostService.processScheduledPosts()

    isAutoPostingRunning = false

    console.log("📊 Auto-post results:", {
      processed: results.processed,
      posted: results.posted,
      errors: results.errors,
    })

    return NextResponse.json({
      success: true,
      message: `Auto-post processed ${results.processed} posts`,
      results: {
        processed: results.processed,
        posted: results.posted,
        errors: results.errors,
        details: results.results,
      },
      timestamp: new Date().toISOString(),
      istTime: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    })
  } catch (error) {
    isAutoPostingRunning = false
    console.error("❌ Auto-post cron job error:", error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

// Helper function to upload image to LinkedIn
async function uploadImageToLinkedIn(imageUrl: string, accessToken: string, linkedinPersonId: string) {
  try {
    console.log("🖼️ Starting image upload to LinkedIn:", imageUrl)

    // Step 1: Register the image upload
    const registerUploadUrl = "https://api.linkedin.com/v2/assets?action=registerUpload"
    const registerUploadBody = {
      registerUploadRequest: {
        recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
        owner: `urn:li:person:${linkedinPersonId}`,
        serviceRelationships: [
          {
            relationshipType: "OWNER",
            identifier: "urn:li:userGeneratedContent",
          },
        ],
      },
    }

    const registerResponse = await fetch(registerUploadUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(registerUploadBody),
    })

    if (!registerResponse.ok) {
      const errorText = await registerResponse.text()
      console.error("❌ Failed to register upload:", errorText)
      throw new Error(`Failed to register upload: ${registerResponse.status} ${errorText}`)
    }

    const registerData = await registerResponse.json()
    console.log("📝 Upload registered successfully")

    // Step 2: Download the image from the URL
    const imageResponse = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    })

    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.status}`)
    }

    const imageBuffer = await imageResponse.arrayBuffer()
    console.log("📷 Image downloaded, size:", imageBuffer.byteLength)

    // Step 3: Upload the image to LinkedIn
    const uploadUrl =
      registerData.value.uploadMechanism["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"].uploadUrl

    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/octet-stream",
      },
      body: imageBuffer,
    })

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      console.error("❌ Failed to upload image:", errorText)
      throw new Error(`Failed to upload image: ${uploadResponse.status} ${errorText}`)
    }

    console.log("✅ Image uploaded successfully to LinkedIn")
    return registerData.value.asset
  } catch (error) {
    console.error("❌ Error uploading image to LinkedIn:", error)
    throw error
  }
}

// Also handle POST requests for manual testing
export async function POST(request: Request) {
  return GET(request)
}
