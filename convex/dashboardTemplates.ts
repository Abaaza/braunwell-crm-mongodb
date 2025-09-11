import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { Id } from "./_generated/dataModel"

export const list = query({
  args: {
    category: v.optional(v.string()),
    includeBuiltIn: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let templates = await ctx.db.query("dashboardTemplates").collect()
    
    if (args.category) {
      templates = templates.filter(t => t.category === args.category)
    }
    
    if (args.includeBuiltIn === false) {
      templates = templates.filter(t => !t.isBuiltIn)
    }
    
    // Get creator info
    const templatesWithCreator = await Promise.all(
      templates.map(async (template) => {
        const creator = await ctx.db.get(template.createdBy)
        return {
          ...template,
          creatorName: creator?.name || "System",
        }
      })
    )
    
    return templatesWithCreator.sort((a, b) => {
      // Sort built-in templates first, then by usage count, then by name
      if (a.isBuiltIn && !b.isBuiltIn) return -1
      if (!a.isBuiltIn && b.isBuiltIn) return 1
      
      const aUsage = a.usageCount || 0
      const bUsage = b.usageCount || 0
      
      if (aUsage !== bUsage) return bUsage - aUsage
      
      return a.name.localeCompare(b.name)
    })
  },
})

export const get = query({
  args: { id: v.id("dashboardTemplates") },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.id)
    if (!template) return null
    
    const creator = await ctx.db.get(template.createdBy)
    return {
      ...template,
      creatorName: creator?.name || "System",
    }
  },
})

export const getCategories = query({
  handler: async (ctx) => {
    const templates = await ctx.db.query("dashboardTemplates").collect()
    const categories = [...new Set(templates.map(t => t.category))]
    return categories.sort()
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
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
    isBuiltIn: v.optional(v.boolean()),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    
    const templateId = await ctx.db.insert("dashboardTemplates", {
      name: args.name,
      description: args.description,
      category: args.category,
      layout: args.layout,
      tags: args.tags,
      isBuiltIn: args.isBuiltIn || false,
      usageCount: 0,
      createdBy: args.userId,
      createdAt: now,
      updatedAt: now,
    })
    
    return templateId
  },
})

export const update = mutation({
  args: {
    id: v.id("dashboardTemplates"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
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
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { id, userId, ...updates } = args
    
    const existing = await ctx.db.get(id)
    if (!existing) throw new Error("Template not found")
    
    // Check if user owns the template or if it's not built-in
    if (existing.createdBy !== userId && existing.isBuiltIn) {
      throw new Error("You cannot edit built-in templates")
    }
    
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    })
    
    return id
  },
})

export const remove = mutation({
  args: {
    id: v.id("dashboardTemplates"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.id)
    if (!template) throw new Error("Template not found")
    
    // Check if user owns the template and it's not built-in
    if (template.createdBy !== args.userId || template.isBuiltIn) {
      throw new Error("You can only delete your own custom templates")
    }
    
    await ctx.db.delete(args.id)
  },
})

export const incrementUsage = mutation({
  args: {
    id: v.id("dashboardTemplates"),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.id)
    if (!template) return
    
    await ctx.db.patch(args.id, {
      usageCount: (template.usageCount || 0) + 1,
    })
  },
})

export const createFromTemplate = mutation({
  args: {
    templateId: v.id("dashboardTemplates"),
    name: v.string(),
    description: v.optional(v.string()),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateId)
    if (!template) throw new Error("Template not found")
    
    // Increment usage count
    await ctx.db.patch(args.templateId, {
      usageCount: (template.usageCount || 0) + 1,
    })
    
    // Create dashboard from template
    const now = Date.now()
    const dashboardId = await ctx.db.insert("dashboards", {
      name: args.name,
      description: args.description,
      layout: template.layout,
      tags: template.tags,
      isTemplate: false,
      isPublic: false,
      isDefault: false,
      category: template.category,
      createdBy: args.userId,
      createdAt: now,
      updatedAt: now,
      accessCount: 0,
    })
    
    return dashboardId
  },
})

// Built-in templates seed data
export const seedBuiltInTemplates = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    
    // Check if built-in templates already exist
    const existingTemplates = await ctx.db
      .query("dashboardTemplates")
      .withIndex("by_builtin", (q) => q.eq("isBuiltIn", true))
      .collect()
    
    if (existingTemplates.length > 0) {
      return "Built-in templates already exist"
    }
    
    // Executive Dashboard Template
    await ctx.db.insert("dashboardTemplates", {
      name: "Executive Dashboard",
      description: "High-level overview of business metrics for executives",
      category: "Executive",
      layout: [
        {
          id: "exec-revenue",
          type: "metric_card",
          position: { x: 0, y: 0, w: 3, h: 2 },
          config: {
            title: "Total Revenue",
            dataSource: "projects",
            aggregation: "sum",
            field: "expectedRevenueGBP",
            dateRange: "month",
            customColors: ["#10b981"],
            showTooltip: true,
            animationEnabled: true,
          },
        },
        {
          id: "exec-projects",
          type: "metric_card",
          position: { x: 3, y: 0, w: 3, h: 2 },
          config: {
            title: "Active Projects",
            dataSource: "projects",
            aggregation: "count",
            filters: [{ field: "status", operator: "equals", value: "open" }],
            customColors: ["#3b82f6"],
            showTooltip: true,
            animationEnabled: true,
          },
        },
        {
          id: "exec-contacts",
          type: "metric_card",
          position: { x: 6, y: 0, w: 3, h: 2 },
          config: {
            title: "Total Contacts",
            dataSource: "contacts",
            aggregation: "count",
            dateRange: "month",
            customColors: ["#f59e0b"],
            showTooltip: true,
            animationEnabled: true,
          },
        },
        {
          id: "exec-tasks",
          type: "metric_card",
          position: { x: 9, y: 0, w: 3, h: 2 },
          config: {
            title: "Completed Tasks",
            dataSource: "tasks",
            aggregation: "count",
            filters: [{ field: "status", operator: "equals", value: "done" }],
            dateRange: "month",
            customColors: ["#ef4444"],
            showTooltip: true,
            animationEnabled: true,
          },
        },
        {
          id: "exec-revenue-chart",
          type: "line_chart",
          position: { x: 0, y: 2, w: 6, h: 4 },
          config: {
            title: "Revenue Trend",
            dataSource: "projects",
            aggregation: "sum",
            field: "expectedRevenueGBP",
            groupBy: "month",
            dateRange: "year",
            showLegend: true,
            showGrid: true,
            showTooltip: true,
            animationEnabled: true,
          },
        },
        {
          id: "exec-project-status",
          type: "pie_chart",
          position: { x: 6, y: 2, w: 6, h: 4 },
          config: {
            title: "Project Status Distribution",
            dataSource: "projects",
            aggregation: "count",
            groupBy: "status",
            showLegend: true,
            showTooltip: true,
            animationEnabled: true,
          },
        },
      ],
      tags: ["executive", "overview", "kpi"],
      isBuiltIn: true,
      usageCount: 0,
      createdBy: args.userId,
      createdAt: now,
      updatedAt: now,
    })
    
    // Project Management Dashboard Template
    await ctx.db.insert("dashboardTemplates", {
      name: "Project Management Dashboard",
      description: "Detailed project tracking and task management metrics",
      category: "Project Management",
      layout: [
        {
          id: "pm-active-projects",
          type: "metric_card",
          position: { x: 0, y: 0, w: 3, h: 2 },
          config: {
            title: "Active Projects",
            dataSource: "projects",
            aggregation: "count",
            filters: [{ field: "status", operator: "equals", value: "open" }],
            customColors: ["#3b82f6"],
            showTooltip: true,
            animationEnabled: true,
          },
        },
        {
          id: "pm-pending-tasks",
          type: "metric_card",
          position: { x: 3, y: 0, w: 3, h: 2 },
          config: {
            title: "Pending Tasks",
            dataSource: "tasks",
            aggregation: "count",
            filters: [{ field: "status", operator: "equals", value: "todo" }],
            customColors: ["#f59e0b"],
            showTooltip: true,
            animationEnabled: true,
          },
        },
        {
          id: "pm-in-progress-tasks",
          type: "metric_card",
          position: { x: 6, y: 0, w: 3, h: 2 },
          config: {
            title: "In Progress",
            dataSource: "tasks",
            aggregation: "count",
            filters: [{ field: "status", operator: "equals", value: "in_progress" }],
            customColors: ["#8b5cf6"],
            showTooltip: true,
            animationEnabled: true,
          },
        },
        {
          id: "pm-completed-tasks",
          type: "metric_card",
          position: { x: 9, y: 0, w: 3, h: 2 },
          config: {
            title: "Completed",
            dataSource: "tasks",
            aggregation: "count",
            filters: [{ field: "status", operator: "equals", value: "done" }],
            customColors: ["#10b981"],
            showTooltip: true,
            animationEnabled: true,
          },
        },
        {
          id: "pm-task-completion",
          type: "bar_chart",
          position: { x: 0, y: 2, w: 6, h: 4 },
          config: {
            title: "Task Completion by Project",
            dataSource: "tasks",
            aggregation: "count",
            groupBy: "projectId",
            showLegend: true,
            showGrid: true,
            showTooltip: true,
            animationEnabled: true,
          },
        },
        {
          id: "pm-task-priority",
          type: "donut_chart",
          position: { x: 6, y: 2, w: 6, h: 4 },
          config: {
            title: "Task Priority Distribution",
            dataSource: "tasks",
            aggregation: "count",
            groupBy: "priority",
            showLegend: true,
            showTooltip: true,
            animationEnabled: true,
          },
        },
      ],
      tags: ["project", "management", "tasks"],
      isBuiltIn: true,
      usageCount: 0,
      createdBy: args.userId,
      createdAt: now,
      updatedAt: now,
    })
    
    // Sales Dashboard Template
    await ctx.db.insert("dashboardTemplates", {
      name: "Sales Dashboard",
      description: "Track sales performance and revenue metrics",
      category: "Sales",
      layout: [
        {
          id: "sales-revenue",
          type: "metric_card",
          position: { x: 0, y: 0, w: 4, h: 2 },
          config: {
            title: "Total Revenue",
            dataSource: "projects",
            aggregation: "sum",
            field: "expectedRevenueGBP",
            dateRange: "month",
            customColors: ["#10b981"],
            showTooltip: true,
            animationEnabled: true,
          },
        },
        {
          id: "sales-avg-deal",
          type: "metric_card",
          position: { x: 4, y: 0, w: 4, h: 2 },
          config: {
            title: "Average Deal Size",
            dataSource: "projects",
            aggregation: "average",
            field: "expectedRevenueGBP",
            dateRange: "month",
            customColors: ["#3b82f6"],
            showTooltip: true,
            animationEnabled: true,
          },
        },
        {
          id: "sales-new-contacts",
          type: "metric_card",
          position: { x: 8, y: 0, w: 4, h: 2 },
          config: {
            title: "New Contacts",
            dataSource: "contacts",
            aggregation: "count",
            dateRange: "month",
            customColors: ["#f59e0b"],
            showTooltip: true,
            animationEnabled: true,
          },
        },
        {
          id: "sales-monthly-revenue",
          type: "area_chart",
          position: { x: 0, y: 2, w: 8, h: 4 },
          config: {
            title: "Monthly Revenue Trend",
            dataSource: "projects",
            aggregation: "sum",
            field: "expectedRevenueGBP",
            groupBy: "month",
            dateRange: "year",
            showLegend: true,
            showGrid: true,
            showTooltip: true,
            animationEnabled: true,
          },
        },
        {
          id: "sales-contact-growth",
          type: "line_chart",
          position: { x: 8, y: 2, w: 4, h: 4 },
          config: {
            title: "Contact Growth",
            dataSource: "contacts",
            aggregation: "count",
            groupBy: "month",
            dateRange: "year",
            showLegend: true,
            showGrid: true,
            showTooltip: true,
            animationEnabled: true,
          },
        },
      ],
      tags: ["sales", "revenue", "contacts"],
      isBuiltIn: true,
      usageCount: 0,
      createdBy: args.userId,
      createdAt: now,
      updatedAt: now,
    })
    
    return "Built-in templates created successfully"
  },
})