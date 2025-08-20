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

    const { style, name, email } = await request.json()

    if (!style) {
      return NextResponse.json({ error: "Avatar style is required" }, { status: 400 })
    }

    // Generate avatar based on style
    let avatarUrl = ""
    const initials = name
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase() || "U"

    // Generate a unique seed based on email
    const seed = email || session.user.email || "user"

    switch (style) {
      case "initials":
        // Use UI Avatars for initials with random background
        avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=200&background=random&color=fff&font-size=0.6&bold=true&length=2`
        break
      case "geometric":
        // Use DiceBear shapes for geometric patterns
        avatarUrl = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(seed)}&size=200&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`
        break
      case "gradient":
        // Use UI Avatars with gradient background
        avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=200&background=linear-gradient(45deg,ff6b6b,4ecdc4,45b7d1,96ceb4,ffeaa7)&color=fff&font-size=0.6&bold=true&length=2`
        break
      case "minimal":
        // Use DiceBear initials for minimal style
        avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}&size=200&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&textColor=000000`
        break
      default:
        // Default to UI Avatars with random background
        avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=200&background=random&color=fff&font-size=0.6&bold=true&length=2`
    }

    // Upload avatar to Cloudinary for consistency
    const uploadResult = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload(
        avatarUrl,
        {
          folder: "linkzup-profile-pictures",
          resource_type: "image",
          public_id: `avatar_${session.user.email}_${Date.now()}`,
          transformation: [
            { width: 400, height: 400, crop: "fill" },
            { quality: "auto", fetch_format: "auto" }
          ]
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      )
    })

    const cloudinaryUrl = uploadResult?.secure_url || avatarUrl

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
      { profilePhoto: cloudinaryUrl },
      { new: true, upsert: true },
    )

    // Also update User model for consistency
    await User.findOneAndUpdate(
      { email: session.user.email },
      { profilePicture: cloudinaryUrl },
      { new: true },
    )

    return NextResponse.json({
      success: true,
      avatarUrl: cloudinaryUrl,
      message: "Avatar generated successfully",
    })
  } catch (error) {
    console.error("Error generating avatar:", error)
    return NextResponse.json({ error: "Failed to generate avatar" }, { status: 500 })
  }
}
