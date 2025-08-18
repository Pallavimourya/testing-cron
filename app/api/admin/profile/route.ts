import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import connectDB from "@/lib/mongodb"
import Admin from "@/models/Admin"

async function getAdminFromToken(request: Request) {
  const token = request.headers.get("cookie")?.split("admin-token=")[1]?.split(";")[0]

  if (!token) {
    throw new Error("No token provided")
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
    const admin = await getAdminFromToken(request)

    return NextResponse.json({
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        profilePhoto: admin.profilePhoto,
        lastLoginAt: admin.lastLoginAt,
        createdAt: admin.createdAt,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Unauthorized" }, { status: 401 })
  }
}

export async function PUT(request: Request) {
  try {
    const admin = await getAdminFromToken(request)
    const { name, email, profilePhoto, currentPassword, newPassword } = await request.json()

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json({ message: "Name and email are required" }, { status: 400 })
    }

    // Check if email is already taken by another admin
    if (email !== admin.email) {
      const existingAdmin = await Admin.findOne({ email: email.toLowerCase(), _id: { $ne: admin._id } })
      if (existingAdmin) {
        return NextResponse.json({ message: "Email already taken" }, { status: 400 })
      }
    }

    // Update basic info
    admin.name = name
    admin.email = email.toLowerCase()
    if (profilePhoto) admin.profilePhoto = profilePhoto

    // Handle password change
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ message: "Current password is required" }, { status: 400 })
      }

      const isCurrentPasswordValid = await admin.comparePassword(currentPassword)
      if (!isCurrentPasswordValid) {
        return NextResponse.json({ message: "Current password is incorrect" }, { status: 400 })
      }

      if (newPassword.length < 6) {
        return NextResponse.json({ message: "New password must be at least 6 characters" }, { status: 400 })
      }

      admin.password = newPassword // Will be hashed by pre-save middleware
    }

    await admin.save()

    return NextResponse.json({
      message: "Profile updated successfully",
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        profilePhoto: admin.profilePhoto,
      },
    })
  } catch (error: any) {
    console.error("Admin profile update error:", error)
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 })
  }
}
