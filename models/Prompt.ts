import mongoose from "mongoose"

const PromptSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      required: true,
    },
    prompt_text: {
      type: String,
      required: true,
    },
    transcript: {
      type: String,
      required: true,
    },
    mcq_data: {
      platform: String,
      industry: String,
      tone: String,
      frequency: String,
      primaryGoal: String,
    },
    status: {
      type: String,
      enum: ["ready", "used", "failed"],
      default: "ready",
    },
    audio_url: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes for better performance
PromptSchema.index({ user_id: 1 })
PromptSchema.index({ status: 1 })
PromptSchema.index({ createdAt: -1 })

export default mongoose.models.Prompt || mongoose.model("Prompt", PromptSchema)
