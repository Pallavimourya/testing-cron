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
  contentId: {
    type: String,
    required: false, // Optional if posting custom content
  },
  content: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    required: false,
  },
  scheduledTime: {
    type: Date,
    required: true, // Always stored in UTC
  },
  scheduledTimeIST: {
    type: String,
    required: true, // Human-readable IST time for reference
  },
  status: {
    type: String,
    enum: ["pending", "posted", "failed", "cancelled"],
    default: "pending",
  },
  platform: {
    type: String,
    enum: ["linkedin"],
    default: "linkedin",
  },
  linkedinPostId: {
    type: String,
    required: false, // Set after successful posting
  },
  linkedinUrl: {
    type: String,
    required: false, // Set after successful posting
  },
  error: {
    type: String,
    required: false, // Error message if posting fails
  },
  attempts: {
    type: Number,
    default: 0,
  },
  maxAttempts: {
    type: Number,
    default: 3,
  },
  lastAttempt: {
    type: Date,
    required: false,
  },
  postedAt: {
    type: Date,
    required: false, // Set when successfully posted
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

// Indexes for efficient querying
scheduledPostSchema.index({ userId: 1, status: 1 })
scheduledPostSchema.index({ scheduledTime: 1, status: 1 })
scheduledPostSchema.index({ userEmail: 1, status: 1 })
scheduledPostSchema.index({ createdAt: -1 })

// Update the updatedAt timestamp before saving
scheduledPostSchema.pre("save", function (next) {
  this.updatedAt = new Date()
  next()
})

export default mongoose.models.ScheduledPost || mongoose.model("ScheduledPost", scheduledPostSchema)
