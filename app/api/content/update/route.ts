import { NextResponse } from "next/server"
import { updateContent, getGeneratedContent } from "@/lib/content-store"

export async function POST(req: Request) {
  try {
    const { contentId, updates } = await req.json()

    if (!contentId || !updates) {
      return NextResponse.json({ error: "Content ID and updates are required" }, { status: 400 })
    }

    const success = await updateContent(contentId, updates)

    if (!success) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 })
    }

    // Get the updated content
    const content = await getGeneratedContent(contentId)

    return NextResponse.json({
      success: true,
      message: "Content updated successfully",
      content,
    })
  } catch (error: any) {
    console.error("Error updating content:", error)
    return NextResponse.json(
      {
        error: error.message || "Failed to update content",
      },
      { status: 500 },
    )
  }
}
