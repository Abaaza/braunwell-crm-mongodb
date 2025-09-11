import { mutation } from "./_generated/server"
import { v } from "convex/values"

export const seedExpenses = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get all projects to link some expenses
    const projects = await ctx.db.query("projects").collect()
    
    // Define expense categories
    const categories = [
      "travel", "equipment", "software", "office", 
      "marketing", "professional_services", "utilities", 
      "insurance", "other"
    ] as const

    // Define vendors
    const vendors = [
      "Amazon Web Services", "Microsoft Azure", "Google Cloud",
      "Adobe Creative Suite", "Slack Technologies", "Zoom Communications",
      "National Rail", "British Airways", "Uber",
      "Office Depot", "Staples", "Dell Technologies",
      "PwC Consulting", "Deloitte", "KPMG",
      "British Gas", "BT Business", "Virgin Media",
      "Aviva Insurance", "AXA Business Insurance"
    ]

    // Create 50 expenses with various statuses
    const expenses = []
    const now = Date.now()
    const oneDay = 24 * 60 * 60 * 1000
    
    for (let i = 0; i < 50; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)]
      const isProjectLinked = Math.random() > 0.3 // 70% linked to projects
      const projectId = isProjectLinked && projects.length > 0 
        ? projects[Math.floor(Math.random() * projects.length)]._id 
        : undefined
      
      const date = now - (Math.floor(Math.random() * 180) * oneDay) // Random date in last 6 months
      const amount = Math.floor(Math.random() * 5000) + 100 // £100 to £5100
      const isVATInclusive = Math.random() > 0.5
      const vatRate = 0.20 // UK VAT rate
      
      // Calculate VAT amounts
      let netAmount: number
      let vatAmount: number
      let grossAmount: number
      
      if (isVATInclusive) {
        grossAmount = amount
        netAmount = grossAmount / (1 + vatRate)
        vatAmount = grossAmount - netAmount
      } else {
        netAmount = amount
        vatAmount = netAmount * vatRate
        grossAmount = netAmount + vatAmount
      }
      
      // Determine status based on age
      const ageInDays = (now - date) / oneDay
      let status: "pending" | "approved" | "rejected" | "paid"
      if (ageInDays > 60) {
        status = Math.random() > 0.1 ? "paid" : "rejected"
      } else if (ageInDays > 30) {
        status = Math.random() > 0.2 ? "approved" : "pending"
      } else {
        status = "pending"
      }
      
      const expense = {
        description: getExpenseDescription(category, i),
        amount,
        date,
        projectId,
        category,
        status,
        netAmount: Math.round(netAmount * 100) / 100,
        vatAmount: Math.round(vatAmount * 100) / 100,
        grossAmount: Math.round(grossAmount * 100) / 100,
        vatRate,
        isVATInclusive,
        paymentMethod: getRandomPaymentMethod(),
        reference: `EXP-2024-${String(i + 1).padStart(4, '0')}`,
        vendor: vendors[Math.floor(Math.random() * vendors.length)],
        notes: Math.random() > 0.7 ? getRandomNote(category) : undefined,
        receiptUrl: Math.random() > 0.6 ? `https://example.com/receipts/receipt-${i + 1}.pdf` : undefined,
        isRecurring: category === "utilities" || category === "insurance" ? Math.random() > 0.7 : false,
        recurringPattern: undefined as "monthly" | "quarterly" | "yearly" | undefined,
        recurringEndDate: undefined as number | undefined,
        createdBy: args.userId,
        createdAt: date,
        updatedAt: date,
        approvedBy: undefined as any,
        approvedAt: undefined as number | undefined,
        rejectionReason: undefined as string | undefined,
        paidAt: undefined as number | undefined,
      }
      
      // Set recurring pattern if applicable
      if (expense.isRecurring) {
        expense.recurringPattern = Math.random() > 0.5 ? "monthly" : "quarterly"
        expense.recurringEndDate = now + (365 * oneDay) // End in 1 year
      }
      
      // Set approval/payment details based on status
      if (status === "approved" || status === "paid") {
        expense.approvedBy = args.userId
        expense.approvedAt = date + (7 * oneDay) // Approved after 7 days
      }
      
      if (status === "paid") {
        expense.paidAt = date + (14 * oneDay) // Paid after 14 days
      }
      
      if (status === "rejected") {
        expense.rejectionReason = getRandomRejectionReason()
      }
      
      expenses.push(expense)
    }
    
    // Insert all expenses
    const insertedIds = []
    for (const expense of expenses) {
      const id = await ctx.db.insert("expenses", expense)
      insertedIds.push(id)
    }
    
    return {
      message: `Successfully created ${insertedIds.length} test expenses`,
      count: insertedIds.length,
    }
  },
})

function getExpenseDescription(category: string, index: number): string {
  const descriptions: Record<string, string[]> = {
    travel: [
      "Train tickets to client meeting",
      "Flight to conference",
      "Hotel accommodation for business trip",
      "Taxi fare to airport",
      "Car rental for site visit",
    ],
    equipment: [
      "Laptop for development",
      "Office chairs",
      "Standing desk",
      "Monitor and accessories",
      "Printer and supplies",
    ],
    software: [
      "Annual software license",
      "Cloud hosting services",
      "Development tools subscription",
      "Project management software",
      "Security software license",
    ],
    office: [
      "Office supplies",
      "Stationery and printing",
      "Kitchen supplies",
      "Cleaning supplies",
      "Office decorations",
    ],
    marketing: [
      "Google Ads campaign",
      "Social media advertising",
      "Trade show booth rental",
      "Marketing materials printing",
      "Website design services",
    ],
    professional_services: [
      "Legal consultation",
      "Accounting services",
      "HR consulting",
      "IT support services",
      "Business strategy consulting",
    ],
    utilities: [
      "Internet service",
      "Electricity bill",
      "Water and sewage",
      "Gas heating",
      "Phone service",
    ],
    insurance: [
      "Business liability insurance",
      "Equipment insurance",
      "Professional indemnity",
      "Building insurance",
      "Vehicle insurance",
    ],
    other: [
      "Team building event",
      "Client entertainment",
      "Training course",
      "Industry membership",
      "Miscellaneous supplies",
    ],
  }
  
  const categoryDescriptions = descriptions[category] || descriptions.other
  return categoryDescriptions[index % categoryDescriptions.length]
}

function getRandomPaymentMethod() {
  const methods = ["bank_transfer", "card", "cash", "cheque", "direct_debit"] as const
  return methods[Math.floor(Math.random() * methods.length)]
}

function getRandomNote(category: string): string {
  const notes = [
    "Approved by finance team",
    "Receipt attached for reference",
    "Part of Q4 budget allocation",
    "Emergency purchase - pre-approved",
    "Bulk purchase for cost savings",
    "Recurring monthly expense",
    "One-time setup cost",
    "Negotiated discount applied",
  ]
  
  if (category === "travel") {
    notes.push("Client visit - billable to project")
    notes.push("Conference attendance approved by management")
  } else if (category === "equipment") {
    notes.push("Replacement for damaged equipment")
    notes.push("New team member setup")
  }
  
  return notes[Math.floor(Math.random() * notes.length)]
}

function getRandomRejectionReason(): string {
  const reasons = [
    "Missing receipt or documentation",
    "Expense not pre-approved",
    "Exceeds budget allocation",
    "Incorrect expense category",
    "Personal expense - not business related",
    "Duplicate submission",
    "Outside of expense policy guidelines",
  ]
  
  return reasons[Math.floor(Math.random() * reasons.length)]
}