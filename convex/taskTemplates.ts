import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { Id } from "./_generated/dataModel"

export const list = query({
  args: {},
  handler: async (ctx) => {
    const templates = await ctx.db.query("taskTemplates").order("desc").collect()
    
    // Get creator info
    const templatesWithDetails = await Promise.all(
      templates.map(async (template) => {
        const creator = await ctx.db.get(template.createdBy)
        return {
          ...template,
          creatorName: creator?.name || "Unknown",
        }
      })
    )
    
    return templatesWithDetails
  },
})

export const get = query({
  args: { id: v.id("taskTemplates") },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.id)
    if (!template) return null
    
    const creator = await ctx.db.get(template.createdBy)
    
    return {
      ...template,
      creatorName: creator?.name || "Unknown",
    }
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    estimatedHours: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    
    const templateId = await ctx.db.insert("taskTemplates", {
      name: args.name,
      title: args.title,
      description: args.description,
      priority: args.priority || "medium",
      estimatedHours: args.estimatedHours,
      tags: args.tags || [],
      createdBy: args.userId,
      createdAt: now,
      updatedAt: now,
    })
    
    return templateId
  },
})

export const update = mutation({
  args: {
    id: v.id("taskTemplates"),
    name: v.optional(v.string()),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    estimatedHours: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { id, userId, ...updates } = args
    
    const existing = await ctx.db.get(id)
    if (!existing) throw new Error("Template not found")
    
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    })
    
    return id
  },
})

export const remove = mutation({
  args: {
    id: v.id("taskTemplates"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.id)
    if (!template) throw new Error("Template not found")
    
    await ctx.db.delete(args.id)
  },
})

export const createTaskFromTemplate = mutation({
  args: {
    templateId: v.id("taskTemplates"),
    projectId: v.id("projects"),
    assignedTo: v.optional(v.id("users")),
    dueDate: v.optional(v.number()),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateId)
    if (!template) throw new Error("Template not found")
    
    const now = Date.now()
    
    const taskId = await ctx.db.insert("tasks", {
      title: template.title,
      description: template.description,
      status: "todo",
      priority: template.priority,
      projectId: args.projectId,
      assignedTo: args.assignedTo,
      dueDate: args.dueDate,
      createdBy: args.userId,
      createdAt: now,
      updatedAt: now,
    })
    
    // Log creation
    await ctx.db.insert("auditLogs", {
      action: "created_from_template",
      entityType: "tasks",
      entityId: taskId,
      userId: args.userId,
      changes: JSON.stringify({ templateId: args.templateId, templateName: template.name }),
      timestamp: now,
    })
    
    return taskId
  },
})