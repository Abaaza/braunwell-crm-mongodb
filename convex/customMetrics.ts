import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { Id } from "./_generated/dataModel"

export const list = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get metrics created by user or public metrics
    const metrics = await ctx.db
      .query("customMetrics")
      .collect()
    
    const userMetrics = metrics.filter(m => 
      m.createdBy === args.userId || m.isPublic
    )
    
    // Get creator info
    const metricsWithCreator = await Promise.all(
      userMetrics.map(async (metric) => {
        const creator = await ctx.db.get(metric.createdBy)
        return {
          ...metric,
          creatorName: creator?.name || "Unknown",
        }
      })
    )
    
    return metricsWithCreator
  },
})

export const get = query({
  args: { id: v.id("customMetrics") },
  handler: async (ctx, args) => {
    const metric = await ctx.db.get(args.id)
    if (!metric) return null
    
    const creator = await ctx.db.get(metric.createdBy)
    return {
      ...metric,
      creatorName: creator?.name || "Unknown",
    }
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    dataSource: v.union(v.literal("projects"), v.literal("tasks"), v.literal("contacts"), v.literal("payments")),
    aggregation: v.union(v.literal("count"), v.literal("sum"), v.literal("average"), v.literal("min"), v.literal("max")),
    field: v.optional(v.string()),
    filters: v.array(v.object({
      field: v.string(),
      operator: v.union(v.literal("equals"), v.literal("not_equals"), v.literal("greater_than"), v.literal("less_than"), v.literal("contains")),
      value: v.string(),
    })),
    groupBy: v.optional(v.string()),
    chartType: v.optional(v.union(v.literal("number"), v.literal("line"), v.literal("bar"), v.literal("pie"), v.literal("donut"))),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    isPublic: v.boolean(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    
    const metricId = await ctx.db.insert("customMetrics", {
      name: args.name,
      description: args.description,
      dataSource: args.dataSource,
      aggregation: args.aggregation,
      field: args.field,
      filters: args.filters,
      groupBy: args.groupBy,
      chartType: args.chartType || "number",
      color: args.color || "blue",
      icon: args.icon || "BarChart3",
      isPublic: args.isPublic,
      createdBy: args.userId,
      createdAt: now,
      updatedAt: now,
    })
    
    // Log creation
    await ctx.db.insert("auditLogs", {
      action: "created",
      entityType: "customMetrics",
      entityId: metricId,
      userId: args.userId,
      timestamp: now,
    })
    
    return metricId
  },
})

export const update = mutation({
  args: {
    id: v.id("customMetrics"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    dataSource: v.optional(v.union(v.literal("projects"), v.literal("tasks"), v.literal("contacts"), v.literal("payments"))),
    aggregation: v.optional(v.union(v.literal("count"), v.literal("sum"), v.literal("average"), v.literal("min"), v.literal("max"))),
    field: v.optional(v.string()),
    filters: v.optional(v.array(v.object({
      field: v.string(),
      operator: v.union(v.literal("equals"), v.literal("not_equals"), v.literal("greater_than"), v.literal("less_than"), v.literal("contains")),
      value: v.string(),
    }))),
    groupBy: v.optional(v.string()),
    chartType: v.optional(v.union(v.literal("number"), v.literal("line"), v.literal("bar"), v.literal("pie"), v.literal("donut"))),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { id, userId, ...updates } = args
    
    const existing = await ctx.db.get(id)
    if (!existing) throw new Error("Metric not found")
    
    // Check if user owns the metric
    if (existing.createdBy !== userId) {
      throw new Error("You can only edit your own metrics")
    }
    
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    })
    
    // Log update
    await ctx.db.insert("auditLogs", {
      action: "updated",
      entityType: "customMetrics",
      entityId: id,
      userId,
      timestamp: Date.now(),
    })
    
    return id
  },
})

export const remove = mutation({
  args: {
    id: v.id("customMetrics"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const metric = await ctx.db.get(args.id)
    if (!metric) throw new Error("Metric not found")
    
    // Check if user owns the metric
    if (metric.createdBy !== args.userId) {
      throw new Error("You can only delete your own metrics")
    }
    
    await ctx.db.delete(args.id)
    
    // Log deletion
    await ctx.db.insert("auditLogs", {
      action: "deleted",
      entityType: "customMetrics",
      entityId: args.id,
      userId: args.userId,
      changes: JSON.stringify({ name: metric.name }),
      timestamp: Date.now(),
    })
  },
})

export const calculate = query({
  args: {
    metricId: v.id("customMetrics"),
    dateRange: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const metric = await ctx.db.get(args.metricId)
    if (!metric) throw new Error("Metric not found")
    
    // Get data based on data source
    let data: any[] = []
    switch (metric.dataSource) {
      case "projects":
        data = await ctx.db.query("projects").collect()
        break
      case "tasks":
        data = await ctx.db.query("tasks").collect()
        break
      case "contacts":
        data = await ctx.db.query("contacts").collect()
        break
      case "payments":
        data = await ctx.db.query("projectPayments").collect()
        break
    }
    
    // Apply filters
    if (metric.filters.length > 0) {
      data = data.filter(item => {
        return metric.filters.every(filter => {
          const fieldValue = item[filter.field]
          const filterValue = filter.value
          
          switch (filter.operator) {
            case "equals":
              return String(fieldValue) === filterValue
            case "not_equals":
              return String(fieldValue) !== filterValue
            case "greater_than":
              return Number(fieldValue) > Number(filterValue)
            case "less_than":
              return Number(fieldValue) < Number(filterValue)
            case "contains":
              return String(fieldValue).toLowerCase().includes(filterValue.toLowerCase())
            default:
              return true
          }
        })
      })
    }
    
    // Apply date range filter if specified
    if (args.dateRange) {
      const now = Date.now()
      let startDate: number
      
      switch (args.dateRange) {
        case "last7days":
          startDate = now - 7 * 24 * 60 * 60 * 1000
          break
        case "last30days":
          startDate = now - 30 * 24 * 60 * 60 * 1000
          break
        case "last90days":
          startDate = now - 90 * 24 * 60 * 60 * 1000
          break
        case "lastyear":
          startDate = now - 365 * 24 * 60 * 60 * 1000
          break
        default:
          startDate = 0
      }
      
      const dateField = metric.dataSource === "payments" ? "date" : "createdAt"
      data = data.filter(item => item[dateField] >= startDate)
    }
    
    // Calculate result based on aggregation
    let result: number | Record<string, number> = 0
    
    if (metric.groupBy) {
      // Group by field and calculate for each group
      const groups: Record<string, any[]> = {}
      data.forEach(item => {
        const groupKey = String(item[metric.groupBy!] || "undefined")
        if (!groups[groupKey]) {
          groups[groupKey] = []
        }
        groups[groupKey].push(item)
      })
      
      const groupResults: Record<string, number> = {}
      for (const [groupKey, groupData] of Object.entries(groups)) {
        groupResults[groupKey] = calculateAggregation(groupData, metric.aggregation, metric.field)
      }
      result = groupResults
    } else {
      result = calculateAggregation(data, metric.aggregation, metric.field)
    }
    
    return {
      metric,
      result,
      dataCount: data.length,
    }
  },
})

// Helper function to calculate aggregation
function calculateAggregation(data: any[], aggregation: string, field?: string): number {
  if (data.length === 0) return 0
  
  switch (aggregation) {
    case "count":
      return data.length
    case "sum":
      if (!field) return 0
      return data.reduce((sum, item) => sum + (Number(item[field]) || 0), 0)
    case "average":
      if (!field) return 0
      const total = data.reduce((sum, item) => sum + (Number(item[field]) || 0), 0)
      return total / data.length
    case "min":
      if (!field) return 0
      return Math.min(...data.map(item => Number(item[field]) || 0))
    case "max":
      if (!field) return 0
      return Math.max(...data.map(item => Number(item[field]) || 0))
    default:
      return 0
  }
}