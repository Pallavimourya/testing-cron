import bcrypt from "bcryptjs"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"

export async function POST(request: Request) {
  try {
    const { name, email, mobile, city, password } = await request.json()

    // Validation
    if (!name || !email || !mobile || !city || !password) {
      return Response.json({ message: "All fields are required" }, { status: 400 })
    }

    // Mobile number validation
    const mobileRegex = /^[6-9]\d{9}$/
    if (!mobileRegex.test(mobile)) {
      return Response.json({ message: "Please enter a valid 10-digit mobile number" }, { status: 400 })
    }

    if (password.length < 6) {
      return Response.json({ message: "Password must be at least 6 characters long" }, { status: 400 })
    }

    await connectDB()

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { mobile: mobile }],
    })

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return Response.json({ message: "User with this email already exists" }, { status: 400 })
      }
      if (existingUser.mobile === mobile) {
        return Response.json({ message: "User with this mobile number already exists" }, { status: 400 })
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      mobile: mobile.trim(),
      city: city.trim(),
      password: hashedPassword,
    })

    await user.save()

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
    console.error("Registration error:", error)
    return Response.json({ message: "Internal server error" }, { status: 500 })
  }
}
