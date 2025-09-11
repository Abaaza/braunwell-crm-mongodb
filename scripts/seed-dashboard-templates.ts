/**
 * Seed script to create built-in dashboard templates
 * This script should be run once to populate the database with default templates
 */

import { ConvexHttpClient } from "convex/browser"
import { api } from "../convex/_generated/api"
import { Id } from "../convex/_generated/dataModel"

const client = new ConvexHttpClient(process.env.CONVEX_URL!)

async function seedDashboardTemplates() {
  try {
    // This would typically be run with admin privileges
    // For now, we'll assume you have a user ID to use
    const adminUserId = "admin" as Id<"users"> // Replace with actual admin user ID
    
    console.log("Seeding built-in dashboard templates...")
    
    const result = await client.mutation(api.dashboardTemplates.seedBuiltInTemplates, {
      userId: adminUserId
    })
    
    console.log("✅ Dashboard templates seeded successfully:", result)
  } catch (error) {
    console.error("❌ Error seeding dashboard templates:", error)
  }
}

// Run the seed script
if (require.main === module) {
  seedDashboardTemplates()
}