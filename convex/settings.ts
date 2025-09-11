import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

// Get organization settings
export const getOrganizationSettings = query({
  handler: async (ctx) => {
    const settings = await ctx.db
      .query("organizationSettings")
      .first()
    
    // Return default settings if none exist
    if (!settings) {
      return {
        companyName: "Braunwell CRM",
        supportEmail: "",
        supportPhone: "",
        timezone: "Europe/London",
        dateFormat: "DD/MM/YYYY",
        currency: "GBP",
        language: "en-GB",
      }
    }
    
    return settings
  },
})

// Update organization settings
export const updateOrganizationSettings = mutation({
  args: {
    companyName: v.optional(v.string()),
    supportEmail: v.optional(v.string()),
    supportPhone: v.optional(v.string()),
    timezone: v.optional(v.string()),
    dateFormat: v.optional(v.string()),
    currency: v.optional(v.string()),
    language: v.optional(v.string()),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args
    
    // Check if user is admin
    const user = await ctx.db.get(userId)
    if (!user || user.role !== "admin") {
      throw new Error("Only admins can update organization settings")
    }
    
    // Get existing settings
    const existing = await ctx.db
      .query("organizationSettings")
      .first()
    
    const now = Date.now()
    
    if (existing) {
      // Update existing settings
      await ctx.db.patch(existing._id, {
        ...updates,
        updatedAt: now,
        updatedBy: userId,
      })
    } else {
      // Create new settings
      await ctx.db.insert("organizationSettings", {
        companyName: updates.companyName || "Braunwell CRM",
        supportEmail: updates.supportEmail || "",
        supportPhone: updates.supportPhone || "",
        timezone: updates.timezone || "Europe/London",
        dateFormat: updates.dateFormat || "DD/MM/YYYY",
        currency: updates.currency || "GBP",
        language: updates.language || "en-GB",
        createdAt: now,
        updatedAt: now,
        updatedBy: userId,
      })
    }
    
    // Log the update
    await ctx.db.insert("auditLogs", {
      action: "updated",
      entityType: "settings",
      entityId: "organization",
      userId,
      changes: JSON.stringify(updates),
      timestamp: now,
    })
    
    return { success: true }
  },
})

// Get notification settings for a user
export const getUserNotificationSettings = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const settings = await ctx.db
      .query("notificationSettings")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first()
    
    // Return default settings if none exist
    if (!settings) {
      return {
        newProjectCreated: true,
        taskAssigned: true,
        dailySummary: false,
        weeklyReports: false,
        emailEnabled: true,
      }
    }
    
    return settings
  },
})

// Update notification settings for a user
export const updateUserNotificationSettings = mutation({
  args: {
    userId: v.id("users"),
    newProjectCreated: v.optional(v.boolean()),
    taskAssigned: v.optional(v.boolean()),
    dailySummary: v.optional(v.boolean()),
    weeklyReports: v.optional(v.boolean()),
    emailEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args
    
    // Get existing settings
    const existing = await ctx.db
      .query("notificationSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first()
    
    const now = Date.now()
    
    if (existing) {
      // Update existing settings
      await ctx.db.patch(existing._id, {
        ...updates,
        updatedAt: now,
      })
    } else {
      // Create new settings
      await ctx.db.insert("notificationSettings", {
        userId,
        newProjectCreated: updates.newProjectCreated ?? true,
        taskAssigned: updates.taskAssigned ?? true,
        dailySummary: updates.dailySummary ?? false,
        weeklyReports: updates.weeklyReports ?? false,
        emailEnabled: updates.emailEnabled ?? true,
        createdAt: now,
        updatedAt: now,
      })
    }
    
    return { success: true }
  },
})

// Get security settings
export const getSecuritySettings = query({
  handler: async (ctx) => {
    const settings = await ctx.db
      .query("securitySettings")
      .first()
    
    // Return default settings if none exist
    if (!settings) {
      return {
        twoFactorRequired: false,
        sessionTimeoutDays: 7,
        passwordMinLength: 8,
        passwordRequireUppercase: true,
        passwordRequireNumbers: true,
        passwordRequireSpecial: false,
        ipWhitelistEnabled: false,
        ipWhitelist: [],
        auditLogRetentionDays: 365,
      }
    }
    
    return settings
  },
})

// Update security settings
export const updateSecuritySettings = mutation({
  args: {
    twoFactorRequired: v.optional(v.boolean()),
    sessionTimeoutDays: v.optional(v.number()),
    passwordMinLength: v.optional(v.number()),
    passwordRequireUppercase: v.optional(v.boolean()),
    passwordRequireNumbers: v.optional(v.boolean()),
    passwordRequireSpecial: v.optional(v.boolean()),
    ipWhitelistEnabled: v.optional(v.boolean()),
    ipWhitelist: v.optional(v.array(v.string())),
    auditLogRetentionDays: v.optional(v.number()),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args
    
    // Check if user is admin
    const user = await ctx.db.get(userId)
    if (!user || user.role !== "admin") {
      throw new Error("Only admins can update security settings")
    }
    
    // Get existing settings
    const existing = await ctx.db
      .query("securitySettings")
      .first()
    
    const now = Date.now()
    
    if (existing) {
      // Update existing settings
      await ctx.db.patch(existing._id, {
        ...updates,
        updatedAt: now,
        updatedBy: userId,
      })
    } else {
      // Create new settings with defaults
      await ctx.db.insert("securitySettings", {
        twoFactorRequired: updates.twoFactorRequired ?? false,
        sessionTimeoutDays: updates.sessionTimeoutDays ?? 7,
        passwordMinLength: updates.passwordMinLength ?? 8,
        passwordRequireUppercase: updates.passwordRequireUppercase ?? true,
        passwordRequireNumbers: updates.passwordRequireNumbers ?? true,
        passwordRequireSpecial: updates.passwordRequireSpecial ?? false,
        ipWhitelistEnabled: updates.ipWhitelistEnabled ?? false,
        ipWhitelist: updates.ipWhitelist ?? [],
        auditLogRetentionDays: updates.auditLogRetentionDays ?? 365,
        createdAt: now,
        updatedAt: now,
        updatedBy: userId,
      })
    }
    
    // Log the update
    await ctx.db.insert("auditLogs", {
      action: "updated",
      entityType: "settings",
      entityId: "security",
      userId,
      changes: JSON.stringify(updates),
      timestamp: now,
    })
    
    return { success: true }
  },
})