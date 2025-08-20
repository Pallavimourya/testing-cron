import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import ApprovedContent from "@/models/ApprovedContent"
import mongoose from "mongoose"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params
    const { format = "json" } = await req.json()

    console.log("📤 Exporting content:", {
      id,
      userId: user._id.toString(),
      format
    })

    // Try to find content in ApprovedContent model first
    let content: any = await ApprovedContent.findOne({ 
      id, 
      userId: user._id 
    }).lean()

    // If not found in ApprovedContent model, try raw collection
    if (!content) {
      console.log("⚠️ Content not found in ApprovedContent model, trying raw collection...")
      
      const collection = mongoose.connection.db?.collection("approvedcontents")
      if (collection) {
        const rawContent = await collection.findOne({
          $and: [
            {
              $or: [
                { id: id },
                { ID: id },
                { _id: new mongoose.Types.ObjectId(id) }
              ]
            },
            {
              $or: [
                { userId: user._id },
                { userId: user._id.toString() },
                { "user id": user._id.toString() },
                { email: user.email }
              ]
            }
          ]
        })

        if (rawContent) {
          content = {
            id: rawContent.ID || rawContent.id || rawContent._id?.toString(),
            topicId: rawContent.topicId || rawContent.Topic || rawContent.topicId,
            topicTitle: rawContent.topicTitle || rawContent.Topic || rawContent.topicTitle,
            content: rawContent.content || rawContent["generated content"] || rawContent.Content || rawContent.content,
            hashtags: rawContent.hashtags || [],
            keyPoints: rawContent.keyPoints || [],
            imageUrl: rawContent.imageUrl || rawContent.Image,
            platform: rawContent.platform || "linkedin",
            contentType: rawContent.contentType || "storytelling",
            status: rawContent.status || "generated",
            generatedAt: rawContent.generatedAt || rawContent.createdAt,
            approvedAt: rawContent.approvedAt || rawContent.approved_at,
            postedAt: rawContent.postedAt || rawContent.posted_at,
            createdAt: rawContent.createdAt,
            updatedAt: rawContent.updatedAt,
            userId: rawContent.userId || rawContent["user id"],
          }
        }
      }
    }

    if (!content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 })
    }

    console.log("✅ Content found for export:", {
      id: content.id,
      topicTitle: content.topicTitle,
      format
    })

    // Format content based on requested format
    let exportData: any
    let contentType: string
    let filename: string

    switch (format.toLowerCase()) {
      case "json":
        exportData = JSON.stringify(content, null, 2)
        contentType = "application/json"
        filename = `content-${content.id}.json`
        break

      case "txt":
        exportData = `Topic: ${content.topicTitle}\n\nContent:\n${content.content}\n\nHashtags: ${content.hashtags?.join(", ") || "None"}\n\nKey Points:\n${content.keyPoints?.map((point: any) => `- ${point}`).join("\n") || "None"}\n\nPlatform: ${content.platform}\nContent Type: ${content.contentType}\nStatus: ${content.status}\nCreated: ${new Date(content.createdAt).toLocaleString()}`
        contentType = "text/plain"
        filename = `content-${content.id}.txt`
        break

      case "md":
        exportData = `# ${content.topicTitle}\n\n${content.content}\n\n## Hashtags\n${content.hashtags?.map((tag: any) => `#${tag}`).join(" ") || "None"}\n\n## Key Points\n${content.keyPoints?.map((point: any) => `- ${point}`).join("\n") || "None"}\n\n---\n\n**Platform:** ${content.platform}  \n**Content Type:** ${content.contentType}  \n**Status:** ${content.status}  \n**Created:** ${new Date(content.createdAt).toLocaleString()}`
        contentType = "text/markdown"
        filename = `content-${content.id}.md`
        break

      case "csv":
        exportData = `Topic Title,Content,Hashtags,Key Points,Platform,Content Type,Status,Created\n"${content.topicTitle}","${content.content.replace(/"/g, '""')}","${content.hashtags?.join("; ") || ""}","${content.keyPoints?.join("; ") || ""}","${content.platform}","${content.contentType}","${content.status}","${new Date(content.createdAt).toLocaleString()}"`
        contentType = "text/csv"
        filename = `content-${content.id}.csv`
        break

      default:
        return NextResponse.json({ error: "Unsupported export format" }, { status: 400 })
    }

    // Create response with appropriate headers for file download
    const response = new NextResponse(exportData)
    response.headers.set("Content-Type", contentType)
    response.headers.set("Content-Disposition", `attachment; filename="${filename}"`)
    response.headers.set("Cache-Control", "no-cache")

    console.log("✅ Content exported successfully:", {
      id: content.id,
      format,
      filename
    })

    return response
  } catch (error) {
    console.error("❌ Error exporting content:", error)
    return NextResponse.json(
      {
        error: "Failed to export content",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
