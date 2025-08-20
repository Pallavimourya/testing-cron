import type { NextRequest } from "next/server"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import { withAdminAuth } from "@/lib/admin-middleware"

// PUT /api/admin/users/[id] - Update user (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(async () => {
    try {
      const { id } = await params
      const body = await request.json()

      await connectDB()

      const user = await User.findByIdAndUpdate(id, { $set: body }, { new: true, runValidators: true }).select(
        "-password",
      )

      if (!user) {
        return Response.json({ success: false, error: "User not found" }, { status: 404 })
      }

      return Response.json({
        success: true,
        user,
      })
    } catch (error) {
      console.error("Update user error:", error)
      return Response.json({ success: false, error: "Failed to update user" }, { status: 500 })
    }
  })(request)
}

// DELETE /api/admin/users/[id] - Delete user (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(async () => {
    try {
      const { id } = await params

      await connectDB()

      const user = await User.findByIdAndDelete(id)

      if (!user) {
        return Response.json({ success: false, error: "User not found" }, { status: 404 })
      }

      return Response.json({
        success: true,
        message: "User deleted successfully",
      })
    } catch (error) {
      console.error("Delete user error:", error)
      return Response.json({ success: false, error: "Failed to delete user" }, { status: 500 })
    }
  })(request)
}
