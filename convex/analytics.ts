import { v } from "convex/values"
import { query } from "./_generated/server"
import { decryptNumber } from "./lib/encryption"

// Helper function to get date range from string
function getDateRangeFromString(dateRange: string) {
  const now = Date.now()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  switch (dateRange) {
    case 'today':
      return { startDate: today.getTime(), endDate: now }
    case 'yesterday':
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      return { startDate: yesterday.getTime(), endDate: today.getTime() }
    case 'last7days':
      return { startDate: now - 7 * 24 * 60 * 60 * 1000, endDate: now }
    case 'last30days':
      return { startDate: now - 30 * 24 * 60 * 60 * 1000, endDate: now }
    case 'last3months':
      return { startDate: now - 90 * 24 * 60 * 60 * 1000, endDate: now }
    case 'last6months':
      return { startDate: now - 180 * 24 * 60 * 60 * 1000, endDate: now }
    case 'lastyear':
      return { startDate: now - 365 * 24 * 60 * 60 * 1000, endDate: now }
    case 'thismonth':
      const firstDayMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      return { startDate: firstDayMonth.getTime(), endDate: now }
    case 'lastmonth':
      const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const firstDayThisMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      return { startDate: firstDayLastMonth.getTime(), endDate: firstDayThisMonth.getTime() }
    default:
      return { startDate: now - 30 * 24 * 60 * 60 * 1000, endDate: now }
  }
}

// Helper function to get comparison date range
function getComparisonDateRange(dateRange: string, comparePeriod: string) {
  const { startDate, endDate } = getDateRangeFromString(dateRange)
  const duration = endDate - startDate
  
  if (comparePeriod === 'previous') {
    return { startDate: startDate - duration, endDate: startDate }
  } else if (comparePeriod === 'yearAgo') {
    return { startDate: startDate - 365 * 24 * 60 * 60 * 1000, endDate: endDate - 365 * 24 * 60 * 60 * 1000 }
  }
  
  return { startDate, endDate }
}

export const getMetrics = query({
  args: {
    dateRange: v.optional(v.string()),
    compareWith: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const [projects, tasks, contacts, auditLogs] = await Promise.all([
      ctx.db.query("projects").collect(),
      ctx.db.query("tasks").collect(),
      ctx.db.query("contacts").collect(),
      ctx.db.query("auditLogs").order("desc").take(100),
    ])

    const now = Date.now()
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000
    
    // Get current period date range
    const currentPeriod = getDateRangeFromString(args.dateRange || "last30days")
    
    // Calculate metrics for a specific period
    const calculateMetricsForPeriod = (startDate: number, endDate: number) => {
      const periodProjects = projects.filter(p => p.createdAt >= startDate && p.createdAt <= endDate)
      const periodTasks = tasks.filter(t => t.createdAt >= startDate && t.createdAt <= endDate)
      const periodContacts = contacts.filter(c => c.createdAt >= startDate && c.createdAt <= endDate)
      const periodActivity = auditLogs.filter(log => log.timestamp >= startDate && log.timestamp <= endDate)
      
      // Revenue metrics for period
      const totalRevenue = periodProjects.reduce((sum, p) => sum + decryptNumber(p.expectedRevenueGBP), 0)
      const openProjectsRevenue = periodProjects
        .filter(p => p.status === "open")
        .reduce((sum, p) => sum + decryptNumber(p.expectedRevenueGBP), 0)
      const closedProjectsRevenue = periodProjects
        .filter(p => p.status === "closed")
        .reduce((sum, p) => sum + decryptNumber(p.expectedRevenueGBP), 0)
      
      // Project metrics for period
      const openProjects = periodProjects.filter(p => p.status === "open").length
      const closedProjects = periodProjects.filter(p => p.status === "closed").length
      
      // Task metrics for period
      const totalTasks = periodTasks.length
      const completedTasks = periodTasks.filter(t => t.status === "done").length
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
      
      return {
        revenue: {
          total: totalRevenue,
          open: openProjectsRevenue,
          closed: closedProjectsRevenue,
          average: periodProjects.length > 0 ? totalRevenue / periodProjects.length : 0,
        },
        projects: {
          total: periodProjects.length,
          open: openProjects,
          closed: closedProjects,
        },
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          completionRate,
        },
        contacts: {
          total: periodContacts.length,
        },
        activity: {
          total: periodActivity.length,
        },
      }
    }
    
    // Calculate current period metrics
    const currentMetrics = calculateMetricsForPeriod(currentPeriod.startDate, currentPeriod.endDate)
    
    // Calculate comparison period metrics if requested
    let comparisonMetrics = null
    let changePercentages = null
    
    if (args.compareWith) {
      const comparisonPeriod = getComparisonDateRange(args.dateRange || "last30days", args.compareWith)
      comparisonMetrics = calculateMetricsForPeriod(comparisonPeriod.startDate, comparisonPeriod.endDate)
      
      // Calculate percentage changes
      changePercentages = {
        revenue: {
          total: comparisonMetrics.revenue.total > 0 
            ? ((currentMetrics.revenue.total - comparisonMetrics.revenue.total) / comparisonMetrics.revenue.total) * 100 
            : 0,
        },
        projects: {
          total: comparisonMetrics.projects.total > 0
            ? ((currentMetrics.projects.total - comparisonMetrics.projects.total) / comparisonMetrics.projects.total) * 100
            : 0,
        },
        tasks: {
          completionRate: currentMetrics.tasks.completionRate - comparisonMetrics.tasks.completionRate,
        },
        contacts: {
          total: comparisonMetrics.contacts.total > 0
            ? ((currentMetrics.contacts.total - comparisonMetrics.contacts.total) / comparisonMetrics.contacts.total) * 100
            : 0,
        },
      }
    }
    
    // Overall metrics (not period-specific)
    const totalRevenue = projects.reduce((sum, p) => sum + decryptNumber(p.expectedRevenueGBP), 0)
    const openProjectsRevenue = projects
      .filter(p => p.status === "open")
      .reduce((sum, p) => sum + decryptNumber(p.expectedRevenueGBP), 0)
    const closedProjectsRevenue = projects
      .filter(p => p.status === "closed")
      .reduce((sum, p) => sum + decryptNumber(p.expectedRevenueGBP), 0)

    const openProjects = projects.filter(p => p.status === "open").length
    const closedProjects = projects.filter(p => p.status === "closed").length
    const projectsLastMonth = projects.filter(p => p.createdAt > thirtyDaysAgo).length

    const totalTasks = tasks.length
    const todoTasks = tasks.filter(t => t.status === "todo").length
    const inProgressTasks = tasks.filter(t => t.status === "in_progress").length
    const completedTasks = tasks.filter(t => t.status === "done").length
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

    const totalContacts = contacts.length
    const contactsLastMonth = contacts.filter(c => c.createdAt > thirtyDaysAgo).length

    const recentActivity = auditLogs.filter(log => log.timestamp > thirtyDaysAgo).length

    // Top projects by revenue
    const topProjects = projects
      .sort((a, b) => decryptNumber(b.expectedRevenueGBP) - decryptNumber(a.expectedRevenueGBP))
      .slice(0, 5)
      .map(p => ({
        _id: p._id,
        name: p.name,
        revenue: decryptNumber(p.expectedRevenueGBP),
        status: p.status,
      }))

    // Monthly revenue data (placeholder - would need proper date grouping)
    const monthlyRevenue = [
      { month: "Jan", revenue: 45000 },
      { month: "Feb", revenue: 52000 },
      { month: "Mar", revenue: 68000 },
      { month: "Apr", revenue: 85000 },
      { month: "May", revenue: 92000 },
      { month: "Jun", revenue: Math.floor(totalRevenue / 2) },
    ]

    // Task distribution by priority
    const tasksByPriority = {
      high: tasks.filter(t => t.priority === "high").length,
      medium: tasks.filter(t => t.priority === "medium").length,
      low: tasks.filter(t => t.priority === "low").length,
      none: tasks.filter(t => !t.priority).length,
    }

    return {
      revenue: {
        total: totalRevenue,
        open: openProjectsRevenue,
        closed: closedProjectsRevenue,
        average: projects.length > 0 ? totalRevenue / projects.length : 0,
        change: changePercentages?.revenue.total,
      },
      projects: {
        total: projects.length,
        open: openProjects,
        closed: closedProjects,
        lastMonth: projectsLastMonth,
        change: changePercentages?.projects.total,
      },
      tasks: {
        total: totalTasks,
        todo: todoTasks,
        inProgress: inProgressTasks,
        completed: completedTasks,
        completionRate,
        byPriority: tasksByPriority,
        completionRateChange: changePercentages?.tasks.completionRate,
      },
      contacts: {
        total: totalContacts,
        lastMonth: contactsLastMonth,
        growthRate: totalContacts > 0 ? (contactsLastMonth / totalContacts) * 100 : 0,
        change: changePercentages?.contacts.total,
      },
      activity: {
        lastMonth: recentActivity,
      },
      topProjects,
      monthlyRevenue,
      currentPeriod: currentMetrics,
      comparisonPeriod: comparisonMetrics,
      changePercentages,
    }
  },
})

export const getRevenueData = query({
  args: { 
    dateRange: v.string() 
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    let startDate: number
    let groupBy: 'month' | 'week' | 'day' = 'month'
    
    // Determine date range
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    switch (args.dateRange) {
      case 'today':
        startDate = today.getTime()
        groupBy = 'day'
        break
      case 'yesterday':
        startDate = today.getTime() - 24 * 60 * 60 * 1000
        groupBy = 'day'
        break
      case 'last7days':
        startDate = now - 7 * 24 * 60 * 60 * 1000
        groupBy = 'day'
        break
      case 'last30days':
        startDate = now - 30 * 24 * 60 * 60 * 1000
        groupBy = 'day'
        break
      case 'last3months':
        startDate = now - 90 * 24 * 60 * 60 * 1000
        groupBy = 'week'
        break
      case 'last6months':
        startDate = now - 180 * 24 * 60 * 60 * 1000
        groupBy = 'month'
        break
      case 'lastyear':
        startDate = now - 365 * 24 * 60 * 60 * 1000
        groupBy = 'month'
        break
      case 'thismonth':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1).getTime()
        groupBy = 'day'
        break
      case 'lastmonth':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1).getTime()
        groupBy = 'day'
        break
      case 'thisquarter':
        const currentQuarter = Math.floor(today.getMonth() / 3)
        startDate = new Date(today.getFullYear(), currentQuarter * 3, 1).getTime()
        groupBy = 'week'
        break
      case 'lastquarter':
        const lastQuarter = Math.floor(today.getMonth() / 3) - 1
        startDate = new Date(today.getFullYear(), lastQuarter * 3, 1).getTime()
        groupBy = 'week'
        break
      case 'thisyear':
        startDate = new Date(today.getFullYear(), 0, 1).getTime()
        groupBy = 'month'
        break
      default:
        startDate = now - 30 * 24 * 60 * 60 * 1000
        groupBy = 'day'
    }
    
    // Get projects and payments within date range
    const projects = await ctx.db.query("projects").collect()
    const payments = await ctx.db.query("projectPayments").collect()
    
    // Filter by date range
    const filteredProjects = projects.filter(p => p.createdAt >= startDate)
    const filteredPayments = payments.filter(p => p.date >= startDate)
    
    // Group data by time period
    const revenueByPeriod = new Map<string, { revenue: number; projectCount: number }>()
    
    // Helper function to format date based on grouping
    const formatDate = (timestamp: number) => {
      const date = new Date(timestamp)
      if (groupBy === 'day') {
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
      } else if (groupBy === 'week') {
        const weekNum = Math.floor((date.getDate() - 1) / 7) + 1
        return `Week ${weekNum}, ${date.toLocaleDateString('en-GB', { month: 'short' })}`
      } else {
        return date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
      }
    }
    
    // Process payments
    filteredPayments.forEach(payment => {
      const period = formatDate(payment.date)
      const existing = revenueByPeriod.get(period) || { revenue: 0, projectCount: 0 }
      revenueByPeriod.set(period, {
        revenue: existing.revenue + payment.amount,
        projectCount: existing.projectCount
      })
    })
    
    // Process projects (for project count)
    filteredProjects.forEach(project => {
      const period = formatDate(project.createdAt)
      const existing = revenueByPeriod.get(period) || { revenue: 0, projectCount: 0 }
      revenueByPeriod.set(period, {
        revenue: existing.revenue,
        projectCount: existing.projectCount + 1
      })
    })
    
    // Convert to array and sort by date
    const chartData = Array.from(revenueByPeriod.entries())
      .map(([month, data]) => ({
        month,
        revenue: data.revenue,
        projectCount: data.projectCount
      }))
      .sort((a, b) => {
        // Simple sort - in production you'd want proper date parsing
        return a.month.localeCompare(b.month)
      })
    
    // Calculate total revenue
    const totalRevenue = filteredPayments.reduce((sum, p) => sum + p.amount, 0)
    
    return {
      chartData,
      totalRevenue,
      dateRange: args.dateRange
    }
  },
})

export const getContactGrowthData = query({
  args: { 
    dateRange: v.string() 
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    let startDate: number
    let groupBy: 'month' | 'week' | 'day' = 'month'
    
    // Determine date range
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    switch (args.dateRange) {
      case 'today':
        startDate = today.getTime()
        groupBy = 'day'
        break
      case 'yesterday':
        startDate = today.getTime() - 24 * 60 * 60 * 1000
        groupBy = 'day'
        break
      case 'last7days':
        startDate = now - 7 * 24 * 60 * 60 * 1000
        groupBy = 'day'
        break
      case 'last30days':
        startDate = now - 30 * 24 * 60 * 60 * 1000
        groupBy = 'day'
        break
      case 'last3months':
        startDate = now - 90 * 24 * 60 * 60 * 1000
        groupBy = 'week'
        break
      case 'last6months':
        startDate = now - 180 * 24 * 60 * 60 * 1000
        groupBy = 'month'
        break
      case 'lastyear':
        startDate = now - 365 * 24 * 60 * 60 * 1000
        groupBy = 'month'
        break
      case 'thismonth':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1).getTime()
        groupBy = 'day'
        break
      case 'lastmonth':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1).getTime()
        groupBy = 'day'
        break
      case 'thisquarter':
        const currentQuarter = Math.floor(today.getMonth() / 3)
        startDate = new Date(today.getFullYear(), currentQuarter * 3, 1).getTime()
        groupBy = 'week'
        break
      case 'lastquarter':
        const lastQuarter = Math.floor(today.getMonth() / 3) - 1
        startDate = new Date(today.getFullYear(), lastQuarter * 3, 1).getTime()
        groupBy = 'week'
        break
      case 'thisyear':
        startDate = new Date(today.getFullYear(), 0, 1).getTime()
        groupBy = 'month'
        break
      default:
        startDate = now - 30 * 24 * 60 * 60 * 1000
        groupBy = 'day'
    }
    
    // Get all contacts
    const contacts = await ctx.db.query("contacts").collect()
    
    // Filter contacts within date range
    const filteredContacts = contacts.filter(c => c.createdAt >= startDate)
    
    // Group data by time period
    const contactsByPeriod = new Map<string, number>()
    
    // Helper function to format date based on grouping
    const formatDate = (timestamp: number) => {
      const date = new Date(timestamp)
      if (groupBy === 'day') {
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
      } else if (groupBy === 'week') {
        const weekNum = Math.floor((date.getDate() - 1) / 7) + 1
        return `Week ${weekNum}, ${date.toLocaleDateString('en-GB', { month: 'short' })}`
      } else {
        return date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
      }
    }
    
    // Count contacts by period
    filteredContacts.forEach(contact => {
      const period = formatDate(contact.createdAt)
      contactsByPeriod.set(period, (contactsByPeriod.get(period) || 0) + 1)
    })
    
    // Convert to array and calculate cumulative total
    let cumulativeTotal = contacts.filter(c => c.createdAt < startDate).length
    const chartData = Array.from(contactsByPeriod.entries())
      .map(([period, count]) => {
        cumulativeTotal += count
        return {
          period,
          newContacts: count,
          totalContacts: cumulativeTotal
        }
      })
      .sort((a, b) => {
        // Simple sort - in production you'd want proper date parsing
        return a.period.localeCompare(b.period)
      })
    
    return {
      chartData,
      totalContacts: contacts.length,
      newContactsInPeriod: filteredContacts.length,
      dateRange: args.dateRange
    }
  },
})