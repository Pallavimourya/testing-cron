import type { NextRequest } from "next/server"
import connectDB from "@/lib/mongodb"
import PaymentSettings from "@/models/PaymentSettings"
import { withAdminAuth } from "@/lib/admin-middleware"
import { getAdminPaymentReadiness } from "@/lib/payment-engine"

// GET /api/admin/settings - Get payment settings
export async function GET(request: NextRequest) {
  return withAdminAuth(async () => {
    try {
      await connectDB()

      const settings = await PaymentSettings.findOne()
      const readiness = await getAdminPaymentReadiness()

      return Response.json({
        success: true,
        settings: settings || {
          razorpayKeyId: "",
          taxPercentage: 0,
          currency: "INR",
          paymentsEnabled: false,
          couponEngineEnabled: true,
        },
        readiness,
      })
    } catch (error) {
      console.error("Get settings error:", error)
      return Response.json({ success: false, error: "Failed to fetch settings" }, { status: 500 })
    }
  })(request)
}

// PUT /api/admin/settings - Update payment settings
export async function PUT(request: NextRequest) {
  return withAdminAuth(async () => {
    try {
      const body = await request.json()
      const {
        razorpayKeyId,
        razorpayKeySecret,
        razorpayWebhookSecret,
        taxPercentage,
        currency,
        paymentsEnabled,
        couponEngineEnabled,
      } = body

      await connectDB()

      const updateData: any = {}
      if (razorpayKeyId !== undefined) updateData.razorpayKeyId = razorpayKeyId
      if (razorpayKeySecret !== undefined) updateData.razorpayKeySecret = razorpayKeySecret
      if (razorpayWebhookSecret !== undefined) updateData.razorpayWebhookSecret = razorpayWebhookSecret
      if (taxPercentage !== undefined) updateData.taxPercentage = taxPercentage
      if (currency !== undefined) updateData.currency = currency.toUpperCase()
      if (paymentsEnabled !== undefined) updateData.paymentsEnabled = paymentsEnabled
      if (couponEngineEnabled !== undefined) updateData.couponEngineEnabled = couponEngineEnabled

      const settings = await PaymentSettings.findOneAndUpdate({}, updateData, {
        new: true,
        upsert: true,
        runValidators: true,
      })

      // Get updated readiness status
      const readiness = await getAdminPaymentReadiness()

      return Response.json({
        success: true,
        settings,
        readiness,
      })
    } catch (error) {
      console.error("Update settings error:", error)
      return Response.json({ success: false, error: "Failed to update settings" }, { status: 500 })
    }
  })(request)
}
