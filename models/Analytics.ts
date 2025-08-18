import mongoose, { Schema, type Document } from "mongoose"

export interface IAnalytics extends Document {
  date: Date
  totalUsers: number
  newUsers: number
  activeUsers: number
  totalRevenue: number
  newPayments: number
  failedPayments: number
  totalPlans: number
  activePlans: number
  totalCoupons: number
  activeCoupons: number
  couponUsage: number
  createdAt: Date
  updatedAt: Date
}

const AnalyticsSchema = new Schema<IAnalytics>(
  {
    date: {
      type: Date,
      required: true,
      unique: true,
    },
    totalUsers: {
      type: Number,
      default: 0,
    },
    newUsers: {
      type: Number,
      default: 0,
    },
    activeUsers: {
      type: Number,
      default: 0,
    },
    totalRevenue: {
      type: Number,
      default: 0,
    },
    newPayments: {
      type: Number,
      default: 0,
    },
    failedPayments: {
      type: Number,
      default: 0,
    },
    totalPlans: {
      type: Number,
      default: 0,
    },
    activePlans: {
      type: Number,
      default: 0,
    },
    totalCoupons: {
      type: Number,
      default: 0,
    },
    activeCoupons: {
      type: Number,
      default: 0,
    },
    couponUsage: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes
AnalyticsSchema.index({ date: -1 })

export default mongoose.models.Analytics || mongoose.model<IAnalytics>("Analytics", AnalyticsSchema)
