import { v } from "convex/values"
import { query, mutation, internalMutation } from "./_generated/server"
import { Id } from "./_generated/dataModel"
import { internal } from "./_generated/api"

export const list = query({
  args: {
    search: v.optional(v.string()),
    entityType: v.optional(v.string()),
    action: v.optional(v.string()),
    userId: v.optional(v.id("users")),
    dateRange: v.string(),
    page: v.number(),
    pageSize: v.number(),
    severity: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical"))),
    category: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    minRiskScore: v.optional(v.number()),
    includeSystemActions: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    let startDate: number
    
    // Calculate date range
    switch (args.dateRange) {
      case 'today':
        startDate = new Date().setHours(0, 0, 0, 0)
        break
      case 'yesterday':
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        startDate = yesterday.setHours(0, 0, 0, 0)
        break
      case 'last7days':
        startDate = now - 7 * 24 * 60 * 60 * 1000
        break
      case 'last30days':
        startDate = now - 30 * 24 * 60 * 60 * 1000
        break
      case 'last90days':
        startDate = now - 90 * 24 * 60 * 60 * 1000
        break
      default:
        startDate = now - 7 * 24 * 60 * 60 * 1000
    }
    
    // Get all logs - we'll filter in memory since we can't chain multiple indexes
    let allLogs = await ctx.db.query("auditLogs")
      .order("desc")
      .collect()
    
    // Apply filters
    if (args.entityType) {
      allLogs = allLogs.filter(log => log.entityType === args.entityType)
    }
    
    if (args.userId) {
      allLogs = allLogs.filter(log => log.userId === args.userId)
    }
    
    // Filter by date
    allLogs = allLogs.filter(log => log.timestamp >= startDate)
    
    // Filter by action
    if (args.action) {
      allLogs = allLogs.filter(log => log.action === args.action)
    }
    
    // Filter by severity
    if (args.severity) {
      allLogs = allLogs.filter(log => log.severity === args.severity)
    }
    
    // Filter by category
    if (args.category) {
      allLogs = allLogs.filter(log => log.category === args.category)
    }
    
    // Filter by IP address
    if (args.ipAddress) {
      allLogs = allLogs.filter(log => log.ipAddress === args.ipAddress)
    }
    
    // Filter by minimum risk score
    if (args.minRiskScore !== undefined) {
      const minScore = args.minRiskScore
      allLogs = allLogs.filter(log => log.riskScore && log.riskScore >= minScore)
    }
    
    // Filter out system actions unless explicitly requested
    if (!args.includeSystemActions) {
      allLogs = allLogs.filter(log => log.userId !== "system")
    }
    
    // Search filter
    if (args.search) {
      const search = args.search
      const searchLower = search.toLowerCase()
      allLogs = allLogs.filter(log => 
        log.entityId.toLowerCase().includes(searchLower) ||
        log.action.toLowerCase().includes(searchLower) ||
        log.entityType.toLowerCase().includes(searchLower) ||
        (log.changes && log.changes.toLowerCase().includes(searchLower)) ||
        (log.description && log.description.toLowerCase().includes(searchLower)) ||
        (log.ipAddress && log.ipAddress.includes(search)) ||
        (log.category && log.category.toLowerCase().includes(searchLower))
      )
    }
    
    // Calculate pagination
    const totalCount = allLogs.length
    const totalPages = Math.ceil(totalCount / args.pageSize)
    const startIndex = args.page * args.pageSize
    const endIndex = startIndex + args.pageSize
    
    // Get page of logs
    const pagedLogs = allLogs.slice(startIndex, endIndex)
    
    // Enrich logs with user information
    const enrichedLogs = await Promise.all(
      pagedLogs.map(async (log) => {
        const user = log.userId === "system" ? null : await ctx.db.get(log.userId)
        return {
          ...log,
          userName: user?.name || (log.userId === "system" ? "System" : "Unknown User"),
          userEmail: user?.email || "",
        }
      })
    )
    
    return {
      logs: enrichedLogs,
      totalCount,
      totalPages,
      currentPage: args.page,
    }
  },
})

export const getStats = query({
  handler: async (ctx) => {
    const now = Date.now()
    const today = new Date().setHours(0, 0, 0, 0)
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000
    
    const allLogs = await ctx.db.query("auditLogs").collect()
    
    // Calculate stats
    const todayLogs = allLogs.filter(log => log.timestamp >= today)
    const weekLogs = allLogs.filter(log => log.timestamp >= sevenDaysAgo)
    
    // Group by action
    const actionCounts = allLogs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // Group by entity type
    const entityCounts = allLogs.reduce((acc, log) => {
      acc[log.entityType] = (acc[log.entityType] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // Security metrics
    const failedActions = allLogs.filter(log => log.successful === false)
    const highRiskActions = allLogs.filter(log => log.riskScore && log.riskScore > 70)
    const criticalSeverityLogs = allLogs.filter(log => log.severity === "critical")
    
    // IP address analysis
    const uniqueIPs = new Set(allLogs.map(log => log.ipAddress).filter(Boolean))
    const ipCounts = allLogs.reduce((acc, log) => {
      if (log.ipAddress) {
        acc[log.ipAddress] = (acc[log.ipAddress] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)
    
    return {
      totalLogs: allLogs.length,
      todayCount: todayLogs.length,
      weekCount: weekLogs.length,
      actionCounts,
      entityCounts,
      securityMetrics: {
        failedActions: failedActions.length,
        highRiskActions: highRiskActions.length,
        criticalSeverityLogs: criticalSeverityLogs.length,
        uniqueIPs: uniqueIPs.size,
        topIPs: Object.entries(ipCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .map(([ip, count]) => ({ ip, count }))
      }
    }
  },
})

// Enhanced audit logging function
export const logAuditEvent = internalMutation({
  args: {
    action: v.string(),
    entityType: v.string(),
    entityId: v.string(),
    userId: v.id("users"),
    changes: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    sessionId: v.optional(v.string()),
    severity: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical"))),
    category: v.optional(v.string()),
    description: v.optional(v.string()),
    metadata: v.optional(v.string()),
    successful: v.optional(v.boolean()),
    errorMessage: v.optional(v.string()),
    affectedRecords: v.optional(v.number()),
    dataClassification: v.optional(v.union(v.literal("public"), v.literal("internal"), v.literal("confidential"), v.literal("restricted"))),
  },
  handler: async (ctx, args) => {
    // Calculate risk score based on action and entity type
    const riskScore = calculateRiskScore(args.action, args.entityType, args.severity)
    
    const auditEntry = {
      ...args,
      timestamp: Date.now(),
      riskScore,
      successful: args.successful ?? true,
    }
    
    return await ctx.db.insert("auditLogs", auditEntry)
  },
})

// Helper function to calculate risk score
function calculateRiskScore(action: string, entityType: string, severity?: string): number {
  let score = 0
  
  // Base score by action
  const actionScores: Record<string, number> = {
    created: 10,
    updated: 15,
    deleted: 30,
    viewed: 5,
    login: 10,
    logout: 5,
    export: 25,
    import: 35,
    backup: 40,
    restore: 50,
    permission_change: 45,
    password_change: 20,
    failed_login: 15,
    bulk_delete: 60,
    bulk_update: 40,
    admin_action: 30,
  }
  
  score += actionScores[action] || 10
  
  // Entity type multiplier
  const entityMultipliers: Record<string, number> = {
    users: 2.0,
    settings: 1.8,
    permissions: 2.5,
    projects: 1.5,
    contacts: 1.3,
    tasks: 1.0,
    auditLogs: 2.0,
  }
  
  score *= entityMultipliers[entityType] || 1.0
  
  // Severity multiplier
  const severityMultipliers: Record<string, number> = {
    low: 0.5,
    medium: 1.0,
    high: 1.5,
    critical: 2.0,
  }
  
  if (severity) {
    score *= severityMultipliers[severity] || 1.0
  }
  
  return Math.min(Math.round(score), 100)
}

// Get security alerts based on recent activity
export const getSecurityAlerts = query({
  handler: async (ctx) => {
    const now = Date.now()
    const last24Hours = now - 24 * 60 * 60 * 1000
    
    const recentLogs = await ctx.db
      .query("auditLogs")
      .withIndex("by_timestamp", (q) => q.gte("timestamp", last24Hours))
      .collect()
    
    const alerts = []
    
    // Multiple failed login attempts
    const failedLogins = recentLogs.filter(log => 
      log.action === "failed_login" && log.successful === false
    )
    const groupedByUser = failedLogins.reduce((acc, log) => {
      acc[log.userId] = (acc[log.userId] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    for (const [userId, count] of Object.entries(groupedByUser)) {
      if (count >= 5) {
        alerts.push({
          type: "multiple_failed_logins",
          severity: "high",
          message: `${count} failed login attempts detected for user ${userId}`,
          timestamp: now,
        })
      }
    }
    
    // Suspicious IP activity
    const ipActivity = recentLogs.reduce((acc, log) => {
      if (log.ipAddress) {
        if (!acc[log.ipAddress]) {
          acc[log.ipAddress] = { count: 0, users: new Set() }
        }
        acc[log.ipAddress].count++
        acc[log.ipAddress].users.add(log.userId)
      }
      return acc
    }, {} as Record<string, { count: number, users: Set<string> }>)
    
    for (const [ip, activity] of Object.entries(ipActivity)) {
      if (activity.count > 100) {
        alerts.push({
          type: "high_activity_ip",
          severity: "medium",
          message: `High activity detected from IP ${ip}: ${activity.count} actions`,
          timestamp: now,
        })
      }
      
      if (activity.users.size > 3) {
        alerts.push({
          type: "multiple_users_same_ip",
          severity: "medium",
          message: `Multiple users (${activity.users.size}) detected from IP ${ip}`,
          timestamp: now,
        })
      }
    }
    
    // High-risk actions
    const highRiskActions = recentLogs.filter(log => log.riskScore && log.riskScore > 70)
    if (highRiskActions.length > 10) {
      alerts.push({
        type: "high_risk_activity",
        severity: "high",
        message: `${highRiskActions.length} high-risk actions detected in the last 24 hours`,
        timestamp: now,
      })
    }
    
    return alerts
  },
})

// Data retention cleanup
export const cleanupOldLogs = internalMutation({
  args: {
    retentionDays: v.number(),
  },
  handler: async (ctx, args) => {
    const cutoffDate = Date.now() - (args.retentionDays * 24 * 60 * 60 * 1000)
    
    // Get old logs
    const oldLogs = await ctx.db
      .query("auditLogs")
      .withIndex("by_timestamp", (q) => q.lt("timestamp", cutoffDate))
      .collect()
    
    // Delete in batches to avoid timeout
    const batchSize = 100
    let deletedCount = 0
    
    for (let i = 0; i < oldLogs.length; i += batchSize) {
      const batch = oldLogs.slice(i, i + batchSize)
      await Promise.all(batch.map(log => ctx.db.delete(log._id)))
      deletedCount += batch.length
    }
    
    // Log the cleanup action
    await ctx.db.insert("auditLogs", {
      action: "cleanup",
      entityType: "auditLogs",
      entityId: "system",
      userId: "system" as Id<"users">, // This will need proper system user handling
      timestamp: Date.now(),
      description: `Cleaned up ${deletedCount} old audit logs older than ${args.retentionDays} days`,
      category: "maintenance",
      severity: "low",
      successful: true,
      affectedRecords: deletedCount,
    })
    
    return { deletedCount }
  },
})

// Export audit logs for compliance
export const exportLogs = mutation({
  args: {
    startDate: v.number(),
    endDate: v.number(),
    entityType: v.optional(v.string()),
    userId: v.optional(v.id("users")),
    format: v.optional(v.union(v.literal("json"), v.literal("csv"))),
  },
  handler: async (ctx, args) => {
    const { startDate, endDate, entityType, userId, format = "json" } = args
    
    // Get logs within date range
    let logs = await ctx.db
      .query("auditLogs")
      .withIndex("by_timestamp", (q) => 
        q.gte("timestamp", startDate).lte("timestamp", endDate)
      )
      .collect()
    
    // Apply filters
    if (entityType) {
      logs = logs.filter(log => log.entityType === entityType)
    }
    
    if (userId) {
      logs = logs.filter(log => log.userId === userId)
    }
    
    // Enrich with user information
    const enrichedLogs = await Promise.all(
      logs.map(async (log) => {
        const user = await ctx.db.get(log.userId)
        return {
          ...log,
          userName: user?.name || "Unknown User",
          userEmail: user?.email || "",
        }
      })
    )
    
    // Log the export action
    await ctx.db.insert("auditLogs", {
      action: "export",
      entityType: "auditLogs",
      entityId: "system",
      userId: userId || ("system" as Id<"users">),
      timestamp: Date.now(),
      description: `Exported ${enrichedLogs.length} audit logs`,
      category: "data_access",
      severity: "medium",
      successful: true,
      affectedRecords: enrichedLogs.length,
      metadata: JSON.stringify({
        startDate,
        endDate,
        entityType,
        format,
      }),
    })
    
    return {
      logs: enrichedLogs,
      count: enrichedLogs.length,
      format,
    }
  },
})
// Daily cleanup cron job
export const dailyCleanup = internalMutation({
  handler: async (ctx) => {
    // Get retention policy from settings
    const settings = await ctx.db.query("securitySettings").first()
    const retentionDays = settings?.auditLogRetentionDays || 365 // Default to 1 year
    
    // Run cleanup
    // Run cleanup inline since we can't call internal mutations from mutations
    const cutoffDate = Date.now() - (retentionDays * 24 * 60 * 60 * 1000)
    
    // Get old logs
    const oldLogs = await ctx.db
      .query("auditLogs")
      .filter((q) => q.lt(q.field("timestamp"), cutoffDate))
      .collect()
    
    // Delete old logs
    let deletedCount = 0
    for (const log of oldLogs) {
      await ctx.db.delete(log._id)
      deletedCount++
    }
    
    const result = { deletedCount }
    
    // Log the cleanup operation
    await ctx.db.insert("auditLogs", {
      action: "daily_cleanup",
      entityType: "system",
      entityId: "cron_job",
      userId: "system" as any,
      timestamp: Date.now(),
      description: `Daily audit log cleanup completed: ${result.deletedCount} logs deleted`,
      category: "maintenance",
      severity: "low",
      successful: true,
      affectedRecords: result.deletedCount,
    })
    
    return result
  },
})

// Manual cleanup function for administrators
export const manualCleanup = mutation({
  args: {
    retentionDays: v.number(),
    dryRun: v.optional(v.boolean()),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { retentionDays, dryRun = false, userId } = args
    
    // Check if user has admin permissions
    const user = await ctx.db.get(userId)
    if (!user || user.role !== "admin") {
      throw new Error("Only administrators can perform manual cleanup")
    }
    
    const cutoffDate = Date.now() - (retentionDays * 24 * 60 * 60 * 1000)
    
    // Get old logs
    const oldLogs = await ctx.db
      .query("auditLogs")
      .withIndex("by_timestamp", (q) => q.lt("timestamp", cutoffDate))
      .collect()
    
    let deletedCount = 0
    
    if (!dryRun) {
      // Delete in batches to avoid timeout
      const batchSize = 100
      for (let i = 0; i < oldLogs.length; i += batchSize) {
        const batch = oldLogs.slice(i, i + batchSize)
        await Promise.all(batch.map(log => ctx.db.delete(log._id)))
        deletedCount += batch.length
      }
      
      // Log the manual cleanup action
      await ctx.db.insert("auditLogs", {
        action: "manual_cleanup",
        entityType: "auditLogs",
        entityId: "admin_action",
        userId,
        timestamp: Date.now(),
        description: `Manual cleanup: ${deletedCount} logs deleted (retention: ${retentionDays} days)`,
        category: "maintenance",
        severity: "medium",
        successful: true,
        affectedRecords: deletedCount,
      })
    }
    
    return {
      wouldDelete: oldLogs.length,
      actuallyDeleted: deletedCount,
      dryRun,
      retentionDays,
    }
  },
})
