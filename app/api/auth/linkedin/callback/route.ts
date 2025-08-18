import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import mongoose from "mongoose"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")
    const state = searchParams.get("state")
    const error = searchParams.get("error")
    const errorDescription = searchParams.get("error_description")

    console.log("🔗 LinkedIn callback received:", { code: !!code, state: !!state, error, errorDescription })

    // Handle LinkedIn OAuth errors
    if (error) {
      console.error("❌ LinkedIn OAuth error:", error, errorDescription)
      const errorParam = error === "user_cancelled_login" ? "user_cancelled" : "linkedin_auth_failed"
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/linkedin?error=${errorParam}`)
    }

    if (!code || !state) {
      console.error("❌ Missing required parameters:", { code: !!code, state: !!state })
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/linkedin?error=missing_params`)
    }

    // Verify state parameter
    let stateData
    try {
      stateData = JSON.parse(Buffer.from(state, "base64").toString())
      console.log("✅ State verified:", { userId: stateData.userId })
    } catch (stateError) {
      console.error("❌ Invalid state parameter:", stateError)
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/linkedin?error=invalid_state`)
    }

    const { userId } = stateData

    if (!userId) {
      console.error("❌ No userId in state")
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/linkedin?error=invalid_state`)
    }

    console.log("🔄 Exchanging code for access token...")

    // Dynamic redirect URI based on environment
    let redirectUri = process.env.LINKEDIN_REDIRECT_URI
    if (!redirectUri) {
      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
      redirectUri = `${baseUrl}/api/auth/linkedin/callback`
    }

    console.log("🔍 Token exchange details:", {
      clientId: process.env.LINKEDIN_CLIENT_ID ? "✅ Set" : "❌ Missing",
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET ? "✅ Set" : "❌ Missing",
      redirectUri,
      codeLength: code?.length || 0,
      code: code?.substring(0, 10) + "...", // Show first 10 chars for debugging
    })

    // Exchange code for access token
    const tokenResponse = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: process.env.LINKEDIN_CLIENT_ID!,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenResponse.ok) {
      const tokenError = await tokenResponse.text()
      console.error("❌ Token exchange failed:", tokenResponse.status, tokenError)
      console.error("❌ Token exchange request details:", {
        url: "https://www.linkedin.com/oauth/v2/accessToken",
        method: "POST",
        clientId: process.env.LINKEDIN_CLIENT_ID,
        redirectUri,
        responseStatus: tokenResponse.status,
        responseText: tokenError,
      })
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/linkedin?error=token_exchange_failed`)
    }

    const tokenData = await tokenResponse.json()
    const { access_token, expires_in } = tokenData

    console.log("✅ Access token received, expires in:", expires_in, "seconds")

    // Fetch LinkedIn profile
    console.log("👤 Fetching LinkedIn profile...")
    const profileResponse = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    })

    if (!profileResponse.ok) {
      const profileError = await profileResponse.text()
      console.error("❌ Profile fetch failed:", profileResponse.status, profileError)
      
      // Handle specific error cases
      if (profileResponse.status === 429) {
        console.error("❌ LinkedIn API rate limit exceeded")
        return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/linkedin?error=rate_limit_exceeded`)
      } else if (profileResponse.status === 401) {
        console.error("❌ LinkedIn API unauthorized")
        return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/linkedin?error=unauthorized`)
      } else {
        return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/linkedin?error=profile_fetch_failed`)
      }
    }

    const profileData = await profileResponse.json()
    console.log("✅ LinkedIn profile fetched:", {
      id: profileData.sub,
      name: profileData.name,
      email: profileData.email,
    })

    // Save LinkedIn data to database
    await connectDB()

    // Update User model
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        linkedinAccessToken: access_token,
        linkedinTokenExpiry: new Date(Date.now() + expires_in * 1000),
        linkedinProfile: {
          id: profileData.sub,
          name: profileData.name,
          email: profileData.email,
          picture: profileData.picture,
          profileUrl: `https://www.linkedin.com/in/${profileData.sub}`,
        },
        linkedinConnectedAt: new Date(),
        linkedinLastSync: new Date(),
      },
      { new: true },
    )

    if (!updatedUser) {
      console.error("❌ User not found for update:", userId)
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/linkedin?error=user_not_found`)
    }

    // Also save to linkedindetails collection for backward compatibility
    if (mongoose.connection.db) {
      const linkedinDetailsCollection = mongoose.connection.db.collection("linkedindetails")

      await linkedinDetailsCollection.updateOne(
        {
          $or: [{ userId: new mongoose.Types.ObjectId(userId) }, { userId: userId }, { email: updatedUser.email }],
        },
        {
          $set: {
            userId: new mongoose.Types.ObjectId(userId),
            email: updatedUser.email,
            accessToken: access_token,
            tokenExpiry: new Date(Date.now() + expires_in * 1000),
            linkedinId: profileData.sub,
            name: profileData.name,
            profileUrl: `https://www.linkedin.com/in/${profileData.sub}`,
            connectedAt: new Date(),
            lastSync: new Date(),
            updatedAt: new Date(),
          },
        },
        { upsert: true },
      )

      console.log("✅ LinkedIn details saved to collection")
    }

    console.log("✅ LinkedIn connection successful for user:", updatedUser.email)

    // Redirect back to LinkedIn dashboard with success
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/linkedin?linkedin=connected`)
  } catch (error) {
    console.error("❌ LinkedIn callback error:", error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/linkedin?error=callback_failed`)
  }
}
