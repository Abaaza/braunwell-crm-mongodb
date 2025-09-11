import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

export const exportData = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get all data for backup
    const [
      users,
      contacts,
      projects,
      tasks,
      projectContacts,
      contactCommunications,
      contactNotes,
      projectPayments,
      taskTemplates,
      organizationSettings,
      notificationSettings,
      securitySettings,
    ] = await Promise.all([
      ctx.db.query("users").collect(),
      ctx.db.query("contacts").collect(),
      ctx.db.query("projects").collect(),
      ctx.db.query("tasks").collect(),
      ctx.db.query("projectContacts").collect(),
      ctx.db.query("contactCommunications").collect(),
      ctx.db.query("contactNotes").collect(),
      ctx.db.query("projectPayments").collect(),
      ctx.db.query("taskTemplates").collect(),
      ctx.db.query("organizationSettings").collect(),
      ctx.db.query("notificationSettings").collect(),
      ctx.db.query("securitySettings").collect(),
    ])

    // Create backup object
    const backup = {
      version: "1.0",
      timestamp: Date.now(),
      exportedBy: args.userId,
      data: {
        users: users.map(({ _id, _creationTime, ...user }) => user),
        contacts: contacts.map(({ _id, _creationTime, ...contact }) => ({ 
          ...contact,
          originalId: _id 
        })),
        projects: projects.map(({ _id, _creationTime, ...project }) => ({ 
          ...project,
          originalId: _id 
        })),
        tasks: tasks.map(({ _id, _creationTime, ...task }) => ({ 
          ...task,
          originalId: _id 
        })),
        projectContacts: projectContacts.map(({ _id, _creationTime, ...pc }) => pc),
        contactCommunications: contactCommunications.map(({ _id, _creationTime, ...cc }) => cc),
        contactNotes: contactNotes.map(({ _id, _creationTime, ...cn }) => cn),
        projectPayments: projectPayments.map(({ _id, _creationTime, ...pp }) => pp),
        taskTemplates: taskTemplates.map(({ _id, _creationTime, ...tt }) => tt),
        organizationSettings: organizationSettings.map(({ _id, _creationTime, ...os }) => os),
        notificationSettings: notificationSettings.map(({ _id, _creationTime, ...ns }) => ns),
        securitySettings: securitySettings.map(({ _id, _creationTime, ...ss }) => ss),
      },
    }

    // Note: Cannot log in queries as they are read-only
    // Audit logging should be done on the client side after successful export

    return backup
  },
})

export const logExport = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Log backup export
    await ctx.db.insert("auditLogs", {
      action: "exported",
      entityType: "backup",
      entityId: "full_backup",
      userId: args.userId,
      timestamp: Date.now(),
    })
  },
})

export const restoreData = mutation({
  args: {
    backup: v.object({
      version: v.string(),
      timestamp: v.number(),
      exportedBy: v.id("users"),
      data: v.object({
        contacts: v.array(v.any()),
        projects: v.array(v.any()),
        tasks: v.array(v.any()),
        projectContacts: v.array(v.any()),
        contactCommunications: v.array(v.any()),
        contactNotes: v.array(v.any()),
        projectPayments: v.array(v.any()),
        taskTemplates: v.array(v.any()),
      }),
    }),
    userId: v.id("users"),
    clearExisting: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    
    // If clearExisting is true, delete existing data first
    if (args.clearExisting) {
      // Delete in reverse dependency order
      const [
        taskTemplates,
        projectPayments,
        contactNotes,
        contactCommunications,
        projectContacts,
        tasks,
        projects,
        contacts,
      ] = await Promise.all([
        ctx.db.query("taskTemplates").collect(),
        ctx.db.query("projectPayments").collect(),
        ctx.db.query("contactNotes").collect(),
        ctx.db.query("contactCommunications").collect(),
        ctx.db.query("projectContacts").collect(),
        ctx.db.query("tasks").collect(),
        ctx.db.query("projects").collect(),
        ctx.db.query("contacts").collect(),
      ])

      // Delete all records
      for (const record of [...taskTemplates, ...projectPayments, ...contactNotes, 
                               ...contactCommunications, ...projectContacts, ...tasks, 
                               ...projects, ...contacts]) {
        await ctx.db.delete(record._id)
      }
    }

    // Maps to track old ID to new ID mapping
    const contactIdMap = new Map<string, any>()
    const projectIdMap = new Map<string, any>()
    const taskIdMap = new Map<string, any>()

    // Restore contacts
    for (const contact of args.backup.data.contacts) {
      const { originalId, ...contactData } = contact
      const newId = await ctx.db.insert("contacts", {
        ...contactData,
        createdAt: contactData.createdAt || now,
        updatedAt: now,
      })
      if (originalId) {
        contactIdMap.set(originalId, newId)
      }
    }

    // Restore projects
    for (const project of args.backup.data.projects) {
      const { originalId, ...projectData } = project
      const newId = await ctx.db.insert("projects", {
        ...projectData,
        createdAt: projectData.createdAt || now,
        updatedAt: now,
      })
      if (originalId) {
        projectIdMap.set(originalId, newId)
      }
    }

    // Restore tasks with updated project references
    for (const task of args.backup.data.tasks) {
      const { originalId, projectId, assignedTo, dependencies, blockedBy, parentTaskId, ...taskData } = task
      const newProjectId = projectIdMap.get(projectId) || projectId
      
      const newId = await ctx.db.insert("tasks", {
        ...taskData,
        projectId: newProjectId,
        assignedTo: assignedTo || undefined,
        dependencies: undefined, // Will update in second pass
        blockedBy: undefined, // Will update in second pass
        parentTaskId: undefined, // Will update in second pass
        createdAt: taskData.createdAt || now,
        updatedAt: now,
      })
      if (originalId) {
        taskIdMap.set(originalId, newId)
      }
    }

    // Second pass: Update task dependencies and relationships
    for (const task of args.backup.data.tasks) {
      if (task.originalId && (task.dependencies || task.blockedBy || task.parentTaskId)) {
        const newTaskId = taskIdMap.get(task.originalId)
        if (newTaskId) {
          const updates: any = {}
          
          if (task.dependencies) {
            updates.dependencies = task.dependencies
              .map((depId: string) => taskIdMap.get(depId) || depId)
              .filter((id: any) => id)
          }
          
          if (task.blockedBy) {
            updates.blockedBy = task.blockedBy
              .map((blockedId: string) => taskIdMap.get(blockedId) || blockedId)
              .filter((id: any) => id)
          }
          
          if (task.parentTaskId) {
            const newParentId = taskIdMap.get(task.parentTaskId)
            if (newParentId) {
              updates.parentTaskId = newParentId
            }
          }
          
          if (Object.keys(updates).length > 0) {
            await ctx.db.patch(newTaskId, updates)
          }
        }
      }
    }

    // Restore project contacts with updated references
    for (const pc of args.backup.data.projectContacts) {
      const newProjectId = projectIdMap.get(pc.projectId) || pc.projectId
      const newContactId = contactIdMap.get(pc.contactId) || pc.contactId
      
      await ctx.db.insert("projectContacts", {
        ...pc,
        projectId: newProjectId,
        contactId: newContactId,
        createdAt: pc.createdAt || now,
      })
    }

    // Restore other data with updated references
    for (const comm of args.backup.data.contactCommunications) {
      const newContactId = contactIdMap.get(comm.contactId) || comm.contactId
      await ctx.db.insert("contactCommunications", {
        ...comm,
        contactId: newContactId,
        createdAt: comm.createdAt || now,
      })
    }

    for (const note of args.backup.data.contactNotes) {
      const newContactId = contactIdMap.get(note.contactId) || note.contactId
      await ctx.db.insert("contactNotes", {
        ...note,
        contactId: newContactId,
        createdAt: note.createdAt || now,
        updatedAt: note.updatedAt || now,
      })
    }

    for (const payment of args.backup.data.projectPayments) {
      const newProjectId = projectIdMap.get(payment.projectId) || payment.projectId
      await ctx.db.insert("projectPayments", {
        ...payment,
        projectId: newProjectId,
        createdAt: payment.createdAt || now,
      })
    }

    for (const template of args.backup.data.taskTemplates) {
      await ctx.db.insert("taskTemplates", {
        ...template,
        createdAt: template.createdAt || now,
        updatedAt: template.updatedAt || now,
      })
    }

    // Log restore operation
    await ctx.db.insert("auditLogs", {
      action: "restored",
      entityType: "backup",
      entityId: "full_restore",
      userId: args.userId,
      changes: JSON.stringify({
        contactsRestored: args.backup.data.contacts.length,
        projectsRestored: args.backup.data.projects.length,
        tasksRestored: args.backup.data.tasks.length,
        clearExisting: args.clearExisting,
      }),
      timestamp: now,
    })

    return {
      success: true,
      restored: {
        contacts: args.backup.data.contacts.length,
        projects: args.backup.data.projects.length,
        tasks: args.backup.data.tasks.length,
        projectContacts: args.backup.data.projectContacts.length,
        contactCommunications: args.backup.data.contactCommunications.length,
        contactNotes: args.backup.data.contactNotes.length,
        projectPayments: args.backup.data.projectPayments.length,
        taskTemplates: args.backup.data.taskTemplates.length,
      },
    }
  },
})