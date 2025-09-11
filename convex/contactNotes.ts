import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { getUserById } from "./users"
import { getContactById } from "./contacts"

export const list = query({
  args: {
    contactId: v.id("contacts"),
  },
  handler: async (ctx, args) => {
    const notes = await ctx.db
      .query("contactNotes")
      .withIndex("by_contact", (q) => q.eq("contactId", args.contactId))
      .order("desc")
      .collect()

    // Get creator names
    const userIds = [...new Set(notes.map(note => note.createdBy))]
    const users = await Promise.all(userIds.map(id => ctx.db.get(id)))
    const userMap = new Map(users.filter(Boolean).map(user => [user!._id, user!.name]))

    return notes.map((note) => ({
      ...note,
      id: note._id,
      createdByName: userMap.get(note.createdBy) || "Unknown User",
    }))
  },
})

export const create = mutation({
  args: {
    contactId: v.id("contacts"),
    content: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await getUserById(ctx, args.userId)
    if (!user) throw new Error("User not found")

    const contact = await getContactById(ctx, args.contactId)
    if (!contact) throw new Error("Contact not found")

    const noteId = await ctx.db.insert("contactNotes", {
      contactId: args.contactId,
      content: args.content,
      createdBy: user._id,
      createdAt: Date.now(),
    })

    return noteId
  },
})

export const update = mutation({
  args: {
    id: v.id("contactNotes"),
    content: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await getUserById(ctx, args.userId)
    if (!user) throw new Error("User not found")

    const note = await ctx.db.get(args.id)
    if (!note) throw new Error("Note not found")

    if (note.createdBy !== user._id && user.role !== "admin") {
      throw new Error("You can only edit your own notes")
    }

    await ctx.db.patch(args.id, {
      content: args.content,
      updatedAt: Date.now(),
    })
  },
})

export const remove = mutation({
  args: {
    id: v.id("contactNotes"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await getUserById(ctx, args.userId)
    if (!user) throw new Error("User not found")

    const note = await ctx.db.get(args.id)
    if (!note) throw new Error("Note not found")

    if (note.createdBy !== user._id && user.role !== "admin") {
      throw new Error("You can only delete your own notes")
    }

    await ctx.db.delete(args.id)
  },
})