import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Plan from "@/models/Plan"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    if (!id || id === "undefined") {
      return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 })
    }

    await connectDB()

    const plan = await Plan.findById(id)
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      plan,
    })
  } catch (error) {
    console.error("Failed to fetch plan:", error)
    return NextResponse.json({ error: "Failed to fetch plan" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    if (!id || id === "undefined") {
      return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 })
    }

    await connectDB()

    const data = await request.json()

    // If slug is being updated, check if it already exists
    if (data.slug) {
      const existingPlan = await Plan.findOne({
        slug: data.slug,
        _id: { $ne: id },
      })
      if (existingPlan) {
        return NextResponse.json({ error: "Plan with this slug already exists" }, { status: 400 })
      }
    }

    const plan = await Plan.findByIdAndUpdate(id, data, { new: true, runValidators: true })

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      plan,
    })
  } catch (error) {
    console.error("Failed to update plan:", error)
    return NextResponse.json({ error: "Failed to update plan" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    if (!id || id === "undefined") {
      return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 })
    }

    await connectDB()

    // Check minimum plan requirement (at least 1 plan must remain)
    const existingPlansCount = await Plan.countDocuments()
    if (existingPlansCount <= 1) {
      return NextResponse.json({ 
        error: "Minimum 1 plan required. Cannot delete the last plan." 
      }, { status: 400 })
    }

    const plan = await Plan.findByIdAndDelete(id)
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Plan deleted successfully",
    })
  } catch (error) {
    console.error("Failed to delete plan:", error)
    return NextResponse.json({ error: "Failed to delete plan" }, { status: 500 })
  }
}
