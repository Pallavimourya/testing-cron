export function formatPrice(amount: number, currency = "INR"): string {
  if (currency === "INR") {
    return `₹${amount.toLocaleString("en-IN")}`
  }
  return `${currency} ${amount.toLocaleString()}`
}

export function calculateDiscount(
  originalAmount: number,
  coupon: {
    type: "percentage" | "fixed"
    value: number
    maxDiscount?: number
    minAmount?: number
  },
): { discountAmount: number; finalAmount: number; isValid: boolean; error?: string } {
  // Check minimum amount
  if (coupon.minAmount && originalAmount < coupon.minAmount) {
    return {
      discountAmount: 0,
      finalAmount: originalAmount,
      isValid: false,
      error: `Minimum order amount is ${formatPrice(coupon.minAmount)}`,
    }
  }

  let discountAmount = 0

  if (coupon.type === "percentage") {
    discountAmount = (originalAmount * coupon.value) / 100

    // Apply max discount limit
    if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
      discountAmount = coupon.maxDiscount
    }
  } else {
    discountAmount = coupon.value
  }

  // Ensure discount doesn't exceed original amount
  discountAmount = Math.min(discountAmount, originalAmount)

  const finalAmount = originalAmount - discountAmount

  return {
    discountAmount,
    finalAmount,
    isValid: true,
  }
}

export function validateCoupon(
  coupon: {
    isActive: boolean
    validFrom: Date
    validUntil: Date
    usageLimit?: number
    usedCount: number
    applicablePlans: string[]
  },
  planId: string,
): { isValid: boolean; error?: string } {
  const now = new Date()

  if (!coupon.isActive) {
    return { isValid: false, error: "Coupon is not active" }
  }

  if (now < coupon.validFrom) {
    return { isValid: false, error: "Coupon is not yet valid" }
  }

  if (now > coupon.validUntil) {
    return { isValid: false, error: "Coupon has expired" }
  }

  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return { isValid: false, error: "Coupon usage limit exceeded" }
  }

  if (coupon.applicablePlans.length > 0 && !coupon.applicablePlans.includes(planId)) {
    return { isValid: false, error: "Coupon is not applicable to this plan" }
  }

  return { isValid: true }
}

export function calculatePriceQuote(
  planPrice: number,
  couponCode?: string,
  couponData?: {
    type: "percentage" | "fixed"
    value: number
    maxDiscount?: number
    minAmount?: number
    isActive: boolean
    validFrom: Date
    validUntil: Date
    usageLimit?: number
    usedCount: number
    applicablePlans: string[]
  },
  planId?: string,
): {
  baseAmount: number
  discountAmount: number
  finalAmount: number
  isValid: boolean
  error?: string
} {
  const baseAmount = planPrice

  if (!couponCode || !couponData || !planId) {
    return {
      baseAmount,
      discountAmount: 0,
      finalAmount: baseAmount,
      isValid: true,
    }
  }

  // Validate coupon
  const couponValidation = validateCoupon(couponData, planId)
  if (!couponValidation.isValid) {
    return {
      baseAmount,
      discountAmount: 0,
      finalAmount: baseAmount,
      isValid: false,
      error: couponValidation.error,
    }
  }

  // Calculate discount
  const discountResult = calculateDiscount(baseAmount, couponData)

  return {
    baseAmount,
    discountAmount: discountResult.discountAmount,
    finalAmount: discountResult.finalAmount,
    isValid: discountResult.isValid,
    error: discountResult.error,
  }
}

export function getPaymentReadiness(
  planId: string,
  userId: string,
  planData?: {
    isActive: boolean
    price: number
    name: string
  },
): {
  isReady: boolean
  error?: string
  planDetails?: {
    id: string
    name: string
    price: number
  }
} {
  if (!planData) {
    return {
      isReady: false,
      error: "Plan not found",
    }
  }

  if (!planData.isActive) {
    return {
      isReady: false,
      error: "Plan is not currently available",
    }
  }

  if (!userId) {
    return {
      isReady: false,
      error: "User authentication required",
    }
  }

  return {
    isReady: true,
    planDetails: {
      id: planId,
      name: planData.name,
      price: planData.price,
    },
  }
}

// Admin payment readiness check function
export async function getAdminPaymentReadiness(): Promise<{
  ready: boolean
  checks: {
    razorpayKeys: boolean
    webhookSecret: boolean
    activePlans: boolean
    currencySet: boolean
    couponEngine: boolean
    lastWebhook: boolean
  }
}> {
  try {
    // Import models dynamically to avoid circular dependencies
    const PaymentSettings = (await import("@/models/PaymentSettings")).default
    const Plan = (await import("@/models/Plan")).default
    const Coupon = (await import("@/models/Coupon")).default

    // Get payment settings
    const settings = await PaymentSettings.findOne()
    
    // Check Razorpay keys
    const razorpayKeys = !!(settings?.razorpayKeyId && settings?.razorpayKeySecret)
    
    // Check webhook secret
    const webhookSecret = !!settings?.razorpayWebhookSecret
    
    // Check if there are active plans
    const activePlans = await Plan.countDocuments({ isActive: true }) > 0
    
    // Check if currency is set
    const currencySet = !!(settings?.currency && settings.currency.trim() !== "")
    
    // Check coupon engine (always true for now, can be enhanced later)
    const couponEngine = true
    
    // Check last webhook (for now, assume true if webhook secret is set)
    const lastWebhook = webhookSecret

    const checks = {
      razorpayKeys,
      webhookSecret,
      activePlans,
      currencySet,
      couponEngine,
      lastWebhook,
    }

    // System is ready if all critical checks pass
    const ready = razorpayKeys && webhookSecret && activePlans && currencySet

    return {
      ready,
      checks,
    }
  } catch (error) {
    console.error("Error checking payment readiness:", error)
    return {
      ready: false,
      checks: {
        razorpayKeys: false,
        webhookSecret: false,
        activePlans: false,
        currencySet: false,
        couponEngine: false,
        lastWebhook: false,
      },
    }
  }
}
