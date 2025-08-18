import { NextResponse } from "next/server"
import { rejectContent, getGeneratedContent } from "@/lib/content-store"

export async function POST(req: Request) {
  try {
    const { contentId } = await req.json()

    if (!contentId) {
      return NextResponse.json({ error: "Content ID is required" }, { status: 400 })
    }

    const success = await rejectContent(contentId)

    if (!success) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 })
    }

    // Get the updated content
    const content = await getGeneratedContent(contentId)

    console.log("❌ Content rejected:", contentId)

    return NextResponse.json({
      success: true,
      message: "Content rejected",
      content,
    })
  } catch (error: any) {
    console.error("Error rejecting content:", error)
    return NextResponse.json(
      {
        error: error.message || "Failed to reject content",
      },
      { status: 500 },
    )
  }
}
