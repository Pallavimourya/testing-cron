import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import mongoose from "mongoose"

export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log("🔌 Disconnecting LinkedIn for user:", user.email)

    // Remove LinkedIn data from User model
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        $unset: {
          linkedinAccessToken: 1,
          linkedinTokenExpiry: 1,
          linkedinProfile: 1,
          linkedinPosts: 1,
          linkedinConnectedAt: 1,
          linkedinLastSync: 1,
        },
      },
      { new: true },
    )

    // Also remove from linkedindetails collection
    if (mongoose.connection.db) {
      const linkedinDetailsCollection = mongoose.connection.db.collection("linkedindetails")

      const deleteResult = await linkedinDetailsCollection.deleteMany({
        $or: [{ userId: user._id }, { userId: user._id.toString() }, { email: user.email }],
      })

      console.log("🗑️ Removed LinkedIn details from collection:", deleteResult.deletedCount)
    }

    console.log("✅ LinkedIn disconnected successfully")

    return NextResponse.json({
      success: true,
      message: "LinkedIn account disconnected successfully",
    })
  } catch (error) {
    console.error("❌ LinkedIn disconnect error:", error)
    return NextResponse.json(
      {
        error: "Failed to disconnect LinkedIn account",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
