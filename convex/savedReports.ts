import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { Id } from "./_generated/dataModel"

export const list = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get reports created by user or public reports
    const reports = await ctx.db
      .query("savedReports")
      .collect()
    
    const userReports = reports.filter(r => 
      r.createdBy === args.userId || r.isPublic
    )
    
    // Get creator info
    const reportsWithCreator = await Promise.all(
      userReports.map(async (report) => {
        const creator = await ctx.db.get(report.createdBy)
        return {
          ...report,
          creatorName: creator?.name || "Unknown",
        }
      })
    )
    
    return reportsWithCreator.sort((a, b) => {
      // Sort by default status first, then by created date
      if (a.isDefault && !b.isDefault) return -1
      if (!a.isDefault && b.isDefault) return 1
      return b.createdAt - a.createdAt
    })
  },
})

export const get = query({
  args: { id: v.id("savedReports") },
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.id)
    if (!report) return null
    
    const creator = await ctx.db.get(report.createdBy)
    return {
      ...report,
      creatorName: creator?.name || "Unknown",
    }
  },
})

export const getDefault = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const defaultReport = await ctx.db
      .query("savedReports")
      .withIndex("by_default", (q) => q.eq("createdBy", args.userId).eq("isDefault", true))
      .first()
    
    return defaultReport
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    type: v.union(v.literal("dashboard"), v.literal("custom")),
    configuration: v.object({
      dateRange: v.optional(v.string()),
      metrics: v.optional(v.array(v.id("customMetrics"))),
      charts: v.optional(v.array(v.string())),
      filters: v.optional(v.object({
        projectStatus: v.optional(v.string()),
        taskStatus: v.optional(v.string()),
        priority: v.optional(v.string()),
      })),
      layout: v.optional(v.string()),
    }),
    isDefault: v.optional(v.boolean()),
    isPublic: v.boolean(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    
    // If setting as default, unset any existing default
    if (args.isDefault) {
      const existingDefault = await ctx.db
        .query("savedReports")
        .withIndex("by_default", (q) => q.eq("createdBy", args.userId).eq("isDefault", true))
        .first()
      
      if (existingDefault) {
        await ctx.db.patch(existingDefault._id, { isDefault: false })
      }
    }
    
    const reportId = await ctx.db.insert("savedReports", {
      name: args.name,
      description: args.description,
      type: args.type,
      configuration: args.configuration,
      isDefault: args.isDefault || false,
      isPublic: args.isPublic,
      createdBy: args.userId,
      createdAt: now,
      updatedAt: now,
    })
    
    // Log creation
    await ctx.db.insert("auditLogs", {
      action: "created",
      entityType: "savedReports",
      entityId: reportId,
      userId: args.userId,
      timestamp: now,
    })
    
    return reportId
  },
})

export const update = mutation({
  args: {
    id: v.id("savedReports"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    configuration: v.optional(v.object({
      dateRange: v.optional(v.string()),
      metrics: v.optional(v.array(v.id("customMetrics"))),
      charts: v.optional(v.array(v.string())),
      filters: v.optional(v.object({
        projectStatus: v.optional(v.string()),
        taskStatus: v.optional(v.string()),
        priority: v.optional(v.string()),
      })),
      layout: v.optional(v.string()),
    })),
    isDefault: v.optional(v.boolean()),
    isPublic: v.optional(v.boolean()),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { id, userId, ...updates } = args
    
    const existing = await ctx.db.get(id)
    if (!existing) throw new Error("Report not found")
    
    // Check if user owns the report
    if (existing.createdBy !== userId) {
      throw new Error("You can only edit your own reports")
    }
    
    // If setting as default, unset any existing default
    if (updates.isDefault === true) {
      const existingDefault = await ctx.db
        .query("savedReports")
        .withIndex("by_default", (q) => q.eq("createdBy", userId).eq("isDefault", true))
        .first()
      
      if (existingDefault && existingDefault._id !== id) {
        await ctx.db.patch(existingDefault._id, { isDefault: false })
      }
    }
    
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    })
    
    // Log update
    await ctx.db.insert("auditLogs", {
      action: "updated",
      entityType: "savedReports",
      entityId: id,
      userId,
      timestamp: Date.now(),
    })
    
    return id
  },
})

export const remove = mutation({
  args: {
    id: v.id("savedReports"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.id)
    if (!report) throw new Error("Report not found")
    
    // Check if user owns the report
    if (report.createdBy !== args.userId) {
      throw new Error("You can only delete your own reports")
    }
    
    await ctx.db.delete(args.id)
    
    // Log deletion
    await ctx.db.insert("auditLogs", {
      action: "deleted",
      entityType: "savedReports",
      entityId: args.id,
      userId: args.userId,
      changes: JSON.stringify({ name: report.name }),
      timestamp: Date.now(),
    })
  },
})

export const setDefault = mutation({
  args: {
    id: v.id("savedReports"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.id)
    if (!report) throw new Error("Report not found")
    
    // Check if user owns the report or if it's public
    if (report.createdBy !== args.userId && !report.isPublic) {
      throw new Error("You can only set your own reports or public reports as default")
    }
    
    // Unset any existing default
    const existingDefault = await ctx.db
      .query("savedReports")
      .withIndex("by_default", (q) => q.eq("createdBy", args.userId).eq("isDefault", true))
      .first()
    
    if (existingDefault) {
      await ctx.db.patch(existingDefault._id, { isDefault: false })
    }
    
    // Set new default
    await ctx.db.patch(args.id, {
      isDefault: true,
      updatedAt: Date.now(),
    })
    
    return args.id
  },
})