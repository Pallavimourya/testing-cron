import { Db } from "mongodb"
import mongoose from "mongoose"
import { LinkedInService } from "./linkedin-service"

export class AutoPostService {
  private db: Db

  constructor(db: Db) {
    this.db = db
  }

  async processScheduledPosts() {
    try {
      console.log("🚀 Auto-post service started")

      // Check multiple collections for scheduled posts
      const collections = ["approvedcontents", "linkdin-content-generation", "generatedcontents"]
      let totalProcessed = 0
      let totalPosted = 0
      let totalErrors = 0
      const results = []

      for (const collectionName of collections) {
        try {
          const collection = this.db.collection(collectionName)

          // Find posts that are scheduled and due now (with 1 minute buffer) based on IST
          const now = new Date()
          const istOffset = 5.5 * 60 * 60 * 1000 // IST is UTC+5:30
          const nowIST = new Date(now.getTime() + istOffset)
          const bufferTime = new Date(nowIST.getTime() + 1 * 60 * 1000) // 1 minute buffer

          console.log(`🕐 Current time (IST): ${nowIST.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`)
          console.log(`🕐 Buffer time (IST): ${bufferTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`)

          // More flexible query to find scheduled posts
          const dueQuery = {
            $and: [
              {
                $or: [
                  { status: "scheduled" }, 
                  { Status: "scheduled" },
                  { status: "pending" },
                  { Status: "pending" }
                ],
              },
              {
                $or: [
                  { scheduledFor: { $lte: bufferTime } }, 
                  { scheduled_for: { $lte: bufferTime } },
                  { scheduledTime: { $lte: bufferTime } }
                ],
              },
              // Ensure the post hasn't been posted already
              {
                $or: [
                  { postedAt: { $exists: false } },
                  { posted_at: { $exists: false } },
                  { linkedinPostId: { $exists: false } },
                  { linkedin_post_id: { $exists: false } }
                ]
              }
            ],
          }

          console.log(`🔍 Checking ${collectionName} for due posts...`)
          console.log(`⏰ Current time: ${now.toISOString()}`)
          console.log(`⏰ Buffer time: ${bufferTime.toISOString()}`)
          
          const duePosts = await collection.find(dueQuery).toArray()
          console.log(`📊 Found ${duePosts.length} posts due for posting in ${collectionName}`)

          // Log details of each due post for debugging
          duePosts.forEach((post, index) => {
            console.log(`📋 Due post ${index + 1} in ${collectionName}:`)
            console.log(`   - ID: ${post._id}`)
            console.log(`   - Status: ${post.status || post.Status}`)
            console.log(`   - Scheduled for: ${post.scheduledFor || post.scheduled_for || post.scheduledTime}`)
            console.log(`   - User: ${post.email || post.userId || post.user_id}`)
            console.log(`   - Content length: ${(post.content || post.Content || '').length}`)
          })

          for (const post of duePosts) {
            try {
              totalProcessed++
              console.log(`🔄 Processing post ${post._id} from ${collectionName}`)

              // Get user details
              const user = await this.findUser(post)
              if (!user) {
                await this.updatePostStatus(collection, post._id, "failed", "User not found")
                totalErrors++
                results.push({ postId: post._id, status: "failed", error: "User not found", collection: collectionName })
                continue
              }

              // Validate LinkedIn connection
              if (!user.linkedinAccessToken || !user.linkedinTokenExpiry || new Date(user.linkedinTokenExpiry) <= new Date()) {
                await this.updatePostStatus(collection, post._id, "failed", "LinkedIn token expired")
                totalErrors++
                results.push({ postId: post._id, status: "failed", error: "LinkedIn token expired", collection: collectionName })
                continue
              }

              // Extract content with fallbacks
              const content = post.content || post.Content || post["generated content"] || ""
              const imageUrl = post.imageUrl || post.Image || post.image_url || null

              if (!content.trim()) {
                await this.updatePostStatus(collection, post._id, "failed", "Empty content")
                totalErrors++
                results.push({ postId: post._id, status: "failed", error: "Empty content", collection: collectionName })
                continue
              }

              console.log(`📤 Posting content to LinkedIn for user ${user.email}:`)
              console.log(`   - Content length: ${content.length}`)
              console.log(`   - Has image: ${!!imageUrl}`)
              console.log(`   - LinkedIn ID: ${user.linkedinProfile?.id}`)

              // Post to LinkedIn using the same logic as manual posting
              const linkedinService = new LinkedInService()
              const postResult = await linkedinService.postToLinkedIn(
                content,
                imageUrl,
                user.linkedinAccessToken,
                user.linkedinProfile?.id
              )

              if (postResult.success) {
                // Update post status to posted
                await this.updatePostStatus(collection, post._id, "posted", undefined, {
                  postedAt: new Date(),
                  posted_at: new Date(),
                  linkedinPostId: postResult.postId,
                  linkedin_post_id: postResult.postId,
                  linkedinUrl: postResult.url,
                  linkedin_url: postResult.url,
                })

                totalPosted++
                results.push({ 
                  postId: post._id, 
                  status: "posted", 
                  linkedinPostId: postResult.postId,
                  linkedinUrl: postResult.url,
                  collection: collectionName 
                })

                console.log(`✅ Successfully posted to LinkedIn: ${postResult.postId}`)
              } else {
                await this.updatePostStatus(collection, post._id, "failed", postResult.error)
                totalErrors++
                results.push({ postId: post._id, status: "failed", error: postResult.error, collection: collectionName })
                console.error(`❌ Failed to post to LinkedIn: ${postResult.error}`)
              }

            } catch (error) {
              console.error(`❌ Error processing post ${post._id}:`, error)
              await this.updatePostStatus(collection, post._id, "failed", error instanceof Error ? error.message : "Unknown error")
              totalErrors++
              results.push({ 
                postId: post._id, 
                status: "failed", 
                error: error instanceof Error ? error.message : "Unknown error",
                collection: collectionName 
              })
            }
          }

        } catch (error) {
          console.error(`❌ Error processing collection ${collectionName}:`, error)
          totalErrors++
        }
      }

      console.log(`📊 Auto-post service completed: ${totalProcessed} processed, ${totalPosted} posted, ${totalErrors} errors`)

      return {
        processed: totalProcessed,
        posted: totalPosted,
        errors: totalErrors,
        results: results
      }

    } catch (error) {
      console.error("❌ Auto-post service error:", error)
      throw error
    }
  }

  private async findUser(post: any) {
    try {
      const usersCollection = this.db.collection("users")
      
      // Try to find user by various field names
      const userQueries = [
        { email: post.email },
        { email: post.userEmail },
        { email: post.user_email },
        { _id: new mongoose.Types.ObjectId(post.userId) },
        { _id: new mongoose.Types.ObjectId(post["user id"]) },
        { _id: new mongoose.Types.ObjectId(post.user_id) }
      ]

      for (const query of userQueries) {
        try {
          const user = await usersCollection.findOne(query)
          if (user) {
            return user
          }
        } catch (error) {
          // Continue to next query
          continue
        }
      }

      return null
    } catch (error) {
      console.error("❌ Error finding user:", error)
      return null
    }
  }

  private async updatePostStatus(collection: any, postId: any, status: string, error?: string, additionalFields?: any) {
    try {
      const updateData: any = {
        status: status,
        updatedAt: new Date(),
        updated_at: new Date(),
      }

      if (error) {
        updateData.error = error
        updateData.lastAttempt = new Date()
      }

      if (additionalFields) {
        Object.assign(updateData, additionalFields)
      }

      await collection.updateOne(
        { _id: postId },
        { $set: updateData }
      )

      console.log(`✅ Updated post ${postId} status to ${status}`)
    } catch (error) {
      console.error(`❌ Error updating post status:`, error)
    }
  }
}
