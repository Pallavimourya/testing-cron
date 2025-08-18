"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Mic, MicOff, Loader2 } from "lucide-react"

interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob, duration: number) => void
  disabled?: boolean
}

export default function AudioRecorder({ onRecordingComplete, disabled }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const [lastAudioBlob, setLastAudioBlob] = useState<Blob | null>(null)
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const timer = useRef<NodeJS.Timeout | undefined>(undefined)

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      // Prefer WAV, fallback to webm/mp4
      const mimeType = MediaRecorder.isTypeSupported('audio/wav')
        ? 'audio/wav'
        : (MediaRecorder.isTypeSupported('audio/webm')
            ? 'audio/webm'
            : 'audio/mp4')
      mediaRecorder.current = new MediaRecorder(stream, { mimeType })
      chunks.current = []

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.current.push(e.data)
        }
      }

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(chunks.current, { type: mimeType })
        console.log('[DEBUG] AudioRecorder onstop audioBlob:', audioBlob, 'type:', audioBlob.type, 'size:', audioBlob.size)
        setLastAudioBlob(audioBlob)
        onRecordingComplete(audioBlob, duration)
        stream.getTracks().forEach(track => track.stop())
        setDuration(0)
      }

      mediaRecorder.current.start()
      setIsRecording(true)
      timer.current = setInterval(() => {
        setDuration(prev => prev + 1)
      }, 1000)
    } catch (error) {
      console.error('Error accessing microphone:', error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop()
      setIsRecording(false)
      if (timer.current) clearInterval(timer.current)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <Button
        size="lg"
        variant={isRecording ? "destructive" : "default"}
        onClick={isRecording ? stopRecording : startRecording}
        disabled={disabled}
        className="w-full h-16"
      >
        {isRecording ? (
          <>
            <MicOff className="h-5 w-5 mr-2" />
            Stop Recording ({duration}s)
          </>
        ) : (
          <>
            <Mic className="h-5 w-5 mr-2" />
            Start Recording
          </>
        )}
      </Button>
      {/* Download link for debugging */}
      {lastAudioBlob && (
        <a
          href={URL.createObjectURL(lastAudioBlob)}
          download={lastAudioBlob.type === 'audio/wav' ? 'recorded-audio.wav' : (lastAudioBlob.type === 'audio/webm' ? 'recorded-audio.webm' : 'recorded-audio.mp4')}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline text-sm mt-2"
        >
          Download Last Recording
        </a>
      )}
    </div>
  )
}
