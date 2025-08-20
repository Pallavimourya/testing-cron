import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import connectDB from "@/lib/mongodb"
import Admin from "@/models/Admin"

export async function GET(request: Request) {
  try {
    const token = request.headers.get("cookie")?.split("admin-token=")[1]?.split(";")[0]

    if (!token) {
      return NextResponse.json({ message: "No token provided" }, { status: 401 })
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || "fallback-secret") as any

    await connectDB()

    const admin = await Admin.findById(decoded.id)

    if (!admin || !admin.isActive) {
      return NextResponse.json({ message: "Admin not found or inactive" }, { status: 401 })
    }

    return NextResponse.json({
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        profilePhoto: admin.profilePhoto,
        lastLoginAt: admin.lastLoginAt,
      },
    })
  } catch (error) {
    console.error("Admin auth check error:", error)
    return NextResponse.json({ message: "Invalid token" }, { status: 401 })
  }
}
