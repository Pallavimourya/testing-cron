import { NextResponse } from "next/server"
import { ISTTime } from "@/lib/utils/ist-time"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const testTime = url.searchParams.get('time') // Format: 2025-08-20T06:45
    
    if (!testTime) {
      return NextResponse.json({
        error: "Please provide a time parameter: ?time=2025-08-20T06:45"
      }, { status: 400 })
    }

    // Test the same logic as the frontend
    const scheduledIST = testTime
    const scheduledDate = new Date(scheduledIST + '+05:30')
    const scheduledTimeIST = scheduledDate.getTime()

    // Test validation
    const isValid = ISTTime.isValidScheduleTime(scheduledDate)

    return NextResponse.json({
      success: true,
      test: {
        input: testTime,
        scheduledIST: scheduledIST,
        scheduledDate: scheduledDate.toISOString(),
        scheduledTimeIST: scheduledTimeIST,
        istDisplay: scheduledDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        isValid: isValid,
        currentTime: new Date().toISOString(),
        currentIST: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        oneMinuteFromNow: new Date(Date.now() + 60000).toISOString()
      }
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
