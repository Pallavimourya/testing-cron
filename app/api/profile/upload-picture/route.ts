import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import UserProfile from "@/models/UserProfile"
import { v2 as cloudinary } from "cloudinary"

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("profilePicture") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large" }, { status: 400 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Cloudinary
    const uploadResult = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: "linkzup-profile-pictures",
          resource_type: "image",
          transformation: [
            { width: 400, height: 400, crop: "fill", gravity: "face" },
            { quality: "auto", fetch_format: "auto" }
          ]
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      ).end(buffer)
    })

    if (!uploadResult || !uploadResult.secure_url) {
      return NextResponse.json({ error: "Failed to upload to Cloudinary" }, { status: 500 })
    }

    // Update user profile picture in database
    await connectDB()
    
    // First find the user to get userId
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Update UserProfile model with the profile picture
    const userProfile = await UserProfile.findOneAndUpdate(
      { userId: user._id },
      { profilePhoto: uploadResult.secure_url },
      { new: true, upsert: true },
    )

    // Also update User model for consistency
    await User.findOneAndUpdate(
      { email: session.user.email },
      { profilePicture: uploadResult.secure_url },
      { new: true },
    )

    return NextResponse.json({
      success: true,
      profilePictureUrl: uploadResult.secure_url,
      message: "Profile picture updated successfully",
    })
  } catch (error) {
    console.error("Error uploading profile picture:", error)
    return NextResponse.json({ error: "Failed to upload profile picture" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Update user profile picture to empty string in database
    await connectDB()
    
    // First find the user to get userId
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Update UserProfile model with empty profile picture
    const userProfile = await UserProfile.findOneAndUpdate(
      { userId: user._id },
      { profilePhoto: "" },
      { new: true, upsert: true },
    )

    // Also update User model for consistency
    await User.findOneAndUpdate(
      { email: session.user.email },
      { profilePicture: "" },
      { new: true },
    )

    return NextResponse.json({
      success: true,
      message: "Profile picture removed successfully",
    })
  } catch (error) {
    console.error("Error removing profile picture:", error)
    return NextResponse.json({ error: "Failed to remove profile picture" }, { status: 500 })
  }
}
