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

    const user = await User.findOne({ email: session.user.email }).select(
      "+linkedinAccessToken +linkedinTokenExpiry +linkedinProfile",
    )

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log("🔄 Syncing LinkedIn data for user:", user.email)

    let accessToken = user.linkedinAccessToken
    let linkedinProfile = user.linkedinProfile

    // If no token in User model, check linkedindetails collection
    if (!accessToken && mongoose.connection.db) {
      const linkedinDetailsCollection = mongoose.connection.db.collection("linkedindetails")
      const linkedinDetails = await linkedinDetailsCollection.findOne({
        $or: [{ userId: user._id }, { userId: user._id.toString() }, { email: user.email }],
      })

      if (linkedinDetails?.accessToken) {
        accessToken = linkedinDetails.accessToken
        linkedinProfile = {
          id: linkedinDetails.linkedinId,
          name: linkedinDetails.name,
          email: linkedinDetails.email,
          profileUrl: linkedinDetails.profileUrl,
        }
        console.log("📋 Using access token from linkedindetails collection")
      }
    }

    // Check if LinkedIn is connected and token is valid
    if (!accessToken || (user.linkedinTokenExpiry && new Date(user.linkedinTokenExpiry) <= new Date())) {
      return NextResponse.json({ error: "LinkedIn not connected or token expired" }, { status: 400 })
    }

    console.log("👤 Fetching updated LinkedIn profile...")

    // Fetch updated profile information
    const profileResponse = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!profileResponse.ok) {
      const errorText = await profileResponse.text()
      console.error("❌ LinkedIn profile fetch failed:", profileResponse.status, errorText)

      if (profileResponse.status === 401) {
        return NextResponse.json({ error: "LinkedIn access token expired. Please reconnect." }, { status: 401 })
      }

      return NextResponse.json({ error: "Failed to fetch LinkedIn profile" }, { status: 400 })
    }

    const profileData = await profileResponse.json()
    console.log("✅ LinkedIn profile updated:", { id: profileData.sub, name: profileData.name })

    // Fetch user's recent LinkedIn posts
    console.log("📝 Fetching LinkedIn posts...")
    let postsData = null
    let postsCount = 0

    try {
      const postsResponse = await fetch(
        `https://api.linkedin.com/v2/ugcPosts?q=authors&authors=List(urn:li:person:${profileData.sub})&count=20&sortBy=CREATED_TIME`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "X-Restli-Protocol-Version": "2.0.0",
          },
        },
      )

      if (postsResponse.ok) {
        postsData = await postsResponse.json()
        postsCount = postsData?.elements?.length || 0
        console.log("✅ LinkedIn posts fetched:", postsCount)
      } else {
        console.warn("⚠️ Failed to fetch LinkedIn posts:", postsResponse.status)
      }
    } catch (postsError) {
      console.warn("⚠️ Error fetching LinkedIn posts:", postsError)
    }

    // Fetch connection count
    console.log("🤝 Fetching LinkedIn connections...")
    let connectionsCount = 0

    try {
      const connectionsResponse = await fetch(
        `https://api.linkedin.com/v2/networkSizes/urn:li:person:${profileData.sub}?edgeType=CONNECTION`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "X-Restli-Protocol-Version": "2.0.0",
          },
        },
      )

      if (connectionsResponse.ok) {
        const connectionsData = await connectionsResponse.json()
        connectionsCount = connectionsData.firstDegreeSize || 0
        console.log("✅ LinkedIn connections count:", connectionsCount)
      } else {
        console.warn("⚠️ Failed to fetch LinkedIn connections:", connectionsResponse.status)
      }
    } catch (connectionsError) {
      console.warn("⚠️ Error fetching LinkedIn connections:", connectionsError)
    }

    // Update user with latest LinkedIn data
    const updatedProfile = {
      id: profileData.sub,
      name: profileData.name,
      email: profileData.email,
      picture: profileData.picture,
      profileUrl: `https://www.linkedin.com/in/${profileData.sub}`,
      connectionsCount,
    }

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        linkedinProfile: updatedProfile,
        linkedinPosts: postsData?.elements || [],
        linkedinLastSync: new Date(),
      },
      { new: true },
    )

    // Also update linkedindetails collection
    if (mongoose.connection.db) {
      const linkedinDetailsCollection = mongoose.connection.db.collection("linkedindetails")

      await linkedinDetailsCollection.updateOne(
        {
          $or: [{ userId: user._id }, { userId: user._id.toString() }, { email: user.email }],
        },
        {
          $set: {
            name: profileData.name,
            email: profileData.email,
            profileUrl: `https://www.linkedin.com/in/${profileData.sub}`,
            connectionsCount,
            postsCount,
            lastSync: new Date(),
            updatedAt: new Date(),
          },
        },
      )

      console.log("✅ LinkedIn details collection updated")
    }

    console.log("✅ LinkedIn sync completed successfully")

    return NextResponse.json({
      success: true,
      message: "LinkedIn data synced successfully",
      profile: updatedProfile,
      postsCount,
      connectionsCount,
      lastSync: updatedUser.linkedinLastSync,
    })
  } catch (error) {
    console.error("❌ LinkedIn sync error:", error)
    return NextResponse.json(
      {
        error: "Failed to sync LinkedIn data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
