import { internalMutation } from "../_generated/server"
import { encryptNumber, decryptNumber, isEncrypted } from "../lib/encryption"

// Migration to encrypt existing revenue values
export const encryptExistingRevenue = internalMutation({
  handler: async (ctx) => {
    const projects = await ctx.db.query("projects").collect()
    const projectTemplates = await ctx.db.query("projectTemplates").collect()
    
    let projectsUpdated = 0
    let templatesUpdated = 0
    
    // Encrypt project revenue values
    for (const project of projects) {
      // Check if value is already encrypted
      if (typeof project.expectedRevenueGBP === 'string' && isEncrypted(project.expectedRevenueGBP)) {
        console.log(`Project ${project._id} already encrypted, skipping`)
        continue
      }
      
      // If it's a number or unencrypted string, encrypt it
      const numValue = typeof project.expectedRevenueGBP === 'number' 
        ? project.expectedRevenueGBP 
        : parseFloat(project.expectedRevenueGBP as any)
      
      if (!isNaN(numValue)) {
        await ctx.db.patch(project._id, {
          expectedRevenueGBP: encryptNumber(numValue)
        })
        projectsUpdated++
      }
    }
    
    // Encrypt project template revenue values
    for (const template of projectTemplates) {
      // Check if value is already encrypted
      if (typeof template.expectedRevenueGBP === 'string' && isEncrypted(template.expectedRevenueGBP)) {
        console.log(`Template ${template._id} already encrypted, skipping`)
        continue
      }
      
      // If it's a number or unencrypted string, encrypt it
      const numValue = typeof template.expectedRevenueGBP === 'number' 
        ? template.expectedRevenueGBP 
        : parseFloat(template.expectedRevenueGBP as any)
      
      if (!isNaN(numValue)) {
        await ctx.db.patch(template._id, {
          expectedRevenueGBP: encryptNumber(numValue)
        })
        templatesUpdated++
      }
    }
    
    return {
      projectsUpdated,
      templatesUpdated,
      totalProjects: projects.length,
      totalTemplates: projectTemplates.length
    }
  },
})

// Helper to decrypt all revenue values (for rollback if needed)
export const decryptAllRevenue = internalMutation({
  handler: async (ctx) => {
    const projects = await ctx.db.query("projects").collect()
    const projectTemplates = await ctx.db.query("projectTemplates").collect()
    
    let projectsUpdated = 0
    let templatesUpdated = 0
    
    // Decrypt project revenue values
    for (const project of projects) {
      if (typeof project.expectedRevenueGBP === 'string' && isEncrypted(project.expectedRevenueGBP)) {
        const decryptedValue = decryptNumber(project.expectedRevenueGBP)
        await ctx.db.patch(project._id, {
          expectedRevenueGBP: decryptedValue.toString()
        })
        projectsUpdated++
      }
    }
    
    // Decrypt project template revenue values
    for (const template of projectTemplates) {
      if (typeof template.expectedRevenueGBP === 'string' && isEncrypted(template.expectedRevenueGBP)) {
        const decryptedValue = decryptNumber(template.expectedRevenueGBP)
        await ctx.db.patch(template._id, {
          expectedRevenueGBP: decryptedValue.toString()
        })
        templatesUpdated++
      }
    }
    
    return {
      projectsUpdated,
      templatesUpdated,
      totalProjects: projects.length,
      totalTemplates: projectTemplates.length
    }
  },
})