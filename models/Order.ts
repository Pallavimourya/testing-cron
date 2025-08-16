import mongoose from "mongoose"

const OrderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    razorpayOrderId: {
      type: String,
      required: true,
    },
    razorpayPaymentId: {
      type: String,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: true,
    },
    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    originalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      required: true,
      enum: ["created", "pending", "paid", "failed", "cancelled"],
      default: "created",
    },
    paymentMethod: {
      type: String,
    },
    notes: {
      type: Map,
      of: String,
    },
  },
  {
    timestamps: true,
  },
)

// Create indexes
OrderSchema.index({ orderId: 1 })
OrderSchema.index({ razorpayOrderId: 1 })
OrderSchema.index({ userId: 1 })
OrderSchema.index({ status: 1 })

export default mongoose.models.Order || mongoose.model("Order", OrderSchema)
