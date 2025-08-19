import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const token = url.searchParams.get('token')
    const authHeader = req.headers.get('authorization')
    const cronSecret = req.headers.get('cron-secret')
    const userAgent = req.headers.get('user-agent')

    console.log("🔐 Test Authentication check:", {
      hasToken: !!token,
      hasAuthHeader: !!authHeader,
      hasCronSecret: !!cronSecret,
      userAgent: userAgent,
      nodeEnv: process.env.NODE_ENV
    })

    console.log("Expected tokens:", {
      EXTERNAL_CRON_TOKEN: process.env.EXTERNAL_CRON_TOKEN ? "SET" : "NOT SET",
      CRON_SECRET: process.env.CRON_SECRET ? "SET" : "NOT SET"
    })

    // Check for various authentication methods
    const isAuthenticated =
      token === process.env.EXTERNAL_CRON_TOKEN ||
      authHeader === `Bearer ${process.env.EXTERNAL_CRON_TOKEN}` ||
      cronSecret === process.env.EXTERNAL_CRON_TOKEN ||
      cronSecret === process.env.CRON_SECRET ||
      userAgent?.includes('cron-job.org') ||
      process.env.NODE_ENV === 'development'

    if (!isAuthenticated) {
      return NextResponse.json({ 
        success: false,
        error: "Unauthorized", 
        message: "Authentication failed",
        received: {
          token: !!token,
          authHeader: !!authHeader,
          cronSecret: !!cronSecret,
          userAgent: userAgent
        },
        expected: {
          EXTERNAL_CRON_TOKEN: process.env.EXTERNAL_CRON_TOKEN ? "SET" : "NOT SET",
          CRON_SECRET: process.env.CRON_SECRET ? "SET" : "NOT SET"
        }
      }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      message: "Authentication successful",
      timestamp: new Date().toISOString(),
      istTime: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      environment: {
        hasExternalCronToken: !!process.env.EXTERNAL_CRON_TOKEN,
        hasCronSecret: !!process.env.CRON_SECRET,
        nodeEnv: process.env.NODE_ENV
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
