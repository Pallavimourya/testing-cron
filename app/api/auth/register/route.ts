import bcrypt from "bcryptjs"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"

export async function POST(request: Request) {
  try {
    console.log("📝 Starting user registration...")
    const { name, email, mobile, city, password } = await request.json()
    console.log("📋 Registration data:", { name, email, mobile, city, passwordLength: password?.length })

    // Validation
    if (!name || !email || !mobile || !city || !password) {
      console.log("❌ Missing required fields")
      return Response.json({ message: "All fields are required" }, { status: 400 })
    }

    // Mobile number validation
    const mobileRegex = /^[6-9]\d{9}$/
    if (!mobileRegex.test(mobile)) {
      console.log("❌ Invalid mobile number:", mobile)
      return Response.json({ message: "Please enter a valid 10-digit mobile number" }, { status: 400 })
    }

    if (password.length < 6) {
      console.log("❌ Password too short")
      return Response.json({ message: "Password must be at least 6 characters long" }, { status: 400 })
    }

    await connectDB()
    console.log("✅ Database connected")

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { mobile: mobile }],
    })

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        console.log("❌ Email already exists:", email)
        return Response.json({ message: "User with this email already exists" }, { status: 400 })
      }
      if (existingUser.mobile === mobile) {
        console.log("❌ Mobile already exists:", mobile)
        return Response.json({ message: "User with this mobile number already exists" }, { status: 400 })
      }
    }

    // Create user (password will be hashed by the model's pre-save middleware)
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      mobile: mobile.trim(),
      city: city.trim(),
      password: password, // Don't hash here, let the model handle it
      role: "user",
      blocked: false,
      subscriptionStatus: "free",
      isOnboarded: false,
      onboardingCompleted: false,
      isVerified: false,
    })

    await user.save()
    console.log("✅ User saved successfully:", user._id)
    console.log("🔐 Password hashed by model middleware")

    return Response.json(
      {
        message: "User created successfully",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          city: user.city,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("❌ Registration error:", error)
    return Response.json({ message: "Internal server error" }, { status: 500 })
  }
}
