// Fix Environment Issues Script
const fs = require("fs")
const path = require("path")

console.log("🔧 Fixing environment issues...")

// Check if .env.local exists
const envPath = path.join(process.cwd(), ".env.local")
const envExamplePath = path.join(process.cwd(), ".env.example")

if (!fs.existsSync(envPath)) {
  console.log("❌ .env.local not found")

  if (fs.existsSync(envExamplePath)) {
    console.log("📋 Copying from .env.example...")
    fs.copyFileSync(envExamplePath, envPath)
    console.log("✅ Created .env.local from .env.example")
  } else {
    console.log("📝 Creating new .env.local...")
    const envContent = `# Database
MONGODB_URI=mongodb://localhost:27017/linkzup

# NextAuth Configuration  
NEXTAUTH_SECRET=${require("crypto").randomBytes(32).toString("hex")}
NEXTAUTH_URL=http://localhost:3000

# Make.com Integration
MAKE_WEBHOOK_URL=https://hook.eu2.make.com/7zsuo1xw8qwojfvn6jqoihlfk85nrxp9
MAKE_API_KEY=test-api-key

# Development
NODE_ENV=development
`
    fs.writeFileSync(envPath, envContent)
    console.log("✅ Created .env.local with default values")
  }
}

// Check environment variables
console.log("\n🔍 Checking environment variables...")
require("dotenv").config({ path: envPath })

const requiredVars = ["MONGODB_URI", "NEXTAUTH_SECRET", "NEXTAUTH_URL"]

const missingVars = requiredVars.filter((varName) => !process.env[varName])

if (missingVars.length > 0) {
  console.log("❌ Missing required environment variables:")
  missingVars.forEach((varName) => console.log(`  - ${varName}`))
  console.log("\n💡 Please update .env.local with the correct values")
} else {
  console.log("✅ All required environment variables are set")
}

// Check package.json scripts
console.log("\n📦 Checking package.json scripts...")
const packagePath = path.join(process.cwd(), "package.json")
if (fs.existsSync(packagePath)) {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"))

  if (packageJson.scripts && packageJson.scripts.dev) {
    console.log("✅ Dev script found:", packageJson.scripts.dev)
  } else {
    console.log("❌ Dev script not found in package.json")
  }
} else {
  console.log("❌ package.json not found")
}

console.log("\n🚀 Next steps:")
console.log("1. Update .env.local with your MongoDB URI")
console.log("2. Run: npm install (if needed)")
console.log("3. Run: npm run dev")
console.log("4. Test: node scripts/test-server-connection.js")
