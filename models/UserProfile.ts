import mongoose from "mongoose"

const UserProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
  },

  // Base Story Data
  baseStoryData: {
    earlyLife: { type: String, default: "" },
    firstDream: { type: String, default: "" },
    firstJob: { type: String, default: "" },
    careerRealization: { type: String, default: "" },
    biggestChallenge: { type: String, default: "" },
    almostGaveUp: { type: String, default: "" },
    turningPoint: { type: String, default: "" },
    mentor: { type: String, default: "" },
    currentWork: { type: String, default: "" },
    uniqueApproach: { type: String, default: "" },
    proudAchievement: { type: String, default: "" },
    industryMisconception: { type: String, default: "" },
    powerfulLesson: { type: String, default: "" },
    coreValues: { type: String, default: "" },
    desiredImpact: { type: String, default: "" },
  },

  // Customization Data (MCQ responses)
  customizationData: {
    content_language: { type: String, enum: ["Hindi", "English", "Hinglish", "Both Languages"], default: "English" },
    target_audience: { type: String, default: "" },
    audience_age: { type: String, default: "" },
    content_goal: { type: String, default: "" },
    content_tone: { type: String, default: "" },
    content_length: { type: String, default: "" },
    content_differentiation: { type: String, default: "" },
  },

  // Generated Script
  generatedScript: {
    type: String,
    default: "",
  },

  // Profile completion status
  onboardingCompleted: {
    type: Boolean,
    default: false,
  },

  // Profile photo
  profilePhoto: {
    type: String,
    default: "",
  },

  // LinkedIn integration
  linkedinConnected: {
    type: Boolean,
    default: false,
  },
  linkedinAccessToken: {
    type: String,
    default: "",
  },
  linkedinRefreshToken: {
    type: String,
    default: "",
  },
  linkedinProfile: {
    id: String,
    firstName: String,
    lastName: String,
    profilePicture: String,
    headline: String,
  },

  // Subscription info
  subscriptionStatus: {
    type: String,
    enum: ["free", "premium", "enterprise"],
    default: "free",
  },
  subscriptionExpiry: {
    type: Date,
  },

  // Usage tracking
  contentGenerated: {
    type: Number,
    default: 0,
  },
  topicsGenerated: {
    type: Number,
    default: 0,
  },
  postsScheduled: {
    type: Number,
    default: 0,
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

// Update the updatedAt field before saving
UserProfileSchema.pre("save", function (next) {
  this.updatedAt = new Date()
  next()
})

// Indexes for better performance
UserProfileSchema.index({ email: 1 })
UserProfileSchema.index({ subscriptionStatus: 1 })

export default mongoose.models.UserProfile || mongoose.model("UserProfile", UserProfileSchema)
