import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { Id } from "./_generated/dataModel"

// Custom field definitions queries
export const getCustomFields = query({
  args: {
    entityType: v.optional(v.union(v.literal("contacts"), v.literal("projects"), v.literal("tasks"))),
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const baseQuery = ctx.db.query("customFields")
    
    const query = args.entityType 
      ? baseQuery.withIndex("by_entity_type", q => q.eq("entityType", args.entityType!))
      : baseQuery
    
    let fields = await query.collect()
    
    if (args.activeOnly) {
      fields = fields.filter(field => field.isActive)
    }
    
    // Sort by display order
    fields.sort((a, b) => a.displayOrder - b.displayOrder)
    
    // Get creator info
    const fieldsWithCreator = await Promise.all(
      fields.map(async (field) => {
        const creator = await ctx.db.get(field.createdBy)
        const updater = await ctx.db.get(field.updatedBy)
        return {
          ...field,
          creatorName: creator?.name || "Unknown",
          updaterName: updater?.name || "Unknown",
        }
      })
    )
    
    return fieldsWithCreator
  },
})

export const getCustomField = query({
  args: { id: v.id("customFields") },
  handler: async (ctx, args) => {
    const field = await ctx.db.get(args.id)
    if (!field) return null
    
    const creator = await ctx.db.get(field.createdBy)
    const updater = await ctx.db.get(field.updatedBy)
    
    return {
      ...field,
      creatorName: creator?.name || "Unknown",
      updaterName: updater?.name || "Unknown",
    }
  },
})

export const createCustomField = mutation({
  args: {
    name: v.string(),
    fieldKey: v.string(),
    entityType: v.union(v.literal("contacts"), v.literal("projects"), v.literal("tasks")),
    fieldType: v.union(
      v.literal("text"),
      v.literal("number"),
      v.literal("date"),
      v.literal("dropdown"),
      v.literal("checkbox"),
      v.literal("textarea"),
      v.literal("email"),
      v.literal("phone"),
      v.literal("url")
    ),
    description: v.optional(v.string()),
    required: v.boolean(),
    defaultValue: v.optional(v.string()),
    options: v.optional(v.array(v.string())),
    validation: v.optional(v.object({
      min: v.optional(v.number()),
      max: v.optional(v.number()),
      pattern: v.optional(v.string()),
      message: v.optional(v.string()),
    })),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { userId, ...fieldData } = args
    
    // Check if field key already exists for this entity type
    const existingField = await ctx.db
      .query("customFields")
      .withIndex("by_field_key", q => q.eq("fieldKey", args.fieldKey))
      .filter(q => q.eq(q.field("entityType"), args.entityType))
      .first()
    
    if (existingField) {
      throw new Error(`A field with key "${args.fieldKey}" already exists for ${args.entityType}`)
    }
    
    // Get the next display order
    const existingFields = await ctx.db
      .query("customFields")
      .withIndex("by_entity_type", q => q.eq("entityType", args.entityType))
      .collect()
    
    const maxOrder = existingFields.length > 0 
      ? Math.max(...existingFields.map(f => f.displayOrder))
      : 0
    
    const now = Date.now()
    const fieldId = await ctx.db.insert("customFields", {
      ...fieldData,
      displayOrder: maxOrder + 1,
      isActive: true,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
      updatedBy: userId,
    })
    
    // Log creation
    await ctx.db.insert("auditLogs", {
      action: "created",
      entityType: "customFields",
      entityId: fieldId,
      userId,
      changes: JSON.stringify({
        name: args.name,
        fieldKey: args.fieldKey,
        entityType: args.entityType,
        fieldType: args.fieldType,
      }),
      timestamp: now,
    })
    
    return fieldId
  },
})

export const updateCustomField = mutation({
  args: {
    id: v.id("customFields"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    required: v.optional(v.boolean()),
    defaultValue: v.optional(v.string()),
    options: v.optional(v.array(v.string())),
    validation: v.optional(v.object({
      min: v.optional(v.number()),
      max: v.optional(v.number()),
      pattern: v.optional(v.string()),
      message: v.optional(v.string()),
    })),
    displayOrder: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { id, userId, ...updates } = args
    
    const existing = await ctx.db.get(id)
    if (!existing) throw new Error("Custom field not found")
    
    // Build changes object for audit log
    const changes: any = {}
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && (existing as any)[key] !== value) {
        changes[key] = { from: (existing as any)[key], to: value }
      }
    })
    
    const now = Date.now()
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: now,
      updatedBy: userId,
    })
    
    // Log update
    if (Object.keys(changes).length > 0) {
      await ctx.db.insert("auditLogs", {
        action: "updated",
        entityType: "customFields",
        entityId: id,
        userId,
        changes: JSON.stringify(changes),
        timestamp: now,
      })
    }
    
    return id
  },
})

export const deleteCustomField = mutation({
  args: {
    id: v.id("customFields"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const field = await ctx.db.get(args.id)
    if (!field) throw new Error("Custom field not found")
    
    // Delete all values associated with this field
    const values = await ctx.db
      .query("customFieldValues")
      .withIndex("by_field", q => q.eq("fieldId", args.id))
      .collect()
    
    for (const value of values) {
      await ctx.db.delete(value._id)
    }
    
    // Delete the field definition
    await ctx.db.delete(args.id)
    
    // Log deletion
    await ctx.db.insert("auditLogs", {
      action: "deleted",
      entityType: "customFields",
      entityId: args.id,
      userId: args.userId,
      changes: JSON.stringify({
        name: field.name,
        fieldKey: field.fieldKey,
        entityType: field.entityType,
        valuesDeleted: values.length,
      }),
      timestamp: Date.now(),
    })
  },
})

export const reorderCustomFields = mutation({
  args: {
    entityType: v.union(v.literal("contacts"), v.literal("projects"), v.literal("tasks")),
    fieldIds: v.array(v.id("customFields")),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    
    // Update display order for each field
    for (let i = 0; i < args.fieldIds.length; i++) {
      await ctx.db.patch(args.fieldIds[i], {
        displayOrder: i + 1,
        updatedAt: now,
        updatedBy: args.userId,
      })
    }
    
    // Log reordering
    await ctx.db.insert("auditLogs", {
      action: "reordered",
      entityType: "customFields",
      entityId: args.entityType,
      userId: args.userId,
      changes: JSON.stringify({
        entityType: args.entityType,
        newOrder: args.fieldIds,
      }),
      timestamp: now,
    })
  },
})

// Custom field values queries and mutations
export const getCustomFieldValues = query({
  args: {
    entityType: v.union(v.literal("contacts"), v.literal("projects"), v.literal("tasks")),
    entityId: v.string(),
  },
  handler: async (ctx, args) => {
    const values = await ctx.db
      .query("customFieldValues")
      .withIndex("by_entity", q => q.eq("entityType", args.entityType).eq("entityId", args.entityId))
      .collect()
    
    // Get field definitions
    const valuesWithFields = await Promise.all(
      values.map(async (value) => {
        const field = await ctx.db.get(value.fieldId)
        return {
          ...value,
          field,
        }
      })
    )
    
    return valuesWithFields
  },
})

export const setCustomFieldValue = mutation({
  args: {
    fieldId: v.id("customFields"),
    entityType: v.union(v.literal("contacts"), v.literal("projects"), v.literal("tasks")),
    entityId: v.string(),
    value: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { userId, ...valueData } = args
    
    // Check if value already exists
    const existingValue = await ctx.db
      .query("customFieldValues")
      .withIndex("by_entity_field", q => 
        q.eq("entityType", args.entityType)
         .eq("entityId", args.entityId)
         .eq("fieldId", args.fieldId)
      )
      .first()
    
    const now = Date.now()
    
    if (existingValue) {
      // Update existing value
      await ctx.db.patch(existingValue._id, {
        value: args.value,
        updatedAt: now,
        updatedBy: userId,
      })
      return existingValue._id
    } else {
      // Create new value
      const valueId = await ctx.db.insert("customFieldValues", {
        ...valueData,
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
        updatedBy: userId,
      })
      return valueId
    }
  },
})

export const deleteCustomFieldValue = mutation({
  args: {
    fieldId: v.id("customFields"),
    entityType: v.union(v.literal("contacts"), v.literal("projects"), v.literal("tasks")),
    entityId: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const value = await ctx.db
      .query("customFieldValues")
      .withIndex("by_entity_field", q => 
        q.eq("entityType", args.entityType)
         .eq("entityId", args.entityId)
         .eq("fieldId", args.fieldId)
      )
      .first()
    
    if (value) {
      await ctx.db.delete(value._id)
    }
  },
})

// Batch operations for custom field values
export const setCustomFieldValues = mutation({
  args: {
    entityType: v.union(v.literal("contacts"), v.literal("projects"), v.literal("tasks")),
    entityId: v.string(),
    values: v.array(v.object({
      fieldId: v.id("customFields"),
      value: v.string(),
    })),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    
    for (const { fieldId, value } of args.values) {
      // Check if value already exists
      const existingValue = await ctx.db
        .query("customFieldValues")
        .withIndex("by_entity_field", q => 
          q.eq("entityType", args.entityType)
           .eq("entityId", args.entityId)
           .eq("fieldId", fieldId)
        )
        .first()
      
      if (existingValue) {
        // Update existing value
        await ctx.db.patch(existingValue._id, {
          value,
          updatedAt: now,
          updatedBy: args.userId,
        })
      } else {
        // Create new value
        await ctx.db.insert("customFieldValues", {
          fieldId,
          entityType: args.entityType,
          entityId: args.entityId,
          value,
          createdBy: args.userId,
          createdAt: now,
          updatedAt: now,
          updatedBy: args.userId,
        })
      }
    }
  },
})