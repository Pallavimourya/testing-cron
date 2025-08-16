import mongoose, { Schema, type Document } from "mongoose"

export interface IPlan extends Document {
  _id: string
  name: string
  slug: string
  description: string
  price: number
  originalPrice?: number
  durationDays: number
  features: string[]
  imageLimit: number
  contentLimit: number // -1 means unlimited
  displayOrder: number
  badge?: string
  color?: string
  icon?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const PlanSchema = new Schema<IPlan>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    originalPrice: {
      type: Number,
      min: 0,
    },
    durationDays: {
      type: Number,
      required: true,
      min: 1,
    },
    features: [
      {
        type: String,
        required: true,
        trim: true,
      },
    ],
    imageLimit: {
      type: Number,
      required: true,
      min: 0,
    },
    contentLimit: {
      type: Number,
      required: true,
      min: -1, // -1 means unlimited
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    badge: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      default: "from-blue-500 to-blue-600",
    },
    icon: {
      type: String,
      default: "Star",
    },
    isActive: {
      type: Boolean,
      default: true,
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

// Indexes (slug index is already created by unique: true)
PlanSchema.index({ isActive: 1 })
PlanSchema.index({ displayOrder: 1 })
PlanSchema.index({ price: 1 })

// Instance methods
PlanSchema.methods.isUnlimitedContent = function () {
  return this.contentLimit === -1
}

PlanSchema.methods.getDisplayPrice = function () {
  return `₹${this.price.toLocaleString("en-IN")}`
}

PlanSchema.methods.getSavings = function () {
  if (!this.originalPrice) return 0
  return this.originalPrice - this.price
}

PlanSchema.methods.getSavingsPercentage = function () {
  if (!this.originalPrice) return 0
  return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100)
}

export default mongoose.models.Plan || mongoose.model<IPlan>("Plan", PlanSchema)
