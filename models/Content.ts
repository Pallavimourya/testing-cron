import mongoose, { Schema, type Document } from "mongoose"

export interface IContent extends Document {
  _id: string
  userId: string
  title: string
  content: string
  platform: string
  contentType: string
  status: "pending" | "approved" | "rejected" | "posted" | "scheduled"
  tags: string[]
  targetAudience?: string
  contentTone?: string
  transcription?: string
  
  // Base Story
  baseStory?: {
    characterProfile: string
    background: string
    goals: string
    challenges: string
    successMetrics: string
  }
  
  // Trending Topics
  trendingTopics?: Array<{
    topic: string
    relevance: number
    engagement: number
    suggestedContent: string[]
  }>
  
  // User Generated Topics
  userTopics?: Array<{
    topic: string
    reasoning: string
    contentIdeas: string[]
    estimatedEngagement: number
  }>
  
  // Template and Style
  template?: string
  photoStyle?: {
    template: string
    colors: string[]
    fonts: string[]
    layouts: string[]
    branding?: {
      logo: string
      colors: string[]
    }
  }
  
  // Engagement tracking
  engagement?: {
    views: number
    likes: number
    comments: number
    shares: number
    clicks: number
    reach: number
  }
  
  // Scheduling
  scheduledFor?: Date
  publishedAt?: Date
  
  // Approval workflow
  approvedBy?: string
  approvedAt?: Date
  rejectionReason?: string
  rejectedBy?: string
  rejectedAt?: Date
  
  // Content variations
  variations?: {
    linkedinPost?: string
    twitterPost?: string
    facebookPost?: string
    instagramCaption?: string
  }
  
  // Performance metrics
  estimatedEngagement?: number
  actualEngagement?: number
  performanceScore?: number
  
  createdAt: Date
  updatedAt: Date
}

const ContentSchema = new Schema<IContent>(
  {
    userId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    platform: {
      type: String,
      enum: ["linkedin", "twitter", "facebook", "instagram", "multi"],
      default: "linkedin",
    },
    contentType: {
      type: String,
      enum: ["post", "article", "carousel", "video", "story"],
      default: "post",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "posted", "scheduled"],
      default: "pending",
    },
    tags: [
      {
        type: String,
        trim: true,
        maxlength: 50,
      },
    ],
    targetAudience: {
      type: String,
      maxlength: 200,
    },
    contentTone: {
      type: String,
      enum: ["professional", "casual", "thought-leadership", "educational", "promotional"],
      default: "professional",
    },
    transcription: {
      type: String,
    },
    
    // Base Story
    baseStory: {
      characterProfile: String,
      background: String,
      goals: String,
      challenges: String,
      successMetrics: String,
    },
    
    // Trending Topics
    trendingTopics: [
      {
        topic: String,
        relevance: Number,
        engagement: Number,
        suggestedContent: [String],
      },
    ],
    
    // User Generated Topics
    userTopics: [
      {
        topic: String,
        reasoning: String,
        contentIdeas: [String],
        estimatedEngagement: Number,
      },
    ],
    
    // Template and Style
    template: {
      type: String,
      default: "professional",
    },
    photoStyle: {
      template: String,
      colors: [String],
      fonts: [String],
      layouts: [String],
      branding: {
        logo: String,
        colors: [String],
      },
    },
    
    // Engagement tracking
    engagement: {
      views: { type: Number, default: 0 },
      likes: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      reach: { type: Number, default: 0 },
    },
    
    // Scheduling
    scheduledFor: {
      type: Date,
    },
    publishedAt: {
      type: Date,
    },
    
    // Approval workflow
    approvedBy: String,
    approvedAt: Date,
    rejectionReason: String,
    rejectedBy: String,
    rejectedAt: Date,
    
    // Content variations
    variations: {
      linkedinPost: String,
      twitterPost: String,
      facebookPost: String,
      instagramCaption: String,
    },
    
    // Performance metrics
    estimatedEngagement: Number,
    actualEngagement: Number,
    performanceScore: Number,
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
ContentSchema.index({ userId: 1, status: 1 })
ContentSchema.index({ userId: 1, createdAt: -1 })
ContentSchema.index({ scheduledFor: 1, status: 1 })
ContentSchema.index({ platform: 1, status: 1 })

// Pre-save middleware to calculate performance score
ContentSchema.pre("save", function (next) {
  if (this.engagement) {
    const { views, likes, comments, shares } = this.engagement
    if (views > 0) {
      this.actualEngagement = likes + comments + shares
      this.performanceScore = Math.round((this.actualEngagement / views) * 100 * 100) / 100
    }
  }
  next()
})

// Static method to get content statistics
ContentSchema.statics.getStats = function (userId: string) {
  return this.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ])
}

// Static method to get engagement statistics
ContentSchema.statics.getEngagementStats = function (userId: string) {
  return this.aggregate([
    { $match: { userId, status: "posted" } },
    {
      $group: {
        _id: null,
        totalViews: { $sum: "$engagement.views" },
        totalLikes: { $sum: "$engagement.likes" },
        totalComments: { $sum: "$engagement.comments" },
        totalShares: { $sum: "$engagement.shares" },
        avgEngagement: { $avg: "$performanceScore" },
      },
    },
  ])
}

export default mongoose.models.Content || mongoose.model<IContent>("Content", ContentSchema)
