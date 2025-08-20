import type { NextRequest } from "next/server"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import { withAdminAuth } from "@/lib/admin-middleware"

// GET /api/admin/users - Get all users (admin only)
export async function GET(request: NextRequest) {
  return withAdminAuth(async () => {
    try {
      await connectDB()

      const users = await User.find().select("-password").sort({ createdAt: -1 }).lean()

      return Response.json({
        success: true,
        users,
      })
    } catch (error) {
      console.error("Get users error:", error)
      return Response.json({ success: false, error: "Failed to fetch users" }, { status: 500 })
    }
  })(request)
}
