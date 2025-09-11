/**
 * Direct test of Ayman's login
 */

import { ConvexHttpClient } from "convex/browser"
import { api } from "../convex/_generated/api"

const CONVEX_URL = "https://resilient-pig-8.convex.cloud"

const client = new ConvexHttpClient(CONVEX_URL)

async function testLogin() {
  console.log("🔐 Testing Ayman's login directly...")
  
  try {
    const result = await client.mutation(api.auth.login, {
      email: "ahofi@braunwell.co.uk",
      password: "4568970",
      clientIp: "127.0.0.1"
    })
    
    console.log("✅ Login successful!")
    console.log(`   Token: ${result.token.substring(0, 10)}...`)
    console.log(`   User: ${result.user.name} (${result.user.email})`)
    console.log(`   Role: ${result.user.role}`)
    
  } catch (error: any) {
    console.log("❌ Login failed:", error.message)
    console.log("\nFull error:", error)
  }
}

// Run the script
if (require.main === module) {
  testLogin()
}