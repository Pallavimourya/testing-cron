import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import Topic from "@/models/Topic"

export async function POST(req: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const result = await Topic.deleteMany({
      userId: user._id,
    })

    return NextResponse.json({
      success: true,
      message: `${result.deletedCount} topics cleared successfully`,
    })
  } catch (error) {
    console.error("Error clearing topics:", error)
    return NextResponse.json({ error: "Failed to clear topics" }, { status: 500 })
  }
}
