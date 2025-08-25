import type { NextRequest } from "next/server"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import { withAdminAuth } from "@/lib/admin-middleware"
import ApprovedContent from "@/models/ApprovedContent"
import Topic from "@/models/Topic"
import ScheduledPost from "@/models/ScheduledPost"
import GeneratedStory from "@/models/GeneratedStory"
import GeneratedContent from "@/models/GeneratedContent"
import Content from "@/models/Content"
import UserProfile from "@/models/UserProfile"
import Payment from "@/models/Payment"
import Order from "@/models/Order"
import CouponUsage from "@/models/CouponUsage"
import LinkedInDetails from "@/models/LinkedInDetails"
import VoiceNote from "@/models/VoiceNote"
import Post from "@/models/Post"

// PUT /api/admin/users/[id] - Update user (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(async () => {
    try {
      const { id } = await params
      const body = await request.json()

      await connectDB()

      const user = await User.findByIdAndUpdate(id, { $set: body }, { new: true, runValidators: true }).select(
        "-password",
      )

      if (!user) {
        return Response.json({ success: false, error: "User not found" }, { status: 404 })
      }

      return Response.json({
        success: true,
        user,
      })
    } catch (error) {
      console.error("Update user error:", error)
      return Response.json({ success: false, error: "Failed to update user" }, { status: 500 })
    }
  })(request)
}

// DELETE /api/admin/users/[id] - Delete user and all associated data (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(async () => {
    try {
      const { id } = await params

      await connectDB()

      // First, find the user to get their email for additional cleanup
      const user = await User.findById(id)
      if (!user) {
        return Response.json({ success: false, error: "User not found" }, { status: 404 })
      }

      const userId = user._id
      const userEmail = user.email

      console.log(`🗑️ Starting deletion of user ${userEmail} (${userId}) and all associated data...`)

      // Delete all user-related data from all collections
      const deletionResults = await Promise.allSettled([
        // Delete approved content
        ApprovedContent.deleteMany({ userId }),
        
        // Delete topics
        Topic.deleteMany({ userId }),
        
        // Delete scheduled posts
        ScheduledPost.deleteMany({ userId }),
        
        // Delete generated stories
        GeneratedStory.deleteMany({ userId }),
        
        // Delete generated content
        GeneratedContent.deleteMany({ userId }),
        
        // Delete content
        Content.deleteMany({ userId }),
        
        // Delete user profile
        UserProfile.deleteMany({ userId }),
        
        // Delete payments (using userId as string)
        Payment.deleteMany({ userId: userId.toString() }),
        
        // Delete orders
        Order.deleteMany({ userId }),
        
        // Delete coupon usage
        CouponUsage.deleteMany({ userId }),
        
        // Delete LinkedIn details
        LinkedInDetails.deleteMany({ userId: userId.toString() }),
        
        // Delete voice notes
        VoiceNote.deleteMany({ userId }),
        
        // Delete posts
        Post.deleteMany({ userId }),
      ])

      // Log deletion results
      deletionResults.forEach((result, index) => {
        const collectionNames = [
          'ApprovedContent', 'Topic', 'ScheduledPost', 'GeneratedStory',
          'GeneratedContent', 'Content', 'UserProfile', 'Payment',
          'Order', 'CouponUsage', 'LinkedInDetails', 'VoiceNote', 'Post'
        ]
        
        if (result.status === 'fulfilled') {
          console.log(`✅ Deleted ${result.value.deletedCount} records from ${collectionNames[index]}`)
        } else {
          console.error(`❌ Error deleting from ${collectionNames[index]}:`, result.reason)
        }
      })

      // Finally, delete the user
      await User.findByIdAndDelete(id)

      console.log(`✅ Successfully deleted user ${userEmail} and all associated data`)

      return Response.json({
        success: true,
        message: "User and all associated data deleted successfully",
        deletedUser: {
          id: userId,
          email: userEmail,
          name: user.name
        }
      })
    } catch (error) {
      console.error("Delete user error:", error)
      return Response.json({ success: false, error: "Failed to delete user" }, { status: 500 })
    }
  })(request)
}
