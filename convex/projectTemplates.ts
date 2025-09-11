import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { Id } from "./_generated/dataModel"
import { encryptNumber, decryptNumber } from "./lib/encryption"

export const list = query({
  handler: async (ctx) => {
    const templates = await ctx.db.query("projectTemplates").order("desc").collect()
    
    // Get creator info
    const templatesWithCreator = await Promise.all(
      templates.map(async (template) => {
        const creator = await ctx.db.get(template.createdBy)
        return {
          ...template,
          expectedRevenueGBP: decryptNumber(template.expectedRevenueGBP),
          creatorName: creator?.name || "Unknown",
        }
      })
    )
    
    return templatesWithCreator
  },
})

export const get = query({
  args: { id: v.id("projectTemplates") },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.id)
    if (!template) return null
    
    const creator = await ctx.db.get(template.createdBy)
    return {
      ...template,
      expectedRevenueGBP: decryptNumber(template.expectedRevenueGBP),
      creatorName: creator?.name || "Unknown",
    }
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    company: v.optional(v.string()),
    expectedRevenueGBP: v.number(),
    durationDays: v.optional(v.number()),
    tasks: v.array(v.object({
      title: v.string(),
      description: v.optional(v.string()),
      priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
      daysFromStart: v.number(),
    })),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    
    const templateId = await ctx.db.insert("projectTemplates", {
      name: args.name,
      description: args.description,
      company: args.company,
      expectedRevenueGBP: encryptNumber(args.expectedRevenueGBP),
      durationDays: args.durationDays,
      tasks: args.tasks,
      createdBy: args.userId,
      createdAt: now,
      updatedAt: now,
    })
    
    // Log creation
    await ctx.db.insert("auditLogs", {
      action: "created",
      entityType: "projectTemplates",
      entityId: templateId,
      userId: args.userId,
      timestamp: now,
    })
    
    return templateId
  },
})

export const update = mutation({
  args: {
    id: v.id("projectTemplates"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    company: v.optional(v.string()),
    expectedRevenueGBP: v.optional(v.number()),
    durationDays: v.optional(v.number()),
    tasks: v.optional(v.array(v.object({
      title: v.string(),
      description: v.optional(v.string()),
      priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
      daysFromStart: v.number(),
    }))),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { id, userId, expectedRevenueGBP, ...updates } = args
    
    const existing = await ctx.db.get(id)
    if (!existing) throw new Error("Template not found")
    
    const patchData: any = {
      ...updates,
      updatedAt: Date.now(),
    }
    
    if (expectedRevenueGBP !== undefined) {
      patchData.expectedRevenueGBP = encryptNumber(expectedRevenueGBP)
    }
    
    await ctx.db.patch(id, patchData)
    
    // Log update
    await ctx.db.insert("auditLogs", {
      action: "updated",
      entityType: "projectTemplates",
      entityId: id,
      userId,
      timestamp: Date.now(),
    })
    
    return id
  },
})

export const remove = mutation({
  args: {
    id: v.id("projectTemplates"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.id)
    if (!template) throw new Error("Template not found")
    
    await ctx.db.delete(args.id)
    
    // Log deletion
    await ctx.db.insert("auditLogs", {
      action: "deleted",
      entityType: "projectTemplates",
      entityId: args.id,
      userId: args.userId,
      changes: JSON.stringify({ name: template.name }),
      timestamp: Date.now(),
    })
  },
})

export const createProjectFromTemplate = mutation({
  args: {
    templateId: v.id("projectTemplates"),
    name: v.string(),
    company: v.optional(v.string()),
    description: v.optional(v.string()),
    startDate: v.optional(v.number()),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateId)
    if (!template) throw new Error("Template not found")
    
    const now = Date.now()
    const startDate = args.startDate || now
    
    // Calculate end date based on template duration
    let endDate: number | undefined
    if (template.durationDays) {
      endDate = startDate + (template.durationDays * 24 * 60 * 60 * 1000)
    }
    
    // Create the project
    const projectId = await ctx.db.insert("projects", {
      name: args.name,
      company: args.company || template.company,
      description: args.description || template.description,
      status: "open",
      expectedRevenueGBP: template.expectedRevenueGBP, // Already encrypted
      startDate,
      endDate,
      createdBy: args.userId,
      createdAt: now,
      updatedAt: now,
    })
    
    // Create tasks from template
    for (const taskTemplate of template.tasks) {
      const dueDate = startDate + (taskTemplate.daysFromStart * 24 * 60 * 60 * 1000)
      
      await ctx.db.insert("tasks", {
        title: taskTemplate.title,
        description: taskTemplate.description,
        status: "todo",
        priority: taskTemplate.priority,
        dueDate,
        projectId,
        assignedTo: undefined,
        createdBy: args.userId,
        createdAt: now,
        updatedAt: now,
      })
    }
    
    // Log creation
    await ctx.db.insert("auditLogs", {
      action: "created",
      entityType: "projects",
      entityId: projectId,
      userId: args.userId,
      changes: JSON.stringify({ fromTemplate: template.name }),
      timestamp: now,
    })
    
    return projectId
  },
})