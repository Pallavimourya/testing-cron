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

    const { topicIds } = await req.json()

    await connectDB()
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const result = await Topic.updateMany(
      {
        id: { $in: topicIds },
        userId: user._id,
      },
      {
        $set: {
          status: "approved",
          approvedAt: new Date(),
        },
      },
    )

    return NextResponse.json({
      success: true,
      message: `${result.modifiedCount} topics saved successfully`,
    })
  } catch (error) {
    console.error("Error bulk saving topics:", error)
    return NextResponse.json({ error: "Failed to bulk save topics" }, { status: 500 })
  }
}
