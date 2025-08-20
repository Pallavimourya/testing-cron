import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import connectDB from "@/lib/mongodb"
import UserProfile from "../../../../models/UserProfile"
import { authOptions } from "../../auth/[...nextauth]/auth"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const profile = await UserProfile.findOne({ userId: session.user.id })

    return NextResponse.json({
      profile: profile || {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        joinedDate: new Date().toISOString(),
      },
    })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const profileData = await req.json()

    await connectDB()

    // Check if profile already exists
    const existingProfile = await UserProfile.findOne({ userId: session.user.id })

    if (existingProfile) {
      // Update existing profile
      const updatedProfile = await UserProfile.findOneAndUpdate(
        { userId: session.user.id },
        { ...profileData, userId: session.user.id },
        { new: true },
      )
      return NextResponse.json({ profile: updatedProfile })
    } else {
      // Create new profile
      const newProfile = await UserProfile.create({
        ...profileData,
        userId: session.user.id,
        joinedDate: new Date().toISOString(),
      })
      return NextResponse.json({ profile: newProfile })
    }
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 })
  }
}
