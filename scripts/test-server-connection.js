// Test Server Connection Script
const fetch = require("node-fetch")

async function testServerConnection() {
  console.log("🔍 Testing server connection...")

  const baseUrl = "http://localhost:3000"

  try {
    // Test if server is running
    console.log("📡 Checking if server is running...")
    const response = await fetch(baseUrl)

    if (response.ok) {
      console.log("✅ Server is running on port 3000")

      // Test API endpoints
      await testApiEndpoints(baseUrl)
    } else {
      console.log("❌ Server responded with error:", response.status)
    }
  } catch (error) {
    if (error.code === "ECONNREFUSED") {
      console.log("❌ Server is not running")
      console.log("💡 Please start the server with: npm run dev")
    } else {
      console.log("❌ Connection error:", error.message)
    }
  }
}

async function testApiEndpoints(baseUrl) {
  console.log("\n🧪 Testing API endpoints...")

  const endpoints = ["/api/auth/session", "/api/profile", "/api/story/latest"]

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`)
      console.log(`${endpoint}: ${response.status === 200 ? "✅" : "❌"} ${response.status}`)
    } catch (error) {
      console.log(`${endpoint}: ❌ Error - ${error.message}`)
    }
  }
}

// Run the test
testServerConnection()
