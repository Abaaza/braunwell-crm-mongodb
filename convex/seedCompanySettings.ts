import { mutation } from "./_generated/server"
import { v } from "convex/values"

export const initializeBraunwellSettings = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if company settings already exist
    const existingSettings = await ctx.db.query("companySettings").first()
    
    if (existingSettings) {
      console.log("Company settings already exist. Updating with Braunwell details...")
      
      // Update existing settings with Braunwell information
      await ctx.db.patch(existingSettings._id, {
        companyName: "Braunwell",
        tradingName: "Braunwell",
        address: {
          line1: "71-75 Shelton Street",
          line2: "Covent Garden",
          city: "London",
          postcode: "WC2H 9JQ",
          country: "United Kingdom",
        },
        phone: "+447777727706",
        email: "hello@braunwell.co.uk",
        website: "https://www.braunwell.co.uk",
        // Keep existing VAT and company numbers if they exist
        updatedAt: Date.now(),
        updatedBy: args.userId,
      })
      
      return { message: "Company settings updated with Braunwell details" }
    }
    
    // Create new settings with Braunwell information
    const now = Date.now()
    
    await ctx.db.insert("companySettings", {
      companyName: "Braunwell",
      tradingName: "Braunwell",
      companyNumber: "", // To be added when available
      vatNumber: "", // To be added when available
      address: {
        line1: "71-75 Shelton Street",
        line2: "Covent Garden",
        city: "London",
        postcode: "WC2H 9JQ",
        country: "United Kingdom",
      },
      phone: "+447777727706",
      email: "hello@braunwell.co.uk",
      website: "https://www.braunwell.co.uk",
      bankDetails: {
        accountName: "",
        accountNumber: "",
        sortCode: "",
        bankName: "",
      },
      invoiceSettings: {
        invoicePrefix: "BRW-",
        nextInvoiceNumber: 1001,
        defaultPaymentTerms: "Net 30",
        defaultVATRate: 0.20,
        footerText: "Thank you for your business. Payment is due within 30 days of invoice date.",
      },
      createdAt: now,
      updatedAt: now,
      updatedBy: args.userId,
    })
    
    return { message: "Company settings initialized with Braunwell details" }
  },
})