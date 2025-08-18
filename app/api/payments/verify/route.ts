import { NextResponse } from "next/server"
import crypto from "crypto"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/auth"
import { PLANS } from "@/lib/razorpay"

export async function POST(req: Request) {
  try {
    console.log("🔍 Payment verification started...")
    
    const body = await req.json()
    console.log("📦 Request body:", body)
    
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature, 
      planId, 
      userEmail 
    } = body

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.error("❌ Missing required Razorpay fields")
      return NextResponse.json({ 
        error: "Missing required payment verification fields" 
      }, { status: 400 })
    }

    // Verify signature
    const expectedBody = razorpay_order_id + "|" + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(expectedBody)
      .digest("hex")

    console.log("🔍 Signature verification:", {
      expected: expectedSignature,
      received: razorpay_signature,
      matches: expectedSignature === razorpay_signature
    })

    if (expectedSignature !== razorpay_signature) {
      console.error("❌ Invalid signature")
      return NextResponse.json({ 
        error: "Invalid payment signature",
        details: "Payment verification failed due to invalid signature"
      }, { status: 400 })
    }

    await connectDB()

    // Get user email from session if not provided
    let email = userEmail
    if (!email) {
      const session = await getServerSession(authOptions)
      if (!session?.user?.email) {
        console.error("❌ No user email found")
        return NextResponse.json({ 
          error: "User email not found" 
        }, { status: 400 })
      }
      email = session.user.email
    }

    // Determine plan type and duration
    let planType = "starter" // Default fallback
    let durationDays = 30

    if (planId) {
      // Try to find plan by database plan ID first
      try {
        const Plan = require("@/models/Plan").default
        const plan = await Plan.findById(planId)
        if (plan) {
          planType = plan.slug
          durationDays = plan.durationDays
        } else {
          // Fallback to PLANS object
          for (const [key, planConfig] of Object.entries(PLANS)) {
            if (planConfig.id === planId) {
              planType = key
              const durationMatch = planConfig.duration.match(/(\d+)/)
              durationDays = durationMatch ? parseInt(durationMatch[1]) : 30
              break
            }
          }
        }
      } catch (error) {
        console.error("Error finding plan:", error)
        // Use default values
      }
    }

    // Calculate subscription end date based on plan duration
    const subscriptionEndDate = new Date()
    subscriptionEndDate.setDate(subscriptionEndDate.getDate() + durationDays)

    console.log("🔍 Updating user subscription:", {
      email: email.toLowerCase(),
      planType: planType,
      durationDays: durationDays,
      subscriptionEndDate
    })

    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      {
        $set: {
          subscriptionStatus: "active",
          subscriptionPlan: planType,
          subscriptionExpiry: subscriptionEndDate,
          updatedAt: new Date(),
        },
      },
      { new: true },
    )

    if (!user) {
      console.error("❌ User not found:", email)
      return NextResponse.json({ 
        error: "User not found",
        details: `No user found with email: ${email}`
      }, { status: 404 })
    }

    console.log("✅ Payment verified and subscription activated for user:", user.email)

    return NextResponse.json({
      success: true,
      message: "Payment verified and subscription activated",
      subscription: {
        status: user.subscriptionStatus,
        plan: user.subscriptionPlan,
        expiry: user.subscriptionExpiry,
        isActive: true
      },
      user: {
        email: user.email,
        name: user.name
      }
    })
  } catch (error) {
    console.error("❌ Payment verification error:", error)
    return NextResponse.json({ 
      error: "Payment verification failed",
      details: error instanceof Error ? error.message : "Unknown error occurred"
    }, { status: 500 })
  }
}
