import mongoose from "mongoose"

const scheduledPostSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  userEmail: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  imageUrl: {
    type: String,
    default: null,
  },
  scheduledAt: {
    type: Date,
    required: true,
    index: true, // Index for efficient querying
  },
  scheduledAtIST: {
    type: String, // Store original IST time for reference
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "posted", "failed", "cancelled"],
    default: "pending",
    index: true,
  },
  retries: {
    type: Number,
    default: 0,
    max: 3,
  },
  postedAt: {
    type: Date,
    default: null,
  },
  linkedinPostId: {
    type: String,
    default: null,
  },
  linkedinUrl: {
    type: String,
    default: null,
  },
  errorMessage: {
    type: String,
    default: null,
  },
  lastAttemptAt: {
    type: Date,
    default: null,
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

// Compound index for efficient cron queries
scheduledPostSchema.index({ scheduledAt: 1, status: 1 })

// Update timestamp on save
scheduledPostSchema.pre("save", function (next) {
  this.updatedAt = new Date()
  next()
})

// Clean up old posts (optional)
scheduledPostSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }) // 30 days

export default mongoose.models.ScheduledPost || mongoose.model("ScheduledPost", scheduledPostSchema)
