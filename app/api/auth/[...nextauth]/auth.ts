import NextAuth, { type NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import UserProfile from "@/models/UserProfile"
import Admin from "@/models/Admin"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("🔐 Auth attempt for email:", credentials?.email)
        
        if (!credentials?.email || !credentials?.password) {
          console.log("❌ Missing credentials")
          return null
        }

        try {
          await connectDB()
          console.log("✅ Database connected")

          // First check if it's an admin user
          const admin = await Admin.findOne({ email: credentials.email }).select("+password")
          console.log("👑 Admin check:", admin ? "Found" : "Not found")
          
          if (admin && admin.isActive) {
            const isPasswordValid = await admin.comparePassword(credentials.password)
            console.log("🔑 Admin password valid:", isPasswordValid)
            
            if (isPasswordValid) {
              console.log("✅ Admin login successful")
              return {
                id: admin._id.toString(),
                email: admin.email,
                name: admin.name,
                role: "admin",
                image: admin.profilePicture || "",
              }
            }
          }

          // If not admin, check regular user
          const user = await User.findOne({ email: credentials.email }).select("+password")
          console.log("👤 User check:", user ? "Found" : "Not found")

          if (!user) {
            console.log("❌ User not found")
            return null
          }

          if (!user.password) {
            console.log("❌ User has no password")
            return null
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
          console.log("🔑 User password valid:", isPasswordValid)

          if (!isPasswordValid) {
            console.log("❌ Invalid password")
            return null
          }

          // Check if user is blocked
          if (user.blocked) {
            console.log("❌ User is blocked")
            return null
          }

          // Get user profile to check for profile photo
          const userProfile = await UserProfile.findOne({ userId: user._id })
          const profileImage = userProfile?.profilePhoto || user.profilePicture || ""

          console.log("✅ User login successful")
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: "user",
            image: profileImage,
          }
        } catch (error) {
          console.error("❌ Auth error:", error)
          return null
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.role = user.role
        token.image = user.image
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.role = token.role as string
        session.user.image = token.image as string
      }
      return session
    },
  },
  pages: {
    signIn: "/signin",
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
