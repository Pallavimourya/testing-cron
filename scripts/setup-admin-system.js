const mongoose = require("mongoose")

// Import models
const PlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    description: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0 },
    durationDays: { type: Number, required: true, min: 1 },
    features: [{ type: String, required: true }],
    imageLimit: { type: Number, default: 0, min: 0 },
    contentLimit: { type: Number, default: 0, min: -1 },
    badge: { type: String, trim: true },
    color: { type: String, default: "from-blue-500 to-blue-600" },
    icon: { type: String, default: "Star" },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
)

const Plan = mongoose.models.Plan || mongoose.model("Plan", PlanSchema)

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/linkzup")
    console.log("✅ MongoDB connected")
  } catch (error) {
    console.error("❌ MongoDB connection error:", error)
    process.exit(1)
  }
}

async function setupAdminSystem() {
  try {
    await connectDB()
    console.log("🚀 Setting up LinkZup Admin System...")

    // Check if plans already exist
    const existingPlans = await Plan.countDocuments()

    if (existingPlans === 0) {
      console.log("📦 Creating default plans...")

      const plans = [
        {
          name: "Starter",
          slug: "zuper15",
          description: "Perfect for getting started with LinkedIn growth",
          price: 9,
          originalPrice: 9,
          durationDays: 15,
          features: [
            "Profile Optimization",
            "Basic Content Strategy",
            "Weekly Post Creation (2 posts)",
            "7 AI Image Generations",
            "30 AI Content Generations",
            "Engagement Monitoring",
            "Basic Analytics Report",
            "Email Support",
          ],
          imageLimit: 7,
          contentLimit: 30,
          badge: "Starter",
          color: "from-blue-500 to-blue-600",
          icon: "Star",
          displayOrder: 1,
          isActive: true,
        },
        {
          name: "Most Popular",
          slug: "zuper30",
          description: "Best value for serious LinkedIn professionals",
          price: 799,
          originalPrice: 799,
          durationDays: 30,
          features: [
            "Everything in Starter",
            "Advanced Profile Optimization",
            "Weekly Post Creation (4 posts)",
            "15 AI Image Generations",
            "30 AI Content Generations",
            "Network Growth Strategy",
            "Engagement Management",
            "Detailed Analytics Report",
            "Priority Email Support",
            "Monthly Strategy Call",
          ],
          imageLimit: 15,
          contentLimit: 30,
          badge: "Most Popular",
          color: "from-purple-500 to-purple-600",
          icon: "Zap",
          displayOrder: 2,
          isActive: true,
        },
        {
          name: "Professional",
          slug: "zuper360",
          description: "Complete LinkedIn mastery for enterprises",
          price: 5999,
          originalPrice: 5999,
          durationDays: 360,
          features: [
            "Everything in Most Popular",
            "Premium Profile Optimization",
            "Weekly Post Creation (6 posts)",
            "300 AI Image Generations",
            "Unlimited AI Content Generations",
            "Advanced Network Growth",
            "Thought Leadership Strategy",
            "Competitor Analysis",
            "Custom Analytics Dashboard",
            "24/7 Priority Support",
            "Weekly Strategy Calls",
            "Content Calendar Management",
            "Annual Strategy Planning",
            "Priority Onboarding",
          ],
          imageLimit: 300,
          contentLimit: -1, // Unlimited
          badge: "Professional",
          color: "from-orange-500 to-orange-600",
          icon: "Crown",
          displayOrder: 3,
          isActive: true,
        },
      ]

      await Plan.insertMany(plans)
      console.log("✅ Successfully created plans:")
      plans.forEach((plan) => {
        console.log(`   - ${plan.name} (₹${plan.price})`)
      })
    } else {
      console.log(`✅ Found ${existingPlans} existing plans`)
    }

    console.log("\n🎉 LinkZup Admin System Setup Complete!")
    console.log("\n📋 Next Steps:")
    console.log("1. Start your development server: npm run dev")
    console.log("2. Access admin panel: http://localhost:3000/admin")
    console.log("3. Login with: admin@zuperstudio.com")
    console.log("4. Test signup form: http://localhost:3000/signup")
    console.log("\n🔧 Admin Features Available:")
    console.log("   ✅ User Management (with mobile & city)")
    console.log("   ✅ Plans Management")
    console.log("   ✅ Coupons Management")
    console.log("   ✅ Payment Analytics")
    console.log("   ✅ Dashboard Overview")
    console.log("   ✅ System Settings")
  } catch (error) {
    console.error("❌ Setup failed:", error)
  } finally {
    await mongoose.disconnect()
    console.log("✅ Database connection closed")
  }
}

// Run the setup
setupAdminSystem()
