import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import connectDB from "@/lib/mongodb"
import User from "../../../../models/User"

export async function POST(req: Request) {
  let session: any
  let preferences: any
  let audioUrl: any
  let transcription: any
  let onboardingCompleted: any
  
  try {
    session = await getServerSession()
    const requestData = await req.json()
    preferences = requestData.preferences
    audioUrl = requestData.audioUrl
    transcription = requestData.transcription
    onboardingCompleted = requestData.onboardingCompleted

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    console.log("📝 Updating user with data:", {
      email: session.user.email,
      preferences,
      audioUrl: audioUrl ? "Audio saved" : "No audio",
      transcription: transcription ? transcription.substring(0, 50) + "..." : "No transcription",
    })

    // Update user with onboarding data - fix the array issue completely
    const updatedUser = await User.findOneAndUpdate(
      { email: session.user.email },
      {
        $set: {
          niche: preferences.industry,
          targetAudience: preferences.primaryGoal,
          contentTone: preferences.tone,
          preferredPlatforms: preferences.platform, // Store as single string, not array
          onboardingCompleted: true,
          audioUrl: audioUrl,
          transcription: transcription,
          preferences: preferences,
          updatedAt: new Date(),
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: false, // Skip validation to avoid casting issues
      },
    )

    console.log("✅ User onboarding completed:", updatedUser.email)

    return NextResponse.json({
      success: true,
      user: {
        email: updatedUser.email,
        name: updatedUser.name,
        onboardingCompleted: updatedUser.onboardingCompleted,
        preferences: preferences,
        transcription: transcription,
      },
    })
  } catch (error: any) {
    console.error("❌ Error completing onboarding:", error)

    // If it's still a casting error, try a different approach
    if (error.name === "CastError" && error.path === "preferredPlatforms") {
      try {
        console.log("🔄 Retrying with direct update...")

        await connectDB()

        // Get session again for the retry
        const session = await getServerSession()
        if (!session?.user?.email) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Use direct MongoDB update to bypass Mongoose casting
        const result = await User.collection.updateOne(
          { email: session.user.email },
          {
            $set: {
              niche: preferences.industry,
              targetAudience: preferences.primaryGoal,
              contentTone: preferences.tone,
              preferredPlatforms: preferences.platform,
              onboardingCompleted: true,
              audioUrl: audioUrl,
              transcription: transcription,
              preferences: preferences,
              updatedAt: new Date(),
            },
          },
          { upsert: true },
        )

        console.log("✅ Direct update successful:", result)

        return NextResponse.json({
          success: true,
          user: {
            email: session.user.email,
            name: session.user.name,
            onboardingCompleted: true,
            preferences: preferences,
            transcription: transcription,
          },
        })
      } catch (retryError) {
        console.error("❌ Retry also failed:", retryError)
        return NextResponse.json({ error: "Database update failed" }, { status: 500 })
      }
    }

    return NextResponse.json({ error: error.message || "Failed to complete onboarding" }, { status: 500 })
  }
}
