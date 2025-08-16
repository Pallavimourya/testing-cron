import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import connectDB from "@/lib/mongodb"
import Content from "../../../../models/Content"

export async function GET() {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const contents = await Content.find({
      user_id: session.user.email,
    })
      .sort({ createdAt: -1 })
      .limit(100)

    return NextResponse.json(contents)
  } catch (error: any) {
    console.error("Error fetching content list:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch content" }, { status: 500 })
  }
}
