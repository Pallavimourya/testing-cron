import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../auth/[...nextauth]/auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import mongoose from "mongoose"
import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    console.log("🗑️ Deleting image for approved content:", id)

    // Find the content first
    if (!mongoose.connection.db) {
      throw new Error("Database connection not established")
    }

    const collection = mongoose.connection.db.collection("approvedcontents")
    
    // Build query to handle both string IDs and ObjectIds
    const query = {
      $and: [
        {
          $or: [
            { id: id },
            { ID: id },
            // Only add ObjectId if it's a valid 24-character hex string
            ...(mongoose.Types.ObjectId.isValid(id) && id.length === 24 ? [{ _id: new mongoose.Types.ObjectId(id) }] : [])
          ],
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
    
    const contentData = await collection.findOne(query)

    if (!contentData) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 })
    }

    // Delete image from Cloudinary if exists
    const imageUrl = contentData.imageUrl || contentData.Image
    if (imageUrl) {
      try {
        const publicIdMatch = imageUrl.match(/\/v\d+\/(.+?)\./)
        if (publicIdMatch && publicIdMatch[1]) {
          const publicId = publicIdMatch[1]
          await cloudinary.uploader.destroy(publicId)
          console.log("✅ Image deleted from Cloudinary:", publicId)
        }
      } catch (cloudinaryError) {
        console.warn("Warning: Could not delete image from Cloudinary:", cloudinaryError)
        // Continue with database update even if Cloudinary deletion fails
      }
    }

    // Update the content to remove image references
    const updateResult = await collection.updateOne(
      query, // Use the same query we built above
      {
        $unset: {
          imageUrl: 1,
          Image: 1,
          imageGenerated: 1,
          image_generated: 1,
        },
        $set: {
          updatedAt: new Date(),
          updated_at: new Date(),
        },
      }
    )

    console.log("📊 Update result:", {
      matchedCount: updateResult.matchedCount,
      modifiedCount: updateResult.modifiedCount,
      contentId: id,
      hadImage: !!imageUrl
    })

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: "Content not found for update" }, { status: 404 })
    }

    // Verify the update worked by fetching the updated content
    const updatedContent = await collection.findOne(query)
    console.log("✅ Updated content imageUrl:", updatedContent?.imageUrl)
    console.log("✅ Updated content Image:", updatedContent?.Image)
    console.log("✅ Updated content imageGenerated:", updatedContent?.imageGenerated)

    console.log("✅ Image deleted successfully for content:", id)

    return NextResponse.json({
      success: true,
      message: "Image deleted successfully!",
      updatedContent: {
        id: updatedContent?.id || updatedContent?._id?.toString(),
        imageUrl: updatedContent?.imageUrl,
        imageGenerated: updatedContent?.imageGenerated,
        hasImage: !!(updatedContent?.imageUrl || updatedContent?.Image)
      }
    })

  } catch (error: any) {
    console.error("❌ Error deleting image:", error)
    return NextResponse.json(
      {
        error: "Failed to delete image",
        details: error.message,
      },
      { status: 500 }
    )
  }
}
