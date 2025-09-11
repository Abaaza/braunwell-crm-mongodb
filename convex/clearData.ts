import { mutation } from "./_generated/server"

export const clearAllData = mutation({
  handler: async (ctx) => {
    // Delete all data from all tables
    const tables = [
      "auditLogs",
      "projectContacts", 
      "tasks",
      "projects",
      "contacts",
      "sessions",
      "users",
    ]

    for (const table of tables) {
      const docs = await ctx.db.query(table as any).collect()
      for (const doc of docs) {
        await ctx.db.delete(doc._id)
      }
    }

    return { message: "All data cleared successfully" }
  },
})