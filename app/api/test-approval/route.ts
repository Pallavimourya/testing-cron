import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import mongoose from "mongoose"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    console.log("🔍 Test Approval - Session data:", {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userEmail: session?.user?.email
    })

    if (!session?.user?.email && !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    if (!mongoose.connection.db) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
    }

    // Find user by email or id
    let user = null
    if (session.user.email) {
      user = await User.findOne({ email: session.user.email })
      console.log("👤 User found by email:", user ? user._id.toString() : "Not found")
    }
    if (!user && session.user.id) {
      user = await User.findById(session.user.id)
      console.log("👤 User found by id:", user ? user._id.toString() : "Not found")
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check what collections exist
    const collections = await mongoose.connection.db.listCollections().toArray()
    console.log("📚 Available collections:", collections.map(c => c.name))

    // Check for content in different collections
    const collectionsToCheck = ["approvedcontents", "generatedcontents", "linkdin-content-generation"]
    const contentSummary: { [key: string]: any } = {}

    for (const collectionName of collectionsToCheck) {
      try {
        const collection = mongoose.connection.db.collection(collectionName)
        const totalCount = await collection.countDocuments()
        
        // Check for user's content
        const userContentCount = await collection.countDocuments({
          $or: [
            { email: user.email },
            { userId: user._id.toString() },
            { userId: user._id },
            { "user id": user._id.toString() },
            { user_id: user._id.toString() }
          ]
        })

        // Check for pending content
        const pendingCount = await collection.countDocuments({
          $and: [
            {
              $or: [
                { email: user.email },
                { userId: user._id.toString() },
                { userId: user._id },
                { "user id": user._id.toString() },
                { user_id: user._id.toString() }
              ]
            },
            {
              $or: [
                { status: "pending" },
                { Status: "pending" },
                { status: "generated" },
                { Status: "generated" }
              ]
            }
          ]
        })

        contentSummary[collectionName] = {
          total: totalCount,
          userContent: userContentCount,
          pending: pendingCount
        }

        console.log(`📊 ${collectionName}:`, contentSummary[collectionName])
      } catch (error) {
        console.error(`❌ Error checking ${collectionName}:`, error)
        contentSummary[collectionName] = { error: error instanceof Error ? error.message : "Unknown error" }
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email
      },
      collections: contentSummary,
      session: {
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id,
        userEmail: session?.user?.email
      }
    })

  } catch (error) {
    console.error("❌ Test approval error:", error)
    return NextResponse.json({
      error: "Test failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
