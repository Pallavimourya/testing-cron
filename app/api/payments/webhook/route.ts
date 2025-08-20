import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import Payment from "@/models/Payment"
import { PLANS } from "@/lib/razorpay"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get("x-razorpay-signature")

    if (!signature) {
      console.error("No signature found in webhook")
      return NextResponse.json({ error: "No signature found" }, { status: 400 })
    }

    // Verify webhook signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error("RAZORPAY_WEBHOOK_SECRET not configured")
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
    }

    const expectedSignature = crypto.createHmac("sha256", webhookSecret).update(body).digest("hex")

    if (expectedSignature !== signature) {
      console.error("Webhook signature verification failed")
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    const event = JSON.parse(body)
    console.log("Webhook event received:", event.event)

    await connectDB()

    switch (event.event) {
      case "payment.captured":
        const payment = event.payload.payment.entity
        const orderId = payment.order_id
        const paymentId = payment.id
        const email = payment.notes?.email

        console.log("Processing payment.captured:", {
          orderId,
          paymentId,
          email,
          amount: payment.amount
        })

        if (email) {
          // Update payment status in Payment collection
          await Payment.findOneAndUpdate(
            { razorpayOrderId: orderId },
            {
              $set: {
                razorpayPaymentId: paymentId,
                status: "paid",
                updatedAt: new Date()
              }
            }
          )

          // Find the payment to get plan details
          const paymentRecord = await Payment.findOne({ razorpayOrderId: orderId })
          
          if (paymentRecord) {
            // Determine plan type from payment
            let planType = "zuper30" // Default fallback
            let durationDays = 30

            // Try to find plan by amount
            const amountInPaise = payment.amount
            for (const [key, plan] of Object.entries(PLANS)) {
              if (plan.price === amountInPaise) {
                planType = key
                // Extract days from duration string (e.g., "30 days" -> 30)
                const durationMatch = plan.duration.match(/(\d+)/)
                durationDays = durationMatch ? parseInt(durationMatch[1]) : 30
                break
              }
            }

            // Calculate subscription end date
            const subscriptionEndDate = new Date()
            subscriptionEndDate.setDate(subscriptionEndDate.getDate() + durationDays)

            // Update user subscription
            await User.findOneAndUpdate(
              { email: email.toLowerCase() },
              {
                $set: {
                  subscriptionStatus: "active",
                  subscriptionPlan: planType,
                  subscriptionExpiry: subscriptionEndDate,
                  updatedAt: new Date()
                }
              }
            )

            console.log(`✅ Subscription activated for ${email}:`, {
              planType,
              durationDays,
              subscriptionEndDate
            })
          }
        }
        break

      case "payment.failed":
        const failedPayment = event.payload.payment.entity
        const failedOrderId = failedPayment.order_id
        const failedEmail = failedPayment.notes?.email

        console.log("Processing payment.failed:", {
          orderId: failedOrderId,
          email: failedEmail
        })

        if (failedEmail) {
          // Update payment status to failed
          await Payment.findOneAndUpdate(
            { razorpayOrderId: failedOrderId },
            {
              $set: {
                status: "failed",
                updatedAt: new Date()
              }
            }
          )

          console.log(`❌ Payment failed for ${failedEmail}`)
        }
        break

      default:
        console.log(`Unhandled webhook event: ${event.event}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook processing error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
