/**
 * Script to verify the production user exists
 */

import { ConvexHttpClient } from "convex/browser"
import { api } from "../convex/_generated/api"

const CONVEX_URL = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL

if (!CONVEX_URL) {
  console.error("❌ CONVEX_URL or NEXT_PUBLIC_CONVEX_URL environment variable is not set")
  process.exit(1)
}

const client = new ConvexHttpClient(CONVEX_URL)

async function verifyProductionUser() {
  try {
    console.log("🔍 Verifying production user...")
    
    // Get all users
    const users = await client.query(api.users.list)
    
    // Find Aideen's account
    const productionUser = users.find(user => user.email === "aideen@braunwell.co.uk")
    
    if (productionUser) {
      console.log("✅ Production user verified!")
      console.log(`   Name: ${productionUser.name}`)
      console.log(`   Email: ${productionUser.email}`)
      console.log(`   Role: ${productionUser.role}`)
      console.log(`   Active: ${productionUser.isActive}`)
      console.log(`   Created: ${new Date(productionUser.createdAt).toLocaleString()}`)
    } else {
      console.log("❌ Production user not found")
    }
    
    // List all users
    console.log("\n📋 All users in the system:")
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.role}) - ${user.isActive ? 'Active' : 'Inactive'}`)
    })
  } catch (error) {
    console.error("❌ Error verifying production user:", error)
  }
}

// Run the script
if (require.main === module) {
  verifyProductionUser()
}