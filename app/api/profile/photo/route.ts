import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import { authOptions } from "../../auth/[...nextauth]/auth"
import sharp from "sharp"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const photo = formData.get("photo") as File

    if (!photo) {
      return NextResponse.json({ error: "No photo provided" }, { status: 400 })
    }

    // Validate file type
    if (!photo.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    // Validate file size (max 10MB)
    if (photo.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 10MB" }, { status: 400 })
    }

    // Convert image to buffer
    const bytes = await photo.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Process image with sharp
    const processedImageBuffer = await sharp(buffer)
      .resize(500, 500, { // Resize to 500x500
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 }) // Convert to JPEG with 80% quality
      .toBuffer()

    // Convert to base64
    const base64Image = `data:image/jpeg;base64,${processedImageBuffer.toString("base64")}`

    await connectDB()

    // Update user profile with new photo
    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      { profilePhoto: base64Image },
      { new: true }
    ).select("profilePhoto")

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true,
      profilePhoto: updatedUser.profilePhoto 
    })
  } catch (error: any) {
    console.error("Error uploading photo:", error)
    return NextResponse.json(
      { error: error.message || "Failed to upload photo" },
      { status: 500 }
    )
  }
}
