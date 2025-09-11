/**
 * Script to verify Ayman's login credentials
 */

import { ConvexHttpClient } from "convex/browser"
import { api } from "../convex/_generated/api"

const CONVEX_URL = "https://resilient-pig-8.convex.cloud"

const client = new ConvexHttpClient(CONVEX_URL)

// Replicate the hashing function
function hashPassword(password: string): string {
  const hash = btoa(password + "salt123")
  return `dev:${hash}`
}

async function verifyAymanLogin() {
  try {
    console.log("🔍 Verifying Ayman's account...")
    
    // Get all users
    const users = await client.query(api.users.list)
    const ayman = users.find(u => u.email === "ahofi@braunwell.co.uk")
    
    if (ayman) {
      console.log("✅ User found:")
      console.log(`   ID: ${ayman._id}`)
      console.log(`   Name: ${ayman.name}`)
      console.log(`   Email: ${ayman.email}`)
      console.log(`   Role: ${ayman.role}`)
      console.log(`   Active: ${ayman.isActive}`)
      
      // Test password hash
      console.log("\n📝 Password verification:")
      const testPassword = "4568970"
      const expectedHash = hashPassword(testPassword)
      console.log(`   Password to test: ${testPassword}`)
      console.log(`   Expected hash: ${expectedHash}`)
      
      // Test login with exact credentials
      console.log("\n🔐 Testing login...")
      try {
        const result = await client.mutation(api.auth.login, {
          email: "ahofi@braunwell.co.uk",
          password: "4568970",
          clientIp: "127.0.0.1"
        })
        console.log("✅ Login successful!")
        console.log(`   Token: ${result.token.substring(0, 10)}...`)
      } catch (error: any) {
        console.log("❌ Login failed:", error.message)
        
        // Try variations
        console.log("\n🔄 Testing variations...")
        const variations = [
          { email: "ahofi@braunwell.co.uk", password: "4568970" },
          { email: "ahofi@braunwell.co.uk", password: "2ideen1996" }, // In case wrong password was set
          { email: "ahofi@braunwell.co.uk ", password: "4568970" }, // With space
          { email: " ahofi@braunwell.co.uk", password: "4568970" }, // With space
        ]
        
        for (const creds of variations) {
          try {
            await client.mutation(api.auth.login, {
              email: creds.email,
              password: creds.password,
              clientIp: "127.0.0.1"
            })
            console.log(`✅ Login worked with: email="${creds.email}" password="${creds.password}"`)
            break
          } catch (e) {
            console.log(`❌ Failed: email="${creds.email}" password="${creds.password}"`)
          }
        }
      }
    } else {
      console.log("❌ User not found with email: ahofi@braunwell.co.uk")
      console.log("\n📋 All users in system:")
      users.forEach(u => {
        console.log(`   - ${u.email} (${u.name})`)
      })
    }
    
  } catch (error) {
    console.error("❌ Error:", error)
  }
}

// Run the script
if (require.main === module) {
  verifyAymanLogin()
}