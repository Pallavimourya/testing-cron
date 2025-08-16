import { NextResponse } from "next/server"
import { transcribeAudio } from "@/lib/transcription"

export async function POST(req: Request) {
  try {
    console.log("🎤 Transcription API called")

    // Check if OpenAI API key exists
    if (!process.env.OPENAI_API_KEY) {
      console.error("❌ OPENAI_API_KEY not found in environment variables")
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 })
    }

    const formData = await req.formData()
    const audioFile = formData.get("audio") as File

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 })
    }

    console.log("📁 Audio file received:", {
      name: audioFile.name,
      size: audioFile.size,
      type: audioFile.type,
    })

    // Convert File to base64
    const arrayBuffer = await audioFile.arrayBuffer()
    const base64Audio = Buffer.from(arrayBuffer).toString('base64')

    // Transcribe the audio using OpenAI Whisper
    const transcription = await transcribeAudio(base64Audio)

    return NextResponse.json({
      transcription,
      success: true,
    })
  } catch (error: any) {
    console.error("❌ Error transcribing audio:", error)
    return NextResponse.json(
      {
        error: error.message || "Transcription failed",
        details: error.toString(),
      },
      { status: 500 },
    )
  }
}
