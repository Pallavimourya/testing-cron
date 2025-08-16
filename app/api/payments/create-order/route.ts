import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/auth"
import { createRazorpayInstance, PLANS, validatePlanType, getRazorpayPublicKey, type PlanType } from "@/lib/razorpay"
import connectDB from "@/lib/mongodb"
import Payment from "@/models/Payment"
import User from "@/models/User"

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 Starting payment order creation...")

    const session = await getServerSession(authOptions)

    console.log("🔍 Payment create-order request - Session:", {
      hasSession: !!session,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
    })

    if (!session?.user?.id) {
      console.log("❌ Unauthorized - No session or user ID")
      return NextResponse.json({ error: "Please sign in to continue" }, { status: 401 })
    }

    const body = await request.json()
    const { planType, planId, amount, planName } = body

    console.log("🔍 Plan data received:", { planType, planId, amount, planName })
    console.log("🔍 Plan data types:", { 
      planType: typeof planType, 
      planId: typeof planId, 
      amount: typeof amount, 
      planName: typeof planName 
    })

    if (!planType) {
      console.log("❌ Invalid plan type:", planType)
      return NextResponse.json({ error: "Invalid plan type" }, { status: 400 })
    }

    console.log("🔍 Connecting to database...")
    await connectDB()
    console.log("✅ Database connected")

    // Use the provided plan data or fallback to PLANS object
    let plan
    if (amount && planName) {
      // Use the actual plan data from database (even without planId)
      plan = {
        id: planId || planType,
        name: planName,
        price: amount, // Already in paise
        duration: "30 days" // Default duration
      }
      console.log("✅ Using database plan data:", plan)
    } else {
      // Fallback to PLANS object
      console.log("🔍 Checking PLANS object for:", planType)
      console.log("🔍 Available PLANS keys:", Object.keys(PLANS))
      plan = PLANS[planType as PlanType]
      if (!plan) {
        console.log("❌ Plan not found in PLANS:", planType)
        return NextResponse.json({ error: "Plan not found" }, { status: 400 })
      }
      console.log("✅ Using PLANS object data:", plan)
    }
    
    console.log("🔍 Plan details:", { name: plan.name, price: plan.price })

    // Validate minimum amount (Razorpay minimum is 100 paise = ₹1)
    if (plan.price < 100) {
      console.log("❌ Amount too low:", plan.price, "paise")
      return NextResponse.json({ error: "Order amount must be at least ₹1" }, { status: 400 })
    }

    // Ensure amount is a valid integer
    if (!Number.isInteger(plan.price)) {
      console.log("❌ Invalid amount:", plan.price)
      return NextResponse.json({ error: "Invalid amount format" }, { status: 400 })
    }

    // Find user in database
    const user = await User.findById(session.user.id)

    if (!user) {
      console.log("❌ User not found in database")
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log("🔍 Creating Razorpay instance...")
    // Create Razorpay instance
    const razorpay = createRazorpayInstance()
    console.log("✅ Razorpay instance created")

    // Create Razorpay order
    // Razorpay requires receipt to be <= 40 characters
    let rawReceipt = `order_${Date.now()}_${session.user.id}`;
    let receipt = rawReceipt;
    if (rawReceipt.length > 40) {
      // Use a hash to ensure uniqueness and length
      const hash = require('crypto').createHash('sha1').update(rawReceipt).digest('hex').substring(0, 32);
      receipt = `order_${hash}`;
    }
    const orderOptions = {
      amount: plan.price, // amount in paise
      currency: "INR",
      receipt,
      notes: {
        userId: session.user.id,
        planType,
        planName: plan.name,
        userEmail: user.email,
      },
    }

    console.log("🔍 Order options:", {
      amount: orderOptions.amount,
      amountInRupees: orderOptions.amount / 100,
      currency: orderOptions.currency,
      receipt: orderOptions.receipt,
    })

    console.log("🔍 Creating Razorpay order...")
    const razorpayOrder = await razorpay.orders.create(orderOptions)
    console.log("✅ Razorpay order created:", razorpayOrder.id)

    console.log("🔍 Saving payment record to database...")
    // Save payment record in database
    const payment = new Payment({
      userId: session.user.id,
      razorpayOrderId: razorpayOrder.id,
      amount: plan.price,
      originalAmount: plan.price, // Set original amount (same as amount for now, can be different with coupons)
      discountAmount: 0, // No discount applied initially
      currency: "INR",
      status: "created",
      planId: plan.id, // Use the plan ID from the request
      planName: plan.name,
      planDuration: plan.duration,
      metadata: {
        planType,
        userEmail: user.email,
        userName: user.name,
      },
    })

    await payment.save()
    console.log("✅ Payment record saved")

    const response = {
      orderId: razorpayOrder.id,
      amount: plan.price,
      currency: "INR",
      planName: plan.name,
      planType,
      key: getRazorpayPublicKey(),
    }

    console.log("✅ Returning response:", {
      orderId: response.orderId,
      amount: response.amount,
      planName: response.planName,
      hasKey: !!response.key,
    })
    return NextResponse.json(response)
  } catch (error) {
    console.error("❌ Create order error:", error)
    console.error("❌ Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : "No stack trace",
      name: error instanceof Error ? error.name : "Unknown",
    })

    // Provide more specific error messages
    let errorMessage = "Failed to create payment order"
    let statusCode = 500

    if (error instanceof Error) {
      if (error.message.includes("Razorpay credentials not configured")) {
        errorMessage = "Payment service not configured. Please contact support."
        statusCode = 503
      } else if (error.message.includes("Razorpay package not installed")) {
        errorMessage = "Payment service unavailable. Please contact support."
        statusCode = 503
      } else if (error.message.includes("connect")) {
        errorMessage = "Database connection failed. Please try again."
        statusCode = 503
      } else if (error.message.includes("NEXT_PUBLIC_RAZORPAY_KEY_ID")) {
        errorMessage = "Payment configuration error. Please contact support."
        statusCode = 503
      } else {
        errorMessage = error.message
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : "Unknown error"
            : undefined,
      },
      { status: statusCode },
    )
  }
}
