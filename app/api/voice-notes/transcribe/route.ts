import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import connectDB from "@/lib/mongodb"
import VoiceNote from "@/models/VoiceNote"
import { authOptions } from "@/app/api/auth/[...nextauth]/auth"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    // Get the single voice note for the user
    const voiceNote = await VoiceNote.findOne({ userId: session.user.id })
      .select('title description audioType audioData transcription createdAt')
      .sort({ createdAt: -1 })

    if (!voiceNote) {
      return NextResponse.json([])
    }

    // Convert audio data to base64
    const noteWithAudio = {
      _id: voiceNote._id.toString(),
      title: voiceNote.title,
      description: voiceNote.description,
      audioUrl: `data:${voiceNote.audioType};base64,${voiceNote.audioData.toString('base64')}`,
      transcription: voiceNote.transcription,
      createdAt: voiceNote.createdAt,
    }

    return NextResponse.json([noteWithAudio])
  } catch (error: any) {
    console.error("Error fetching voice note:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch voice note" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const audioFile = formData.get("audio") as File
    const title = formData.get("title") as string
    const description = formData.get("description") as string

    if (!audioFile || !title) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Validate audio file size (max 10MB)
    if (audioFile.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Audio file too large. Maximum size is 10MB" },
        { status: 400 }
      )
    }

    // Validate audio file type
    if (!audioFile.type.startsWith('audio/')) {
      return NextResponse.json(
        { error: "Invalid file type. Only audio files are allowed" },
        { status: 400 }
      )
    }

    await connectDB()

    // Convert audio file to buffer
    const buffer = Buffer.from(await audioFile.arrayBuffer())

    // Find existing voice note or create new one
    let voiceNote = await VoiceNote.findOne({ userId: session.user.id })

    if (voiceNote) {
      // Update existing voice note
      voiceNote.title = title
      voiceNote.description = description
      voiceNote.audioData = buffer
      voiceNote.audioType = audioFile.type
      voiceNote.transcription = "" // Reset transcription for new recording
      await voiceNote.save()
    } else {
      // Create new voice note
      voiceNote = await VoiceNote.create({
        userId: session.user.id,
        title,
        description,
        audioData: buffer,
        audioType: audioFile.type,
        transcription: "", // Initialize empty transcription
      })
    }

    return NextResponse.json({
      _id: voiceNote._id.toString(),
      title: voiceNote.title,
      description: voiceNote.description,
      audioUrl: `data:${voiceNote.audioType};base64,${voiceNote.audioData.toString('base64')}`,
      transcription: voiceNote.transcription,
      createdAt: voiceNote.createdAt,
    })
  } catch (error: any) {
    console.error("Error creating/updating voice note:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create/update voice note" },
      { status: 500 }
    )
  }
}
