import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import connectDB from "@/lib/mongodb"
import Plan from "@/models/Plan"
import Admin from "@/models/Admin"

async function verifyAdminToken(request: Request) {
  const token = request.headers.get("cookie")?.split("admin-token=")[1]?.split(";")[0]

  if (!token) {
    throw new Error("No admin token provided")
  }

  const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || "fallback-secret") as any

  await connectDB()

  const admin = await Admin.findById(decoded.id)
  if (!admin || !admin.isActive) {
    throw new Error("Admin not found or inactive")
  }

  return admin
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await verifyAdminToken(request)
    const { id } = await params

    if (!id || id === "undefined") {
      return NextResponse.json({ message: "Invalid plan ID" }, { status: 400 })
    }

    await connectDB()

    const data = await request.json()

    // If slug is being updated, check if it already exists
    if (data.slug) {
      const existingPlan = await Plan.findOne({
        slug: data.slug.toLowerCase(),
        _id: { $ne: id },
      })
      if (existingPlan) {
        return NextResponse.json({ message: "Plan with this slug already exists" }, { status: 400 })
      }
      data.slug = data.slug.toLowerCase()
    }

    const plan = await Plan.findByIdAndUpdate(id, data, { new: true, runValidators: true })

    if (!plan) {
      return NextResponse.json({ message: "Plan not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Plan updated successfully",
      plan,
    })
  } catch (error: any) {
    console.error("Admin update plan error:", error)
    return NextResponse.json({ message: error.message || "Failed to update plan" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await verifyAdminToken(request)
    const { id } = await params

    if (!id || id === "undefined") {
      return NextResponse.json({ message: "Invalid plan ID" }, { status: 400 })
    }

    await connectDB()

    // Check if this is the last active plan
    const activePlansCount = await Plan.countDocuments({ isActive: true })
    const planToDelete = await Plan.findById(id)

    if (!planToDelete) {
      return NextResponse.json({ message: "Plan not found" }, { status: 404 })
    }

    if (planToDelete.isActive && activePlansCount <= 1) {
      return NextResponse.json(
        {
          message: "Cannot delete the last active plan. At least one active plan must exist.",
        },
        { status: 400 },
      )
    }

    await Plan.findByIdAndDelete(id)

    return NextResponse.json({
      success: true,
      message: "Plan deleted successfully",
    })
  } catch (error: any) {
    console.error("Admin delete plan error:", error)
    return NextResponse.json({ message: error.message || "Failed to delete plan" }, { status: 500 })
  }
}
