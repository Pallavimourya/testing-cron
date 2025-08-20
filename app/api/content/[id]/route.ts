import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import connectDB from "@/lib/mongodb"
import Content from "../../../../models/Content"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { action, title, content } = await req.json()
    await connectDB()

    const updateData: any = { updatedAt: new Date() }

    switch (action) {
      case "approve":
        updateData.status = "approved"
        updateData.approved_at = new Date()
        break
      case "reject":
        updateData.status = "rejected"
        break
      case "edit":
        if (title) updateData.title = title
        if (content) updateData.content = content
        break
      case "post":
        updateData.status = "posted"
        updateData.posted_at = new Date()
        break
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    const { id } = await params
    const updatedContent = await Content.findByIdAndUpdate(id, updateData, { new: true })

    if (!updatedContent) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 })
    }



    return NextResponse.json(updatedContent)
  } catch (error: any) {
    console.error("Error updating content:", error)
    return NextResponse.json({ error: error.message || "Failed to update content" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const { id } = await params
    const deletedContent = await Content.findByIdAndDelete(id)

    if (!deletedContent) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Content deleted successfully" })
  } catch (error: any) {
    console.error("Error deleting content:", error)
    return NextResponse.json({ error: error.message || "Failed to delete content" }, { status: 500 })
  }
}
