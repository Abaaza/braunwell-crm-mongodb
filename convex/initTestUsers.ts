import { mutation } from "./_generated/server"

export const initTestUsers = mutation({
  handler: async (ctx) => {
    const now = Date.now()
    
    // Check if users already exist
    const existingAdmin = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", "admin@braunwell.com"))
      .first()
    
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", "user@braunwell.com"))
      .first()
    
    const users = []
    
    if (!existingAdmin) {
      const adminId = await ctx.db.insert("users", {
        email: "admin@braunwell.com",
        // Pre-hashed password for "admin123"
        passwordHash: "$2a$10$yeiBtUKuIC9G.07N/4Aaq.z51KY/esy/Zjnh2mUPOWuWD0/Iqg.tO",
        role: "admin",
        name: "Admin User",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
      users.push({ id: adminId, email: "admin@braunwell.com", role: "admin" })
    }
    
    if (!existingUser) {
      const userId = await ctx.db.insert("users", {
        email: "user@braunwell.com", 
        // Pre-hashed password for "user123"
        passwordHash: "$2a$10$QlFOQsikVrHxJOqqYY99muxCPRItQScZTOLo.9.WHmTAQbFGJC6IK",
        role: "user",
        name: "Regular User",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
      users.push({ id: userId, email: "user@braunwell.com", role: "user" })
    }
    
    return {
      message: "Test users initialized",
      created: users,
      skipped: {
        admin: !!existingAdmin,
        user: !!existingUser,
      }
    }
  },
})