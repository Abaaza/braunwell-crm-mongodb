import { v } from "convex/values"
import { query } from "./_generated/server"

export const getUserActivity = query({
  args: { 
    userId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50
    
    let query = ctx.db.query("auditLogs").order("desc")
    
    if (args.userId) {
      query = query.filter(q => q.eq(q.field("userId"), args.userId))
    }
    
    const logs = await query.take(limit)
    
    // Get user details for each log
    const logsWithDetails = await Promise.all(
      logs.map(async (log) => {
        const user = await ctx.db.get(log.userId)
        
        // Parse entity details based on type
        let entityDetails: any = {}
        try {
          switch (log.entityType) {
            case "projects":
              const project = await ctx.db.get(log.entityId as any)
              entityDetails = project && 'name' in project ? { name: project.name } : { name: "Deleted Project" }
              break
            case "contacts":
              const contact = await ctx.db.get(log.entityId as any)
              entityDetails = contact && 'name' in contact ? { name: contact.name } : { name: "Deleted Contact" }
              break
            case "tasks":
              const task = await ctx.db.get(log.entityId as any)
              entityDetails = task && 'title' in task ? { name: task.title } : { name: "Deleted Task" }
              break
            case "users":
              const targetUser = await ctx.db.get(log.entityId as any)
              entityDetails = targetUser && 'name' in targetUser ? { name: targetUser.name } : { name: "Deleted User" }
              break
            default:
              entityDetails = { name: log.entityId }
          }
        } catch (error) {
          entityDetails = { name: log.entityId }
        }
        
        return {
          ...log,
          userName: user?.name || "Unknown User",
          userEmail: user?.email,
          entityDetails,
        }
      })
    )
    
    return logsWithDetails
  },
})

export const getActivitySummary = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const now = Date.now()
    const oneDayAgo = now - 24 * 60 * 60 * 1000
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000
    
    let query = ctx.db.query("auditLogs")
    
    if (args.userId) {
      query = query.filter(q => q.eq(q.field("userId"), args.userId))
    }
    
    const allLogs = await query.collect()
    
    const summary = {
      total: allLogs.length,
      today: allLogs.filter(log => log.timestamp > oneDayAgo).length,
      thisWeek: allLogs.filter(log => log.timestamp > oneWeekAgo).length,
      thisMonth: allLogs.filter(log => log.timestamp > oneMonthAgo).length,
      byAction: {} as Record<string, number>,
      byEntity: {} as Record<string, number>,
    }
    
    // Count by action type
    allLogs.forEach(log => {
      summary.byAction[log.action] = (summary.byAction[log.action] || 0) + 1
      summary.byEntity[log.entityType] = (summary.byEntity[log.entityType] || 0) + 1
    })
    
    return summary
  },
})

export const getUserActivityStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)
    if (!user) throw new Error("User not found")
    
    // Get counts of created entities
    const [projects, contacts, tasks] = await Promise.all([
      ctx.db.query("projects").filter(q => q.eq(q.field("createdBy"), args.userId)).collect(),
      ctx.db.query("contacts").filter(q => q.eq(q.field("createdBy"), args.userId)).collect(),
      ctx.db.query("tasks").filter(q => q.eq(q.field("createdBy"), args.userId)).collect(),
    ])
    
    // Get recent activity
    const recentLogs = await ctx.db
      .query("auditLogs")
      .filter(q => q.eq(q.field("userId"), args.userId))
      .order("desc")
      .take(10)
    
    return {
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      },
      stats: {
        projectsCreated: projects.length,
        contactsCreated: contacts.length,
        tasksCreated: tasks.length,
        totalActions: recentLogs.length,
      },
      recentActivity: recentLogs,
    }
  },
})