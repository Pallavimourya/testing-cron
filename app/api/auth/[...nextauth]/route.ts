import NextAuth from "next-auth"
import { authOptions } from "./auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
