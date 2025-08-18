import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const now = new Date()
    const istOffset = 5.5 * 60 * 60 * 1000 // IST is UTC+5:30
    const nowIST = new Date(now.getTime() + istOffset)
    
    return NextResponse.json({
      success: true,
      message: "External cron test endpoint is working",
      timestamp: now.toISOString(),
      istTime: nowIST.toISOString(),
      istTimeFormatted: nowIST.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      environment: {
        hasExternalCronSecret: !!process.env.EXTERNAL_CRON_SECRET,
        hasCronJobToken: !!process.env.CRON_JOB_TOKEN,
        hasCronSecret: !!process.env.CRON_SECRET,
      },
      endpoints: {
        externalCron: "/api/cron/external-auto-post",
        internalCron: "/api/cron/auto-post",
        testEndpoint: "/api/test-external-cron",
      },
      instructions: {
        cronJobOrg: "Set up cron-job.org to call /api/cron/external-auto-post every minute",
        headers: "Use Authorization: Bearer YOUR_EXTERNAL_CRON_SECRET or X-Cron-Job-Token: YOUR_CRON_JOB_TOKEN",
        schedule: "Every minute (* * * * *)",
      }
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  return GET(request)
}
