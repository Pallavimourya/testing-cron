import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import connectDB from "@/lib/mongodb"
import UserProfile from "../../../models/UserProfile"
import User from "../../../models/User"

export async function GET() {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    // First find the user to get userId
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userProfile = await UserProfile.findOne({
      userId: user._id,
    })

    if (!userProfile) {
      return NextResponse.json({
        onboardingCompleted: false,
        message: "Profile not found",
      })
    }

    return NextResponse.json(userProfile)
  } catch (error: any) {
    console.error("Error fetching profile:", error)
    return NextResponse.json(
      {
        error: error.message || "Failed to fetch profile",
      },
      { status: 500 },
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.json()
    await connectDB()

    // First find the user to get userId
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Update or create user profile
    const userProfile = await UserProfile.findOneAndUpdate(
      { userId: user._id },
      {
        $set: {
          ...formData,
          userId: user._id,
          email: session.user.email,
          updatedAt: new Date(),
        },
      },
      {
        new: true,
        upsert: true,
      },
    )

    return NextResponse.json(userProfile)
  } catch (error: any) {
    console.error("Error saving profile:", error)
    return NextResponse.json(
      {
        error: error.message || "Failed to save profile",
      },
      { status: 500 },
    )
  }
}
