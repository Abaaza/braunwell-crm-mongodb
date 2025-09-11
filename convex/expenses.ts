import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { getUserById } from "./users"
import { getProjectById } from "./projects"
import { sendNotificationToUsers } from "./notifications"

// Helper function to calculate VAT amounts
function calculateVATAmounts(
  amount: number,
  isVATInclusive: boolean,
  vatRate: number
) {
  let netAmount: number
  let vatAmount: number
  let grossAmount: number

  if (isVATInclusive) {
    // Amount includes VAT - calculate net amount
    grossAmount = amount
    netAmount = grossAmount / (1 + vatRate)
    vatAmount = grossAmount - netAmount
  } else {
    // Amount excludes VAT - calculate gross amount
    netAmount = amount
    vatAmount = netAmount * vatRate
    grossAmount = netAmount + vatAmount
  }

  return {
    netAmount: Math.round(netAmount * 100) / 100,
    vatAmount: Math.round(vatAmount * 100) / 100,
    grossAmount: Math.round(grossAmount * 100) / 100,
  }
}

export const list = query({
  args: {
    projectId: v.optional(v.id("projects")),
    category: v.optional(v.string()),
    status: v.optional(v.string()),
    dateFrom: v.optional(v.number()),
    dateTo: v.optional(v.number()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let expenses = await ctx.db
      .query("expenses")
      .order("desc")
      .collect()

    // Apply filters
    if (args.projectId !== undefined) {
      expenses = expenses.filter(e => e.projectId === args.projectId)
    }

    if (args.category) {
      expenses = expenses.filter(e => e.category === args.category)
    }

    if (args.status) {
      expenses = expenses.filter(e => e.status === args.status)
    }

    if (args.dateFrom) {
      const dateFrom = args.dateFrom
      expenses = expenses.filter(e => e.date >= dateFrom)
    }

    if (args.dateTo) {
      const dateTo = args.dateTo
      expenses = expenses.filter(e => e.date <= dateTo)
    }

    if (args.search) {
      const searchLower = args.search.toLowerCase()
      expenses = expenses.filter(e =>
        e.description.toLowerCase().includes(searchLower) ||
        e.vendor?.toLowerCase().includes(searchLower) ||
        e.reference?.toLowerCase().includes(searchLower)
      )
    }

    // Get creator and approver names
    const userIds = [...new Set([
      ...expenses.map(e => e.createdBy),
      ...expenses.filter(e => e.approvedBy).map(e => e.approvedBy!)
    ])]
    
    const users = await Promise.all(userIds.map(id => ctx.db.get(id)))
    const userMap = new Map(users.filter(Boolean).map(user => [user!._id, (user as any).name || "Unknown"]))

    // Get project names
    const projectIds = [...new Set(expenses.filter(e => e.projectId).map(e => e.projectId!))]
    const projects = await Promise.all(projectIds.map(id => ctx.db.get(id)))
    const projectMap = new Map(projects.filter(Boolean).map(project => [project!._id, (project as any).name || "Unknown"]))

    return expenses.map(expense => ({
      ...expense,
      id: expense._id,
      createdByName: userMap.get(expense.createdBy) || "Unknown User",
      approvedByName: expense.approvedBy ? userMap.get(expense.approvedBy) || "Unknown User" : null,
      projectName: expense.projectId ? projectMap.get(expense.projectId) || "Unknown Project" : null,
    }))
  },
})

export const get = query({
  args: { id: v.id("expenses") },
  handler: async (ctx, args) => {
    const expense = await ctx.db.get(args.id)
    if (!expense) return null

    const creator = await ctx.db.get(expense.createdBy)
    const approver = expense.approvedBy ? await ctx.db.get(expense.approvedBy) : null
    const project = expense.projectId ? await ctx.db.get(expense.projectId) : null

    return {
      ...expense,
      id: expense._id,
      createdByName: (creator as any)?.name || "Unknown User",
      approvedByName: approver ? (approver as any)?.name || "Unknown User" : null,
      projectName: project ? (project as any)?.name || "Unknown Project" : null,
    }
  },
})

export const getTotalByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_project", q => q.eq("projectId", args.projectId))
      .collect()

    const totals = {
      total: 0,
      approved: 0,
      pending: 0,
      paid: 0,
      count: expenses.length,
    }

    for (const expense of expenses) {
      totals.total += expense.grossAmount
      if (expense.status === "approved") totals.approved += expense.grossAmount
      if (expense.status === "pending") totals.pending += expense.grossAmount
      if (expense.status === "paid") totals.paid += expense.grossAmount
    }

    return totals
  },
})

export const getByCategory = query({
  args: {
    dateFrom: v.optional(v.number()),
    dateTo: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let expenses = await ctx.db.query("expenses").collect()

    if (args.dateFrom) {
      const dateFrom = args.dateFrom
      expenses = expenses.filter(e => e.date >= dateFrom)
    }

    if (args.dateTo) {
      const dateTo = args.dateTo
      expenses = expenses.filter(e => e.date <= dateTo)
    }

    const categoryTotals = new Map<string, number>()

    for (const expense of expenses) {
      const current = categoryTotals.get(expense.category) || 0
      categoryTotals.set(expense.category, current + expense.grossAmount)
    }

    return Array.from(categoryTotals.entries()).map(([category, total]) => ({
      category,
      total,
    }))
  },
})

export const create = mutation({
  args: {
    description: v.string(),
    amount: v.number(),
    date: v.optional(v.number()),
    projectId: v.optional(v.id("projects")),
    category: v.union(
      v.literal("travel"),
      v.literal("equipment"),
      v.literal("software"),
      v.literal("office"),
      v.literal("marketing"),
      v.literal("professional_services"),
      v.literal("utilities"),
      v.literal("insurance"),
      v.literal("other")
    ),
    isVATInclusive: v.boolean(),
    vatRate: v.optional(v.number()),
    paymentMethod: v.optional(v.union(
      v.literal("bank_transfer"),
      v.literal("card"),
      v.literal("cash"),
      v.literal("cheque"),
      v.literal("direct_debit")
    )),
    reference: v.optional(v.string()),
    vendor: v.optional(v.string()),
    receiptUrl: v.optional(v.string()),
    notes: v.optional(v.string()),
    isRecurring: v.optional(v.boolean()),
    recurringPattern: v.optional(v.union(
      v.literal("monthly"),
      v.literal("quarterly"),
      v.literal("yearly")
    )),
    recurringEndDate: v.optional(v.number()),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await getUserById(ctx, args.userId)
    if (!user) throw new Error("User not found")

    // Validate project if provided
    if (args.projectId) {
      const project = await getProjectById(ctx, args.projectId)
      if (!project) throw new Error("Project not found")
    }

    // Get company settings for default VAT rate
    const companySettings = await ctx.db.query("companySettings").first()
    const defaultVATRate = companySettings?.invoiceSettings?.defaultVATRate || 0.20

    // Calculate VAT amounts
    const vatRate = args.vatRate || defaultVATRate
    const { netAmount, vatAmount, grossAmount } = calculateVATAmounts(
      args.amount,
      args.isVATInclusive,
      vatRate
    )

    const expenseData = {
      description: args.description,
      amount: args.amount,
      date: args.date || Date.now(),
      projectId: args.projectId,
      category: args.category,
      status: "pending" as const,
      netAmount,
      vatAmount,
      grossAmount,
      vatRate,
      isVATInclusive: args.isVATInclusive,
      paymentMethod: args.paymentMethod,
      reference: args.reference,
      vendor: args.vendor,
      receiptUrl: args.receiptUrl,
      notes: args.notes,
      isRecurring: args.isRecurring,
      recurringPattern: args.recurringPattern,
      recurringEndDate: args.recurringEndDate,
      createdBy: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    const expenseId = await ctx.db.insert("expenses", expenseData)

    // Log the creation
    await ctx.db.insert("auditLogs", {
      action: "expense_created",
      entityType: "expenses",
      entityId: expenseId,
      userId: user._id,
      changes: JSON.stringify({
        amount: args.amount,
        category: args.category,
        projectId: args.projectId,
      }),
      timestamp: Date.now(),
      successful: true,
      category: "data_modification",
    })

    // Send notification to admins for approval
    const admins = await ctx.db
      .query("users")
      .filter(q => q.eq(q.field("role"), "admin"))
      .collect()

    // Note: In production, notifications would be sent via scheduler
    // to avoid mutation calling mutation error

    return expenseId
  },
})

export const update = mutation({
  args: {
    id: v.id("expenses"),
    description: v.optional(v.string()),
    amount: v.optional(v.number()),
    date: v.optional(v.number()),
    category: v.optional(v.union(
      v.literal("travel"),
      v.literal("equipment"),
      v.literal("software"),
      v.literal("office"),
      v.literal("marketing"),
      v.literal("professional_services"),
      v.literal("utilities"),
      v.literal("insurance"),
      v.literal("other")
    )),
    isVATInclusive: v.optional(v.boolean()),
    vatRate: v.optional(v.number()),
    paymentMethod: v.optional(v.union(
      v.literal("bank_transfer"),
      v.literal("card"),
      v.literal("cash"),
      v.literal("cheque"),
      v.literal("direct_debit")
    )),
    reference: v.optional(v.string()),
    vendor: v.optional(v.string()),
    receiptUrl: v.optional(v.string()),
    notes: v.optional(v.string()),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await getUserById(ctx, args.userId)
    if (!user) throw new Error("User not found")

    const expense = await ctx.db.get(args.id)
    if (!expense) throw new Error("Expense not found")

    // Check permissions
    if (expense.createdBy !== user._id && user.role !== "admin") {
      throw new Error("You can only edit your own expenses")
    }

    // Can't edit approved or paid expenses unless admin
    if ((expense.status === "approved" || expense.status === "paid") && user.role !== "admin") {
      throw new Error("Cannot edit approved or paid expenses")
    }

    const updates: any = { updatedAt: Date.now() }

    // Update basic fields if provided
    if (args.description !== undefined) updates.description = args.description
    if (args.date !== undefined) updates.date = args.date
    if (args.category !== undefined) updates.category = args.category
    if (args.paymentMethod !== undefined) updates.paymentMethod = args.paymentMethod
    if (args.reference !== undefined) updates.reference = args.reference
    if (args.vendor !== undefined) updates.vendor = args.vendor
    if (args.receiptUrl !== undefined) updates.receiptUrl = args.receiptUrl
    if (args.notes !== undefined) updates.notes = args.notes

    // Handle amount/VAT updates
    if (args.amount !== undefined || args.isVATInclusive !== undefined || args.vatRate !== undefined) {
      const amount = args.amount ?? expense.amount
      const isVATInclusive = args.isVATInclusive ?? expense.isVATInclusive
      const vatRate = args.vatRate ?? expense.vatRate

      const { netAmount, vatAmount, grossAmount } = calculateVATAmounts(
        amount,
        isVATInclusive,
        vatRate
      )

      updates.amount = amount
      updates.isVATInclusive = isVATInclusive
      updates.vatRate = vatRate
      updates.netAmount = netAmount
      updates.vatAmount = vatAmount
      updates.grossAmount = grossAmount
    }

    await ctx.db.patch(args.id, updates)

    // Log the update
    await ctx.db.insert("auditLogs", {
      action: "expense_updated",
      entityType: "expenses",
      entityId: args.id,
      userId: user._id,
      changes: JSON.stringify(updates),
      timestamp: Date.now(),
      successful: true,
      category: "data_modification",
    })
  },
})

export const approve = mutation({
  args: {
    id: v.id("expenses"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await getUserById(ctx, args.userId)
    if (!user) throw new Error("User not found")

    if (user.role !== "admin") {
      throw new Error("Only admins can approve expenses")
    }

    const expense = await ctx.db.get(args.id)
    if (!expense) throw new Error("Expense not found")

    if (expense.status !== "pending") {
      throw new Error("Can only approve pending expenses")
    }

    await ctx.db.patch(args.id, {
      status: "approved",
      approvedBy: user._id,
      approvedAt: Date.now(),
      updatedAt: Date.now(),
    })

    // Log the approval
    await ctx.db.insert("auditLogs", {
      action: "expense_approved",
      entityType: "expenses",
      entityId: args.id,
      userId: user._id,
      timestamp: Date.now(),
      successful: true,
      category: "data_modification",
    })

    // Notify the expense creator
    // Note: In production, this would be done via scheduler
  },
})

export const reject = mutation({
  args: {
    id: v.id("expenses"),
    reason: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await getUserById(ctx, args.userId)
    if (!user) throw new Error("User not found")

    if (user.role !== "admin") {
      throw new Error("Only admins can reject expenses")
    }

    const expense = await ctx.db.get(args.id)
    if (!expense) throw new Error("Expense not found")

    if (expense.status !== "pending") {
      throw new Error("Can only reject pending expenses")
    }

    await ctx.db.patch(args.id, {
      status: "rejected",
      rejectionReason: args.reason,
      updatedAt: Date.now(),
    })

    // Log the rejection
    await ctx.db.insert("auditLogs", {
      action: "expense_rejected",
      entityType: "expenses",
      entityId: args.id,
      userId: user._id,
      changes: JSON.stringify({ reason: args.reason }),
      timestamp: Date.now(),
      successful: true,
      category: "data_modification",
    })
  },
})

export const markAsPaid = mutation({
  args: {
    id: v.id("expenses"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await getUserById(ctx, args.userId)
    if (!user) throw new Error("User not found")

    if (user.role !== "admin") {
      throw new Error("Only admins can mark expenses as paid")
    }

    const expense = await ctx.db.get(args.id)
    if (!expense) throw new Error("Expense not found")

    if (expense.status !== "approved") {
      throw new Error("Can only mark approved expenses as paid")
    }

    await ctx.db.patch(args.id, {
      status: "paid",
      paidAt: Date.now(),
      updatedAt: Date.now(),
    })

    // Log the payment
    await ctx.db.insert("auditLogs", {
      action: "expense_paid",
      entityType: "expenses",
      entityId: args.id,
      userId: user._id,
      timestamp: Date.now(),
      successful: true,
      category: "data_modification",
    })
  },
})

export const remove = mutation({
  args: {
    id: v.id("expenses"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await getUserById(ctx, args.userId)
    if (!user) throw new Error("User not found")

    const expense = await ctx.db.get(args.id)
    if (!expense) throw new Error("Expense not found")

    // Check permissions
    if (expense.createdBy !== user._id && user.role !== "admin") {
      throw new Error("You can only delete your own expenses")
    }

    // Can't delete approved or paid expenses
    if (expense.status === "approved" || expense.status === "paid") {
      throw new Error("Cannot delete approved or paid expenses")
    }

    await ctx.db.delete(args.id)

    // Log the deletion
    await ctx.db.insert("auditLogs", {
      action: "expense_deleted",
      entityType: "expenses",
      entityId: args.id,
      userId: user._id,
      changes: JSON.stringify({
        amount: expense.amount,
        category: expense.category,
      }),
      timestamp: Date.now(),
      successful: true,
      category: "data_modification",
    })
  },
})

export const bulkApprove = mutation({
  args: {
    ids: v.array(v.id("expenses")),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await getUserById(ctx, args.userId)
    if (!user) throw new Error("User not found")

    if (user.role !== "admin") {
      throw new Error("Only admins can approve expenses")
    }

    const results = []

    for (const id of args.ids) {
      const expense = await ctx.db.get(id)
      if (!expense || expense.status !== "pending") {
        results.push({ id, success: false, reason: "Not found or not pending" })
        continue
      }

      await ctx.db.patch(id, {
        status: "approved",
        approvedBy: user._id,
        approvedAt: Date.now(),
        updatedAt: Date.now(),
      })

      results.push({ id, success: true })
    }

    // Log bulk operation
    await ctx.db.insert("auditLogs", {
      action: "expenses_bulk_approved",
      entityType: "expenses",
      entityId: "bulk",
      userId: user._id,
      changes: JSON.stringify({ count: args.ids.length }),
      timestamp: Date.now(),
      successful: true,
      category: "data_modification",
      affectedRecords: args.ids.length,
    })

    return results
  },
})