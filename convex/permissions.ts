import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

// Define available permissions
export const permissions = [
  // Projects
  { id: "projects.view", category: "Projects", name: "View Projects", description: "View all projects" },
  { id: "projects.create", category: "Projects", name: "Create Projects", description: "Create new projects" },
  { id: "projects.edit", category: "Projects", name: "Edit Projects", description: "Edit existing projects" },
  { id: "projects.delete", category: "Projects", name: "Delete Projects", description: "Delete projects" },
  
  // Contacts
  { id: "contacts.view", category: "Contacts", name: "View Contacts", description: "View all contacts" },
  { id: "contacts.create", category: "Contacts", name: "Create Contacts", description: "Create new contacts" },
  { id: "contacts.edit", category: "Contacts", name: "Edit Contacts", description: "Edit existing contacts" },
  { id: "contacts.delete", category: "Contacts", name: "Delete Contacts", description: "Delete contacts" },
  
  // Tasks
  { id: "tasks.view", category: "Tasks", name: "View Tasks", description: "View all tasks" },
  { id: "tasks.create", category: "Tasks", name: "Create Tasks", description: "Create new tasks" },
  { id: "tasks.edit", category: "Tasks", name: "Edit Tasks", description: "Edit existing tasks" },
  { id: "tasks.delete", category: "Tasks", name: "Delete Tasks", description: "Delete tasks" },
  { id: "tasks.assign", category: "Tasks", name: "Assign Tasks", description: "Assign tasks to users" },
  
  // Analytics
  { id: "analytics.view", category: "Analytics", name: "View Analytics", description: "Access analytics dashboard" },
  { id: "analytics.export", category: "Analytics", name: "Export Analytics", description: "Export analytics data" },
  
  // Settings
  { id: "settings.view", category: "Settings", name: "View Settings", description: "View system settings" },
  { id: "settings.edit", category: "Settings", name: "Edit Settings", description: "Modify system settings" },
  
  // Users
  { id: "users.view", category: "Users", name: "View Users", description: "View all users" },
  { id: "users.create", category: "Users", name: "Create Users", description: "Create new users" },
  { id: "users.edit", category: "Users", name: "Edit Users", description: "Edit user profiles" },
  { id: "users.delete", category: "Users", name: "Delete Users", description: "Delete users" },
  { id: "users.permissions", category: "Users", name: "Manage Permissions", description: "Manage user permissions" },
  
  // System
  { id: "system.backup", category: "System", name: "Backup System", description: "Create system backups" },
  { id: "system.restore", category: "System", name: "Restore System", description: "Restore from backups" },
  { id: "system.logs", category: "System", name: "View Logs", description: "View system and audit logs" },
]

export const getPermissions = query({
  handler: async () => {
    return permissions
  },
})

export const getUserPermissions = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)
    if (!user) throw new Error("User not found")
    
    // Admins have all permissions
    if (user.role === "admin") {
      return permissions.map(p => p.id)
    }
    
    // For regular users, check stored permissions
    // For now, we'll return a default set
    // In a real implementation, you'd store these in a userPermissions table
    return [
      "projects.view",
      "contacts.view",
      "contacts.create",
      "contacts.edit",
      "tasks.view",
      "tasks.create",
      "tasks.edit",
      "analytics.view",
    ]
  },
})

export const updateUserPermissions = mutation({
  args: {
    userId: v.id("users"),
    permissions: v.array(v.string()),
    updatedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)
    if (!user) throw new Error("User not found")
    
    // For now, we'll just log the change
    // In a real implementation, you'd store these in a userPermissions table
    await ctx.db.insert("auditLogs", {
      action: "updated",
      entityType: "permissions",
      entityId: args.userId,
      userId: args.updatedBy,
      changes: JSON.stringify({
        permissions: args.permissions,
      }),
      timestamp: Date.now(),
    })
    
    return { success: true }
  },
})