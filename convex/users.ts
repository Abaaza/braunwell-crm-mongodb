import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { Id } from "./_generated/dataModel"

// Helper function to get user by ID
export async function getUserById(ctx: { db: any }, userId: Id<"users">) {
  return await ctx.db.get(userId)
}

export const list = query({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect()
    
    // Get additional stats for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const [projects, tasks, contacts] = await Promise.all([
          ctx.db.query("projects").filter(q => q.eq(q.field("createdBy"), user._id)).collect(),
          ctx.db.query("tasks").filter(q => q.eq(q.field("assignedTo"), user._id)).collect(),
          ctx.db.query("contacts").filter(q => q.eq(q.field("createdBy"), user._id)).collect(),
        ])
        
        return {
          ...user,
          projectsCount: projects.length,
          tasksCount: tasks.length,
          contactsCount: contacts.length,
        }
      })
    )
    
    return usersWithStats
  },
})

export const updateRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("user")),
    currentUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Prevent users from changing their own role
    if (args.userId === args.currentUserId) {
      throw new Error("You cannot change your own role")
    }
    
    const user = await ctx.db.get(args.userId)
    if (!user) throw new Error("User not found")
    
    await ctx.db.patch(args.userId, {
      role: args.role,
      updatedAt: Date.now(),
    })
    
    // Log the change
    await ctx.db.insert("auditLogs", {
      action: "updated",
      entityType: "users",
      entityId: args.userId,
      userId: args.currentUserId,
      changes: JSON.stringify({ role: { from: user.role, to: args.role } }),
      timestamp: Date.now(),
    })
    
    return args.userId
  },
})

export const toggleStatus = mutation({
  args: {
    userId: v.id("users"),
    currentUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Prevent users from deactivating themselves
    if (args.userId === args.currentUserId) {
      throw new Error("You cannot deactivate your own account")
    }
    
    const user = await ctx.db.get(args.userId)
    if (!user) throw new Error("User not found")
    
    const newStatus = !user.isActive
    
    await ctx.db.patch(args.userId, {
      isActive: newStatus,
      updatedAt: Date.now(),
    })
    
    // If deactivating, remove all sessions
    if (!newStatus) {
      const sessions = await ctx.db
        .query("sessions")
        .filter(q => q.eq(q.field("userId"), args.userId))
        .collect()
      
      for (const session of sessions) {
        await ctx.db.delete(session._id)
      }
    }
    
    // Log the change
    await ctx.db.insert("auditLogs", {
      action: "updated",
      entityType: "users",
      entityId: args.userId,
      userId: args.currentUserId,
      changes: JSON.stringify({ isActive: { from: user.isActive, to: newStatus } }),
      timestamp: Date.now(),
    })
    
    return args.userId
  },
})

// Simple password hashing for development
function hashPassword(password: string): string {
  // Simple hash for development - DO NOT use in production
  const hash = btoa(password + "salt123")
  return `dev:${hash}`
}

export const createUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
    role: v.optional(v.union(v.literal("admin"), v.literal("user"))),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if email already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", q => q.eq("email", args.email))
      .first()
    
    if (existingUser) {
      throw new Error("A user with this email already exists")
    }
    
    const now = Date.now()
    
    // Create new user
    const userId = await ctx.db.insert("users", {
      email: args.email,
      passwordHash: hashPassword(args.password),
      role: args.role || "user",
      name: args.name,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })
    
    // Log creation
    await ctx.db.insert("auditLogs", {
      action: "user_created",
      entityType: "users",
      entityId: userId,
      userId: args.createdBy,
      timestamp: now,
      metadata: JSON.stringify({
        name: args.name,
        email: args.email,
        role: args.role || "user",
      }),
    })
    
    return userId
  },
})