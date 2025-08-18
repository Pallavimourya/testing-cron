import Razorpay from "razorpay"
import crypto from "crypto"

// Plan types that match your existing system
export type PlanType = "starter" | "professional" | "enterprise"

// Plan configuration that matches your existing plans
export const PLANS = {
  starter: {
    id: "plan_starter",
    displayName: "Starter",
    name: "Starter Plan",
    price: 99900, // ₹999 in paise
    duration: "30 days",
    imageLimit: 20,
    contentLimit: 50,
    features: [
      "50 AI-generated posts",
      "20 AI-generated images",
      "Basic LinkedIn integration",
      "Content scheduling",
      "Email support",
      "Basic analytics",
    ],
  },
  professional: {
    id: "plan_professional",
    displayName: "Professional",
    name: "Professional Plan",
    price: 199900, // ₹1999 in paise
    duration: "30 days",
    imageLimit: 100,
    contentLimit: 200,
    features: [
      "200 AI-generated posts",
      "100 AI-generated images",
      "Advanced LinkedIn integration",
      "Content scheduling",
      "Priority email support",
      "Advanced analytics",
      "Custom templates",
      "Bulk operations",
    ],
  },
  enterprise: {
    id: "plan_enterprise",
    displayName: "Enterprise",
    name: "Enterprise Plan",
    price: 399900, // ₹3999 in paise
    duration: "30 days",
    imageLimit: -1, // Unlimited
    contentLimit: -1, // Unlimited
    features: [
      "Unlimited AI-generated posts",
      "Unlimited AI-generated images",
      "Premium LinkedIn integration",
      "Advanced content scheduling",
      "24/7 priority support",
      "Premium analytics & insights",
      "Custom templates & branding",
      "Bulk operations",
      "API access",
      "White-label options",
    ],
  },
}

export const formatPrice = (priceInPaise: number): string => {
  return `₹${(priceInPaise / 100).toLocaleString("en-IN")}`
}

// Initialize Razorpay instance
let razorpayInstance: Razorpay | null = null

export const getRazorpayInstance = (): Razorpay => {
  if (!razorpayInstance) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay credentials not found in environment variables")
    }

    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
  }

  return razorpayInstance
}

// Alias for backward compatibility
export const createRazorpayInstance = getRazorpayInstance

// Validate plan type
export const validatePlanType = (planType: string): planType is PlanType => {
  return Object.keys(PLANS).includes(planType)
}

// Get Razorpay public key
export const getRazorpayPublicKey = (): string => {
  const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
  if (!key) {
    throw new Error("NEXT_PUBLIC_RAZORPAY_KEY_ID not found in environment variables")
  }
  return key
}

// Subscription utility functions
export const isSubscriptionActive = (status: string, expiryDate?: string): boolean => {
  if (status !== "active") return false
  if (!expiryDate) return false

  const expiry = new Date(expiryDate)
  const now = new Date()

  return expiry > now
}

export const getRemainingImageGenerations = (planType: string, used: number) => {
  const plan = PLANS[planType as PlanType]
  if (!plan) {
    return { total: 0, remaining: 0, used, limit: 0 }
  }

  // For now, we'll use a simple mapping based on plan type
  // You can adjust these limits as needed
  const limits = {
    starter: 20,
    professional: 100,
    enterprise: -1, // unlimited
  }

  const total = limits[planType as keyof typeof limits] || 0
  const remaining = total === -1 ? -1 : Math.max(0, total - used)

  return { total, remaining, used, limit: total }
}

// Payment signature verification function
export function verifyPaymentSignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
): boolean {
  try {
    const keySecret = process.env.RAZORPAY_KEY_SECRET
    if (!keySecret) {
      throw new Error("RAZORPAY_KEY_SECRET not found in environment variables")
    }

    const body = razorpayOrderId + "|" + razorpayPaymentId
    const expectedSignature = crypto.createHmac("sha256", keySecret).update(body.toString()).digest("hex")

    return expectedSignature === razorpaySignature
  } catch (error) {
    console.error("Payment signature verification error:", error)
    return false
  }
}

// Create Razorpay order function
export function createRazorpayOrder(amount: number, currency = "INR", receipt?: string) {
  const razorpay = getRazorpayInstance()

  return razorpay.orders.create({
    amount: Math.round(amount * 100), // Convert to paise
    currency,
    receipt: receipt || `order_${Date.now()}`,
  })
}

// Webhook signature validation function
export function validateWebhookSignature(body: string, signature: string, secret: string): boolean {
  try {
    const expectedSignature = crypto.createHmac("sha256", secret).update(body).digest("hex")

    return expectedSignature === signature
  } catch (error) {
    console.error("Webhook signature validation error:", error)
    return false
  }
}

export default getRazorpayInstance
