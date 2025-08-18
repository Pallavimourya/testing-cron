import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/auth"
import connectDB from "@/lib/mongodb"
import Payment from "@/models/Payment"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params
    console.log("🔍 Checking payment status for order:", orderId)

    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      console.log("❌ Unauthorized - No session")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    // Find payment record - fixed field name
    const payment = await Payment.findOne({ 
      razorpayOrderId: orderId,
      userId: session.user.id 
    })

    if (!payment) {
      console.log("❌ Payment record not found")
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    console.log("✅ Payment status retrieved:", {
      orderId: payment.razorpayOrderId,
      status: payment.status,
      amount: payment.amount,
      planName: payment.planName,
    })

    return NextResponse.json({
      orderId: payment.razorpayOrderId,
      status: payment.status,
      amount: payment.amount,
      planName: payment.planName,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    })
  } catch (error) {
    console.error("❌ Payment status check error:", error)
    return NextResponse.json(
      {
        error: "Failed to check payment status",
        details: process.env.NODE_ENV === "development" 
          ? error instanceof Error ? error.message : "Unknown error" 
          : undefined,
      },
      { status: 500 },
    )
  }
}
