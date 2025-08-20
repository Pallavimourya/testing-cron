import mongoose from "mongoose"

const voiceNoteSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  audioData: {
    type: Buffer,
    required: true,
  },
  audioType: {
    type: String,
    required: true,
    enum: ['audio/webm', 'audio/mp3', 'audio/wav'],
  },
  transcription: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

// Indexes for better performance
voiceNoteSchema.index({ userId: 1 })
voiceNoteSchema.index({ createdAt: -1 })

// Update the updatedAt timestamp before saving
voiceNoteSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

export default mongoose.models.VoiceNote || mongoose.model("VoiceNote", voiceNoteSchema)
