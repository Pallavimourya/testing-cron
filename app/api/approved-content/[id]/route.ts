import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import mongoose from "mongoose"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    console.log("🔍 Fetching approved content by ID:", id)

    if (mongoose.connection.db) {
      const collection = mongoose.connection.db.collection("approvedcontents")

      // Build query to handle both ObjectId and string IDs
      const query: any = {
        $and: [
          {
            $or: [
              { id: id },
              { ID: id },
              { _id: id }
            ]
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
      }

      // Only try ObjectId conversion if the ID looks like a valid ObjectId
      if (mongoose.Types.ObjectId.isValid(id) && id.length === 24) {
        query.$and[0].$or.push({ _id: new mongoose.Types.ObjectId(id) })
      }

      const content = await collection.findOne(query)

      if (!content) {
        return NextResponse.json({ error: "Content not found" }, { status: 404 })
      }

      // Transform the data
      const transformedContent = {
        id: content._id?.toString() || content.id || content.ID || id,
        topicId: content.topicId || content.topic_id || content["Topic ID"] || id,
        topicTitle: content.topicTitle || content.Topic || content.topic_title || "Untitled Topic",
        content: content.content || content.Content || content["generated content"] || "",
        hashtags: content.hashtags || content.Hashtags || [],
        keyPoints: content.keyPoints || content["Key Points"] || [],
        imageUrl: content.imageUrl || content.Image || content.image_url || null,
        imageGenerated: content.imageGenerated || content.image_generated || false,
        aiGenerationUsed: content.aiGenerationUsed || content.ai_generation_used || false,
        contentType: content.contentType || content.content_type || "storytelling",
        status: content.status || "approved",
        generatedAt: content.generatedAt || content.generated_at || content.createdAt,
        approvedAt: content.approvedAt || content.approved_at || content.createdAt,
        postedAt: content.postedAt || content.posted_at || null,
        createdAt: content.createdAt || content.created_at,
        updatedAt: content.updatedAt || content.updated_at,
      }

      return NextResponse.json({
        success: true,
        content: transformedContent,
      })
    }

    return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
  } catch (error) {
    console.error("❌ Error fetching approved content:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch approved content",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check for both email and id in session
    if (!session?.user?.email && !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    
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

    const { id } = await params
    const body = await request.json()
    const { topicTitle, content, hashtags, keyPoints, contentType, imageUrl, status, approvedAt, postedAt, failedAt } = body

    console.log("📝 Updating approved content:", id)

    if (mongoose.connection.db) {
      const collection = mongoose.connection.db.collection("approvedcontents")

      const updateData: any = {
        updatedAt: new Date(),
        updated_at: new Date(),
      }

      // Handle content fields
      if (topicTitle) updateData.topicTitle = topicTitle
      if (content) updateData.content = content
      if (hashtags) updateData.hashtags = hashtags
      if (keyPoints) updateData.keyPoints = keyPoints
      if (contentType) updateData.contentType = contentType
      if (imageUrl !== undefined) updateData.imageUrl = imageUrl

      // Handle status updates
      if (status) {
        updateData.status = status
        if (status === "approved" && approvedAt) updateData.approvedAt = new Date(approvedAt)
        if (status === "posted" && postedAt) updateData.postedAt = new Date(postedAt)
        if (status === "failed" && failedAt) updateData.failedAt = new Date(failedAt)
      }

      // Build query to handle both ObjectId and string IDs
      const query: any = {
        $and: [
          {
            $or: [
              { id: id },
              { ID: id },
              { _id: id }
            ]
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
      }

      // Only try ObjectId conversion if the ID looks like a valid ObjectId
      if (mongoose.Types.ObjectId.isValid(id) && id.length === 24) {
        query.$and[0].$or.push({ _id: new mongoose.Types.ObjectId(id) })
      }

      const result = await collection.updateOne(
        query,
        { $set: updateData },
      )

      if (result.matchedCount === 0) {
        return NextResponse.json({ error: "Content not found" }, { status: 404 })
      }

      console.log("✅ Updated approved content:", id)

      return NextResponse.json({
        success: true,
        message: "Content updated successfully",
      })
    }

    return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
  } catch (error) {
    console.error("❌ Error updating approved content:", error)
    return NextResponse.json(
      {
        error: "Failed to update approved content",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    console.log("🗑️ Deleting approved content:", id)

    if (mongoose.connection.db) {
      const collection = mongoose.connection.db.collection("approvedcontents")

      // Build query to handle both ObjectId and string IDs
      const query: any = {
        $and: [
          {
            $or: [
              { id: id },
              { ID: id },
              { _id: id }
            ]
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
      }

      // Only try ObjectId conversion if the ID looks like a valid ObjectId
      if (mongoose.Types.ObjectId.isValid(id) && id.length === 24) {
        query.$and[0].$or.push({ _id: new mongoose.Types.ObjectId(id) })
      }

      const result = await collection.deleteOne(query)

      if (result.deletedCount === 0) {
        return NextResponse.json({ error: "Content not found" }, { status: 404 })
      }

      console.log("✅ Deleted approved content:", id)

      return NextResponse.json({
        success: true,
        message: "Content deleted successfully",
      })
    }

    return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
  } catch (error) {
    console.error("❌ Error deleting approved content:", error)
    return NextResponse.json(
      {
        error: "Failed to delete approved content",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
