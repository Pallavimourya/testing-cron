import mongoose, { Schema, type Document } from "mongoose"

export interface IApprovedContent extends Document {
  _id: string
  id: string
  userId: mongoose.Types.ObjectId
  topicId: string
  topicTitle: string
  content: string
  hashtags: string[]
  keyPoints: string[]
  imageUrl?: string
  contentType: "storytelling" | "tips" | "insight" | "question" | "list"
  language: string
  status: "generated" | "approved" | "rejected" | "scheduled" | "posted"
  platform: "linkedin" | "twitter" | "facebook"
  scheduledFor?: Date
  postedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const ApprovedContentSchema = new Schema<IApprovedContent>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    topicId: {
      type: String,
      required: true,
    },
    topicTitle: {
      type: String,
      required: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    hashtags: {
      type: [String],
      default: [],
    },
    keyPoints: {
      type: [String],
      default: [],
    },
    imageUrl: {
      type: String,
    },
    contentType: {
      type: String,
      enum: ["storytelling", "tips", "insight", "question", "list"],
      default: "storytelling",
    },
    language: {
      type: String,
      default: "English",
      required: true,
    },
    status: {
      type: String,
      enum: ["generated", "approved", "rejected", "scheduled", "posted"],
      default: "generated",
    },
    platform: {
      type: String,
      enum: ["linkedin", "twitter", "facebook"],
      default: "linkedin",
    },
    scheduledFor: {
      type: Date,
    },
    postedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret: any) => {
        ret.id = ret._id
        delete ret._id
        delete ret.__v
        return ret
      },
    },
  },
)

// Indexes for better performance
ApprovedContentSchema.index({ userId: 1, createdAt: -1 })
ApprovedContentSchema.index({ userId: 1, status: 1 })
ApprovedContentSchema.index({ topicId: 1 })
// Note: unique: true on id field automatically creates an index

export default mongoose.models.ApprovedContent ||
  mongoose.model<IApprovedContent>("ApprovedContent", ApprovedContentSchema)
