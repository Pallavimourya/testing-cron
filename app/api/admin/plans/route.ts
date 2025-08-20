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

export async function GET(request: Request) {
  try {
    await verifyAdminToken(request)
    await connectDB()

    const plans = await Plan.find().sort({ displayOrder: 1, createdAt: -1 })

    return NextResponse.json({
      success: true,
      plans,
    })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Unauthorized" }, { status: 401 })
  }
}

export async function POST(request: Request) {
  try {
    await verifyAdminToken(request)
    await connectDB()

    const data = await request.json()

    // Validate required fields
    const { name, slug, description, price, durationDays, features, imageLimit, contentLimit } = data

    if (
      !name ||
      !slug ||
      !description ||
      price === undefined ||
      !durationDays ||
      !features ||
      imageLimit === undefined ||
      contentLimit === undefined
    ) {
      return NextResponse.json({ message: "All required fields must be provided" }, { status: 400 })
    }

    // Check if slug already exists
    const existingPlan = await Plan.findOne({ slug: slug.toLowerCase() })
    if (existingPlan) {
      return NextResponse.json({ message: "Plan with this slug already exists" }, { status: 400 })
    }

    // Create new plan
    const plan = new Plan({
      ...data,
      slug: slug.toLowerCase(),
      isActive: data.isActive !== undefined ? data.isActive : true,
    })

    await plan.save()

    return NextResponse.json(
      {
        success: true,
        message: "Plan created successfully",
        plan,
      },
      { status: 201 },
    )
  } catch (error: any) {
    console.error("Admin create plan error:", error)
    return NextResponse.json({ message: error.message || "Failed to create plan" }, { status: 500 })
  }
}
