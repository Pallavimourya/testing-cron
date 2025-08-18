import mongoose from "mongoose"

const GeneratedStorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  baseStoryData: {
    earlyLife: String,
    firstDream: String,
    firstJob: String,
    careerRealization: String,
    biggestChallenge: String,
    almostGaveUp: String,
    turningPoint: String,
    mentor: String,
    currentWork: String,
    uniqueApproach: String,
    proudAchievement: String,
    industryMisconception: String,
    powerfulLesson: String,
    coreValues: String,
    desiredImpact: String,
  },
  customizationData: {
    target_audience: String,
    audience_age: String,
    content_goal: String,
    content_tone: String,
    writing_style: String,
    content_length: String,
    posting_frequency: String,
    content_formats: [String],
    engagement_style: String,
    personal_anecdotes: String,
    visual_style: String,
    branding_colors: String,
    keywords: [String],
    content_inspiration: String,
    content_differentiation: String,
  },
  generatedStory: {
    type: String,
    required: true,
  },
  editedStory: {
    type: String,
    default: "",
  },
  finalStory: {
    type: String,
    default: "",
  },
  status: {
    type: String,
    enum: ["generating", "generated", "edited", "approved", "failed"],
    default: "generating",
  },
  makeWebhookId: {
    type: String,
    default: "",
  },
  generatedTopics: [
    {
      id: String,
      title: String,
      status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
      },
      approvedAt: Date,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

GeneratedStorySchema.pre("save", function (next) {
  this.updatedAt = new Date()
  next()
})


GeneratedStorySchema.index({ status: 1 })
GeneratedStorySchema.index({ createdAt: -1 })

export default mongoose.models.GeneratedStory || mongoose.model("GeneratedStory", GeneratedStorySchema)
