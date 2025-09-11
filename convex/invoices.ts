import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { Id } from "./_generated/dataModel"
import { getUserById } from "./users"
import { getProjectById } from "./projects"

export const list = query({
  args: {
    projectId: v.optional(v.id("projects")),
    status: v.optional(v.union(v.literal("draft"), v.literal("sent"), v.literal("paid"), v.literal("overdue"), v.literal("cancelled"))),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let invoices = await ctx.db.query("invoices").order("desc").collect()
    
    // Filter by project if specified
    if (args.projectId) {
      invoices = invoices.filter(invoice => invoice.projectId === args.projectId)
    }
    
    // Filter by status if specified
    if (args.status) {
      invoices = invoices.filter(invoice => invoice.status === args.status)
    }
    
    // Search by invoice number or client name
    if (args.search) {
      const searchLower = args.search.toLowerCase()
      invoices = invoices.filter(invoice =>
        invoice.invoiceNumber.toLowerCase().includes(searchLower) ||
        invoice.clientInfo.name.toLowerCase().includes(searchLower) ||
        invoice.clientInfo.company?.toLowerCase().includes(searchLower)
      )
    }
    
    // Get project and creator info
    const invoicesWithDetails = await Promise.all(
      invoices.map(async (invoice) => {
        const project = await ctx.db.get(invoice.projectId)
        const creator = await ctx.db.get(invoice.createdBy)
        
        return {
          ...invoice,
          projectName: project?.name || "Unknown Project",
          creatorName: creator?.name || "Unknown User",
        }
      })
    )
    
    return invoicesWithDetails
  },
})

export const get = query({
  args: { id: v.id("invoices") },
  handler: async (ctx, args) => {
    const invoice = await ctx.db.get(args.id)
    if (!invoice) return null
    
    const project = await ctx.db.get(invoice.projectId)
    const creator = await ctx.db.get(invoice.createdBy)
    const contact = invoice.contactId ? await ctx.db.get(invoice.contactId) : null
    
    return {
      ...invoice,
      projectName: project?.name || "Unknown Project",
      creatorName: creator?.name || "Unknown User",
      contactName: contact?.name,
    }
  },
})

export const create = mutation({
  args: {
    projectId: v.id("projects"),
    contactId: v.optional(v.id("contacts")),
    dueDate: v.number(),
    lineItems: v.array(v.object({
      description: v.string(),
      quantity: v.number(),
      unitPrice: v.number(),
    })),
    paymentTerms: v.optional(v.string()),
    notes: v.optional(v.string()),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await getUserById(ctx, args.userId)
    if (!user) throw new Error("User not found")
    
    const project = await getProjectById(ctx, args.projectId)
    if (!project) throw new Error("Project not found")
    
    const contact = args.contactId ? await ctx.db.get(args.contactId) : null
    
    // Get company settings for invoice generation
    const companySettings = await ctx.db.query("companySettings").first()
    if (!companySettings) {
      throw new Error("Company settings not configured. Please set up company details first.")
    }
    
    // Generate invoice number
    const invoiceNumber = `${companySettings.invoiceSettings.invoicePrefix}${companySettings.invoiceSettings.nextInvoiceNumber.toString().padStart(4, '0')}`
    
    // Calculate line items with VAT
    const processedLineItems = args.lineItems.map(item => {
      const netAmount = item.quantity * item.unitPrice
      const vatRate = companySettings.invoiceSettings.defaultVATRate
      const vatAmount = netAmount * vatRate
      const grossAmount = netAmount + vatAmount
      
      return {
        ...item,
        netAmount,
        vatRate,
        vatAmount,
        grossAmount,
      }
    })
    
    // Calculate totals
    const subtotal = processedLineItems.reduce((sum, item) => sum + item.netAmount, 0)
    const totalVAT = processedLineItems.reduce((sum, item) => sum + item.vatAmount, 0)
    const totalAmount = subtotal + totalVAT
    
    // Prepare client information
    const clientInfo = {
      name: contact?.name || project.company || "Unknown Client",
      email: contact?.email,
      company: contact?.company || project.company,
      address: undefined, // Contacts don't have addresses in the current schema
    }
    
    const now = Date.now()
    
    const invoiceId = await ctx.db.insert("invoices", {
      invoiceNumber,
      projectId: args.projectId,
      contactId: args.contactId,
      issueDate: now,
      dueDate: args.dueDate,
      lineItems: processedLineItems,
      subtotal,
      totalVAT,
      totalAmount,
      status: "draft",
      paymentTerms: args.paymentTerms || companySettings.invoiceSettings.defaultPaymentTerms,
      notes: args.notes,
      vatNumber: companySettings.vatNumber,
      clientInfo,
      companyInfo: {
        name: companySettings.companyName,
        address: companySettings.address,
        phone: companySettings.phone,
        email: companySettings.email,
        website: companySettings.website,
        vatNumber: companySettings.vatNumber,
        companyNumber: companySettings.companyNumber,
      },
      createdBy: args.userId,
      createdAt: now,
      updatedAt: now,
    })
    
    // Update next invoice number
    await ctx.db.patch(companySettings._id, {
      invoiceSettings: {
        ...companySettings.invoiceSettings,
        nextInvoiceNumber: companySettings.invoiceSettings.nextInvoiceNumber + 1,
      },
      updatedAt: now,
      updatedBy: args.userId,
    })
    
    // Log creation
    await ctx.db.insert("auditLogs", {
      action: "invoice_created",
      entityType: "invoice",
      entityId: invoiceId,
      userId: args.userId,
      changes: JSON.stringify({ 
        invoiceNumber,
        totalAmount,
        projectName: project.name,
      }),
      timestamp: now,
    })
    
    return invoiceId
  },
})

export const updateStatus = mutation({
  args: {
    id: v.id("invoices"),
    status: v.union(v.literal("draft"), v.literal("sent"), v.literal("paid"), v.literal("overdue"), v.literal("cancelled")),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await getUserById(ctx, args.userId)
    if (!user) throw new Error("User not found")
    
    const invoice = await ctx.db.get(args.id)
    if (!invoice) throw new Error("Invoice not found")
    
    const now = Date.now()
    
    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: now,
    })
    
    // Log status change
    await ctx.db.insert("auditLogs", {
      action: "invoice_status_updated",
      entityType: "invoice",
      entityId: args.id,
      userId: args.userId,
      changes: JSON.stringify({
        from: invoice.status,
        to: args.status,
        invoiceNumber: invoice.invoiceNumber,
      }),
      timestamp: now,
    })
    
    return args.id
  },
})

export const remove = mutation({
  args: {
    id: v.id("invoices"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await getUserById(ctx, args.userId)
    if (!user) throw new Error("User not found")
    
    const invoice = await ctx.db.get(args.id)
    if (!invoice) throw new Error("Invoice not found")
    
    // Only allow deletion of draft invoices
    if (invoice.status !== "draft") {
      throw new Error("Only draft invoices can be deleted")
    }
    
    await ctx.db.delete(args.id)
    
    // Log deletion
    await ctx.db.insert("auditLogs", {
      action: "invoice_deleted",
      entityType: "invoice",
      entityId: args.id,
      userId: args.userId,
      changes: JSON.stringify({
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: invoice.totalAmount,
      }),
      timestamp: Date.now(),
    })
  },
})

export const getOverdueInvoices = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()
    const invoices = await ctx.db.query("invoices").collect()
    
    return invoices.filter(invoice => 
      invoice.status === "sent" && 
      invoice.dueDate < now
    )
  },
})

export const getInvoiceStats = query({
  args: {},
  handler: async (ctx) => {
    const invoices = await ctx.db.query("invoices").collect()
    
    const stats = {
      total: invoices.length,
      draft: invoices.filter(i => i.status === "draft").length,
      sent: invoices.filter(i => i.status === "sent").length,
      paid: invoices.filter(i => i.status === "paid").length,
      overdue: invoices.filter(i => i.status === "overdue").length,
      cancelled: invoices.filter(i => i.status === "cancelled").length,
      totalValue: invoices.reduce((sum, i) => sum + i.totalAmount, 0),
      paidValue: invoices.filter(i => i.status === "paid").reduce((sum, i) => sum + i.totalAmount, 0),
    }
    
    return stats
  },
})