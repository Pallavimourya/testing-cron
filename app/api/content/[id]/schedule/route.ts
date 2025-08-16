import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../auth/[...nextauth]/auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import mongoose from "mongoose"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const scheduledDate = new Date(scheduledFor)
    if (scheduledDate <= new Date()) {
      return NextResponse.json({ error: "Scheduled date must be in the future" }, { status: 400 })
    }

    console.log("📅 Updating schedule for content:", id, "to", scheduledDate)

    if (!mongoose.connection.db) {
      throw new Error("Database connection not established")
    }

    // Try to update in multiple collections
    const collections = ["approvedcontents", "linkdin-content-generation", "generatedcontents"]
    let updated = false

    for (const collectionName of collections) {
      try {
        const collection = mongoose.connection.db.collection(collectionName)

        const result = await collection.updateOne(
          {
            $and: [
              {
                $or: [{ _id: new mongoose.Types.ObjectId(id) }, { id: id }, { ID: id }],
              },
              {
                $or: [
                  { email: user.email },
                  { "user id": user._id.toString() },
                  { user_id: user._id.toString() },
                  { userId: user._id.toString() },
                  { userId: user._id },
                ],
              },
            ],
          },
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
          console.log(`✅ Updated content in ${collectionName}`)
          updated = true
          break
        }
      } catch (error) {
        console.error(`❌ Error updating in ${collectionName}:`, error)
      }
    }

    if (!updated) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Content schedule updated successfully",
      scheduledFor: scheduledDate,
    })
  } catch (error: any) {
    console.error("❌ Error updating content schedule:", error)
    return NextResponse.json(
      {
        error: "Failed to update schedule",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
