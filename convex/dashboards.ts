import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { Id } from "./_generated/dataModel"
import { decryptNumber } from "./lib/encryption"

// Dashboard queries
export const list = query({
  args: {
    userId: v.id("users"),
    includePublic: v.optional(v.boolean()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let dashboards = await ctx.db
      .query("dashboards")
      .collect()
    
    // Filter based on ownership and public visibility
    const filteredDashboards = dashboards.filter(dashboard => {
      const isOwner = dashboard.createdBy === args.userId
      const isPublic = args.includePublic && dashboard.isPublic
      const categoryMatch = !args.category || dashboard.category === args.category
      
      return (isOwner || isPublic) && categoryMatch
    })
    
    // Get creator info
    const dashboardsWithCreator = await Promise.all(
      filteredDashboards.map(async (dashboard) => {
        const creator = await ctx.db.get(dashboard.createdBy)
        return {
          ...dashboard,
          creatorName: creator?.name || "Unknown",
        }
      })
    )
    
    return dashboardsWithCreator.sort((a, b) => {
      // Sort by default status first, then by last accessed, then by created date
      if (a.isDefault && !b.isDefault) return -1
      if (!a.isDefault && b.isDefault) return 1
      
      const aLastAccessed = a.lastAccessedAt || a.createdAt
      const bLastAccessed = b.lastAccessedAt || b.createdAt
      
      return bLastAccessed - aLastAccessed
    })
  },
})

export const get = query({
  args: { id: v.id("dashboards") },
  handler: async (ctx, args) => {
    const dashboard = await ctx.db.get(args.id)
    if (!dashboard) return null
    
    const creator = await ctx.db.get(dashboard.createdBy)
    return {
      ...dashboard,
      creatorName: creator?.name || "Unknown",
    }
  },
})

export const getDefault = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const defaultDashboard = await ctx.db
      .query("dashboards")
      .withIndex("by_default", (q) => q.eq("createdBy", args.userId).eq("isDefault", true))
      .first()
    
    return defaultDashboard
  },
})

// Dashboard mutations
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    layout: v.array(v.object({
      id: v.string(),
      type: v.union(
        v.literal("metric_card"),
        v.literal("line_chart"),
        v.literal("bar_chart"),
        v.literal("pie_chart"),
        v.literal("area_chart"),
        v.literal("donut_chart"),
        v.literal("table"),
        v.literal("progress_bar"),
        v.literal("gauge"),
        v.literal("heatmap"),
        v.literal("funnel"),
        v.literal("scatter"),
        v.literal("custom_metric")
      ),
      position: v.object({
        x: v.number(),
        y: v.number(),
        w: v.number(),
        h: v.number(),
      }),
      config: v.object({
        title: v.string(),
        dataSource: v.union(v.literal("projects"), v.literal("tasks"), v.literal("contacts"), v.literal("payments"), v.literal("invoices"), v.literal("custom")),
        filters: v.optional(v.array(v.object({
          field: v.string(),
          operator: v.union(v.literal("equals"), v.literal("not_equals"), v.literal("greater_than"), v.literal("less_than"), v.literal("contains"), v.literal("not_contains"), v.literal("starts_with"), v.literal("ends_with"), v.literal("in"), v.literal("not_in")),
          value: v.string(),
        }))),
        aggregation: v.optional(v.union(v.literal("count"), v.literal("sum"), v.literal("average"), v.literal("min"), v.literal("max"))),
        field: v.optional(v.string()),
        groupBy: v.optional(v.string()),
        dateRange: v.optional(v.string()),
        refreshInterval: v.optional(v.number()),
        customColors: v.optional(v.array(v.string())),
        showLegend: v.optional(v.boolean()),
        showGrid: v.optional(v.boolean()),
        showTooltip: v.optional(v.boolean()),
        animationEnabled: v.optional(v.boolean()),
        customQuery: v.optional(v.string()),
      }),
    })),
    tags: v.optional(v.array(v.string())),
    isTemplate: v.optional(v.boolean()),
    isPublic: v.boolean(),
    isDefault: v.optional(v.boolean()),
    category: v.optional(v.string()),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    
    // If setting as default, unset any existing default
    if (args.isDefault) {
      const existingDefault = await ctx.db
        .query("dashboards")
        .withIndex("by_default", (q) => q.eq("createdBy", args.userId).eq("isDefault", true))
        .first()
      
      if (existingDefault) {
        await ctx.db.patch(existingDefault._id, { isDefault: false })
      }
    }
    
    const dashboardId = await ctx.db.insert("dashboards", {
      name: args.name,
      description: args.description,
      layout: args.layout,
      tags: args.tags,
      isTemplate: args.isTemplate || false,
      isPublic: args.isPublic,
      isDefault: args.isDefault || false,
      category: args.category,
      createdBy: args.userId,
      createdAt: now,
      updatedAt: now,
      accessCount: 0,
    })
    
    // Log creation
    await ctx.db.insert("auditLogs", {
      action: "created",
      entityType: "dashboards",
      entityId: dashboardId,
      userId: args.userId,
      timestamp: now,
    })
    
    return dashboardId
  },
})

export const update = mutation({
  args: {
    id: v.id("dashboards"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    layout: v.optional(v.array(v.object({
      id: v.string(),
      type: v.union(
        v.literal("metric_card"),
        v.literal("line_chart"),
        v.literal("bar_chart"),
        v.literal("pie_chart"),
        v.literal("area_chart"),
        v.literal("donut_chart"),
        v.literal("table"),
        v.literal("progress_bar"),
        v.literal("gauge"),
        v.literal("heatmap"),
        v.literal("funnel"),
        v.literal("scatter"),
        v.literal("custom_metric")
      ),
      position: v.object({
        x: v.number(),
        y: v.number(),
        w: v.number(),
        h: v.number(),
      }),
      config: v.object({
        title: v.string(),
        dataSource: v.union(v.literal("projects"), v.literal("tasks"), v.literal("contacts"), v.literal("payments"), v.literal("invoices"), v.literal("custom")),
        filters: v.optional(v.array(v.object({
          field: v.string(),
          operator: v.union(v.literal("equals"), v.literal("not_equals"), v.literal("greater_than"), v.literal("less_than"), v.literal("contains"), v.literal("not_contains"), v.literal("starts_with"), v.literal("ends_with"), v.literal("in"), v.literal("not_in")),
          value: v.string(),
        }))),
        aggregation: v.optional(v.union(v.literal("count"), v.literal("sum"), v.literal("average"), v.literal("min"), v.literal("max"))),
        field: v.optional(v.string()),
        groupBy: v.optional(v.string()),
        dateRange: v.optional(v.string()),
        refreshInterval: v.optional(v.number()),
        customColors: v.optional(v.array(v.string())),
        showLegend: v.optional(v.boolean()),
        showGrid: v.optional(v.boolean()),
        showTooltip: v.optional(v.boolean()),
        animationEnabled: v.optional(v.boolean()),
        customQuery: v.optional(v.string()),
      }),
    }))),
    tags: v.optional(v.array(v.string())),
    isTemplate: v.optional(v.boolean()),
    isPublic: v.optional(v.boolean()),
    isDefault: v.optional(v.boolean()),
    category: v.optional(v.string()),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { id, userId, ...updates } = args
    
    const existing = await ctx.db.get(id)
    if (!existing) throw new Error("Dashboard not found")
    
    // Check if user owns the dashboard
    if (existing.createdBy !== userId) {
      throw new Error("You can only edit your own dashboards")
    }
    
    // If setting as default, unset any existing default
    if (updates.isDefault === true) {
      const existingDefault = await ctx.db
        .query("dashboards")
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
      entityType: "dashboards",
      entityId: id,
      userId,
      timestamp: Date.now(),
    })
    
    return id
  },
})

export const remove = mutation({
  args: {
    id: v.id("dashboards"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const dashboard = await ctx.db.get(args.id)
    if (!dashboard) throw new Error("Dashboard not found")
    
    // Check if user owns the dashboard
    if (dashboard.createdBy !== args.userId) {
      throw new Error("You can only delete your own dashboards")
    }
    
    await ctx.db.delete(args.id)
    
    // Log deletion
    await ctx.db.insert("auditLogs", {
      action: "deleted",
      entityType: "dashboards",
      entityId: args.id,
      userId: args.userId,
      changes: JSON.stringify({ name: dashboard.name }),
      timestamp: Date.now(),
    })
  },
})

export const setDefault = mutation({
  args: {
    id: v.id("dashboards"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const dashboard = await ctx.db.get(args.id)
    if (!dashboard) throw new Error("Dashboard not found")
    
    // Check if user owns the dashboard or if it's public
    if (dashboard.createdBy !== args.userId && !dashboard.isPublic) {
      throw new Error("You can only set your own dashboards or public dashboards as default")
    }
    
    // Unset any existing default
    const existingDefault = await ctx.db
      .query("dashboards")
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

export const trackAccess = mutation({
  args: {
    id: v.id("dashboards"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const dashboard = await ctx.db.get(args.id)
    if (!dashboard) return
    
    // Update access tracking
    await ctx.db.patch(args.id, {
      lastAccessedAt: Date.now(),
      accessCount: (dashboard.accessCount || 0) + 1,
    })
    
    // Log access
    await ctx.db.insert("auditLogs", {
      action: "viewed",
      entityType: "dashboards",
      entityId: args.id,
      userId: args.userId,
      timestamp: Date.now(),
    })
  },
})

// Dashboard data queries
export const getDashboardData = query({
  args: {
    widgetId: v.string(),
    dataSource: v.union(v.literal("projects"), v.literal("tasks"), v.literal("contacts"), v.literal("payments"), v.literal("invoices")),
    config: v.object({
      aggregation: v.optional(v.union(v.literal("count"), v.literal("sum"), v.literal("average"), v.literal("min"), v.literal("max"))),
      field: v.optional(v.string()),
      groupBy: v.optional(v.string()),
      dateRange: v.optional(v.string()),
      filters: v.optional(v.array(v.object({
        field: v.string(),
        operator: v.union(v.literal("equals"), v.literal("not_equals"), v.literal("greater_than"), v.literal("less_than"), v.literal("contains"), v.literal("not_contains"), v.literal("starts_with"), v.literal("ends_with"), v.literal("in"), v.literal("not_in")),
        value: v.string(),
      }))),
    }),
  },
  handler: async (ctx, args) => {
    // This is a simplified version - in a real implementation, you'd have 
    // more sophisticated data fetching logic based on the dataSource and config
    
    const now = Date.now()
    const dateRanges = {
      "today": { start: now - 24 * 60 * 60 * 1000, end: now },
      "week": { start: now - 7 * 24 * 60 * 60 * 1000, end: now },
      "month": { start: now - 30 * 24 * 60 * 60 * 1000, end: now },
      "quarter": { start: now - 90 * 24 * 60 * 60 * 1000, end: now },
      "year": { start: now - 365 * 24 * 60 * 60 * 1000, end: now },
    }
    
    const dateRange = args.config.dateRange ? dateRanges[args.config.dateRange as keyof typeof dateRanges] : null
    
    try {
      switch (args.dataSource) {
        case "projects":
          const projects = await ctx.db.query("projects").collect()
          const filteredProjects = dateRange 
            ? projects.filter(p => p.createdAt >= dateRange.start && p.createdAt <= dateRange.end)
            : projects
          
          if (args.config.aggregation === "count") {
            return { value: filteredProjects.length, data: filteredProjects }
          } else if (args.config.aggregation === "sum" && args.config.field === "expectedRevenueGBP") {
            const total = filteredProjects.reduce((sum, p) => sum + decryptNumber(p.expectedRevenueGBP), 0)
            return { value: total, data: filteredProjects }
          }
          break
          
        case "tasks":
          const tasks = await ctx.db.query("tasks").collect()
          const filteredTasks = dateRange 
            ? tasks.filter(t => t.createdAt >= dateRange.start && t.createdAt <= dateRange.end)
            : tasks
          
          if (args.config.aggregation === "count") {
            return { value: filteredTasks.length, data: filteredTasks }
          }
          break
          
        case "contacts":
          const contacts = await ctx.db.query("contacts").collect()
          const filteredContacts = dateRange 
            ? contacts.filter(c => c.createdAt >= dateRange.start && c.createdAt <= dateRange.end)
            : contacts
          
          if (args.config.aggregation === "count") {
            return { value: filteredContacts.length, data: filteredContacts }
          }
          break
          
        default:
          return { value: 0, data: [] }
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      return { value: 0, data: [], error: "Failed to fetch data" }
    }
    
    return { value: 0, data: [] }
  },
})