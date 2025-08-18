import mongoose from "mongoose"

const TopicSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      unique: true,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    storyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GeneratedStory",
      default: null,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "dismissed"],
      default: "pending",
    },
    source: {
      type: String,
      enum: ["auto", "manual", "story"],
      required: true,
    },
    generationType: {
      type: String,
      enum: ["auto", "manual", "story"],
      required: true,
    },
    userPrompt: {
      type: String,
      default: null,
    },
    contentStatus: {
      type: String,
      enum: ["not_generated", "generating", "generated", "failed"],
      default: "not_generated",
    },
    contentId: {
      type: String,
      default: null,
    },
    generatedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
)

// Create indexes
TopicSchema.index({ userId: 1, status: 1 })
TopicSchema.index({ userId: 1, createdAt: -1 })
// Note: unique: true on id field automatically creates an index

export default mongoose.models.Topic || mongoose.model("Topic", TopicSchema)
