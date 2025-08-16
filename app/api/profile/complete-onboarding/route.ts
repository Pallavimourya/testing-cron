import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import connectDB from "@/lib/mongodb"
import UserProfile from "../../../../models/UserProfile"

export async function POST(req: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const profileData = await req.json()

    await connectDB()

    // Update or create user profile
    const userProfile = await UserProfile.findOneAndUpdate(
      { email: session.user.email },
      {
        name: session.user.name,
        email: session.user.email,
        userId: session.user.email, // Using email as userId for now
        onboardingCompleted: true,
        mcqResponses: profileData.mcqResponses,
        audioResponses: profileData.audioResponses,
        niche: profileData.niche,
        targetAudience: profileData.targetAudience,
        contentTone: profileData.contentTone,
        preferredPlatforms: profileData.preferredPlatforms,
        updatedAt: new Date(),
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    )

    console.log("User profile updated:", userProfile.email)

    return NextResponse.json({
      success: true,
      userId: userProfile.userId,
      message: "Onboarding completed successfully",
    })
  } catch (error: any) {
    console.error("Error completing onboarding:", error)
    return NextResponse.json({ error: error.message || "Failed to complete onboarding" }, { status: 500 })
  }
}
