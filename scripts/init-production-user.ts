/**
 * Script to initialize the production user
 * Run this script to create the production admin user
 */

import { ConvexHttpClient } from "convex/browser"
import { api } from "../convex/_generated/api"

const CONVEX_URL = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL

if (!CONVEX_URL) {
  console.error("❌ CONVEX_URL or NEXT_PUBLIC_CONVEX_URL environment variable is not set")
  process.exit(1)
}

const client = new ConvexHttpClient(CONVEX_URL)

async function initializeProductionUser() {
  try {
    console.log("🚀 Initializing production user...")
    
    const result = await client.mutation(api.auth.initializeProductionUser)
    
    if (result.created) {
      console.log("✅ Production user created successfully!")
      console.log("   Email: aideen@braunwell.co.uk")
      console.log("   Role: admin")
    } else {
      console.log("ℹ️  Production user already exists")
    }
  } catch (error) {
    console.error("❌ Error initializing production user:", error)
  }
}

// Run the script
if (require.main === module) {
  initializeProductionUser()
}