import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../auth/[...nextauth]/auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import mongoose from "mongoose"
import { convertISTToUTC, isScheduledTimeValid } from "@/lib/timezone-utils"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { id } = await params
    const body = await request.json()
    const { scheduledFor } = body

    if (!scheduledFor) {
      return NextResponse.json({ error: "Scheduled date is required" }, { status: 400 })
    }

    // Convert IST datetime string to UTC Date object
    const scheduledDate = convertISTToUTC(scheduledFor)
    
    // Validate that the scheduled time is at least 5 minutes in the future
    if (!isScheduledTimeValid(scheduledFor)) {
      return NextResponse.json({ 
        error: "Scheduled time must be at least 5 minutes in the future (IST)" 
      }, { status: 400 })
    }

    console.log("📅 Scheduling individual post:", id)
    console.log("📅 Scheduled time (IST input):", scheduledFor)
    console.log("📅 Scheduled time (UTC):", scheduledDate.toISOString())
    console.log("📅 Scheduled time (IST):", scheduledDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }))
    console.log("📅 Current time (UTC):", new Date().toISOString())
    console.log("📅 Current time (IST):", new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }))
    console.log("👤 User email:", user.email)
    console.log("👤 User ID:", user._id.toString())

    if (!mongoose.connection.db) {
      throw new Error("Database connection not established")
    }

    // Try to update in multiple collections with improved query logic
    const collections = ["approvedcontents", "linkdin-content-generation", "generatedcontents"]
    let updated = false

    for (const collectionName of collections) {
      try {
        const collection = mongoose.connection.db.collection(collectionName)

        // Try multiple query strategies
        const queries = [
          // Strategy 1: Direct ID match with user filter
          {
            $and: [
              {
                $or: [
                  { _id: new mongoose.Types.ObjectId(id) },
                  { id: id },
                  { ID: id }
                ]
              },
              {
                $or: [
                  { email: user.email },
                  { "user id": user._id.toString() },
                  { user_id: user._id.toString() },
                  { userId: user._id.toString() },
                  { userId: user._id },
                  { userEmail: user.email },
                  { user_email: user.email }
                ],
              },
            ]
          },
          // Strategy 2: String ID match with user filter
          {
            $and: [
              {
                $or: [
                  { _id: id },
                  { id: id },
                  { ID: id }
                ]
              },
              {
                $or: [
                  { email: user.email },
                  { "user id": user._id.toString() },
                  { user_id: user._id.toString() },
                  { userId: user._id.toString() },
                  { userId: user._id },
                  { userEmail: user.email },
                  { user_email: user.email }
                ],
              },
            ]
          },
          // Strategy 3: Broader search without user filter
          {
            $or: [
              { _id: new mongoose.Types.ObjectId(id) },
              { id: id },
              { ID: id },
              { _id: id }
            ]
          }
        ]

        for (const query of queries) {
          try {
            const result = await collection.updateOne(
              query,
              {
                $set: {
                  status: "scheduled",
                  Status: "scheduled",
                  scheduledFor: scheduledDate,
                  scheduled_for: scheduledDate,
                  updatedAt: new Date(),
                  updated_at: new Date(),
                  modifiedTime: new Date(),
                },
              },
            )

            if (result.matchedCount > 0) {
              console.log(`✅ Scheduled post in ${collectionName} using query strategy`)
              updated = true
              break
            }
          } catch (error) {
            console.log(`❌ Query strategy failed in ${collectionName}:`, error)
            continue
          }
        }

        if (updated) break

      } catch (error) {
        console.error(`❌ Error scheduling in ${collectionName}:`, error)
      }
    }

    if (!updated) {
      console.error("❌ Content not found in any collection. Available fields in collections:")
      for (const collectionName of collections) {
        try {
          const collection = mongoose.connection.db.collection(collectionName)
          const sampleDoc = await collection.findOne({})
          if (sampleDoc) {
            console.log(`📋 ${collectionName} sample document structure:`, Object.keys(sampleDoc))
          }
        } catch (error) {
          console.log(`❌ Could not check ${collectionName}:`, error)
        }
      }
      return NextResponse.json({ error: "Content not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Post scheduled successfully",
      scheduledFor: scheduledDate,
    })
  } catch (error: any) {
    console.error("❌ Error scheduling post:", error)
    return NextResponse.json(
      {
        error: "Failed to schedule post",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
