import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import connectDB from "@/lib/mongodb";
import Admin from "@/models/Admin";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email || (session.user.role !== "admin" && session.user.role !== "super_admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    
    // Verify admin exists and is active
    const admin = await Admin.findOne({
      email: session.user.email,
      isActive: true,
    });

    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { newPassword } = await req.json();
    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: "Password too short" }, { status: 400 });
    }

    // Update admin password
    admin.password = newPassword; // This will be hashed by the pre-save middleware
    await admin.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin change password error:", error);
    return NextResponse.json({ error: "Failed to change password" }, { status: 500 });
  }
}
