/**
 * Script to add Ayman Hofi to development database
 */

import { ConvexHttpClient } from "convex/browser"
import { api } from "../convex/_generated/api"

// Use the dev URL from .env.local
const CONVEX_DEV_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://hidden-kudu-495.convex.cloud"

const client = new ConvexHttpClient(CONVEX_DEV_URL)

async function addAymanToDev() {
  try {
    console.log("🚀 Adding Ayman Hofi to development database...")
    console.log("   Dev URL:", CONVEX_DEV_URL)
    
    const result = await client.mutation(api.auth.addAymanHofiAdmin)
    
    if (result.created) {
      console.log("✅ Admin user created successfully in dev!")
      console.log("   Name: Ayman Hofi")
      console.log("   Email: ahofi@braunwell.co.uk")
      console.log("   Password: 4568970")
      console.log("   Role: admin")
      console.log("   User ID:", result.userId)
      
      // Test login
      console.log("\n🔐 Testing login in dev...")
      try {
        const loginResult = await client.mutation(api.auth.login, {
          email: "ahofi@braunwell.co.uk",
          password: "4568970",
          clientIp: "127.0.0.1"
        })
        console.log("✅ Login test successful!")
      } catch (error: any) {
        console.log("❌ Login test failed:", error.message)
      }
    } else {
      console.log("ℹ️  User already exists in dev database")
    }
    
    // List all users in dev
    console.log("\n📋 All users in development database:")
    const users = await client.query(api.users.list)
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.role}`)
    })
    
  } catch (error) {
    console.error("❌ Error adding admin user to dev:", error)
  }
}

// Run the script
if (require.main === module) {
  addAymanToDev()
}