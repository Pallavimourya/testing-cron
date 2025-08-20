import { NextResponse } from "next/server"
import { getLatestGeneratedContent } from "@/lib/content-store"

export async function GET() {
  try {
    const content = await getLatestGeneratedContent()

    return NextResponse.json({
      success: true,
      content,
      hasContent: content !== null,
    })
  } catch (error: any) {
    console.error("Error fetching latest content:", error)
    return NextResponse.json(
      {
        error: error.message || "Failed to fetch latest content",
        hasContent: false,
      },
      { status: 500 },
    )
  }
}
