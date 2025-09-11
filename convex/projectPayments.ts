import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { getUserById } from "./users"
import { getProjectById } from "./projects"
import { sendNotificationToUsers } from "./notifications"

// Local wrapper functions for encryption/decryption
function encryptEntityData(data: any, entityType: string) {
  // For now, just return the data as-is
  // In a real implementation, this would encrypt sensitive fields
  return data
}

function decryptEntityData(data: any, entityType: string) {
  // For now, just return the data as-is
  // In a real implementation, this would decrypt sensitive fields
  return data
}

export const list = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const payments = await ctx.db
      .query("projectPayments")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .collect()

    // Decrypt sensitive payment data
    const decryptedPayments = payments.map(payment => decryptEntityData(payment, 'projectPayments'))

    // Get creator names
    const userIds = [...new Set(payments.map(payment => payment.createdBy))]
    const users = await Promise.all(userIds.map(id => ctx.db.get(id)))
    const userMap = new Map(users.filter(Boolean).map(user => [user!._id, (user as any).name || "Unknown"]))

    return decryptedPayments.map((payment) => ({
      ...payment,
      id: payment._id,
      createdByName: userMap.get(payment.createdBy) || "Unknown User",
    }))
  },
})

export const getTotalPaid = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const payments = await ctx.db
      .query("projectPayments")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect()

    // Note: amount is not encrypted in our current config, but we decrypt for consistency
    const decryptedPayments = payments.map(payment => decryptEntityData(payment, 'projectPayments'))

    return decryptedPayments.reduce((sum, payment) => sum + payment.amount, 0)
  },
})

export const getVATSummary = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const payments = await ctx.db
      .query("projectPayments")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect()

    // Decrypt payments for calculation
    const decryptedPayments = payments.map(payment => decryptEntityData(payment, 'projectPayments'))

    const summary = {
      totalNet: 0,
      totalVAT: 0,
      totalGross: 0,
      count: payments.length,
    }

    for (const payment of decryptedPayments) {
      summary.totalNet += payment.netAmount || 0
      summary.totalVAT += payment.vatAmount || 0
      summary.totalGross += payment.grossAmount || payment.amount
    }

    return summary
  },
})

export const getPaymentsByVATStatus = query({
  args: {
    projectId: v.optional(v.id("projects")),
    vatInclusive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let payments = await ctx.db.query("projectPayments").collect()

    // Decrypt payments for filtering
    let decryptedPayments = payments.map(payment => decryptEntityData(payment, 'projectPayments'))

    if (args.projectId) {
      decryptedPayments = decryptedPayments.filter(p => p.projectId === args.projectId)
    }

    if (args.vatInclusive !== undefined) {
      decryptedPayments = decryptedPayments.filter(p => p.isVATInclusive === args.vatInclusive)
    }

    // Get creator names
    const userIds = [...new Set(decryptedPayments.map(payment => payment.createdBy))]
    const users = await Promise.all(userIds.map(id => ctx.db.get(id)))
    const userMap = new Map(users.filter(Boolean).map(user => [user!._id, (user as any).name || "Unknown"]))

    return decryptedPayments.map((payment) => ({
      ...payment,
      id: payment._id,
      createdByName: userMap.get(payment.createdBy) || "Unknown User",
    }))
  },
})

export const create = mutation({
  args: {
    projectId: v.id("projects"),
    amount: v.number(),
    date: v.optional(v.number()),
    method: v.optional(v.union(v.literal("bank_transfer"), v.literal("card"), v.literal("cash"), v.literal("cheque"))),
    reference: v.optional(v.string()),
    notes: v.optional(v.string()),
    // VAT fields
    netAmount: v.optional(v.number()),
    vatAmount: v.optional(v.number()),
    grossAmount: v.optional(v.number()),
    vatRate: v.optional(v.number()),
    isVATInclusive: v.optional(v.boolean()),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await getUserById(ctx, args.userId)
    if (!user) throw new Error("User not found")

    const project = await getProjectById(ctx, args.projectId)
    if (!project) throw new Error("Project not found")

    // Get company settings for default VAT rate
    const companySettings = await ctx.db.query("companySettings").first()
    const defaultVATRate = companySettings?.invoiceSettings?.defaultVATRate || 0.20

    // Calculate VAT amounts based on whether payment is VAT inclusive or not
    let netAmount: number
    let vatAmount: number
    let grossAmount: number
    let vatRate: number

    if (args.isVATInclusive !== undefined && args.netAmount !== undefined && args.vatAmount !== undefined) {
      // Use provided values
      netAmount = args.netAmount
      vatAmount = args.vatAmount
      grossAmount = args.grossAmount || (netAmount + vatAmount)
      vatRate = args.vatRate || defaultVATRate
    } else if (args.isVATInclusive === true) {
      // Payment amount includes VAT - calculate net amount
      grossAmount = args.amount
      vatRate = args.vatRate || defaultVATRate
      netAmount = grossAmount / (1 + vatRate)
      vatAmount = grossAmount - netAmount
    } else {
      // Payment amount excludes VAT - calculate gross amount
      netAmount = args.amount
      vatRate = args.vatRate || defaultVATRate
      vatAmount = netAmount * vatRate
      grossAmount = netAmount + vatAmount
    }

    // Prepare payment data
    const paymentData = {
      projectId: args.projectId,
      amount: args.amount,
      date: args.date || Date.now(),
      method: args.method,
      reference: args.reference,
      notes: args.notes,
      netAmount,
      vatAmount,
      grossAmount,
      vatRate,
      isVATInclusive: args.isVATInclusive || false,
      createdBy: user._id,
      createdAt: Date.now(),
    }

    // Encrypt sensitive fields
    const encryptedPaymentData = encryptEntityData(paymentData, 'projectPayments')

    const paymentId = await ctx.db.insert("projectPayments", encryptedPaymentData)

    // Log the payment
    await ctx.db.insert("auditLogs", {
      action: "payment_added",
      entityType: "project",
      entityId: args.projectId,
      userId: user._id,
      changes: JSON.stringify({ 
        amount: args.amount,
        netAmount,
        vatAmount,
        grossAmount,
        vatRate,
      }),
      timestamp: Date.now(),
    })

    // Send notification for payment received
    const allUsers = await ctx.db.query("users").collect()
    const otherUsers = allUsers.filter(u => u._id !== user._id && u.isActive)
    
    // Send notifications
    // Note: In production, this would be done via scheduler or as a separate mutation
    // For now, we'll skip notifications to avoid mutation calling mutation error

    return paymentId
  },
})

export const update = mutation({
  args: {
    id: v.id("projectPayments"),
    amount: v.optional(v.number()),
    date: v.optional(v.number()),
    method: v.optional(v.union(v.literal("bank_transfer"), v.literal("card"), v.literal("cash"), v.literal("cheque"))),
    reference: v.optional(v.string()),
    notes: v.optional(v.string()),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await getUserById(ctx, args.userId)
    if (!user) throw new Error("User not found")

    const payment = await ctx.db.get(args.id)
    if (!payment) throw new Error("Payment not found")

    if (payment.createdBy !== user._id && user.role !== "admin") {
      throw new Error("You can only edit your own payments")
    }

    const updates: any = {}
    if (args.amount !== undefined) updates.amount = args.amount
    if (args.date !== undefined) updates.date = args.date
    if (args.method !== undefined) updates.method = args.method
    if (args.reference !== undefined) updates.reference = args.reference
    if (args.notes !== undefined) updates.notes = args.notes

    // Encrypt sensitive fields in updates
    const encryptedUpdates = encryptEntityData(updates, 'projectPayments')

    await ctx.db.patch(args.id, encryptedUpdates)

    // Log the update
    await ctx.db.insert("auditLogs", {
      action: "payment_updated",
      entityType: "project",
      entityId: payment.projectId,
      userId: user._id,
      changes: JSON.stringify(updates), // Log unencrypted changes for audit trail
      timestamp: Date.now(),
    })
  },
})

export const remove = mutation({
  args: {
    id: v.id("projectPayments"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await getUserById(ctx, args.userId)
    if (!user) throw new Error("User not found")

    const payment = await ctx.db.get(args.id)
    if (!payment) throw new Error("Payment not found")

    if (user.role !== "admin") {
      throw new Error("Only admins can delete payments")
    }

    // Decrypt payment data for audit logging
    const decryptedPayment = decryptEntityData(payment, 'projectPayments')

    await ctx.db.delete(args.id)

    // Log the deletion
    await ctx.db.insert("auditLogs", {
      action: "payment_deleted",
      entityType: "project",
      entityId: payment.projectId,
      userId: user._id,
      changes: JSON.stringify({ amount: decryptedPayment.amount }),
      timestamp: Date.now(),
    })
  },
})