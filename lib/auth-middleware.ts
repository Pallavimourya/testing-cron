import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import Admin from "@/models/Admin"

export async function requireAuth() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  return session
}

export async function requireAdmin() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  await connectDB()

  // Check if user is admin in User model
  const user = await User.findById(session.user.id)
  if (user?.role === "admin") {
    return { session, user, isAdmin: true }
  }

  // Check if user exists in Admin model
  const admin = await Admin.findOne({ email: session.user.email })
  if (!admin || !admin.isActive) {
    throw new Error("Admin access required")
  }

  return { session, admin, isAdmin: true }
}

export async function getUserWithPermissions(userId: string) {
  await connectDB()

  const user = await User.findById(userId)
  if (!user) {
    throw new Error("User not found")
  }

  return {
    ...user.toJSON(),
    canAccessPremiumFeatures: user.canAccessPremiumFeatures(),
    canGenerateContent: user.canGenerateContent(),
    hasActiveSubscription: user.hasActiveSubscription(),
  }
}
