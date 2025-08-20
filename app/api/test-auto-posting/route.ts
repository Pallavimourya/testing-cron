import { NextResponse } from "next/server"
import { processScheduledPosts } from "@/lib/linkedin-poster"

// Manual test endpoint for auto-posting functionality
export async function GET() {
  try {
    console.log("🧪 Manual test of auto-posting functionality")

    const results = await processScheduledPosts()

    return NextResponse.json({
      success: true,
      message: "Auto-posting test completed",
      results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Auto-posting test error:", error)

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

export async function POST() {
  return GET()
}
