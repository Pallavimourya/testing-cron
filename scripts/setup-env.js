// Setup Environment Variables Script
const fs = require("fs")
const path = require("path")

console.log("🔧 Setting up environment variables...")

const envTemplate = `# Database
MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.mongodb.net/linkzup?retryWrites=true&w=majority

# NextAuth Configuration
NEXTAUTH_SECRET=${generateRandomSecret()}
NEXTAUTH_URL=http://localhost:3000

# Make.com Integration
MAKE_WEBHOOK_URL=https://hook.eu2.make.com/7zsuo1xw8qwojfvn6jqoihlfk85nrxp9
MAKE_API_KEY=your-make-api-key-here

# OpenAI (if needed)
OPENAI_API_KEY=your-openai-api-key-here

# Razorpay (if needed)
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret

# Cloudinary (if needed)
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
`

function generateRandomSecret() {
  return require("crypto").randomBytes(32).toString("hex")
}

const envPath = path.join(process.cwd(), ".env.local")

if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, envTemplate)
  console.log("✅ Created .env.local file with template")
  console.log("📝 Please update the values in .env.local with your actual credentials")
} else {
  console.log("⚠️  .env.local already exists")
  console.log("📝 Please make sure all required environment variables are set")
}

console.log("\n🔍 Required Environment Variables:")
console.log("- MONGODB_URI: Your MongoDB connection string")
console.log("- NEXTAUTH_SECRET: Random secret for NextAuth (already generated)")
console.log("- NEXTAUTH_URL: Your app URL (set to localhost:3000)")
console.log("- MAKE_WEBHOOK_URL: Your Make.com webhook URL")
console.log("\n💡 Optional but recommended:")
console.log("- OPENAI_API_KEY: For AI features")
console.log("- RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET: For payments")
console.log("- CLOUDINARY credentials: For image uploads")

console.log("\n🚀 Next steps:")
console.log("1. Update .env.local with your actual values")
console.log("2. Run: npm run dev")
console.log("3. Test: node scripts/test-auth.js")
