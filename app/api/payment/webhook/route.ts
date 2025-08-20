import type { NextRequest } from "next/server"
import crypto from "crypto"
import connectDB from "@/lib/mongodb"
import Payment from "@/models/Payment"
import User from "@/models/User"
import Plan from "@/models/Plan"
import Coupon from "@/models/Coupon"
import CouponUsage from "@/models/CouponUsage"
import PaymentSettings from "@/models/PaymentSettings"

// POST /api/payment/webhook - Razorpay webhook handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get("x-razorpay-signature")

    if (!signature) {
      return Response.json({ success: false, error: "Missing signature" }, { status: 400 })
    }

    await connectDB()

    // Get webhook secret
    const settings = await PaymentSettings.findOne().select("+razorpayWebhookSecret")
    const webhookSecret = settings?.razorpayWebhookSecret

    if (!webhookSecret) {
      console.warn("Webhook secret not configured")
      return Response.json({ success: true }) // Allow webhook to pass
    }

    // Verify webhook signature
    const expectedSignature = crypto.createHmac("sha256", webhookSecret).update(body).digest("hex")

    if (expectedSignature !== signature) {
      console.error("Invalid webhook signature")
      return Response.json({ success: false, error: "Invalid signature" }, { status: 400 })
    }

    const event = JSON.parse(body)
    console.log("Webhook event:", event.event, event.payload?.payment?.entity?.id)

    // Update last webhook time
    await PaymentSettings.findOneAndUpdate({}, { lastWebhookTime: new Date() }, { upsert: true })

    // Handle different event types
    switch (event.event) {
      case "payment.authorized":
      case "payment.captured":
        await handlePaymentSuccess(event.payload.payment.entity)
        break

      case "payment.failed":
        await handlePaymentFailed(event.payload.payment.entity)
        break

      default:
        console.log("Unhandled webhook event:", event.event)
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return Response.json({ success: false, error: "Webhook processing failed" }, { status: 500 })
  }
}

async function handlePaymentSuccess(payment: any) {
  try {
    const paymentRecord = await Payment.findOne({ razorpayOrderId: payment.order_id })
    if (!paymentRecord) {
      console.error("Payment record not found for payment:", payment.id)
      return
    }

    // Skip if already processed
    if (paymentRecord.status === "paid") {
      return
    }

    // Update payment record
    paymentRecord.status = "paid"
    paymentRecord.razorpayPaymentId = payment.id
    await paymentRecord.save()

    // Get plan
    const plan = await Plan.findById(paymentRecord.planId)
    if (!plan) {
      console.error("Plan not found:", paymentRecord.planId)
      return
    }

    // Update user subscription
    const user = await User.findById(paymentRecord.userId)
    if (!user) {
      console.error("User not found:", paymentRecord.userId)
      return
    }

    const now = new Date()
    const subscriptionExpiry = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000)

    user.subscriptionStatus = "active"
    user.subscriptionPlan = paymentRecord.planId
    user.subscriptionExpiry = subscriptionExpiry
    await user.save()

    // Handle coupon usage
    if (paymentRecord.couponCode && paymentRecord.couponId) {
      await Coupon.findByIdAndUpdate(paymentRecord.couponId, {
        $inc: { usageCount: 1 },
      })

      const couponUsage = new CouponUsage({
        userId: paymentRecord.userId,
        couponId: paymentRecord.couponId,
        couponCode: paymentRecord.couponCode,
        orderId: paymentRecord._id.toString(),
        discountAmount: paymentRecord.discountAmount,
      })
      await couponUsage.save()
    }

    console.log("Payment processed successfully:", payment.id)
  } catch (error) {
    console.error("Error handling payment success:", error)
  }
}

async function handlePaymentFailed(payment: any) {
  try {
    const paymentRecord = await Payment.findOne({ razorpayOrderId: payment.order_id })
    if (!paymentRecord) {
      console.error("Payment record not found for failed payment:", payment.id)
      return
    }

    paymentRecord.status = "failed"
    paymentRecord.razorpayPaymentId = payment.id
    await paymentRecord.save()

    console.log("Payment marked as failed:", payment.id)
  } catch (error) {
    console.error("Error handling payment failure:", error)
  }
}
