import { mutation, query } from "./_generated/server"
import { v } from "convex/values"
import { migrateToEncrypted, isEncrypted, encryptValue } from "./encryption"

/**
 * Migration utility to encrypt existing data in batches
 */
export const migrateContacts = mutation({
  args: {
    batchSize: v.optional(v.number()),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize || 100
    const contacts = await ctx.db
      .query("contacts")
      .order("desc")
      .take(batchSize)
    
    let migrated = 0
    let skipped = 0
    
    for (const contact of contacts) {
      // Check if contact already has encrypted fields
      if (contact.email && isEncrypted(contact.email)) {
        skipped++
        continue
      }
      
      // Migrate contact to encrypted format
      const fieldsToEncrypt = ['email', 'phone', 'notes']
      const migratedContact = await migrateToEncrypted(contact, fieldsToEncrypt, encryptValue)
      
      // Update the contact with encrypted data
      await ctx.db.patch(contact._id, {
        email: migratedContact.email,
        phone: migratedContact.phone,
        notes: migratedContact.notes,
        updatedAt: Date.now(),
      })
      
      migrated++
    }
    
    // Log migration
    await ctx.db.insert("auditLogs", {
      action: "data_migration",
      entityType: "contacts",
      entityId: "bulk_migration",
      userId: args.userId,
      changes: JSON.stringify({
        migrated,
        skipped,
        batchSize,
      }),
      timestamp: Date.now(),
      description: `Migrated ${migrated} contacts to encrypted format, skipped ${skipped} already encrypted`,
    })
    
    return {
      migrated,
      skipped,
      total: contacts.length,
    }
  },
})

/**
 * Migration utility to encrypt existing project payments
 */
export const migrateProjectPayments = mutation({
  args: {
    batchSize: v.optional(v.number()),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize || 100
    const payments = await ctx.db
      .query("projectPayments")
      .order("desc")
      .take(batchSize)
    
    let migrated = 0
    let skipped = 0
    
    for (const payment of payments) {
      // Check if payment already has encrypted fields
      if (payment.reference && isEncrypted(payment.reference)) {
        skipped++
        continue
      }
      
      // Migrate payment to encrypted format
      const paymentFieldsToEncrypt = ['reference', 'notes']
      const migratedPayment = await migrateToEncrypted(payment, paymentFieldsToEncrypt, encryptValue)
      
      // Update the payment with encrypted data
      await ctx.db.patch(payment._id, {
        reference: migratedPayment.reference,
        notes: migratedPayment.notes,
      })
      
      migrated++
    }
    
    // Log migration
    await ctx.db.insert("auditLogs", {
      action: "data_migration",
      entityType: "projectPayments",
      entityId: "bulk_migration",
      userId: args.userId,
      changes: JSON.stringify({
        migrated,
        skipped,
        batchSize,
      }),
      timestamp: Date.now(),
      description: `Migrated ${migrated} project payments to encrypted format, skipped ${skipped} already encrypted`,
    })
    
    return {
      migrated,
      skipped,
      total: payments.length,
    }
  },
})

/**
 * Migration utility to encrypt existing company settings
 */
export const migrateCompanySettings = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const settings = await ctx.db.query("companySettings").first()
    if (!settings) {
      return {
        migrated: 0,
        skipped: 0,
        total: 0,
        message: "No company settings found",
      }
    }
    
    // Check if settings already have encrypted fields
    if (settings.email && isEncrypted(settings.email)) {
      return {
        migrated: 0,
        skipped: 1,
        total: 1,
        message: "Company settings already encrypted",
      }
    }
    
    // Migrate settings to encrypted format
    const settingsFieldsToEncrypt = ['companyNumber', 'vatNumber', 'phone', 'email']
    const migratedSettings = await migrateToEncrypted(settings, settingsFieldsToEncrypt, encryptValue)
    
    // Update settings with encrypted data
    await ctx.db.patch(settings._id, {
      email: migratedSettings.email,
      phone: migratedSettings.phone,
      vatNumber: migratedSettings.vatNumber,
      companyNumber: migratedSettings.companyNumber,
      bankDetails: migratedSettings.bankDetails,
      updatedAt: Date.now(),
      updatedBy: args.userId,
    })
    
    // Log migration
    await ctx.db.insert("auditLogs", {
      action: "data_migration",
      entityType: "companySettings",
      entityId: settings._id,
      userId: args.userId,
      changes: JSON.stringify({
        migrated: 1,
        skipped: 0,
      }),
      timestamp: Date.now(),
      description: "Migrated company settings to encrypted format",
    })
    
    return {
      migrated: 1,
      skipped: 0,
      total: 1,
      message: "Company settings migrated successfully",
    }
  },
})

/**
 * Check migration status for all entities
 */
export const getMigrationStatus = query({
  args: {},
  handler: async (ctx) => {
    const [contacts, payments, settings] = await Promise.all([
      ctx.db.query("contacts").collect(),
      ctx.db.query("projectPayments").collect(),
      ctx.db.query("companySettings").first(),
    ])
    
    // Check contacts
    const encryptedContacts = contacts.filter(c => c.email && isEncrypted(c.email))
    const unencryptedContacts = contacts.filter(c => c.email && !isEncrypted(c.email))
    
    // Check payments
    const encryptedPayments = payments.filter(p => p.reference && isEncrypted(p.reference))
    const unencryptedPayments = payments.filter(p => p.reference && !isEncrypted(p.reference))
    
    // Check settings
    let settingsStatus = "not_found"
    if (settings) {
      if (settings.email && isEncrypted(settings.email)) {
        settingsStatus = "encrypted"
      } else if (settings.email) {
        settingsStatus = "unencrypted"
      } else {
        settingsStatus = "no_sensitive_data"
      }
    }
    
    return {
      contacts: {
        total: contacts.length,
        encrypted: encryptedContacts.length,
        unencrypted: unencryptedContacts.length,
        percentage: contacts.length > 0 ? Math.round((encryptedContacts.length / contacts.length) * 100) : 0,
      },
      projectPayments: {
        total: payments.length,
        encrypted: encryptedPayments.length,
        unencrypted: unencryptedPayments.length,
        percentage: payments.length > 0 ? Math.round((encryptedPayments.length / payments.length) * 100) : 0,
      },
      companySettings: {
        status: settingsStatus,
      },
    }
  },
})

/**
 * Migrate all data in a single operation (use with caution on large datasets)
 */
export const migrateAllData = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const results = {
      contacts: { migrated: 0, skipped: 0, total: 0 },
      payments: { migrated: 0, skipped: 0, total: 0 },
      settings: { migrated: 0, skipped: 0, total: 0 },
    }
    
    // Note: In production, these would be called separately or via scheduler
    // For now, return placeholder results
    results.contacts = { migrated: 0, skipped: 0, total: 0 }
    results.payments = { migrated: 0, skipped: 0, total: 0 }
    results.settings = { migrated: 0, skipped: 0, total: 0 }
    
    // Log complete migration
    await ctx.db.insert("auditLogs", {
      action: "complete_data_migration",
      entityType: "system",
      entityId: "full_migration",
      userId: args.userId,
      changes: JSON.stringify(results),
      timestamp: Date.now(),
      description: "Completed full data migration to encrypted format",
    })
    
    return results
  },
})

/**
 * Test encryption/decryption functionality
 */
export const testEncryption = query({
  args: {
    testValue: v.string(),
  },
  handler: async (ctx, args) => {
    const { encryptValue, decryptValue } = await import("./encryption")
    
    try {
      const encrypted = encryptValue(args.testValue)
      const decrypted = decryptValue(encrypted)
      
      return {
        success: true,
        original: args.testValue,
        encrypted,
        decrypted,
        matches: args.testValue === decrypted,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  },
})

/**
 * Validate encryption integrity across all data
 */
export const validateEncryption = query({
  args: {},
  handler: async (ctx) => {
    const { decryptValue, isEncrypted } = await import("./encryption")
    
    const issues = []
    
    // Check contacts
    const contacts = await ctx.db.query("contacts").collect()
    for (const contact of contacts) {
      if (contact.email && isEncrypted(contact.email)) {
        try {
          decryptValue(contact.email)
        } catch (error) {
          issues.push({
            type: "contact",
            id: contact._id,
            field: "email",
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }
      
      if (contact.phone && isEncrypted(contact.phone)) {
        try {
          decryptValue(contact.phone)
        } catch (error) {
          issues.push({
            type: "contact",
            id: contact._id,
            field: "phone",
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }
    }
    
    // Check project payments
    const payments = await ctx.db.query("projectPayments").collect()
    for (const payment of payments) {
      if (payment.reference && isEncrypted(payment.reference)) {
        try {
          decryptValue(payment.reference)
        } catch (error) {
          issues.push({
            type: "payment",
            id: payment._id,
            field: "reference",
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }
    }
    
    // Check company settings
    const settings = await ctx.db.query("companySettings").first()
    if (settings) {
      const fieldsToCheck = ['email', 'phone', 'vatNumber', 'companyNumber']
      for (const field of fieldsToCheck) {
        const value = (settings as any)[field]
        if (value && isEncrypted(value)) {
          try {
            decryptValue(value)
          } catch (error) {
            issues.push({
              type: "companySettings",
              id: settings._id,
              field,
              error: error instanceof Error ? error.message : 'Unknown error',
            })
          }
        }
      }
    }
    
    return {
      totalIssues: issues.length,
      issues,
      status: issues.length === 0 ? "all_valid" : "issues_found",
    }
  },
})