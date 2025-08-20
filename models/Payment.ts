import mongoose, { Schema, type Document } from "mongoose"

export interface IPayment extends Document {
  userId: string
  razorpayOrderId: string
  razorpayPaymentId?: string
  razorpaySignature?: string
  amount: number
  originalAmount: number // Added original amount before discount
  discountAmount: number // Added discount amount
  currency: string
  status: "created" | "paid" | "failed" | "cancelled"
  planId: string // Added plan ID reference
  planName: string
  planDuration: string
  couponCode?: string // Added coupon code used
  couponId?: string // Added coupon ID reference
  metadata?: {
    planType?: string
    userEmail?: string
    userName?: string
    [key: string]: any
  }
  createdAt: Date
  updatedAt: Date
}

const PaymentSchema = new Schema<IPayment>(
  {
    userId: {
      type: String,
      required: true,
    },
    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
    },
    razorpayPaymentId: {
      type: String,
    },
    razorpaySignature: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
    },
    originalAmount: {
      type: Number,
      required: true,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      required: true,
      default: "INR",
    },
    status: {
      type: String,
      enum: ["created", "paid", "failed", "cancelled"],
      default: "created",
    },
    planId: {
      type: String,
      required: true,
    },
    planName: {
      type: String,
      required: true,
    },
    planDuration: {
      type: String,
      required: true,
    },
    couponCode: {
      type: String,
      uppercase: true,
    },
    couponId: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
)

// Indexes for better query performance
PaymentSchema.index({ userId: 1, status: 1 })
PaymentSchema.index({ createdAt: -1 })
PaymentSchema.index({ planId: 1 }) // Added plan index
PaymentSchema.index({ couponCode: 1 }) // Added coupon index

export default mongoose.models.Payment || mongoose.model<IPayment>("Payment", PaymentSchema)
