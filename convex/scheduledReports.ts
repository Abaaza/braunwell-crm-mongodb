import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { Id } from "./_generated/dataModel"

export const list = query({
  args: {
    userId: v.id("users"),
    dashboardId: v.optional(v.id("dashboards")),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let reports = await ctx.db
      .query("scheduledReports")
      .withIndex("by_creator", (q) => q.eq("createdBy", args.userId))
      .collect()
    
    if (args.dashboardId) {
      reports = reports.filter(r => r.dashboardId === args.dashboardId)
    }
    
    if (args.isActive !== undefined) {
      reports = reports.filter(r => r.isActive === args.isActive)
    }
    
    // Get dashboard info
    const reportsWithDashboard = await Promise.all(
      reports.map(async (report) => {
        const dashboard = await ctx.db.get(report.dashboardId)
        return {
          ...report,
          dashboardName: dashboard?.name || "Unknown Dashboard",
        }
      })
    )
    
    return reportsWithDashboard.sort((a, b) => b.createdAt - a.createdAt)
  },
})

export const get = query({
  args: { id: v.id("scheduledReports") },
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.id)
    if (!report) return null
    
    const dashboard = await ctx.db.get(report.dashboardId)
    return {
      ...report,
      dashboardName: dashboard?.name || "Unknown Dashboard",
    }
  },
})

export const getDue = query({
  args: {
    maxNextSendTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const maxTime = args.maxNextSendTime || Date.now()
    
    const dueReports = await ctx.db
      .query("scheduledReports")
      .withIndex("by_next_send", (q) => q.lte("nextSendAt", maxTime))
      .collect()
    
    const activeReports = dueReports.filter(r => r.isActive)
    
    // Get dashboard info
    const reportsWithDashboard = await Promise.all(
      activeReports.map(async (report) => {
        const dashboard = await ctx.db.get(report.dashboardId)
        return {
          ...report,
          dashboardName: dashboard?.name || "Unknown Dashboard",
        }
      })
    )
    
    return reportsWithDashboard
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    dashboardId: v.id("dashboards"),
    schedule: v.object({
      frequency: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"), v.literal("quarterly")),
      dayOfWeek: v.optional(v.number()),
      dayOfMonth: v.optional(v.number()),
      time: v.string(),
      timezone: v.string(),
    }),
    recipients: v.array(v.object({
      email: v.string(),
      name: v.optional(v.string()),
      type: v.union(v.literal("user"), v.literal("external")),
    })),
    format: v.union(v.literal("pdf"), v.literal("excel"), v.literal("csv")),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    
    // Calculate next send time
    const nextSendAt = calculateNextSendTime(args.schedule, now)
    
    const reportId = await ctx.db.insert("scheduledReports", {
      name: args.name,
      description: args.description,
      dashboardId: args.dashboardId,
      schedule: args.schedule,
      recipients: args.recipients,
      format: args.format,
      isActive: true,
      nextSendAt,
      errorCount: 0,
      createdBy: args.userId,
      createdAt: now,
      updatedAt: now,
    })
    
    // Log creation
    await ctx.db.insert("auditLogs", {
      action: "created",
      entityType: "scheduledReports",
      entityId: reportId,
      userId: args.userId,
      timestamp: now,
    })
    
    return reportId
  },
})

export const update = mutation({
  args: {
    id: v.id("scheduledReports"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    schedule: v.optional(v.object({
      frequency: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"), v.literal("quarterly")),
      dayOfWeek: v.optional(v.number()),
      dayOfMonth: v.optional(v.number()),
      time: v.string(),
      timezone: v.string(),
    })),
    recipients: v.optional(v.array(v.object({
      email: v.string(),
      name: v.optional(v.string()),
      type: v.union(v.literal("user"), v.literal("external")),
    }))),
    format: v.optional(v.union(v.literal("pdf"), v.literal("excel"), v.literal("csv"))),
    isActive: v.optional(v.boolean()),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { id, userId, ...updates } = args
    
    const existing = await ctx.db.get(id)
    if (!existing) throw new Error("Scheduled report not found")
    
    // Check if user owns the report
    if (existing.createdBy !== userId) {
      throw new Error("You can only edit your own scheduled reports")
    }
    
    // Recalculate next send time if schedule changed
    let nextSendAt = existing.nextSendAt
    if (updates.schedule) {
      nextSendAt = calculateNextSendTime(updates.schedule, Date.now())
    }
    
    await ctx.db.patch(id, {
      ...updates,
      nextSendAt,
      updatedAt: Date.now(),
    })
    
    // Log update
    await ctx.db.insert("auditLogs", {
      action: "updated",
      entityType: "scheduledReports",
      entityId: id,
      userId,
      timestamp: Date.now(),
    })
    
    return id
  },
})

export const remove = mutation({
  args: {
    id: v.id("scheduledReports"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.id)
    if (!report) throw new Error("Scheduled report not found")
    
    // Check if user owns the report
    if (report.createdBy !== args.userId) {
      throw new Error("You can only delete your own scheduled reports")
    }
    
    await ctx.db.delete(args.id)
    
    // Log deletion
    await ctx.db.insert("auditLogs", {
      action: "deleted",
      entityType: "scheduledReports",
      entityId: args.id,
      userId: args.userId,
      changes: JSON.stringify({ name: report.name }),
      timestamp: Date.now(),
    })
  },
})

export const markAsSent = mutation({
  args: {
    id: v.id("scheduledReports"),
    success: v.boolean(),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.id)
    if (!report) throw new Error("Scheduled report not found")
    
    const now = Date.now()
    const nextSendAt = calculateNextSendTime(report.schedule, now)
    
    const updates: any = {
      lastSentAt: now,
      nextSendAt,
      updatedAt: now,
    }
    
    if (args.success) {
      updates.errorCount = 0
      updates.lastError = undefined
    } else {
      updates.errorCount = (report.errorCount || 0) + 1
      updates.lastError = args.errorMessage
      
      // Disable after 5 consecutive errors
      if (updates.errorCount >= 5) {
        updates.isActive = false
      }
    }
    
    await ctx.db.patch(args.id, updates)
    
    return args.id
  },
})

export const toggleActive = mutation({
  args: {
    id: v.id("scheduledReports"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.id)
    if (!report) throw new Error("Scheduled report not found")
    
    // Check if user owns the report
    if (report.createdBy !== args.userId) {
      throw new Error("You can only modify your own scheduled reports")
    }
    
    const newActiveState = !report.isActive
    const updates: any = {
      isActive: newActiveState,
      updatedAt: Date.now(),
    }
    
    // Reset error count when reactivating
    if (newActiveState) {
      updates.errorCount = 0
      updates.lastError = undefined
      updates.nextSendAt = calculateNextSendTime(report.schedule, Date.now())
    }
    
    await ctx.db.patch(args.id, updates)
    
    return args.id
  },
})

// Helper function to calculate next send time
function calculateNextSendTime(
  schedule: {
    frequency: "daily" | "weekly" | "monthly" | "quarterly"
    dayOfWeek?: number
    dayOfMonth?: number
    time: string
    timezone: string
  },
  fromTime: number
): number {
  const [hours, minutes] = schedule.time.split(':').map(Number)
  const now = new Date(fromTime)
  
  // For simplicity, we'll use UTC time calculations
  // In a real implementation, you'd want to handle timezones properly
  
  let nextSend = new Date(now)
  nextSend.setHours(hours, minutes, 0, 0)
  
  // If the time has passed today, move to tomorrow
  if (nextSend.getTime() <= now.getTime()) {
    nextSend.setDate(nextSend.getDate() + 1)
  }
  
  switch (schedule.frequency) {
    case "daily":
      // Already set to next day if needed
      break
      
    case "weekly":
      const targetDay = schedule.dayOfWeek || 0 // Default to Sunday
      const currentDay = nextSend.getDay()
      const daysUntilTarget = (targetDay - currentDay + 7) % 7
      if (daysUntilTarget === 0 && nextSend.getTime() <= now.getTime()) {
        nextSend.setDate(nextSend.getDate() + 7)
      } else {
        nextSend.setDate(nextSend.getDate() + daysUntilTarget)
      }
      break
      
    case "monthly":
      const targetDate = schedule.dayOfMonth || 1
      nextSend.setDate(targetDate)
      if (nextSend.getTime() <= now.getTime()) {
        nextSend.setMonth(nextSend.getMonth() + 1)
        nextSend.setDate(targetDate)
      }
      break
      
    case "quarterly":
      const targetDateQ = schedule.dayOfMonth || 1
      const currentMonth = nextSend.getMonth()
      const nextQuarterMonth = Math.floor(currentMonth / 3) * 3 + 3
      nextSend.setMonth(nextQuarterMonth)
      nextSend.setDate(targetDateQ)
      if (nextSend.getTime() <= now.getTime()) {
        nextSend.setMonth(nextQuarterMonth + 3)
        nextSend.setDate(targetDateQ)
      }
      break
  }
  
  return nextSend.getTime()
}