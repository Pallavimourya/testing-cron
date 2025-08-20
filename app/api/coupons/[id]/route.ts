import type { NextRequest } from "next/server"
import connectDB from "@/lib/mongodb"
import Coupon from "@/models/Coupon"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await connectDB()

    const coupon = await Coupon.findById(id)

    if (!coupon) {
      return Response.json({ error: "Coupon not found" }, { status: 404 })
    }

    return Response.json(coupon)
  } catch (error) {
    console.error("Get coupon error:", error)
    return Response.json({ error: "Failed to fetch coupon" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    await connectDB()

    const coupon = await Coupon.findByIdAndUpdate(id, body, { new: true, runValidators: true })

    if (!coupon) {
      return Response.json({ error: "Coupon not found" }, { status: 404 })
    }

    return Response.json(coupon)
  } catch (error) {
    console.error("Update coupon error:", error)
    return Response.json({ error: "Failed to update coupon" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await connectDB()

    const coupon = await Coupon.findByIdAndDelete(id)

    if (!coupon) {
      return Response.json({ error: "Coupon not found" }, { status: 404 })
    }

    return Response.json({ message: "Coupon deleted successfully" })
  } catch (error) {
    console.error("Delete coupon error:", error)
    return Response.json({ error: "Failed to delete coupon" }, { status: 500 })
  }
}
