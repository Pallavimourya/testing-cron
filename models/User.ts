import mongoose, { Schema, type Document } from "mongoose"
import bcrypt from "bcryptjs"

export interface IUser extends Document {
  _id: string
  name: string
  email: string
  mobile: string // New field for mobile number
  city: string // New field for city
  password?: string
  image?: string
  emailVerified?: Date
  createdAt: Date
  updatedAt: Date

  // Profile fields
  bio?: string
  company?: string
  jobTitle?: string
  industry?: string
  location?: string
  website?: string
  profilePhoto?: string
  blocked?: boolean
  role?: "user" | "admin" // Added role field for admin access

  // Onboarding
  isOnboarded: boolean
  onboardingStep?: number
  onboardingCompleted: boolean // New field for onboarding completion status

  // Content preferences
  contentStyle?: string
  targetAudience?: string
  contentTopics?: string[]
  postingFrequency?: string

  // LinkedIn integration
  linkedinAccessToken?: string
  linkedinTokenExpiry?: Date
  linkedinProfile?: {
    id: string
    name: string
    email: string
    picture?: string
    profileUrl?: string
    headline?: string
    location?: string
    connectionsCount?: number
  }
  linkedinPosts?: any[]
  linkedinConnectedAt?: Date
  linkedinLastSync?: Date

  // Subscription
  subscriptionStatus?: string
  subscriptionPlan?: string
  subscriptionStartDate?: Date // New field for subscription start date
  subscriptionExpiry?: Date
  razorpayCustomerId?: string
  razorpaySubscriptionId?: string
  autoRenew?: boolean // New field for auto-renewal status
  currentPlanId?: string // Added current plan ID reference

  // Usage tracking
  contentGenerated?: number
  imagesGenerated?: number // New field for tracking image generations
  lastActiveAt?: Date

  // Verification fields
  isVerified: boolean
  verificationToken?: string
  resetPasswordToken?: string
  resetPasswordExpires?: Date
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    mobile: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      select: false, // Don't include password in queries by default
      minlength: 6,
      required: true,
    },
    image: {
      type: String,
    },
    emailVerified: {
      type: Date,
    },

    // Profile fields
    bio: {
      type: String,
      maxlength: 500,
    },
    company: {
      type: String,
      maxlength: 100,
    },
    jobTitle: {
      type: String,
      maxlength: 100,
    },
    industry: {
      type: String,
      maxlength: 100,
    },
    location: {
      type: String,
      maxlength: 100,
    },
    website: {
      type: String,
      maxlength: 200,
    },
    profilePhoto: {
      type: String,
    },
    blocked: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    // Onboarding
    isOnboarded: {
      type: Boolean,
      default: false,
    },
    onboardingStep: {
      type: Number,
      default: 0,
    },
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },

    // Content preferences
    contentStyle: {
      type: String,
      enum: ["professional", "casual", "thought-leadership", "educational", "promotional"],
      default: "professional",
    },
    targetAudience: {
      type: String,
      maxlength: 200,
    },
    contentTopics: [
      {
        type: String,
        maxlength: 50,
      },
    ],
    postingFrequency: {
      type: String,
      enum: ["daily", "weekly", "bi-weekly", "monthly"],
      default: "weekly",
    },

    // LinkedIn integration
    linkedinAccessToken: {
      type: String,
      select: false, // Don't include in queries by default for security
    },
    linkedinTokenExpiry: {
      type: Date,
    },
    linkedinProfile: {
      id: String,
      name: String,
      email: String,
      picture: String,
      profileUrl: String,
      headline: String,
      location: String,
      connectionsCount: Number,
    },
    linkedinPosts: [
      {
        type: Schema.Types.Mixed,
      },
    ],
    linkedinConnectedAt: {
      type: Date,
    },
    linkedinLastSync: {
      type: Date,
    },

    // Subscription
    subscriptionStatus: {
      type: String,
      enum: ["free", "active", "expired", "cancelled"],
      default: "free",
    },
    subscriptionPlan: {
      type: String,
      default: "free",
    },
    subscriptionStartDate: {
      type: Date,
    },
    subscriptionExpiry: {
      type: Date,
    },
    razorpayCustomerId: {
      type: String,
    },
    razorpaySubscriptionId: {
      type: String,
    },
    autoRenew: {
      type: Boolean,
      default: false,
    },
    currentPlanId: {
      type: String,
    },

    // Usage tracking
    contentGenerated: {
      type: Number,
      default: 0,
    },
    imagesGenerated: {
      type: Number,
      default: 0,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },

    // Verification fields
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret: any) => {
        ret.id = ret._id
        delete ret._id
        delete ret?.__v
        delete ret?.password
        delete ret?.linkedinAccessToken
        delete ret?.verificationToken
        delete ret?.resetPasswordToken
        delete ret?.resetPasswordExpires
        return ret
      },
    },
  },
)

// Indexes for better performance
UserSchema.index({ createdAt: -1 })
UserSchema.index({ lastActiveAt: -1 })
UserSchema.index({ "linkedinProfile.id": 1 })
UserSchema.index({ subscriptionStatus: 1 })
UserSchema.index({ subscriptionExpiry: 1 })
UserSchema.index({ mobile: 1 }) // New index for mobile

// Pre-save middleware to hash password if modified
UserSchema.pre("save", async function (next) {
  if (this.isModified("password") && this.password) {
    try {
      const salt = await bcrypt.genSalt(10)
      this.password = await bcrypt.hash(this.password, salt)
    } catch (err) {
      return next(err as any)
    }
  }
  this.lastActiveAt = new Date()
  next()
})

// Static method to find user by LinkedIn ID
UserSchema.statics.findByLinkedInId = function (linkedinId: string) {
  return this.findOne({ "linkedinProfile.id": linkedinId })
}

// Instance method to check if LinkedIn token is valid
UserSchema.methods.isLinkedInTokenValid = function () {
  return this.linkedinAccessToken && this.linkedinTokenExpiry && new Date(this.linkedinTokenExpiry) > new Date()
}

// Instance method to check if subscription is active
UserSchema.methods.hasActiveSubscription = function () {
  return (
    this.subscriptionStatus === "active" && this.subscriptionExpiry && new Date(this.subscriptionExpiry) > new Date()
  )
}

// Instance method to get remaining image generations
UserSchema.methods.getRemainingImageGenerations = function () {
  const plans = {
    zuper15: 7,
    zuper30: 15,
    zuper360: 300,
  }

  const limit = plans[this.subscriptionPlan as keyof typeof plans] || 0
  const used = this.imagesGenerated || 0

  return {
    limit,
    used,
    remaining: Math.max(0, limit - used),
  }
}

// Instance method to get LinkedIn profile summary
UserSchema.methods.getLinkedInSummary = function () {
  if (!this.linkedinProfile) return null

  return {
    name: this.linkedinProfile.name,
    headline: this.linkedinProfile.headline,
    location: this.linkedinProfile.location,
    connectionsCount: this.linkedinProfile.connectionsCount,
    profileUrl: this.linkedinProfile.profileUrl,
    lastSync: this.linkedinLastSync,
    isConnected: this.isLinkedInTokenValid(),
  }
}

// Method to compare password
UserSchema.methods.comparePassword = async function (candidatePassword: string) {
  return bcrypt.compare(candidatePassword, this.password)
}

UserSchema.methods.canAccessPremiumFeatures = function () {
  return this.hasActiveSubscription() && this.subscriptionStatus === "active"
}

UserSchema.methods.canGenerateContent = function () {
  if (!this.canAccessPremiumFeatures()) return false

  // Check if user has reached content limit for their plan
  // This would need to be implemented based on plan limits
  return true
}

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema)
