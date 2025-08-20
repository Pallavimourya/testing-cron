import mongoose from "mongoose"

const postSchema = new mongoose.Schema({
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
  },
  platform: {
    type: String,
    required: true,
    enum: ['instagram', 'twitter', 'linkedin', 'facebook'],
  },
  views: {
    type: Number,
    default: 0,
  },
  likes: [{
    type: String, // userId of the user who liked
  }],
  comments: [{
    userId: String,
    content: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

// Indexes for better performance
postSchema.index({ userId: 1 })
postSchema.index({ createdAt: -1 })

// Update the updatedAt timestamp before saving
postSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

export default mongoose.models.Post || mongoose.model("Post", postSchema)
