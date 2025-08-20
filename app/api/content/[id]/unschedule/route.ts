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

    console.log("🗑️ Unscheduling post:", id)

    if (!mongoose.connection.db) {
      throw new Error("Database connection not established")
    }

    const collections = ["approvedcontents", "linkdin-content-generation", "generatedcontents"]
    let unscheduled = false

    // Try to unschedule from each collection
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
                  { userId: user._id.toString() },
                  { user_id: user._id.toString() },
                  { userId: user._id },
                ],
              },
              {
                $or: [{ status: "scheduled" }, { Status: "scheduled" }],
              },
            ],
          },
          {
            $set: {
              status: "approved",
              Status: "approved",
              updatedAt: new Date(),
              updated_at: new Date(),
              unscheduledAt: new Date(),
              unscheduledBy: user._id,
            },
            $unset: {
              scheduledFor: 1,
              scheduled_for: 1,
              scheduleType: 1,
              scheduledBy: 1,
              scheduledAt: 1,
              error: 1,
              lastAttempt: 1,
            },
          },
        )

        if (result.matchedCount > 0) {
          console.log(`✅ Unscheduled post ${id} from ${collectionName}`)
          unscheduled = true
          break
        }
      } catch (error) {
        console.error(`❌ Error unscheduling from ${collectionName}:`, error)
      }
    }

    if (!unscheduled) {
      return NextResponse.json({ error: "Post not found or not scheduled" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Post unscheduled successfully",
    })
  } catch (error: any) {
    console.error("❌ Error unscheduling post:", error)
    return NextResponse.json(
      {
        error: "Failed to unschedule post",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
