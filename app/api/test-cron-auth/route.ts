import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    const userAgent = req.headers.get('user-agent')
    const url = new URL(req.url)
    const tokenParam = url.searchParams.get('token')
    const authParam = url.searchParams.get('auth')
    
    const cronSecret = process.env.CRON_SECRET || 'BzbHyiKVrc6rDLWHn4uYLHo+s1WkHp2ucuzsCi/euRI='
    const externalCronToken = process.env.EXTERNAL_CRON_TOKEN || 'external-cron-token'
    
    const isAuthenticated = 
      authHeader === `Bearer ${cronSecret}` ||
      tokenParam === externalCronToken ||
      authParam === cronSecret ||
      userAgent?.includes('cron-job.org') ||
      process.env.NODE_ENV === 'development'
    
    return NextResponse.json({
      success: true,
      message: "Cron authentication test endpoint",
      authentication: {
        isAuthenticated,
        hasAuthHeader: !!authHeader,
        hasTokenParam: !!tokenParam,
        hasAuthParam: !!authParam,
        userAgent: userAgent?.substring(0, 50),
        nodeEnv: process.env.NODE_ENV,
        cronSecretExists: !!process.env.CRON_SECRET,
        externalCronTokenExists: !!process.env.EXTERNAL_CRON_TOKEN
      },
      timestamp: new Date().toISOString(),
      istTime: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
