import mongoose, { Schema, type Document } from "mongoose"

export interface IPaymentSettings extends Document {
  razorpayKeyId: string
  razorpayKeySecret: string
  razorpayWebhookSecret: string
  taxPercentage: number
  currency: string
  paymentsEnabled: boolean
  couponEngineEnabled: boolean
  lastWebhookTime?: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const PaymentSettingsSchema = new Schema<IPaymentSettings>(
  {
    razorpayKeyId: {
      type: String,
      required: false,
      default: "",
    },
    razorpayKeySecret: {
      type: String,
      required: false,
      default: "",
    },
    razorpayWebhookSecret: {
      type: String,
      required: false,
      default: "",
    },
    taxPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
    },
    paymentsEnabled: {
      type: Boolean,
      default: false,
    },
    couponEngineEnabled: {
      type: Boolean,
      default: true,
    },
    lastWebhookTime: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
)

// No need to initialize mongoose.models as it is managed internally by mongoose

export default mongoose.models.PaymentSettings ||
  mongoose.model<IPaymentSettings>("PaymentSettings", PaymentSettingsSchema)
