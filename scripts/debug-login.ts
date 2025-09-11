/**
 * Script to debug login issues
 */

import { ConvexHttpClient } from "convex/browser"
import { api } from "../convex/_generated/api"

const CONVEX_URL = process.env.CONVEX_URL || "https://resilient-pig-8.convex.cloud"

const client = new ConvexHttpClient(CONVEX_URL)

// Replicate the hashing function from auth.ts
function hashPassword(password: string): string {
  const hash = btoa(password + "salt123")
  return `dev:${hash}`
}

async function debugLogin() {
  try {
    console.log("🔍 Debugging login for aideen@braunwell.co.uk...")
    
    // Test password hashing
    const testPassword = "2ideen1996"
    const expectedHash = hashPassword(testPassword)
    console.log(`\n📝 Password hashing test:`)
    console.log(`   Input password: ${testPassword}`)
    console.log(`   Expected hash: ${expectedHash}`)
    
    // Get all users to see the actual hash
    const users = await client.query(api.users.list)
    const aideen = users.find(u => u.email === "aideen@braunwell.co.uk")
    
    if (aideen) {
      console.log(`\n👤 User found:`)
      console.log(`   Email: ${aideen.email}`)
      console.log(`   Name: ${aideen.name}`)
      console.log(`   Role: ${aideen.role}`)
      console.log(`   Active: ${aideen.isActive}`)
      console.log(`   Password hash in DB: ${aideen.passwordHash || 'NOT VISIBLE'}`)
      
      // Note: We can't see the actual passwordHash from the client query
      // But we can test the login
    }
    
    // Test the actual login
    console.log(`\n🔐 Testing login...`)
    try {
      const result = await client.mutation(api.auth.login, {
        email: "aideen@braunwell.co.uk",
        password: testPassword,
        clientIp: "127.0.0.1"
      })
      console.log("✅ Login successful!")
      console.log(`   Token: ${result.token.substring(0, 10)}...`)
      console.log(`   User ID: ${result.user.id}`)
    } catch (error: any) {
      console.log("❌ Login failed:", error.message)
      
      // Try with different password variations
      console.log("\n🔄 Testing password variations...")
      const variations = [
        "2ideen1996",
        "admin123", // in case it was set to default
        "password", // another default
      ]
      
      for (const pwd of variations) {
        try {
          await client.mutation(api.auth.login, {
            email: "aideen@braunwell.co.uk",
            password: pwd,
            clientIp: "127.0.0.1"
          })
          console.log(`✅ Login worked with password: ${pwd}`)
          break
        } catch (e) {
          console.log(`❌ Failed with: ${pwd}`)
        }
      }
    }
    
  } catch (error) {
    console.error("❌ Error during debug:", error)
  }
}

// Run the script
if (require.main === module) {
  debugLogin()
}