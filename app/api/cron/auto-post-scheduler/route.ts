import { NextResponse } from "next/server"
import { processScheduledPosts } from "@/lib/linkedin-poster"

// This API route will be called by Vercel Cron Jobs every minute
export async function GET(request: Request) {
  try {
    // Security check - only allow requests from Vercel Cron or with valid secret
    const authHeader = request.headers.get("Authorization")
    const userAgent = request.headers.get("User-Agent")

    // Check if it's a Vercel cron job or has valid secret
    const isVercelCron = userAgent === "vercel-cron/1.0"
    const hasValidSecret = process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`

    if (!isVercelCron && !hasValidSecret) {
      console.log("🚫 Unauthorized cron job access attempt")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("🚀 Auto-posting cron job started at", new Date().toISOString())

    // Process scheduled posts
    const results = await processScheduledPosts()

    console.log("📊 Auto-posting results:", {
      processed: results.processed,
      posted: results.posted,
      failed: results.failed,
      errors: results.errors.length,
    })

    return NextResponse.json({
      success: true,
      message: `Processed ${results.processed} posts`,
      results: {
        processed: results.processed,
        posted: results.posted,
        failed: results.failed,
        errors: results.errors,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Auto-posting cron job error:", error)

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

// Also handle POST requests for manual testing
export async function POST(request: Request) {
  return GET(request)
}
