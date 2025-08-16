import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../[...nextauth]/auth"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // LinkedIn OAuth 2.0 configuration
    const clientId = process.env.LINKEDIN_CLIENT_ID

    // Dynamic redirect URI based on environment
    let redirectUri = process.env.LINKEDIN_REDIRECT_URI
    if (!redirectUri) {
      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
      redirectUri = `${baseUrl}/api/auth/linkedin/callback`
    }

    if (!clientId) {
      console.error("LinkedIn client ID not found in environment variables")
      return NextResponse.json({ error: "LinkedIn client ID not configured" }, { status: 500 })
    }

    console.log("🔗 LinkedIn OAuth config:", {
      clientId: clientId.substring(0, 8) + "...",
      redirectUri,
      environment: process.env.NODE_ENV,
    })

    // Generate state parameter for security
    const state = Buffer.from(
      JSON.stringify({
        userId: session.user.id,
        timestamp: Date.now(),
      }),
    ).toString("base64")

    // LinkedIn OAuth scopes for profile and posts
    const scopes = [
      "openid",
      "profile",
      "email",
      "w_member_social", // For posting to LinkedIn
    ].join(" ")

    // Build LinkedIn authorization URL
    const authUrl = new URL("https://www.linkedin.com/oauth/v2/authorization")
    authUrl.searchParams.set("response_type", "code")
    authUrl.searchParams.set("client_id", clientId)
    authUrl.searchParams.set("redirect_uri", redirectUri)
    authUrl.searchParams.set("state", state)
    authUrl.searchParams.set("scope", scopes)

    console.log("Generated LinkedIn auth URL:", authUrl.toString())

    return NextResponse.json({
      authUrl: authUrl.toString(),
      state,
    })
  } catch (error) {
    console.error("LinkedIn auth error:", error)
    return NextResponse.json({ error: "Failed to generate LinkedIn auth URL" }, { status: 500 })
  }
}
