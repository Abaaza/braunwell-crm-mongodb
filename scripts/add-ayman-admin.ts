/**
 * Script to add Ayman Hofi as admin user
 */

import { ConvexHttpClient } from "convex/browser"
import { api } from "../convex/_generated/api"

const CONVEX_URL = "https://resilient-pig-8.convex.cloud"

const client = new ConvexHttpClient(CONVEX_URL)

async function addAymanAdmin() {
  try {
    console.log("🚀 Adding Ayman Hofi as admin user...")
    
    const result = await client.mutation(api.auth.addAymanHofiAdmin)
    
    if (result.created) {
      console.log("✅ Admin user created successfully!")
      console.log("   Name: Ayman Hofi")
      console.log("   Email: ahofi@braunwell.co.uk")
      console.log("   Password: 4568970")
      console.log("   Role: admin")
      console.log("   User ID:", result.userId)
      
      // Test login
      console.log("\n🔐 Testing login...")
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
      console.log("ℹ️  User already exists")
    }
    
    // List all admin users
    console.log("\n📋 All admin users in the system:")
    const users = await client.query(api.users.list)
    const admins = users.filter(u => u.role === "admin")
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.name} (${admin.email})`)
    })
    
  } catch (error) {
    console.error("❌ Error adding admin user:", error)
  }
}

// Run the script
if (require.main === module) {
  addAymanAdmin()
}