import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Plan from "@/models/Plan"

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const plans = await Plan.find({ isActive: true }).sort({ price: 1 })

    return NextResponse.json({
      success: true,
      plans,
    })
  } catch (error) {
    console.error("Failed to fetch active plans:", error)
    return NextResponse.json({ error: "Failed to fetch active plans" }, { status: 500 })
  }
}
