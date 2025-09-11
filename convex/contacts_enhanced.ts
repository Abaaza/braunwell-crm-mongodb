import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { Id } from "./_generated/dataModel"
import { createAuditLog, createDataAccessLog, createBulkOperationLog, generateChanges, AuditContext } from "./auditUtils"

// Helper function to get contact by ID
export async function getContactById(ctx: { db: any }, contactId: Id<"contacts">) {
  return await ctx.db.get(contactId)
}

export const list = query({
  args: {
    search: v.optional(v.string()),
    userId: v.optional(v.id("users")),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let contacts = await ctx.db.query("contacts").order("desc").collect()
    
    // Search by name, email, phone, or company
    if (args.search) {
      const searchLower = args.search.toLowerCase()
      contacts = contacts.filter(c => 
        c.name.toLowerCase().includes(searchLower) ||
        c.email.toLowerCase().includes(searchLower) ||
        c.phone.includes(searchLower) ||
        c.company?.toLowerCase().includes(searchLower)
      )
    }
    
    // Log bulk data access if user context is provided
    // Note: In production, audit logging would be done asynchronously
    // For now, we'll skip it in queries to avoid scheduler requirement
    
    // Get creator info
    const contactsWithDetails = await Promise.all(
      contacts.map(async (contact) => {
        const creator = await ctx.db.get(contact.createdBy)
        return {
          ...contact,
          creatorName: creator?.name || "Unknown",
        }
      })
    )
    
    return contactsWithDetails
  },
})

export const get = query({
  args: { 
    id: v.id("contacts"),
    userId: v.optional(v.id("users")),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const contact = await ctx.db.get(args.id)
    if (!contact) return null
    
    const creator = await ctx.db.get(contact.createdBy)
    
    // Log data access if user context is provided
    // Note: In production, audit logging would be done asynchronously
    // For now, we'll skip it in queries to avoid scheduler requirement
    
    return {
      ...contact,
      creatorName: creator?.name || "Unknown",
    }
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    company: v.optional(v.string()),
    notes: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    userId: v.id("users"),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, ipAddress, userAgent, sessionId, ...contactData } = args
    
    // Check if email already exists
    const existing = await ctx.db
      .query("contacts")
      .withIndex("by_email", (q) => q.eq("email", contactData.email))
      .first()
    
    if (existing) {
      // Log failed creation attempt
      const auditContext: AuditContext = { userId, ipAddress, userAgent, sessionId }
      await createAuditLog(ctx, auditContext, {
        action: "create_failed",
        entityType: "contacts",
        entityId: "duplicate_email",
        severity: "medium",
        successful: false,
        errorMessage: "A contact with this email already exists",
        metadata: { email: contactData.email },
      })
      
      throw new Error("A contact with this email already exists")
    }
    
    const now = Date.now()
    
    const contactId = await ctx.db.insert("contacts", {
      ...contactData,
      tags: contactData.tags || [],
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    })
    
    // Log creation with detailed audit information
    const auditContext: AuditContext = { userId, ipAddress, userAgent, sessionId }
    await createAuditLog(ctx, auditContext, {
      action: "created",
      entityType: "contacts",
      entityId: contactId,
      severity: "medium",
      description: `Created contact: ${contactData.name} (${contactData.email})`,
      metadata: {
        contactName: contactData.name,
        contactEmail: contactData.email,
        company: contactData.company,
      },
    })
    
    return contactId
  },
})

export const update = mutation({
  args: {
    id: v.id("contacts"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    company: v.optional(v.string()),
    notes: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    userId: v.id("users"),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, userId, ipAddress, userAgent, sessionId, ...updates } = args
    
    const existing = await ctx.db.get(id)
    if (!existing) {
      const auditContext: AuditContext = { userId, ipAddress, userAgent, sessionId }
      await createAuditLog(ctx, auditContext, {
        action: "update_failed",
        entityType: "contacts",
        entityId: id,
        severity: "medium",
        successful: false,
        errorMessage: "Contact not found",
      })
      throw new Error("Contact not found")
    }
    
    // If email is being updated, check for duplicates
    if (updates.email && updates.email !== existing.email) {
      const duplicate = await ctx.db
        .query("contacts")
        .withIndex("by_email", (q) => q.eq("email", updates.email!))
        .first()
      
      if (duplicate) {
        const auditContext: AuditContext = { userId, ipAddress, userAgent, sessionId }
        await createAuditLog(ctx, auditContext, {
          action: "update_failed",
          entityType: "contacts",
          entityId: id,
          severity: "medium",
          successful: false,
          errorMessage: "A contact with this email already exists",
          metadata: { attemptedEmail: updates.email, existingContactId: duplicate._id },
        })
        throw new Error("A contact with this email already exists")
      }
    }
    
    // Generate changes using utility function
    const changes = generateChanges(existing, updates)
    
    if (changes && Object.keys(changes).length > 0) {
      await ctx.db.patch(id, {
        ...updates,
        updatedAt: Date.now(),
      })
      
      // Log update with detailed audit information
      const auditContext: AuditContext = { userId, ipAddress, userAgent, sessionId }
      await createAuditLog(ctx, auditContext, {
        action: "updated",
        entityType: "contacts",
        entityId: id,
        changes,
        severity: "medium",
        description: `Updated contact: ${existing.name} (${existing.email})`,
        metadata: {
          contactName: existing.name,
          contactEmail: existing.email,
          fieldsChanged: Object.keys(changes),
        },
      })
    }
    
    return id
  },
})

export const remove = mutation({
  args: {
    id: v.id("contacts"),
    userId: v.id("users"),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, userId, ipAddress, userAgent, sessionId } = args
    
    const contact = await ctx.db.get(id)
    if (!contact) {
      const auditContext: AuditContext = { userId, ipAddress, userAgent, sessionId }
      await createAuditLog(ctx, auditContext, {
        action: "delete_failed",
        entityType: "contacts",
        entityId: id,
        severity: "medium",
        successful: false,
        errorMessage: "Contact not found",
      })
      throw new Error("Contact not found")
    }
    
    await ctx.db.delete(id)
    
    // Log deletion with detailed audit information
    const auditContext: AuditContext = { userId, ipAddress, userAgent, sessionId }
    await createAuditLog(ctx, auditContext, {
      action: "deleted",
      entityType: "contacts",
      entityId: id,
      severity: "high",
      description: `Deleted contact: ${contact.name} (${contact.email})`,
      metadata: {
        contactName: contact.name,
        contactEmail: contact.email,
        company: contact.company,
      },
    })
  },
})

export const removeMultiple = mutation({
  args: {
    ids: v.array(v.id("contacts")),
    userId: v.id("users"),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { ids, userId, ipAddress, userAgent, sessionId } = args
    const deletedContacts = []
    
    for (const id of ids) {
      const contact = await ctx.db.get(id)
      if (contact) {
        await ctx.db.delete(id)
        deletedContacts.push({ 
          id,
          name: contact.name, 
          email: contact.email,
          company: contact.company,
        })
      }
    }
    
    // Log bulk deletion with detailed audit information
    const auditContext: AuditContext = { userId, ipAddress, userAgent, sessionId }
    await createBulkOperationLog(ctx, auditContext, "delete", "contacts", deletedContacts.length, {
      deletedContacts: deletedContacts.map(c => ({
        id: c.id,
        name: c.name,
        email: c.email,
        company: c.company,
      })),
      requestedIds: ids,
    })
    
    return { deletedCount: deletedContacts.length }
  },
})

// Export contacts with enhanced audit logging
export const exportContacts = mutation({
  args: {
    userId: v.id("users"),
    filters: v.optional(v.object({
      search: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      company: v.optional(v.string()),
    })),
    format: v.optional(v.union(v.literal("csv"), v.literal("json"))),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, filters, format = "csv", ipAddress, userAgent, sessionId } = args
    
    let contacts = await ctx.db.query("contacts").collect()
    
    // Apply filters
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase()
      contacts = contacts.filter(c => 
        c.name.toLowerCase().includes(searchLower) ||
        c.email.toLowerCase().includes(searchLower) ||
        c.phone.includes(searchLower) ||
        c.company?.toLowerCase().includes(searchLower)
      )
    }
    
    if (filters?.tags && filters.tags.length > 0) {
      contacts = contacts.filter(c => 
        c.tags?.some(tag => filters.tags!.includes(tag))
      )
    }
    
    if (filters?.company) {
      contacts = contacts.filter(c => 
        c.company?.toLowerCase().includes(filters.company!.toLowerCase())
      )
    }
    
    // Log export with detailed audit information
    const auditContext: AuditContext = { userId, ipAddress, userAgent, sessionId }
    await createAuditLog(ctx, auditContext, {
      action: "exported",
      entityType: "contacts",
      entityId: "bulk_export",
      severity: "high",
      description: `Exported ${contacts.length} contacts`,
      affectedRecords: contacts.length,
      metadata: {
        format,
        filters,
        exportedCount: contacts.length,
      },
    })
    
    return {
      contacts,
      count: contacts.length,
      format,
    }
  },
})

// Import contacts with enhanced audit logging
export const importContacts = mutation({
  args: {
    contacts: v.array(v.object({
      name: v.string(),
      email: v.string(),
      phone: v.string(),
      company: v.optional(v.string()),
      notes: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
    })),
    userId: v.id("users"),
    skipDuplicates: v.optional(v.boolean()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { contacts, userId, skipDuplicates = true, ipAddress, userAgent, sessionId } = args
    
    const results = {
      created: 0,
      skipped: 0,
      errors: [] as string[],
    }
    
    for (const contactData of contacts) {
      try {
        // Check if email already exists
        const existing = await ctx.db
          .query("contacts")
          .withIndex("by_email", (q) => q.eq("email", contactData.email))
          .first()
        
        if (existing) {
          if (skipDuplicates) {
            results.skipped++
            continue
          } else {
            results.errors.push(`Duplicate email: ${contactData.email}`)
            continue
          }
        }
        
        const now = Date.now()
        const contactId = await ctx.db.insert("contacts", {
          ...contactData,
          tags: contactData.tags || [],
          createdBy: userId,
          createdAt: now,
          updatedAt: now,
        })
        
        results.created++
        
      } catch (error) {
        results.errors.push(`Error with ${contactData.email}: ${error}`)
      }
    }
    
    // Log import with detailed audit information
    const auditContext: AuditContext = { userId, ipAddress, userAgent, sessionId }
    await createAuditLog(ctx, auditContext, {
      action: "imported",
      entityType: "contacts",
      entityId: "bulk_import",
      severity: "high",
      description: `Imported ${results.created} contacts (${results.skipped} skipped, ${results.errors.length} errors)`,
      affectedRecords: results.created,
      metadata: {
        totalRequested: contacts.length,
        created: results.created,
        skipped: results.skipped,
        errors: results.errors,
        skipDuplicates,
      },
    })
    
    return results
  },
})