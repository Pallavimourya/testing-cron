import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../auth/[...nextauth]/auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import mongoose from "mongoose"

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
    const contentId = id

    console.log("📤 Posting approved content to LinkedIn, ID:", contentId)
    console.log("👤 User email:", user.email)
    console.log("👤 User ID:", user._id.toString())

    // Find content in approvedcontents collection with improved query
    let contentData = null
    if (mongoose.connection.db) {
      const collection = mongoose.connection.db.collection("approvedcontents")

      // Try multiple query strategies
      const queries = [
        // Strategy 1: Direct ID match
        {
          $or: [
            { _id: new mongoose.Types.ObjectId(contentId) },
            { id: contentId },
            { ID: contentId }
          ]
        },
        // Strategy 2: String ID match
        {
          $or: [
            { _id: contentId },
            { id: contentId },
            { ID: contentId }
          ]
        }
      ]

      for (const query of queries) {
        try {
          contentData = await collection.findOne({
            $and: [
              query,
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
            ],
          })

          if (contentData) {
            console.log(`✅ Found content using query strategy:`, query)
            break
          }
        } catch (error) {
          console.log(`❌ Query strategy failed:`, error)
          continue
        }
      }

      // If still not found, try a broader search
      if (!contentData) {
        console.log("🔍 Trying broader search...")
        contentData = await collection.findOne({
          $or: [
            { _id: new mongoose.Types.ObjectId(contentId) },
            { id: contentId },
            { ID: contentId },
            { _id: contentId }
          ]
        })
      }

      console.log("📊 Found content in approvedcontents:", !!contentData)
      if (contentData) {
        console.log("📋 Content details:", {
          id: contentData._id,
          status: contentData.status,
          email: contentData.email,
          userId: contentData.userId,
          contentLength: (contentData.content || contentData.Content || contentData["generated content"] || "").length
        })
      }
    }

    if (!contentData) {
      console.error("❌ Content not found. Available fields in collection:")
      if (mongoose.connection.db) {
        const collection = mongoose.connection.db.collection("approvedcontents")
        const sampleDoc = await collection.findOne({})
        if (sampleDoc) {
          console.log("📋 Sample document structure:", Object.keys(sampleDoc))
        }
      }
      return NextResponse.json({ error: "Approved content not found" }, { status: 404 })
    }

    // Extract content details with fallbacks
    const content = contentData.content || contentData.Content || contentData["generated content"] || contentData.content || ""
    const imageUrl = contentData.imageUrl || contentData.Image || contentData.image_url || contentData.image || null
    const topicTitle = contentData.topicTitle || contentData.Topic || contentData.topic_title || contentData.title || ""

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "No content to post" }, { status: 400 })
    }

    console.log("📝 Content details:", {
      contentLength: content.length,
      hasImage: !!imageUrl,
      topicTitle: topicTitle,
    })

    // Get the host from the request
    const host = request.headers.get("host") || "localhost:3000"
    const protocol = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https")

    // Post to LinkedIn using the existing LinkedIn API
    const linkedinResponse = await fetch(`${protocol}://${host}/api/linkedin/post`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: request.headers.get("cookie") || "",
      },
      body: JSON.stringify({
        content: content,
        imageUrl: imageUrl,
        contentId: contentId,
      }),
    })

    const linkedinResult = await linkedinResponse.json()

    if (linkedinResponse.ok) {
      console.log("✅ Successfully posted to LinkedIn:", linkedinResult)

      // Update content status in approvedcontents collection
      if (mongoose.connection.db) {
        const collection = mongoose.connection.db.collection("approvedcontents")

        await collection.updateOne(
          {
            $or: [
              { _id: new mongoose.Types.ObjectId(contentId) },
              { id: contentId },
              { ID: contentId },
              { _id: contentId }
            ],
          },
          {
            $set: {
              status: "posted",
              postedAt: new Date(),
              posted_at: new Date(),
              linkedinPostId: linkedinResult.postId || linkedinResult.linkedinPostId,
              linkedin_post_id: linkedinResult.postId || linkedinResult.linkedinPostId,
              linkedinUrl: linkedinResult.url,
              linkedin_url: linkedinResult.url,
              updatedAt: new Date(),
              updated_at: new Date(),
            },
          },
        )

        console.log("✅ Updated content status to 'posted' in approvedcontents collection")
      }

      return NextResponse.json({
        success: true,
        message: "Content posted to LinkedIn successfully",
        postId: linkedinResult.postId || linkedinResult.linkedinPostId,
        linkedinUrl: linkedinResult.url,
      })
    } else {
      console.error("❌ Failed to post to LinkedIn:", linkedinResult)

      // Update content status to failed
      if (mongoose.connection.db) {
        const collection = mongoose.connection.db.collection("approvedcontents")

        await collection.updateOne(
          {
            $or: [
              { _id: new mongoose.Types.ObjectId(contentId) },
              { id: contentId },
              { ID: contentId },
              { _id: contentId }
            ],
          },
          {
            $set: {
              status: "failed",
              error: linkedinResult.error || "Failed to post to LinkedIn",
              updatedAt: new Date(),
              updated_at: new Date(),
            },
          },
        )

        console.log("❌ Updated content status to 'failed' in approvedcontents collection")
      }

      return NextResponse.json(
        {
          error: linkedinResult.error || "Failed to post to LinkedIn",
          details: linkedinResult,
        },
        { status: linkedinResponse.status },
      )
    }
  } catch (error) {
    console.error("❌ Error posting to LinkedIn:", error)
    return NextResponse.json(
      {
        error: "Failed to post to LinkedIn",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
