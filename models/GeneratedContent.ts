import mongoose from "mongoose"

const GeneratedContentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    Topic: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    platform: {
      type: String,
      enum: ["linkedin", "instagram", "twitter", "facebook"],
      default: "linkedin",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "posted", "scheduled"],
      default: "pending",
    },
    scheduledFor: {
      type: Date,
    },
    postedAt: {
      type: Date,
    },
    approvedAt: {
      type: Date,
    },
    rejectedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
    },
    analytics: {
      views: { type: Number, default: 0 },
      likes: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
    },
    makecom_id: String,
    hashtags: [String],
    keyPoints: [String],
    linkedinPostId: String,
    linkedinResponse: mongoose.Schema.Types.Mixed,
    error: String,
    lastAttempt: Date,
    Image: String,
  },
  {
    timestamps: true,
  },
)

// Indexes for efficient querying
GeneratedContentSchema.index({ userId: 1, status: 1 })
GeneratedContentSchema.index({ userId: 1, scheduledFor: 1 })
GeneratedContentSchema.index({ status: 1, scheduledFor: 1 })
GeneratedContentSchema.index({ userId: 1, createdAt: -1 })

export default mongoose.models.GeneratedContent || mongoose.model("GeneratedContent", GeneratedContentSchema)
