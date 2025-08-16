import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import connectDB from "@/lib/mongodb"
import VoiceNote from "../../../../models/VoiceNote"
import { authOptions } from "../../auth/[...nextauth]/auth"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const { id } = await params
    const voiceNote = await VoiceNote.findOne({
      _id: id,
      userId: session.user.id,
    })

    if (!voiceNote) {
      return NextResponse.json({ message: "Voice note not found" }, { status: 404 })
    }

    // Return audio data as a blob
    return new NextResponse(voiceNote.audioData, {
      headers: {
        "Content-Type": voiceNote.audioType,
        "Content-Disposition": `attachment; filename="${voiceNote.title}.mp3"`,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const { id } = await params
    const voiceNote = await VoiceNote.findOneAndDelete({
      _id: id,
      userId: session.user.id,
    })

    if (!voiceNote) {
      return NextResponse.json({ message: "Voice note not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Voice note deleted successfully" })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Something went wrong" }, { status: 500 })
  }
}
