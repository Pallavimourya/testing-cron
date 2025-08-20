import type React from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/auth"
import { AdminSidebar } from "@/components/admin-sidebar"
import connectDB from "@/lib/mongodb"
import Admin from "@/models/Admin"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  // Check if user is authenticated
  if (!session?.user?.email) {
    redirect("/signin")
  }

  // Check if user is admin (either "admin" or "super_admin")
  if (session.user.role !== "admin" && session.user.role !== "super_admin") {
    redirect("/signin")
  }

  await connectDB()
  const admin = await Admin.findOne({
    email: session.user.email,
    isActive: true,
  })

  if (!admin) {
    redirect("/signin")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <AdminSidebar />

        {/* Main Content */}
        <div className="flex-1 lg:ml-64 transition-all duration-300">
          <main className="p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  )
}
