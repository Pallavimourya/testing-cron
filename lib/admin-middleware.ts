import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/auth"
import type { NextRequest } from "next/server"

export function withAdminAuth(handler: (request: NextRequest) => Promise<Response>) {
  return async (request: NextRequest) => {
    try {
      const session = await getServerSession(authOptions)

      if (!session?.user?.email) {
        return Response.json({ error: "Unauthorized" }, { status: 401 })
      }

      // Check if user is admin (either "admin" or "super_admin")
      if (session.user.role !== "admin" && session.user.role !== "super_admin") {
        return Response.json({ error: "Access denied" }, { status: 403 })
      }

      return handler(request)
    } catch (error) {
      console.error("Admin auth error:", error)
      return Response.json({ error: "Authentication failed" }, { status: 500 })
    }
  }
}

export function isAdmin(email?: string | null): boolean {
  return email === "admin@zuperstudio.com" || email === "s.admin@zuperstudio.com"
}
