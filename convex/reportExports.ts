import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { Id } from "./_generated/dataModel"

export const list = query({
  args: {
    userId: v.id("users"),
    dashboardId: v.optional(v.id("dashboards")),
    status: v.optional(v.union(v.literal("pending"), v.literal("processing"), v.literal("completed"), v.literal("failed"))),
  },
  handler: async (ctx, args) => {
    let exports = await ctx.db
      .query("reportExports")
      .withIndex("by_creator", (q) => q.eq("createdBy", args.userId))
      .collect()
    
    if (args.dashboardId) {
      exports = exports.filter(e => e.dashboardId === args.dashboardId)
    }
    
    if (args.status) {
      exports = exports.filter(e => e.status === args.status)
    }
    
    // Get dashboard info
    const exportsWithDashboard = await Promise.all(
      exports.map(async (exportRecord) => {
        const dashboard = await ctx.db.get(exportRecord.dashboardId)
        return {
          ...exportRecord,
          dashboardName: dashboard?.name || "Unknown Dashboard",
        }
      })
    )
    
    return exportsWithDashboard.sort((a, b) => b.createdAt - a.createdAt)
  },
})

export const get = query({
  args: { id: v.id("reportExports") },
  handler: async (ctx, args) => {
    const exportRecord = await ctx.db.get(args.id)
    if (!exportRecord) return null
    
    const dashboard = await ctx.db.get(exportRecord.dashboardId)
    return {
      ...exportRecord,
      dashboardName: dashboard?.name || "Unknown Dashboard",
    }
  },
})

export const create = mutation({
  args: {
    dashboardId: v.id("dashboards"),
    format: v.union(v.literal("pdf"), v.literal("excel"), v.literal("csv"), v.literal("json")),
    parameters: v.optional(v.object({
      dateRange: v.optional(v.string()),
      filters: v.optional(v.array(v.object({
        field: v.string(),
        operator: v.string(),
        value: v.string(),
      }))),
      includeCharts: v.optional(v.boolean()),
      includeData: v.optional(v.boolean()),
    })),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    const expiresAt = now + (7 * 24 * 60 * 60 * 1000) // 7 days
    
    const dashboard = await ctx.db.get(args.dashboardId)
    if (!dashboard) throw new Error("Dashboard not found")
    
    const fileName = `${dashboard.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.${args.format}`
    
    const exportId = await ctx.db.insert("reportExports", {
      dashboardId: args.dashboardId,
      format: args.format,
      status: "pending",
      fileName,
      parameters: args.parameters,
      expiresAt,
      createdBy: args.userId,
      createdAt: now,
      updatedAt: now,
    })
    
    // Log export creation
    await ctx.db.insert("auditLogs", {
      action: "created",
      entityType: "reportExports",
      entityId: exportId,
      userId: args.userId,
      timestamp: now,
    })
    
    return exportId
  },
})

export const updateStatus = mutation({
  args: {
    id: v.id("reportExports"),
    status: v.union(v.literal("pending"), v.literal("processing"), v.literal("completed"), v.literal("failed")),
    fileUrl: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args
    
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    })
    
    return id
  },
})

export const remove = mutation({
  args: {
    id: v.id("reportExports"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const exportRecord = await ctx.db.get(args.id)
    if (!exportRecord) throw new Error("Export not found")
    
    // Check if user owns the export
    if (exportRecord.createdBy !== args.userId) {
      throw new Error("You can only delete your own exports")
    }
    
    await ctx.db.delete(args.id)
    
    // Log deletion
    await ctx.db.insert("auditLogs", {
      action: "deleted",
      entityType: "reportExports",
      entityId: args.id,
      userId: args.userId,
      timestamp: Date.now(),
    })
  },
})

export const cleanupExpired = mutation({
  handler: async (ctx) => {
    const now = Date.now()
    const expiredExports = await ctx.db
      .query("reportExports")
      .withIndex("by_expires", (q) => q.lt("expiresAt", now))
      .collect()
    
    for (const exportRecord of expiredExports) {
      await ctx.db.delete(exportRecord._id)
    }
    
    return `Cleaned up ${expiredExports.length} expired exports`
  },
})

// Simplified export processing (in a real app, this would be more complex)
export const processExport = mutation({
  args: {
    id: v.id("reportExports"),
  },
  handler: async (ctx, args) => {
    const exportRecord = await ctx.db.get(args.id)
    if (!exportRecord) throw new Error("Export not found")
    
    // Update status to processing
    await ctx.db.patch(args.id, {
      status: "processing",
      updatedAt: Date.now(),
    })
    
    try {
      // Get dashboard data
      const dashboard = await ctx.db.get(exportRecord.dashboardId)
      if (!dashboard) throw new Error("Dashboard not found")
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // In a real implementation, you would:
      // 1. Fetch the actual data based on the dashboard configuration
      // 2. Generate the file in the requested format
      // 3. Upload to cloud storage
      // 4. Return the file URL
      
      const mockFileUrl = `https://example.com/exports/${exportRecord.fileName}`
      const mockFileSize = Math.floor(Math.random() * 1000000) + 100000 // 100KB - 1MB
      
      // Update status to completed
      await ctx.db.patch(args.id, {
        status: "completed",
        fileUrl: mockFileUrl,
        fileSize: mockFileSize,
        updatedAt: Date.now(),
      })
      
      return "Export completed successfully"
    } catch (error) {
      // Update status to failed
      await ctx.db.patch(args.id, {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        updatedAt: Date.now(),
      })
      
      throw error
    }
  },
})