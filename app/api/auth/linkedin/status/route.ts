import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../[...nextauth]/auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const user = await User.findById(session.user.id).select(
      "linkedinAccessToken linkedinTokenExpiry linkedinProfile linkedinConnectedAt linkedinLastSync",
    )

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if LinkedIn is connected and token is valid
    const isConnected = !!(
      user.linkedinAccessToken &&
      user.linkedinTokenExpiry &&
      new Date(user.linkedinTokenExpiry) > new Date()
    )

    if (isConnected && user.linkedinProfile) {
      return NextResponse.json({
        isConnected: true,
        linkedinName: user.linkedinProfile.name,
        linkedinEmail: user.linkedinProfile.email,
        profileUrl: user.linkedinProfile.profileUrl,
        connectedAt: user.linkedinConnectedAt,
        lastSync: user.linkedinLastSync,
      })
    }

    return NextResponse.json({
      isConnected: false,
    })
  } catch (error) {
    console.error("LinkedIn status check error:", error)
    return NextResponse.json({ error: "Failed to check LinkedIn status" }, { status: 500 })
  }
}
