import type { NextRequest } from "next/server"
import connectDB from "@/lib/mongodb"
import ScheduledPost from "@/models/ScheduledPost"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await connectDB()

    const scheduledPost = await ScheduledPost.findById(id)

    if (!scheduledPost) {
      return Response.json({ error: "Scheduled post not found" }, { status: 404 })
    }

    return Response.json(scheduledPost)
  } catch (error) {
    console.error("Get scheduled post error:", error)
    return Response.json({ error: "Failed to fetch scheduled post" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    await connectDB()

    const scheduledPost = await ScheduledPost.findByIdAndUpdate(id, body, { new: true, runValidators: true })

    if (!scheduledPost) {
      return Response.json({ error: "Scheduled post not found" }, { status: 404 })
    }

    return Response.json(scheduledPost)
  } catch (error) {
    console.error("Update scheduled post error:", error)
    return Response.json({ error: "Failed to update scheduled post" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await connectDB()

    const scheduledPost = await ScheduledPost.findByIdAndDelete(id)

    if (!scheduledPost) {
      return Response.json({ error: "Scheduled post not found" }, { status: 404 })
    }

    return Response.json({ message: "Scheduled post deleted successfully" })
  } catch (error) {
    console.error("Delete scheduled post error:", error)
    return Response.json({ error: "Failed to delete scheduled post" }, { status: 500 })
  }
}
