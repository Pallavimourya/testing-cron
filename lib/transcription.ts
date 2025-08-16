import OpenAI from 'openai'
import fs from 'fs'
import path from 'path'
import os from 'os'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function transcribeAudio(base64Audio: string): Promise<string> {
  try {
    console.log('Starting transcription process...')
    
    // Convert base64 to buffer
    const audioBuffer = Buffer.from(base64Audio, 'base64')
    console.log('Audio buffer created, size:', audioBuffer.length)

    // Create a temporary file
    const tempDir = os.tmpdir()
    const tempFilePath = path.join(tempDir, `audio-${Date.now()}.webm`)
    console.log('Temporary file path:', tempFilePath)

    // Write the buffer to a temporary file
    fs.writeFileSync(tempFilePath, audioBuffer)
    console.log('Audio file written to disk')

    // Create a file object from the temporary file
    const file = fs.createReadStream(tempFilePath)
    console.log('File stream created')

    // Call OpenAI's Whisper API for transcription
    console.log('Calling OpenAI Whisper API...')
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
      language: "en",
      response_format: "text"
    })
    console.log('Transcription received from OpenAI')

    // Clean up the temporary file
    fs.unlinkSync(tempFilePath)
    console.log('Temporary file cleaned up')

    return transcription
  } catch (error: any) {
    console.error('Detailed transcription error:', {
      message: error.message,
      code: error.code,
      type: error.type,
      stack: error.stack
    })
    throw new Error(`Failed to transcribe audio: ${error.message}`)
  }
}
