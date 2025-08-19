import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import mongoose from "mongoose"
import { AutoPostService } from "@/lib/services/auto-post-service"

export async function GET(req: Request) {
  try {
    console.log("🔄 Simple external cron job triggered")
    
    // Very permissive authentication - allow any request from cron-job.org
    const userAgent = req.headers.get('user-agent') || req.headers.get('User-Agent') || ''
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization')
    const url = new URL(req.url)
    const tokenParam = url.searchParams.get('token')
    const authParam = url.searchParams.get('auth')
    
    console.log("🔍 Simple auth debug:", {
      userAgent: userAgent.substring(0, 100),
      hasAuthHeader: !!authHeader,
      hasTokenParam: !!tokenParam,
      hasAuthParam: !!authParam,
      url: req.url
    })
    
    // Allow any request that looks like it's from a cron service
    const isCronRequest = 
      userAgent.toLowerCase().includes('cron') ||
      userAgent.toLowerCase().includes('cron-job.org') ||
      authHeader ||
      tokenParam ||
      authParam ||
      process.env.NODE_ENV === 'development'
    
    if (!isCronRequest) {
      console.log("❌ Not a cron request")
      return NextResponse.json({ 
        error: "Not a cron request",
        message: "This endpoint is for cron jobs only",
        userAgent: userAgent.substring(0, 50)
      }, { status: 403 })
    }

    console.log("✅ Simple external cron authentication successful")

    await connectDB()

    if (!mongoose.connection.db) {
      throw new Error("Database connection not established")
    }

    // Use the improved auto-post service
    const autoPostService = new AutoPostService(mongoose.connection.db)
    const results = await autoPostService.processScheduledPosts()

    console.log("📊 Simple external cron results:", {
      processed: results.processed,
      posted: results.posted,
      errors: results.errors,
    })

    return NextResponse.json({
      success: true,
      message: `Simple external cron processed ${results.processed} posts`,
      results: {
        processed: results.processed,
        posted: results.posted,
        errors: results.errors,
        details: results.results,
      },
      timestamp: new Date().toISOString(),
      istTime: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      cronService: "simple-external",
      userAgent: userAgent.substring(0, 50)
    })
  } catch (error) {
    console.error("❌ Simple external cron job error:", error)

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
