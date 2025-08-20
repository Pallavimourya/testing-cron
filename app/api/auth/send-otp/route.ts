import { NextRequest, NextResponse } from "next/server"
import User from "@/models/User"
import connectDB from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 Starting OTP send process...")
    await connectDB()
    console.log("✅ Database connected")
    
    const { mobile } = await request.json()
    console.log("📱 Mobile number received:", mobile)

    if (!mobile) {
      console.log("❌ No mobile number provided")
      return NextResponse.json(
        { error: "Mobile number is required" },
        { status: 400 }
      )
    }

    // Validate mobile number format (10 digits starting with 6-9)
    const mobileRegex = /^[6-9]\d{9}$/
    if (!mobileRegex.test(mobile)) {
      console.log("❌ Invalid mobile number format:", mobile)
      return NextResponse.json(
        { error: "Please enter a valid 10-digit mobile number" },
        { status: 400 }
      )
    }

    // Check if user exists with this mobile number
    console.log("🔍 Searching for user with mobile:", mobile)
    const user = await User.findOne({ mobile })
    if (!user) {
      console.log("❌ No user found with mobile:", mobile)
      return NextResponse.json(
        { error: "No account found with this mobile number" },
        { status: 404 }
      )
    }
    console.log("✅ User found:", user.name)

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    console.log("🔢 Generated OTP:", otp)
    
    // Store OTP in user document with expiry (10 minutes)
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    console.log("⏰ OTP expiry:", otpExpiry)
    
    const updateResult = await User.findByIdAndUpdate(user._id, {
      resetPasswordToken: otp,
      resetPasswordExpires: otpExpiry
    })
    console.log("💾 OTP saved to database:", updateResult ? "Success" : "Failed")

    // Send SMS using TextLocal (Free tier available)
    try {
      const textLocalApiKey = process.env.TEXTLOCAL_API_KEY || "YOUR_TEXTLOCAL_API_KEY"
      const textLocalSender = process.env.TEXTLOCAL_SENDER || "TXTLCL"
      
      console.log("🔑 API Key (first 10 chars):", textLocalApiKey.substring(0, 10) + "...")
      console.log("📱 Sending to:", `91${mobile}`)
      
      const smsUrl = "https://api.textlocal.in/send/"
      const smsData = new URLSearchParams({
        apikey: textLocalApiKey,
        numbers: `91${mobile}`,
        sender: textLocalSender,
        message: `Your password reset OTP is ${otp}. Valid for 10 minutes. Do not share this OTP with anyone.`
      })
      
      const smsResponse = await fetch(smsUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: smsData
      })
      
      const smsResult = await smsResponse.json()
      console.log("📱 SMS API Response:", smsResult)
      
      if (smsResponse.ok && smsResult.status === "success") {
        console.log("✅ SMS sent successfully!")
      } else {
        console.log("❌ SMS failed, but OTP is:", otp)
        console.log("📱 For testing, OTP is:", otp)
        
        // Try alternative method - simpler message
        console.log("🔄 Trying alternative SMS method...")
        const altSmsData = new URLSearchParams({
          apikey: textLocalApiKey,
          numbers: `91${mobile}`,
          message: `OTP: ${otp}. Valid for 10 minutes.`,
          sender: "TXTLCL"
        })
        
        const altResponse = await fetch(smsUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: altSmsData
        })
        
        const altResult = await altResponse.json()
        console.log("📱 Alternative SMS Response:", altResult)
      }
    } catch (smsError) {
      console.log("❌ SMS service error:", smsError)
      console.log("📱 For testing, OTP is:", otp)
    }

    return NextResponse.json({
      message: "OTP sent successfully",
      mobile: mobile.replace(/(\d{3})(\d{3})(\d{4})/, '$1***$3') // Mask middle digits
    })

  } catch (error) {
    console.error("Error sending OTP:", error)
    return NextResponse.json(
      { error: "Failed to send OTP. Please try again." },
      { status: 500 }
    )
  }
}
