import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/auth"
import connectDB from "@/lib/mongodb"
import Payment from "@/models/Payment"
import { formatPrice } from "@/lib/razorpay"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Fetching payment history...")

    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      console.log("❌ Unauthorized - No session")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const status = searchParams.get("status") || "paid" // Default to paid status
    const skip = (page - 1) * limit

    await connectDB()

    // Build query filter
    const queryFilter: any = { userId: session.user.id }
    if (status && status !== "all") {
      queryFilter.status = status
    }

    // Get total count
    const total = await Payment.countDocuments(queryFilter)

    // Get payments with pagination and status filter
    const payments = await Payment.find(queryFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean() as any

    const formattedPayments = payments.map((payment: any) => ({
      _id: payment._id,
      razorpayOrderId: payment.razorpayOrderId,
      razorpayPaymentId: payment.razorpayPaymentId,
      amount: payment.amount,
      formattedAmount: formatPrice(payment.amount),
      currency: payment.currency,
      status: payment.status,
      planName: payment.planName,
      planDuration: payment.planDuration,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      paidAt: payment.status === "paid" ? payment.updatedAt : undefined,
      failureReason: payment.status === "failed" ? "Payment failed" : undefined,
    }))

    const pagination = {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    }

    console.log("✅ Payment history fetched:", {
      totalPayments: total,
      currentPage: page,
      totalPages: pagination.pages,
      statusFilter: status,
    })

    return NextResponse.json({
      payments: formattedPayments,
      pagination,
      success: true,
    })
  } catch (error) {
    console.error("❌ Payment history error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch payment history",
        details:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : "Unknown error"
            : undefined,
      },
      { status: 500 },
    )
  }
}
