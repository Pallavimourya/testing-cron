import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import mongoose from "mongoose"

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const scheduled = searchParams.get("scheduled")

    console.log("📊 Fetching approved content with params:", { status, limit, page, scheduled })

    if (!mongoose.connection.db) {
      throw new Error("Database connection not established")
    }

    // Check multiple collections for approved content
    const collections = ["approvedcontents", "linkdin-content-generation", "generatedcontents"]

    let allContent: any[] = []

    for (const collectionName of collections) {
      try {
        const collection = mongoose.connection.db.collection(collectionName)

        // Build query based on parameters
        const query: any = {
          $and: [
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

        // Add status filter
        if (status) {
          if (status === "scheduled") {
            query.$and.push({
              $or: [{ status: "scheduled" }, { Status: "scheduled" }],
            })
          } else {
            query.$and.push({
              $or: [{ status: status }, { Status: status }],
            })
          }
        }

        // Add scheduled filter
        if (scheduled === "true") {
          query.$and.push({
            $or: [{ scheduledFor: { $exists: true, $ne: null } }, { scheduled_for: { $exists: true, $ne: null } }],
          })
        }

        console.log(`🔍 Querying ${collectionName} with:`, JSON.stringify(query, null, 2))

        const content = await collection
          .find(query)
          .sort({ createdAt: -1, created_at: -1, _id: -1 })
          .limit(limit)
          .skip((page - 1) * limit)
          .toArray()

        console.log(`📄 Found ${content.length} items in ${collectionName}`)

        // Normalize the data structure
        const normalizedContent = content.map((item: any) => ({
          _id: item._id,
          id: item.id || item.ID || item._id.toString(),
          topicTitle: item.topicTitle || item["Topic Title"] || item.topic || item.Topic || "Untitled",
          content: item.content || item.Content || item.linkedinPost || "",
          hashtags: item.hashtags || item.Hashtags || [],
          keyPoints: item.keyPoints || item["Key Points"] || [],
          imageUrl: item.imageUrl || item.Image || item.image_url || null,
          imageGenerated: item.imageGenerated || item.image_generated || false,
          aiGenerationUsed: item.aiGenerationUsed || item.ai_generation_used || false,
          status: item.status || item.Status || "approved",
          platform: item.platform || item.Platform || "linkedin",
          contentType: item.contentType || item["Content Type"] || "post",
          scheduledFor: item.scheduledFor || item.scheduled_for || null,
          postedAt: item.postedAt || item.posted_at || null,
          createdAt: item.createdAt || item.created_at || item._id.getTimestamp(),
          updatedAt: item.updatedAt || item.updated_at || item.modifiedTime || new Date(),
          collection: collectionName,
        }))

        allContent = [...allContent, ...normalizedContent]
      } catch (error) {
        console.error(`❌ Error querying ${collectionName}:`, error)
      }
    }

    // Remove duplicates based on content similarity
    const uniqueContent = allContent.filter(
      (item, index, self) =>
        index ===
        self.findIndex((t) => t.content === item.content || t.topicTitle === item.topicTitle || t.id === item.id),
    )

    // Sort by creation date (newest first)
    uniqueContent.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    console.log(`✅ Returning ${uniqueContent.length} unique approved content items`)

    return NextResponse.json({
      success: true,
      content: uniqueContent,
      total: uniqueContent.length,
      page,
      limit,
      hasMore: uniqueContent.length === limit,
    })
  } catch (error: any) {
    console.error("❌ Error fetching approved content:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch approved content",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
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

    const body = await request.json()
    const { topicTitle, content, hashtags = [], keyPoints = [], platform = "linkedin", contentType = "post" } = body

    if (!topicTitle || !content) {
      return NextResponse.json({ error: "Topic title and content are required" }, { status: 400 })
    }

    if (!mongoose.connection.db) {
      throw new Error("Database connection not established")
    }

    const collection = mongoose.connection.db.collection("approvedcontents")

    const newContent = {
      id: new mongoose.Types.ObjectId().toString(),
      userId: user._id,
      email: user.email,
      topicTitle,
      content,
      hashtags,
      keyPoints,
      platform,
      contentType,
      status: "approved",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await collection.insertOne(newContent)

    console.log("✅ Created new approved content:", result.insertedId)

    return NextResponse.json({
      success: true,
      message: "Content created successfully",
      content: { ...newContent, _id: result.insertedId },
    })
  } catch (error: any) {
    console.error("❌ Error creating approved content:", error)
    return NextResponse.json(
      {
        error: "Failed to create content",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
