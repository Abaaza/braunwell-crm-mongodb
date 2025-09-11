import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { Id } from "./_generated/dataModel"

// Rate limiting for authentication attempts
const authAttempts = new Map<string, { count: number; lastAttempt: number }>()

// Clean up old attempts when checking rate limit
function cleanupOldAttempts() {
  const now = Date.now()
  const fifteenMinutes = 15 * 60 * 1000
  
  for (const [key, attempt] of authAttempts.entries()) {
    if (now - attempt.lastAttempt > fifteenMinutes) {
      authAttempts.delete(key)
    }
  }
}

function checkRateLimit(identifier: string): boolean {
  // Clean up old attempts periodically
  cleanupOldAttempts()
  
  const now = Date.now()
  const fifteenMinutes = 15 * 60 * 1000
  const maxAttempts = 5
  
  const attempt = authAttempts.get(identifier)
  
  if (!attempt) {
    authAttempts.set(identifier, { count: 1, lastAttempt: now })
    return true
  }
  
  // Reset counter if more than 15 minutes have passed
  if (now - attempt.lastAttempt > fifteenMinutes) {
    authAttempts.set(identifier, { count: 1, lastAttempt: now })
    return true
  }
  
  // Check if under rate limit
  if (attempt.count >= maxAttempts) {
    return false
  }
  
  // Increment counter
  attempt.count++
  attempt.lastAttempt = now
  
  return true
}

// Helper to generate a random token
function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}

// Simple password hashing for development
// In production, use a proper hashing service
function hashPassword(password: string): string {
  // Simple hash for development - DO NOT use in production
  const hash = btoa(password + "salt123")
  return `dev:${hash}`
}

// Helper to verify password
function verifyPassword(password: string, storedHash: string): boolean {
  // Check if it's a dev hash
  if (storedHash.startsWith('dev:')) {
    const expectedHash = hashPassword(password)
    return expectedHash === storedHash
  }
  
  // For backward compatibility with any existing hashes
  return false
}

// Initialize default users
export const initializeUsers = mutation({
  handler: async (ctx) => {
    const existingUsers = await ctx.db.query("users").collect()
    
    if (existingUsers.length === 0) {
      const now = Date.now()
      
      // Create admin user
      await ctx.db.insert("users", {
        email: "admin@braunwell.com",
        passwordHash: hashPassword("admin123"),
        role: "admin",
        name: "Admin User",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
      
      // Create regular user
      await ctx.db.insert("users", {
        email: "user@braunwell.com",
        passwordHash: hashPassword("user123"),
        role: "user",
        name: "Regular User",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
    }
  },
})

// Initialize production user
export const initializeProductionUser = mutation({
  handler: async (ctx) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", "aideen@braunwell.co.uk"))
      .first()
    
    if (!existingUser) {
      const now = Date.now()
      
      // Create Aideen's admin user
      await ctx.db.insert("users", {
        email: "aideen@braunwell.co.uk",
        passwordHash: hashPassword("2ideen1996"),
        role: "admin",
        name: "Aideen",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
      
      return { created: true }
    }
    
    return { created: false, message: "User already exists" }
  },
})

// Reset production user password
export const resetProductionUserPassword = mutation({
  handler: async (ctx) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", "aideen@braunwell.co.uk"))
      .first()
    
    if (user) {
      await ctx.db.patch(user._id, {
        passwordHash: hashPassword("2ideen1996"),
        updatedAt: Date.now(),
      })
      
      return { success: true, message: "Password reset successfully" }
    }
    
    return { success: false, message: "User not found" }
  },
})

// Add Ayman Hofi as admin user
export const addAymanHofiAdmin = mutation({
  handler: async (ctx) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", "ahofi@braunwell.co.uk"))
      .first()
    
    if (!existingUser) {
      const now = Date.now()
      
      // Create Ayman's admin user
      const userId = await ctx.db.insert("users", {
        email: "ahofi@braunwell.co.uk",
        passwordHash: hashPassword("4568970"),
        role: "admin",
        name: "Ayman Hofi",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
      
      return { created: true, userId }
    }
    
    return { created: false, message: "User already exists" }
  },
})

// Reset Ayman's password
export const resetAymanPassword = mutation({
  handler: async (ctx) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", "ahofi@braunwell.co.uk"))
      .first()
    
    if (user) {
      await ctx.db.patch(user._id, {
        passwordHash: hashPassword("4568970"),
        updatedAt: Date.now(),
      })
      
      return { success: true, message: "Password reset successfully to 4568970" }
    }
    
    return { success: false, message: "User not found" }
  },
})

// Reset passwords for development
export const resetPasswords = mutation({
  handler: async (ctx) => {
    const adminUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", "admin@braunwell.com"))
      .first()
    
    if (adminUser) {
      await ctx.db.patch(adminUser._id, {
        passwordHash: hashPassword("admin123"),
      })
    }
    
    const regularUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", "user@braunwell.com"))
      .first()
    
    if (regularUser) {
      await ctx.db.patch(regularUser._id, {
        passwordHash: hashPassword("user123"),
      })
    }
    
    return { success: true }
  },
})

// Login mutation
export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    clientIp: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Rate limiting check
    const identifier = args.clientIp || args.email
    if (!checkRateLimit(identifier)) {
      throw new Error("Too many login attempts. Please try again in 15 minutes.")
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first()
    
    if (!user || !verifyPassword(args.password, user.passwordHash)) {
      // Log failed login attempt only if user exists
      if (user) {
        await ctx.db.insert("auditLogs", {
          action: "login_failed",
          userId: user._id,
          entityId: user._id,
          entityType: "user",
          timestamp: Date.now(),
          metadata: JSON.stringify({
            email: args.email,
            ip: args.clientIp,
            timestamp: Date.now(),
          }),
        })
      }
      
      throw new Error("Invalid email or password")
    }
    
    if (!user.isActive) {
      throw new Error("Account is deactivated")
    }
    
    // Update last login
    await ctx.db.patch(user._id, {
      lastLoginAt: Date.now(),
    })
    
    // Create session
    const token = generateToken()
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
    
    await ctx.db.insert("sessions", {
      userId: user._id,
      token,
      expiresAt,
    })
    
    // Log successful login
    await ctx.db.insert("auditLogs", {
      action: "login_success",
      userId: user._id,
      entityId: user._id,
      entityType: "user",
      timestamp: Date.now(),
      metadata: JSON.stringify({
        email: args.email,
        ip: args.clientIp,
        timestamp: Date.now(),
      }),
    })
    
    return {
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
      },
    }
  },
})

// Logout mutation
export const logout = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first()
    
    if (session) {
      await ctx.db.delete(session._id)
    }
  },
})

// Validate session query
export const validateSession = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first()
    
    if (!session || session.expiresAt < Date.now()) {
      return null
    }
    
    const user = await ctx.db.get(session.userId)
    
    if (!user || !user.isActive) {
      return null
    }
    
    return {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
    }
  },
})

// Get current user query
export const getCurrentUser = query({
  args: {
    token: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.token) return null
    
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token!))
      .first()
    
    if (!session || session.expiresAt < Date.now()) {
      return null
    }
    
    const user = await ctx.db.get(session.userId)
    
    if (!user || !user.isActive) {
      return null
    }
    
    return {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
    }
  },
})

// Update user profile
export const updateProfile = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)
    if (!user) {
      throw new Error("User not found")
    }

    await ctx.db.patch(args.userId, {
      name: args.name,
      updatedAt: Date.now(),
    })

    return { success: true }
  },
})

// Update user avatar
export const updateAvatar = mutation({
  args: {
    userId: v.id("users"),
    avatarData: v.string(), // Base64 encoded image
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)
    if (!user) {
      throw new Error("User not found")
    }

    // Validate image size (max 2MB in base64)
    if (args.avatarData.length > 2 * 1024 * 1024 * 1.37) { // Base64 is ~37% larger
      throw new Error("Image size must be less than 2MB")
    }

    await ctx.db.patch(args.userId, {
      avatar: args.avatarData,
      updatedAt: Date.now(),
    })

    return { success: true }
  },
})

// Update user password
export const updatePassword = mutation({
  args: {
    userId: v.id("users"),
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)
    if (!user) {
      throw new Error("User not found")
    }

    // Verify current password
    const isValidPassword = await verifyPassword(args.currentPassword, user.passwordHash)
    if (!isValidPassword) {
      throw new Error("Current password is incorrect")
    }

    // Hash new password
    const newPasswordHash = await hashPassword(args.newPassword)

    // Update user password
    await ctx.db.patch(args.userId, {
      passwordHash: newPasswordHash,
      updatedAt: Date.now(),
    })

    return { success: true }
  },
})

// Migration function to update existing passwords (run once)
export const migratePasswords = mutation({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect()
    
    for (const user of users) {
      // Check if password is still using old base64 format (no colon)
      if (user.passwordHash && !user.passwordHash.includes(':')) {
        // Decode the base64 password
        const oldPassword = atob(user.passwordHash)
        
        // Hash it properly
        const newHash = await hashPassword(oldPassword)
        
        // Update the user
        await ctx.db.patch(user._id, {
          passwordHash: newHash,
          updatedAt: Date.now(),
        })
      }
    }
    
    return { migrated: users.length }
  },
})
