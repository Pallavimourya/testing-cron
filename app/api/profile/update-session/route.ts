import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import UserProfile from "@/models/UserProfile"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { profilePicture } = await request.json()

    // Allow empty string for removing profile picture
    if (profilePicture === undefined) {
      return NextResponse.json({ error: "Profile picture URL is required" }, { status: 400 })
    }

    // Update the user's profile picture in the database
    await connectDB()
    
    // First find the user to get userId
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Update UserProfile model with the profile picture
    const userProfile = await UserProfile.findOneAndUpdate(
      { userId: user._id },
      { profilePhoto: profilePicture || "" },
      { new: true, upsert: true },
    )

    // Also update User model for consistency
    await User.findOneAndUpdate(
      { email: session.user.email },
      { profilePicture: profilePicture || "" },
      { new: true },
    )

    // Return the updated profile picture URL for immediate use
    return NextResponse.json({
      success: true,
      message: "Profile picture updated successfully",
      profilePicture: profilePicture || ""
    })
  } catch (error) {
    console.error("Error updating session:", error)
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 })
  }
}
