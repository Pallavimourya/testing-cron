import { NextRequest, NextResponse } from "next/server"
import User from "@/models/User"
import connectDB from "@/lib/mongodb"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 Starting forgot password process...")
    await connectDB()
    console.log("✅ Database connected")
    
    const { email } = await request.json()
    console.log("📧 Email received:", email)

    if (!email) {
      console.log("❌ No email provided")
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    // Check if user exists with this email
    console.log("🔍 Searching for user with email:", email)
    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      console.log("❌ No user found with email:", email)
      // Don't reveal if email exists or not for security
      return NextResponse.json({
        message: "If an account exists with this email, you will receive a password reset link shortly."
      })
    }
    console.log("✅ User found:", user.name)

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    
    // Save reset token to user
    await User.findByIdAndUpdate(user._id, {
      resetPasswordToken: resetToken,
      resetPasswordExpires: resetTokenExpiry
    })
    console.log("💾 Reset token saved to database")

    // Create reset URL
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/reset-password?token=${resetToken}`
    console.log("🔗 Reset URL created:", resetUrl)

    // Send actual email using Gmail SMTP
    try {
      const nodemailer = require('nodemailer')
      
      // Create transporter using Gmail
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER || 'your-email@gmail.com',
          pass: process.env.GMAIL_APP_PASSWORD || 'your-app-password'
        }
      })

      // Email content
      const mailOptions = {
        from: `"LinkzUp" <${process.env.GMAIL_USER || 'your-email@gmail.com'}>`,
        to: email,
        subject: 'Password Reset Request - LinkzUp',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h2 style="color: #333; text-align: center; margin-bottom: 30px;">Password Reset Request</h2>
              
              <p style="color: #555; font-size: 16px; line-height: 1.6;">Hello <strong>${user.name}</strong>,</p>
              
              <p style="color: #555; font-size: 16px; line-height: 1.6;">You requested a password reset for your account.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
              </div>
              
              <p style="color: #666; font-size: 14px; line-height: 1.6;">
                <strong>Important:</strong> This link will expire in 1 hour for security reasons.
              </p>
              
              <p style="color: #666; font-size: 14px; line-height: 1.6;">
                If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
              </p>
              
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              
              <p style="color: #999; font-size: 12px; text-align: center;">
                Best regards,<br>
                LinkzUp Team
              </p>
            </div>
          </div>
        `
      }

      // Send email
      const info = await transporter.sendMail(mailOptions)
      console.log("✅ Email sent successfully!")
      console.log("📧 Message ID:", info.messageId)
      
    } catch (emailError: any) {
      console.log("❌ Email sending failed:", emailError?.message || emailError)
      console.log("📧 For testing, reset URL is:", resetUrl)
    }

    return NextResponse.json({
      message: "If an account exists with this email, you will receive a password reset link shortly."
    })

  } catch (error) {
    console.error("Error in forgot password:", error)
    return NextResponse.json(
      { error: "Failed to process request. Please try again." },
      { status: 500 }
    )
  }
}
