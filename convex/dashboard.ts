import { query } from "./_generated/server"
import { v } from "convex/values"
import { decryptNumber } from "./lib/encryption"

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const [projects, tasks, contacts] = await Promise.all([
      ctx.db.query("projects").collect(),
      ctx.db.query("tasks").collect(),
      ctx.db.query("contacts").collect(),
    ])

    const openProjects = projects.filter(p => p.status === "open")
    const activeTasks = tasks.filter(t => t.status !== "done")
    const totalRevenue = projects.reduce((sum, p) => sum + decryptNumber(p.expectedRevenueGBP), 0)
    
    // Calculate recent contacts (last 7 days)
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    const recentContacts = contacts.filter(c => c.createdAt > sevenDaysAgo)

    return {
      totalProjects: projects.length,
      openProjects: openProjects.length,
      activeTasks: activeTasks.length,
      totalRevenue,
      recentContactsCount: recentContacts.length,
    }
  },
})

export const getRecentActivity = query({
  args: {},
  handler: async (ctx) => {
    const logs = await ctx.db
      .query("auditLogs")
      .order("desc")
      .take(5)

    const activitiesWithUsers = await Promise.all(
      logs.map(async (log) => {
        const user = await ctx.db.get(log.userId)
        return {
          ...log,
          userName: user?.name || "Unknown",
        }
      })
    )

    return activitiesWithUsers
  },
})

export const getRecentContacts = query({
  args: {},
  handler: async (ctx) => {
    const contacts = await ctx.db
      .query("contacts")
      .order("desc")
      .take(5)

    return contacts
  },
})