/**
 * Script to execute password reset
 */

import { ConvexHttpClient } from "convex/browser"
import { api } from "../convex/_generated/api"

const CONVEX_URL = "https://resilient-pig-8.convex.cloud"

const client = new ConvexHttpClient(CONVEX_URL)

async function executePasswordReset() {
  try {
    console.log("🔄 Resetting password for aideen@braunwell.co.uk...")
    
    const result = await client.mutation(api.auth.resetProductionUserPassword)
    
    if (result.success) {
      console.log("✅", result.message)
      console.log("\n📝 Login credentials:")
      console.log("   Email: aideen@braunwell.co.uk")
      console.log("   Password: 2ideen1996")
      
      // Test login immediately
      console.log("\n🔐 Testing login...")
      try {
        const loginResult = await client.mutation(api.auth.login, {
          email: "aideen@braunwell.co.uk",
          password: "2ideen1996",
          clientIp: "127.0.0.1"
        })
        console.log("✅ Login test successful!")
      } catch (error: any) {
        console.log("❌ Login test failed:", error.message)
      }
    } else {
      console.log("❌", result.message)
    }
    
  } catch (error) {
    console.error("❌ Error:", error)
  }
}

// Run the script
if (require.main === module) {
  executePasswordReset()
}