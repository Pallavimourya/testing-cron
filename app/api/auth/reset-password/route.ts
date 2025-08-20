import { NextRequest, NextResponse } from "next/server"
import User from "@/models/User"
import connectDB from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const { mobile, otp, newPassword } = await request.json()

    if (!mobile || !otp || !newPassword) {
      return NextResponse.json(
        { error: "Mobile number, OTP, and new password are required" },
        { status: 400 }
      )
    }

    // Validate mobile number format
    const mobileRegex = /^[6-9]\d{9}$/
    if (!mobileRegex.test(mobile)) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit mobile number" },
        { status: 400 }
      )
    }

    // Validate password length
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      )
    }

    // Find user by mobile number
    const user = await User.findOne({ mobile })
    if (!user) {
      return NextResponse.json(
        { error: "No account found with this mobile number" },
        { status: 404 }
      )
    }

    // Check if OTP exists and is not expired
    if (!user.resetPasswordToken || !user.resetPasswordExpires) {
      return NextResponse.json(
        { error: "No OTP request found. Please request a new OTP." },
        { status: 400 }
      )
    }

    // Check if OTP is expired
    if (new Date() > user.resetPasswordExpires) {
      return NextResponse.json(
        { error: "OTP has expired. Please request a new OTP." },
        { status: 400 }
      )
    }

    // Verify OTP
    if (user.resetPasswordToken !== otp) {
      return NextResponse.json(
        { error: "Invalid OTP. Please check and try again." },
        { status: 400 }
      )
    }

    // Update password and clear OTP fields
    user.password = newPassword
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    
    await user.save()

    return NextResponse.json({
      message: "Password reset successfully"
    })

  } catch (error) {
    console.error("Error resetting password:", error)
    return NextResponse.json(
      { error: "Failed to reset password. Please try again." },
      { status: 500 }
    )
  }
}
