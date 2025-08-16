import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import mongoose from "mongoose"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    // Check for both email and id in session
    if (!session?.user?.email && !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { contentId, scheduleFor } = await req.json()

    if (!contentId) {
      return NextResponse.json({ error: "Content ID is required" }, { status: 400 })
    }

    await connectDB()

    if (!mongoose.connection.db) {
      throw new Error("Database connection not established")
    }

    // Find user by email or id
    let user = null
    if (session.user.email) {
      user = await User.findOne({ email: session.user.email })
    }
    if (!user && session.user.id) {
      user = await User.findById(session.user.id)
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check multiple collections for the content
    const collections = ["approvedcontents", "generatedcontents", "linkdin-content-generation"]
    let content = null
    let collection = null
    let userIdField: string | null = null

    for (const collectionName of collections) {
      try {
        const currentCollection = mongoose.connection.db.collection(collectionName)
        
        // Determine the user ID field based on collection
        let currentUserIdField = "userId"
        if (collectionName === "linkdin-content-generation") {
          currentUserIdField = "User ID\t"
        }

        // Try to find content in this collection
        const foundContent = await currentCollection.findOne({
          $and: [
            {
              $or: [
                { _id: new mongoose.Types.ObjectId(contentId) },
                { id: contentId },
                { ID: contentId }
              ]
            },
            {
              $or: [
                { email: user.email },
                { [currentUserIdField]: user._id.toString() },
                { [currentUserIdField]: user._id },
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

        if (foundContent) {
          content = foundContent
          collection = currentCollection
          userIdField = currentUserIdField
          console.log(`✅ Found content in ${collectionName} collection`)
          break
        }
      } catch (error) {
        console.error(`❌ Error checking ${collectionName} collection:`, error)
        continue
      }
    }

    if (!content) {
      return NextResponse.json({ error: "Pending content not found" }, { status: 404 })
    }

    // LinkedIn check is now optional - only check if user wants to post immediately
    let linkedinCheckRequired = false
    if (scheduleFor) {
      const scheduleDate = new Date(scheduleFor)
      if (scheduleDate <= new Date()) {
        linkedinCheckRequired = true // Immediate posting requires LinkedIn
      }
    }

    if (linkedinCheckRequired) {
      // Check if user has LinkedIn connected
      const userWithLinkedIn = await User.findById(user._id).select("linkedinProfile linkedinAccessToken linkedinTokenExpiry")

      if (!userWithLinkedIn?.linkedinAccessToken || !userWithLinkedIn?.linkedinProfile?.id) {
        return NextResponse.json(
          {
            error: "LinkedIn account not connected. Please connect your LinkedIn account first.",
          },
          { status: 400 },
        )
      }

      // Check if LinkedIn token is still valid
      if (userWithLinkedIn.linkedinTokenExpiry && new Date(userWithLinkedIn.linkedinTokenExpiry) <= new Date()) {
        return NextResponse.json(
          {
            error: "LinkedIn token expired. Please reconnect your LinkedIn account.",
          },
          { status: 400 },
        )
      }
    }

    // Update content status
    const updateData: any = {
      status: "approved",
      approvedAt: new Date(),
      updatedAt: new Date(),
      modifiedTime: new Date(),
      $unset: { rejectionReason: 1, error: 1 },
    }

    // If scheduleFor is provided, set it as scheduled
    if (scheduleFor) {
      const scheduleDate = new Date(scheduleFor)
      if (scheduleDate > new Date()) {
        updateData.status = "scheduled"
        updateData.scheduledFor = scheduleDate
        console.log(`📅 Content scheduled for: ${scheduleDate.toISOString()}`)
      } else {
        return NextResponse.json({ error: "Schedule time must be in the future" }, { status: 400 })
      }
    }

    // Build query to find the content
    const query: any = {
      $and: [
        {
          $or: [
            { _id: new mongoose.Types.ObjectId(contentId) },
            { id: contentId },
            { ID: contentId }
          ]
        },
        {
          $or: [
            { email: user.email },
            ...(userIdField ? [
              { [userIdField]: user._id.toString() },
              { [userIdField]: user._id }
            ] : []),
            { "user id": user._id.toString() },
            { user_id: user._id.toString() }
          ]
        }
      ]
    }

    if (!collection) {
      return NextResponse.json({ error: "Content collection not found" }, { status: 404 })
    }

    const result = await collection.updateOne(query, { $set: updateData })
    
    console.log(`APPROVE_DEBUG: ContentId=${contentId}, UpdatedStatus=${updateData.status}, ScheduleFor=${updateData.scheduledFor}, Collection=${collection.collectionName}`)

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Content not found or unauthorized" }, { status: 404 })
    }

    console.log(
      `✅ Content ${contentId} ${updateData.status === "scheduled" ? "scheduled for " + updateData.scheduledFor : "approved"}`,
    )

    return NextResponse.json({
      success: true,
      message:
        updateData.status === "scheduled"
          ? `Content approved and scheduled for ${new Date(updateData.scheduledFor).toLocaleString()}`
          : "Content approved successfully!",
    })
  } catch (error: any) {
    console.error("Error approving content:", error)
    return NextResponse.json(
      {
        error: error.message || "Failed to approve content",
      },
      { status: 500 },
    )
  }
}
