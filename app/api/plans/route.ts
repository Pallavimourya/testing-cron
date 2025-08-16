import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Plan from "@/models/Plan"

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const plans = await Plan.find().sort({ createdAt: -1 })

    return NextResponse.json({
      success: true,
      plans,
    })
  } catch (error) {
    console.error("Failed to fetch plans:", error)
    return NextResponse.json({ error: "Failed to fetch plans" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const data = await request.json()

    // Check plan limit (maximum 3 plans)
    const existingPlansCount = await Plan.countDocuments()
    if (existingPlansCount >= 3) {
      return NextResponse.json({ 
        error: "Maximum 3 plans allowed. Please delete an existing plan first." 
      }, { status: 400 })
    }

    // Check if slug already exists
    const existingPlan = await Plan.findOne({ slug: data.slug })
    if (existingPlan) {
      return NextResponse.json({ error: "Plan with this slug already exists" }, { status: 400 })
    }

    const plan = new Plan(data)
    await plan.save()

    return NextResponse.json(
      {
        success: true,
        plan,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Failed to create plan:", error)
    return NextResponse.json({ error: "Failed to create plan" }, { status: 500 })
  }
}
