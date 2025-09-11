import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { Id } from "./_generated/dataModel"

// Get all contacts for a project
export const getProjectContacts = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const projectContacts = await ctx.db
      .query("projectContacts")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect()

    const contacts = await Promise.all(
      projectContacts.map(async (pc) => {
        const contact = await ctx.db.get(pc.contactId)
        if (!contact) return null
        
        return {
          ...contact,
          associationId: pc._id,
          role: pc.role,
          associationNotes: pc.notes,
          associatedAt: pc.createdAt,
        }
      })
    )

    return contacts.filter(Boolean)
  },
})

// Get all projects for a contact
export const getContactProjects = query({
  args: {
    contactId: v.id("contacts"),
  },
  handler: async (ctx, args) => {
    const projectContacts = await ctx.db
      .query("projectContacts")
      .withIndex("by_contact", (q) => q.eq("contactId", args.contactId))
      .collect()

    const projects = await Promise.all(
      projectContacts.map(async (pc) => {
        const project = await ctx.db.get(pc.projectId)
        if (!project) return null
        
        return {
          ...project,
          associationId: pc._id,
          role: pc.role,
          associationNotes: pc.notes,
          associatedAt: pc.createdAt,
        }
      })
    )

    return projects.filter(Boolean)
  },
})

// Add a contact to a project
export const addContactToProject = mutation({
  args: {
    projectId: v.id("projects"),
    contactId: v.id("contacts"),
    role: v.optional(v.string()),
    notes: v.optional(v.string()),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if association already exists
    const existing = await ctx.db
      .query("projectContacts")
      .withIndex("by_project_contact", (q) => 
        q.eq("projectId", args.projectId).eq("contactId", args.contactId)
      )
      .first()

    if (existing) {
      throw new Error("Contact is already associated with this project")
    }

    // Create association
    const associationId = await ctx.db.insert("projectContacts", {
      projectId: args.projectId,
      contactId: args.contactId,
      role: args.role,
      notes: args.notes,
      createdBy: args.userId,
      createdAt: Date.now(),
    })

    // Log the action
    await ctx.db.insert("auditLogs", {
      action: "associated",
      entityType: "projectContacts",
      entityId: associationId,
      userId: args.userId,
      changes: JSON.stringify({
        projectId: args.projectId,
        contactId: args.contactId,
        role: args.role,
      }),
      timestamp: Date.now(),
    })

    return associationId
  },
})

// Remove a contact from a project
export const removeContactFromProject = mutation({
  args: {
    associationId: v.id("projectContacts"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const association = await ctx.db.get(args.associationId)
    if (!association) {
      throw new Error("Association not found")
    }

    await ctx.db.delete(args.associationId)

    // Log the action
    await ctx.db.insert("auditLogs", {
      action: "disassociated",
      entityType: "projectContacts",
      entityId: args.associationId,
      userId: args.userId,
      changes: JSON.stringify({
        projectId: association.projectId,
        contactId: association.contactId,
      }),
      timestamp: Date.now(),
    })

    return args.associationId
  },
})

// Update contact role in project
export const updateContactRole = mutation({
  args: {
    associationId: v.id("projectContacts"),
    role: v.optional(v.string()),
    notes: v.optional(v.string()),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const association = await ctx.db.get(args.associationId)
    if (!association) {
      throw new Error("Association not found")
    }

    await ctx.db.patch(args.associationId, {
      role: args.role,
      notes: args.notes,
    })

    // Log the action
    await ctx.db.insert("auditLogs", {
      action: "updated",
      entityType: "projectContacts",
      entityId: args.associationId,
      userId: args.userId,
      changes: JSON.stringify({
        role: { from: association.role, to: args.role },
        notes: { from: association.notes, to: args.notes },
      }),
      timestamp: Date.now(),
    })

    return args.associationId
  },
})

// Get available contacts to add to a project (excluding already associated)
export const getAvailableContacts = query({
  args: {
    projectId: v.id("projects"),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get all contacts
    let allContacts = await ctx.db.query("contacts").collect()
    
    // Filter by search if provided
    if (args.search) {
      const searchLower = args.search.toLowerCase()
      allContacts = allContacts.filter(
        (contact) =>
          contact.name.toLowerCase().includes(searchLower) ||
          contact.email.toLowerCase().includes(searchLower) ||
          (contact.company && contact.company.toLowerCase().includes(searchLower))
      )
    }

    // Get associated contact IDs
    const associations = await ctx.db
      .query("projectContacts")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect()
    
    const associatedContactIds = new Set(associations.map(a => a.contactId))

    // Filter out already associated contacts
    return allContacts.filter(contact => !associatedContactIds.has(contact._id))
  },
})