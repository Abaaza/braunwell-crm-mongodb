import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { getUserById } from "./users"

// Simple wrapper functions for encryption/decryption
// In production, these would handle field-specific encryption
function encryptEntityData(data: any, entityType: string) {
  // For now, just return the data as-is
  // In production, this would encrypt sensitive fields
  return data
}

function decryptEntityData(data: any, entityType: string) {
  // For now, just return the data as-is
  // In production, this would decrypt sensitive fields
  return data
}

export const get = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("companySettings").first()
    if (!settings) return null
    
    // Decrypt sensitive fields before returning
    return decryptEntityData(settings, 'companySettings')
  },
})

export const create = mutation({
  args: {
    companyName: v.string(),
    tradingName: v.optional(v.string()),
    companyNumber: v.optional(v.string()),
    vatNumber: v.optional(v.string()),
    address: v.object({
      line1: v.string(),
      line2: v.optional(v.string()),
      city: v.string(),
      postcode: v.string(),
      country: v.string(),
    }),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    website: v.optional(v.string()),
    bankDetails: v.optional(v.object({
      accountName: v.string(),
      accountNumber: v.string(),
      sortCode: v.string(),
      bankName: v.string(),
    })),
    invoiceSettings: v.object({
      invoicePrefix: v.string(),
      nextInvoiceNumber: v.number(),
      defaultPaymentTerms: v.string(),
      defaultVATRate: v.number(),
      footerText: v.optional(v.string()),
    }),
    logo: v.optional(v.string()),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await getUserById(ctx, args.userId)
    if (!user) throw new Error("User not found")
    
    // Check if settings already exist
    const existingSettings = await ctx.db.query("companySettings").first()
    if (existingSettings) {
      throw new Error("Company settings already exist. Use update instead.")
    }
    
    const now = Date.now()
    const { userId, ...settingsData } = args
    
    // Prepare settings data and encrypt sensitive fields
    const settingsWithTimestamps = {
      ...settingsData,
      createdAt: now,
      updatedAt: now,
      updatedBy: userId,
    }
    
    // Encrypt sensitive fields
    const encryptedSettings = encryptEntityData(settingsWithTimestamps, 'companySettings')
    
    const settingsId = await ctx.db.insert("companySettings", encryptedSettings)
    
    // Log creation
    await ctx.db.insert("auditLogs", {
      action: "company_settings_created",
      entityType: "company_settings",
      entityId: settingsId,
      userId,
      changes: JSON.stringify({ companyName: args.companyName }),
      timestamp: now,
    })
    
    return settingsId
  },
})

export const update = mutation({
  args: {
    companyName: v.optional(v.string()),
    tradingName: v.optional(v.string()),
    companyNumber: v.optional(v.string()),
    vatNumber: v.optional(v.string()),
    address: v.optional(v.object({
      line1: v.string(),
      line2: v.optional(v.string()),
      city: v.string(),
      postcode: v.string(),
      country: v.string(),
    })),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    website: v.optional(v.string()),
    bankDetails: v.optional(v.object({
      accountName: v.string(),
      accountNumber: v.string(),
      sortCode: v.string(),
      bankName: v.string(),
    })),
    invoiceSettings: v.optional(v.object({
      invoicePrefix: v.string(),
      nextInvoiceNumber: v.number(),
      defaultPaymentTerms: v.string(),
      defaultVATRate: v.number(),
      footerText: v.optional(v.string()),
    })),
    logo: v.optional(v.string()),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await getUserById(ctx, args.userId)
    if (!user) throw new Error("User not found")
    
    const existingSettings = await ctx.db.query("companySettings").first()
    if (!existingSettings) {
      throw new Error("Company settings not found. Create them first.")
    }
    
    // Decrypt existing settings to compare with updates
    const decryptedExistingSettings = decryptEntityData(existingSettings, 'companySettings')
    
    const now = Date.now()
    const { userId, ...updates } = args
    
    // Build changes object for audit log
    const changes: any = {}
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && JSON.stringify((decryptedExistingSettings as any)[key]) !== JSON.stringify(value)) {
        changes[key] = { from: (decryptedExistingSettings as any)[key], to: value }
      }
    })
    
    // Filter out undefined values and encrypt sensitive fields
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    )
    
    const encryptedUpdates = encryptEntityData(filteredUpdates, 'companySettings')
    
    await ctx.db.patch(existingSettings._id, {
      ...encryptedUpdates,
      updatedAt: now,
      updatedBy: userId,
    })
    
    // Log update
    if (Object.keys(changes).length > 0) {
      await ctx.db.insert("auditLogs", {
        action: "company_settings_updated",
        entityType: "company_settings",
        entityId: existingSettings._id,
        userId,
        changes: JSON.stringify(changes),
        timestamp: now,
      })
    }
    
    return existingSettings._id
  },
})

export const getInvoiceSettings = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("companySettings").first()
    if (!settings) return null
    
    // Decrypt settings to get invoice settings
    const decryptedSettings = decryptEntityData(settings, 'companySettings')
    return decryptedSettings?.invoiceSettings || null
  },
})

// Initialize default company settings
export const initializeDefaultSettings = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if settings already exist
    const existingSettings = await ctx.db.query("companySettings").first()
    if (existingSettings) {
      return existingSettings._id
    }
    
    // Get the first admin user
    const adminUser = await ctx.db
      .query("users")
      .filter(q => q.eq(q.field("role"), "admin"))
      .first()
    
    if (!adminUser) {
      throw new Error("No admin user found. Please initialize users first.")
    }
    
    const now = Date.now()
    
    // Create default settings
    const defaultSettings = {
      companyName: "Braunwell Ltd",
      tradingName: "Braunwell CRM",
      companyNumber: "12345678",
      vatNumber: "GB123456789",
      address: {
        line1: "123 Business Street",
        line2: "Suite 100",
        city: "London",
        postcode: "SW1A 1AA",
        country: "United Kingdom",
      },
      phone: "+44 20 7123 4567",
      email: "info@braunwell.com",
      website: "https://braunwell.com",
      bankDetails: {
        accountName: "Braunwell Ltd",
        accountNumber: "12345678",
        sortCode: "12-34-56",
        bankName: "Example Bank UK",
      },
      invoiceSettings: {
        invoicePrefix: "INV",
        nextInvoiceNumber: 1001,
        defaultPaymentTerms: "Net 30 days",
        defaultVATRate: 20,
        footerText: "Thank you for your business!",
      },
      createdAt: now,
      updatedAt: now,
      updatedBy: adminUser._id,
    }
    
    // For now, insert without encryption since we're using simple encoding
    const settingsId = await ctx.db.insert("companySettings", defaultSettings)
    
    return settingsId
  },
})

export const updateInvoiceSettings = mutation({
  args: {
    invoicePrefix: v.string(),
    nextInvoiceNumber: v.number(),
    defaultPaymentTerms: v.string(),
    defaultVATRate: v.number(),
    footerText: v.optional(v.string()),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await getUserById(ctx, args.userId)
    if (!user) throw new Error("User not found")
    
    const existingSettings = await ctx.db.query("companySettings").first()
    if (!existingSettings) {
      throw new Error("Company settings not found. Create them first.")
    }
    
    const now = Date.now()
    const { userId, ...invoiceUpdates } = args
    
    const newInvoiceSettings = {
      ...existingSettings.invoiceSettings,
      ...invoiceUpdates,
    }
    
    await ctx.db.patch(existingSettings._id, {
      invoiceSettings: newInvoiceSettings,
      updatedAt: now,
      updatedBy: userId,
    })
    
    // Log update
    await ctx.db.insert("auditLogs", {
      action: "invoice_settings_updated",
      entityType: "company_settings",
      entityId: existingSettings._id,
      userId,
      changes: JSON.stringify({ invoiceSettings: invoiceUpdates }),
      timestamp: now,
    })
    
    return existingSettings._id
  },
})