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

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const { imageFile, isReplace = false } = await request.json()

    console.log("📤 Uploading image for approved content:", id, "Replace:", isReplace)

    if (!imageFile) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 })
    }

    // Validate base64 image format
    if (!imageFile.startsWith('data:image/')) {
      return NextResponse.json({ error: "Invalid image format" }, { status: 400 })
    }

    // Find the content first
    if (!mongoose.connection.db) {
      throw new Error("Database connection not established")
    }

    const collection = mongoose.connection.db.collection("approvedcontents")
    // Build query to handle both ObjectId and string IDs
    const query: any = {
      $and: [
        {
          $or: [
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
          ],
        },
      ],
    }

    // Only try ObjectId conversion if the ID looks like a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(id) && id.length === 24) {
      query.$and[0].$or.push({ _id: new mongoose.Types.ObjectId(id) })
    }

    const contentData = await collection.findOne(query)

    if (!contentData) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 })
    }

    // Delete old image from Cloudinary if replacing
    if (isReplace && (contentData.imageUrl || contentData.Image)) {
      const oldImageUrl = contentData.imageUrl || contentData.Image
      try {
        const publicIdMatch = oldImageUrl.match(/\/v\d+\/(.+?)\./)
        if (publicIdMatch && publicIdMatch[1]) {
          const publicId = publicIdMatch[1]
          await cloudinary.uploader.destroy(publicId)
          console.log("🗑️ Old image deleted from Cloudinary:", publicId)
        }
      } catch (error) {
        console.warn("Warning: Could not delete old image from Cloudinary:", error)
      }
    }

    // Upload to Cloudinary
    let imageUrl: string
    try {
      const uploadResult = await cloudinary.uploader.upload(imageFile, {
        folder: "linkzup-approved-content",
        resource_type: "image",
        transformation: [
          { width: 1200, height: 630, crop: "fill", gravity: "center" },
          { quality: "auto", fetch_format: "auto" }
        ],
        allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"]
      })
      
      imageUrl = uploadResult.secure_url
      console.log("✅ Image uploaded to Cloudinary:", imageUrl)
    } catch (cloudinaryError: any) {
      console.error("❌ Cloudinary upload error:", cloudinaryError)
      return NextResponse.json({ 
        error: "Failed to upload image to Cloudinary",
        details: cloudinaryError.message 
      }, { status: 500 })
    }

    // Update the content with the new image URL
    const updateResult = await collection.updateOne(
      query, // Use the same query we built above
      {
        $set: {
          imageUrl: imageUrl,
          Image: imageUrl,
          imageGenerated: false, // This is manually uploaded, not AI generated
          image_generated: false,
          updatedAt: new Date(),
          updated_at: new Date(),
        },
      }
    )

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: "Content not found for update" }, { status: 404 })
    }

    console.log("✅ Image uploaded and saved for content:", id)

    return NextResponse.json({
      success: true,
      imageUrl: imageUrl,
      isReplace,
      message: isReplace ? "Image replaced successfully!" : "Image uploaded successfully!"
    })

  } catch (error: any) {
    console.error("❌ Error uploading image:", error)
    return NextResponse.json(
      {
        error: "Failed to upload image",
        details: error.message,
      },
      { status: 500 }
    )
  }
}
