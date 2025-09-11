import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { getUserById } from "./users"
import { getContactById } from "./contacts"

export const list = query({
  args: {
    contactId: v.id("contacts"),
  },
  handler: async (ctx, args) => {
    const communications = await ctx.db
      .query("contactCommunications")
      .withIndex("by_contact", (q) => q.eq("contactId", args.contactId))
      .order("desc")
      .collect()

    return communications.map((comm) => ({
      ...comm,
      id: comm._id,
    }))
  },
})

export const create = mutation({
  args: {
    contactId: v.id("contacts"),
    type: v.union(v.literal("email"), v.literal("call"), v.literal("meeting")),
    subject: v.string(),
    notes: v.optional(v.string()),
    date: v.optional(v.number()),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await getUserById(ctx, args.userId)
    if (!user) throw new Error("User not found")

    const contact = await getContactById(ctx, args.contactId)
    if (!contact) throw new Error("Contact not found")

    const communicationId = await ctx.db.insert("contactCommunications", {
      contactId: args.contactId,
      type: args.type,
      subject: args.subject,
      notes: args.notes,
      date: args.date || Date.now(),
      createdBy: user._id,
      createdAt: Date.now(),
    })

    return communicationId
  },
})

export const update = mutation({
  args: {
    id: v.id("contactCommunications"),
    type: v.optional(v.union(v.literal("email"), v.literal("call"), v.literal("meeting"))),
    subject: v.optional(v.string()),
    notes: v.optional(v.string()),
    date: v.optional(v.number()),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await getUserById(ctx, args.userId)
    if (!user) throw new Error("User not found")

    const communication = await ctx.db.get(args.id)
    if (!communication) throw new Error("Communication not found")

    if (communication.createdBy !== user._id && user.role !== "admin") {
      throw new Error("You can only edit your own communications")
    }

    const updates: any = {}
    if (args.type !== undefined) updates.type = args.type
    if (args.subject !== undefined) updates.subject = args.subject
    if (args.notes !== undefined) updates.notes = args.notes
    if (args.date !== undefined) updates.date = args.date

    await ctx.db.patch(args.id, updates)
  },
})

export const remove = mutation({
  args: {
    id: v.id("contactCommunications"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await getUserById(ctx, args.userId)
    if (!user) throw new Error("User not found")

    const communication = await ctx.db.get(args.id)
    if (!communication) throw new Error("Communication not found")

    if (communication.createdBy !== user._id && user.role !== "admin") {
      throw new Error("You can only delete your own communications")
    }

    await ctx.db.delete(args.id)
  },
})