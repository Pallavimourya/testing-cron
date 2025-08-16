const mongoose = require("mongoose")

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/linkzup")
    console.log("✅ Connected to MongoDB")
  } catch (error) {
    console.error("❌ MongoDB connection error:", error)
    process.exit(1)
  }
}

// Plan Schema
const planSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number },
    durationDays: { type: Number, required: true },
    features: [{ type: String }],
    imageLimit: { type: Number, required: true },
    contentLimit: { type: Number, required: true }, // -1 for unlimited
    badge: { type: String },
    color: { type: String, default: "from-blue-500 to-blue-600" },
    icon: { type: String, default: "Star" },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  },
)

const Plan = mongoose.models.Plan || mongoose.model("Plan", planSchema)

const initializePlans = async () => {
  try {
    await connectDB()

    // Clear existing plans
    await Plan.deleteMany({})
    console.log("🗑️ Cleared existing plans")

    // Create new plans
    const plans = [
      {
        name: "Starter",
        slug: "zuper-15",
        description: "Perfect for individuals getting started with content creation",
        price: 1500, // ₹15 in paise
        originalPrice: 2000,
        durationDays: 15,
        features: [
          "15 AI-generated posts",
          "5 AI-generated images",
          "Basic content templates",
          "Email support",
          "LinkedIn integration",
        ],
        imageLimit: 5,
        contentLimit: 15,
        badge: "Best for Beginners",
        color: "from-blue-500 to-blue-600",
        icon: "Star",
        isActive: true,
      },
      {
        name: "Most Popular",
        slug: "zuper-30",
        description: "Ideal for professionals and small businesses",
        price: 2500, // ₹25 in paise
        originalPrice: 3500,
        durationDays: 30,
        features: [
          "50 AI-generated posts",
          "20 AI-generated images",
          "Premium content templates",
          "Priority support",
          "LinkedIn integration",
          "Content scheduling",
          "Analytics dashboard",
        ],
        imageLimit: 20,
        contentLimit: 50,
        badge: "Most Popular",
        color: "from-green-500 to-green-600",
        icon: "Crown",
        isActive: true,
      },
      {
        name: "Professional",
        slug: "zuper-360",
        description: "For agencies and power users who need unlimited content",
        price: 15000, // ₹150 in paise
        originalPrice: 20000,
        durationDays: 360,
        features: [
          "Unlimited AI-generated posts",
          "Unlimited AI-generated images",
          "All premium templates",
          "24/7 priority support",
          "LinkedIn integration",
          "Advanced scheduling",
          "Detailed analytics",
          "Team collaboration",
          "Custom branding",
        ],
        imageLimit: -1, // Unlimited
        contentLimit: -1, // Unlimited
        badge: "Best Value",
        color: "from-purple-500 to-purple-600",
        icon: "Zap",
        isActive: true,
      },
    ]

    const createdPlans = await Plan.insertMany(plans)
    console.log(`✅ Created ${createdPlans.length} plans:`)

    createdPlans.forEach((plan) => {
      console.log(`   - ${plan.name} (${plan.slug}): ₹${plan.price / 100} for ${plan.durationDays} days`)
    })

    console.log("\n🎉 Plans initialization completed successfully!")
  } catch (error) {
    console.error("❌ Error initializing plans:", error)
  } finally {
    await mongoose.connection.close()
    console.log("🔌 Database connection closed")
  }
}

// Run the initialization
initializePlans()
