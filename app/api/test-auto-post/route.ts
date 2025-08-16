import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/auth"

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("🧪 Manual test of auto-post functionality triggered by:", session.user.email)

    // Call the actual auto-post endpoint
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const autoPostUrl = `${baseUrl}/api/cron/auto-post`

    console.log("📞 Calling auto-post endpoint:", autoPostUrl)

    const response = await fetch(autoPostUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ Auto-post test failed:", response.status, errorText)
      return NextResponse.json(
        {
          success: false,
          error: `Auto-post test failed: ${response.status}`,
          details: errorText,
        },
        { status: response.status },
      )
    }

    const result = await response.json()
    console.log("✅ Auto-post test completed:", result)

    return NextResponse.json({
      success: true,
      message: "Auto-post test completed successfully",
      ...result,
      testTriggeredBy: session.user.email,
      testTime: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("❌ Error in auto-post test:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Auto-post test failed",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

// Also handle GET requests
export async function GET() {
  return POST()
}
