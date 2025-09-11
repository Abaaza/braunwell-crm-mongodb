import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  users: defineTable({
    email: v.string(),
    passwordHash: v.string(),
    role: v.union(v.literal("admin"), v.literal("user")),
    name: v.string(),
    avatar: v.optional(v.string()), // Base64 encoded image
    isActive: v.optional(v.boolean()),
    lastLoginAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_email", ["email"]),

  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
  }).index("by_token", ["token"]),

  contacts: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    company: v.optional(v.string()),
    notes: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_email", ["email"]),

  projects: defineTable({
    name: v.string(),
    company: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.union(v.literal("open"), v.literal("closed")),
    expectedRevenueGBP: v.string(), // Encrypted value
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    isArchived: v.optional(v.boolean()),
    archivedAt: v.optional(v.number()),
    archivedBy: v.optional(v.id("users")),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_status", ["status"]).index("by_archived", ["isArchived"]),

  tasks: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(v.literal("todo"), v.literal("in_progress"), v.literal("done")),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    dueDate: v.optional(v.number()),
    projectId: v.id("projects"),
    assignedTo: v.optional(v.id("users")),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    isRecurring: v.optional(v.boolean()),
    recurringPattern: v.optional(v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("biweekly"),
      v.literal("monthly"),
      v.literal("quarterly"),
      v.literal("yearly")
    )),
    recurringEndDate: v.optional(v.number()),
    parentTaskId: v.optional(v.id("tasks")), // For linking recurring instances
    dependencies: v.optional(v.array(v.id("tasks"))), // Tasks that must be completed before this one
    blockedBy: v.optional(v.array(v.id("tasks"))), // Tasks that are blocked by this one
  })
    .index("by_project", ["projectId"])
    .index("by_assignee", ["assignedTo"])
    .index("by_status", ["status"]),

  auditLogs: defineTable({
    action: v.string(), // created, updated, deleted, viewed, login, logout, etc.
    entityType: v.string(), // users, contacts, projects, tasks, settings, etc.
    entityId: v.string(), // ID of the affected entity
    userId: v.id("users"), // User who performed the action
    changes: v.optional(v.string()), // JSON string of changes (old vs new values)
    timestamp: v.number(), // When the action occurred
    ipAddress: v.optional(v.string()), // IP address of the user
    userAgent: v.optional(v.string()), // Browser/client information
    sessionId: v.optional(v.string()), // Session identifier
    severity: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical"))), // Severity level
    category: v.optional(v.string()), // Category: data_access, data_modification, authentication, authorization, etc.
    description: v.optional(v.string()), // Human-readable description of the action
    metadata: v.optional(v.string()), // Additional context as JSON string
    riskScore: v.optional(v.number()), // Risk score (0-100) for the action
    successful: v.optional(v.boolean()), // Whether the action was successful
    errorMessage: v.optional(v.string()), // Error message if action failed
    affectedRecords: v.optional(v.number()), // Number of records affected (for bulk operations)
    dataClassification: v.optional(v.union(v.literal("public"), v.literal("internal"), v.literal("confidential"), v.literal("restricted"))), // Data sensitivity level
  })
    .index("by_entity", ["entityType", "entityId"])
    .index("by_user", ["userId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_severity", ["severity"])
    .index("by_category", ["category"])
    .index("by_ip", ["ipAddress"])
    .index("by_session", ["sessionId"]),

  projectContacts: defineTable({
    projectId: v.id("projects"),
    contactId: v.id("contacts"),
    role: v.optional(v.string()), // e.g., "primary", "technical", "financial"
    notes: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_contact", ["contactId"])
    .index("by_project_contact", ["projectId", "contactId"]),

  contactCommunications: defineTable({
    contactId: v.id("contacts"),
    type: v.union(v.literal("email"), v.literal("call"), v.literal("meeting")),
    subject: v.string(),
    notes: v.optional(v.string()),
    date: v.number(),
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_contact", ["contactId"])
    .index("by_date", ["date"]),

  contactNotes: defineTable({
    contactId: v.id("contacts"),
    content: v.string(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_contact", ["contactId"])
    .index("by_created", ["createdAt"]),

  projectPayments: defineTable({
    projectId: v.id("projects"),
    amount: v.number(),
    date: v.number(),
    method: v.optional(v.union(v.literal("bank_transfer"), v.literal("card"), v.literal("cash"), v.literal("cheque"))),
    reference: v.optional(v.string()),
    notes: v.optional(v.string()),
    // VAT fields
    netAmount: v.optional(v.number()), // Amount excluding VAT
    vatAmount: v.optional(v.number()), // VAT amount
    grossAmount: v.optional(v.number()), // Amount including VAT
    vatRate: v.optional(v.number()), // VAT rate applied (e.g., 0.20 for 20%)
    isVATInclusive: v.optional(v.boolean()), // Whether the payment amount includes VAT
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_date", ["date"]),

  organizationSettings: defineTable({
    companyName: v.string(),
    supportEmail: v.optional(v.string()),
    supportPhone: v.optional(v.string()),
    timezone: v.string(),
    dateFormat: v.string(),
    currency: v.string(),
    language: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    updatedBy: v.id("users"),
  }),

  notificationSettings: defineTable({
    userId: v.id("users"),
    newProjectCreated: v.boolean(),
    taskAssigned: v.boolean(),
    dailySummary: v.boolean(),
    weeklyReports: v.boolean(),
    emailEnabled: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  securitySettings: defineTable({
    twoFactorRequired: v.boolean(),
    sessionTimeoutDays: v.number(),
    passwordMinLength: v.number(),
    passwordRequireUppercase: v.boolean(),
    passwordRequireNumbers: v.boolean(),
    passwordRequireSpecial: v.boolean(),
    ipWhitelistEnabled: v.boolean(),
    ipWhitelist: v.array(v.string()),
    auditLogRetentionDays: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
    updatedBy: v.id("users"),
  }),

  taskTemplates: defineTable({
    name: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    estimatedHours: v.optional(v.number()),
    tags: v.array(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_name", ["name"]),

  projectTemplates: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    company: v.optional(v.string()),
    expectedRevenueGBP: v.string(), // Encrypted value
    durationDays: v.optional(v.number()), // Expected project duration in days
    tasks: v.array(v.object({
      title: v.string(),
      description: v.optional(v.string()),
      priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
      daysFromStart: v.number(), // Days from project start when task should be due
    })),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_name", ["name"]),

  customMetrics: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    dataSource: v.union(v.literal("projects"), v.literal("tasks"), v.literal("contacts"), v.literal("payments")),
    aggregation: v.union(v.literal("count"), v.literal("sum"), v.literal("average"), v.literal("min"), v.literal("max")),
    field: v.optional(v.string()), // Field to aggregate (e.g., "expectedRevenueGBP" for sum)
    filters: v.array(v.object({
      field: v.string(),
      operator: v.union(v.literal("equals"), v.literal("not_equals"), v.literal("greater_than"), v.literal("less_than"), v.literal("contains")),
      value: v.string(),
    })),
    groupBy: v.optional(v.string()), // Field to group by (e.g., "status", "priority")
    chartType: v.optional(v.union(v.literal("number"), v.literal("line"), v.literal("bar"), v.literal("pie"), v.literal("donut"))),
    color: v.optional(v.string()), // Color for the metric card
    icon: v.optional(v.string()), // Icon name for the metric card
    isPublic: v.boolean(), // Whether all users can see this metric
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_creator", ["createdBy"]).index("by_public", ["isPublic"]),

  savedReports: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    type: v.union(v.literal("dashboard"), v.literal("custom")), // dashboard = analytics page config, custom = specific report
    configuration: v.object({
      dateRange: v.optional(v.string()), // Default date range
      metrics: v.optional(v.array(v.id("customMetrics"))), // Selected custom metrics
      charts: v.optional(v.array(v.string())), // Which charts to show/hide
      filters: v.optional(v.object({
        projectStatus: v.optional(v.string()),
        taskStatus: v.optional(v.string()),
        priority: v.optional(v.string()),
      })),
      layout: v.optional(v.string()), // Custom layout configuration
    }),
    isDefault: v.optional(v.boolean()), // User's default report
    isPublic: v.boolean(), // Whether all users can see this report
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_creator", ["createdBy"]).index("by_public", ["isPublic"]).index("by_default", ["createdBy", "isDefault"]),

  // Search-related tables
  savedSearches: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    entityType: v.union(v.literal("contacts"), v.literal("projects"), v.literal("tasks"), v.literal("all")),
    query: v.string(), // The search query
    filters: v.object({
      dateRange: v.optional(v.object({
        start: v.optional(v.number()),
        end: v.optional(v.number()),
      })),
      status: v.optional(v.array(v.string())),
      priority: v.optional(v.array(v.string())),
      assignedTo: v.optional(v.array(v.id("users"))),
      projectId: v.optional(v.array(v.id("projects"))),
      contactId: v.optional(v.array(v.id("contacts"))),
      tags: v.optional(v.array(v.string())),
      customFields: v.optional(v.array(v.object({
        field: v.string(),
        operator: v.union(v.literal("equals"), v.literal("not_equals"), v.literal("contains"), v.literal("not_contains"), v.literal("greater_than"), v.literal("less_than"), v.literal("starts_with"), v.literal("ends_with")),
        value: v.string(),
      }))),
    }),
    sortBy: v.optional(v.object({
      field: v.string(),
      order: v.union(v.literal("asc"), v.literal("desc")),
    })),
    isPublic: v.boolean(),
    isDefault: v.optional(v.boolean()),
    usageCount: v.optional(v.number()),
    lastUsed: v.optional(v.number()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_creator", ["createdBy"]).index("by_entity_type", ["entityType"]).index("by_public", ["isPublic"]).index("by_usage", ["usageCount"]),

  searchHistory: defineTable({
    userId: v.id("users"),
    query: v.string(),
    entityType: v.union(v.literal("contacts"), v.literal("projects"), v.literal("tasks"), v.literal("all")),
    resultsCount: v.number(),
    searchTime: v.number(), // Time taken to execute search in milliseconds
    timestamp: v.number(),
  }).index("by_user", ["userId"]).index("by_user_timestamp", ["userId", "timestamp"]),

  searchIndex: defineTable({
    entityType: v.union(v.literal("contacts"), v.literal("projects"), v.literal("tasks")),
    entityId: v.string(),
    searchableContent: v.string(), // Concatenated searchable fields
    keywords: v.array(v.string()), // Extracted keywords for faster matching
    metadata: v.object({
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      status: v.optional(v.string()),
      priority: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_entity_type", ["entityType"]).index("by_entity", ["entityType", "entityId"]).index("by_keywords", ["keywords"]),

  notifications: defineTable({
    userId: v.id("users"), // User who should receive this notification
    type: v.union(
      v.literal("task_assigned"),
      v.literal("task_updated"),
      v.literal("task_completed"),
      v.literal("project_created"),
      v.literal("project_updated"),
      v.literal("project_closed"),
      v.literal("contact_created"),
      v.literal("contact_updated"),
      v.literal("payment_received"),
      v.literal("system_maintenance"),
      v.literal("user_mentioned")
    ),
    title: v.string(),
    message: v.string(),
    entityType: v.optional(v.union(v.literal("task"), v.literal("project"), v.literal("contact"), v.literal("payment"))),
    entityId: v.optional(v.string()), // ID of the related entity
    entityName: v.optional(v.string()), // Name of the related entity for display
    actionUrl: v.optional(v.string()), // URL to navigate to when clicked
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    isRead: v.boolean(),
    readAt: v.optional(v.number()),
    createdBy: v.optional(v.id("users")), // User who triggered the notification
    createdAt: v.number(),
    expiresAt: v.optional(v.number()), // Optional expiration date
  })
    .index("by_user", ["userId"])
    .index("by_user_read", ["userId", "isRead"])
    .index("by_user_created", ["userId", "createdAt"])
    .index("by_type", ["type"])
    .index("by_entity", ["entityType", "entityId"]),

  // Custom fields tables
  customFields: defineTable({
    name: v.string(), // Field name/label
    fieldKey: v.string(), // Unique identifier for the field (e.g., "client_priority")
    entityType: v.union(v.literal("contacts"), v.literal("projects"), v.literal("tasks")), // Which entity this field applies to
    fieldType: v.union(
      v.literal("text"),
      v.literal("number"),
      v.literal("date"),
      v.literal("dropdown"),
      v.literal("checkbox"),
      v.literal("textarea"),
      v.literal("email"),
      v.literal("phone"),
      v.literal("url")
    ),
    description: v.optional(v.string()), // Help text for the field
    required: v.boolean(), // Whether this field is required
    defaultValue: v.optional(v.string()), // Default value as string (will be parsed based on fieldType)
    options: v.optional(v.array(v.string())), // For dropdown fields
    validation: v.optional(v.object({
      min: v.optional(v.number()), // For number/text length validation
      max: v.optional(v.number()), // For number/text length validation
      pattern: v.optional(v.string()), // Regex pattern for validation
      message: v.optional(v.string()), // Custom validation message
    })),
    displayOrder: v.number(), // Order in which fields should be displayed
    isActive: v.boolean(), // Whether this field is currently active
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    updatedBy: v.id("users"),
  })
    .index("by_entity_type", ["entityType"])
    .index("by_field_key", ["fieldKey"])
    .index("by_entity_active", ["entityType", "isActive"])
    .index("by_display_order", ["entityType", "displayOrder"]),

  customFieldValues: defineTable({
    fieldId: v.id("customFields"), // Reference to the field definition
    entityType: v.union(v.literal("contacts"), v.literal("projects"), v.literal("tasks")),
    entityId: v.string(), // ID of the entity (contact, project, or task)
    value: v.string(), // Stored value as string (will be parsed based on field type)
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    updatedBy: v.id("users"),
  })
    .index("by_entity", ["entityType", "entityId"])
    .index("by_field", ["fieldId"])
    .index("by_entity_field", ["entityType", "entityId", "fieldId"]),

  // UK-specific tables
  invoices: defineTable({
    invoiceNumber: v.string(),
    projectId: v.id("projects"),
    contactId: v.optional(v.id("contacts")),
    issueDate: v.number(),
    dueDate: v.number(),
    
    // Line items
    lineItems: v.array(v.object({
      description: v.string(),
      quantity: v.number(),
      unitPrice: v.number(),
      netAmount: v.number(),
      vatRate: v.number(),
      vatAmount: v.number(),
      grossAmount: v.number(),
    })),
    
    // Totals
    subtotal: v.number(), // Total net amount
    totalVAT: v.number(), // Total VAT amount
    totalAmount: v.number(), // Total gross amount
    
    // Invoice details
    status: v.union(v.literal("draft"), v.literal("sent"), v.literal("paid"), v.literal("overdue"), v.literal("cancelled")),
    paymentTerms: v.optional(v.string()), // e.g., "Net 30", "Due on receipt"
    notes: v.optional(v.string()),
    
    // UK tax information
    vatNumber: v.optional(v.string()), // Company VAT number
    
    // Client information (snapshot at time of invoice)
    clientInfo: v.object({
      name: v.string(),
      email: v.optional(v.string()),
      company: v.optional(v.string()),
      address: v.optional(v.object({
        line1: v.string(),
        line2: v.optional(v.string()),
        city: v.string(),
        postcode: v.string(),
        country: v.string(),
      })),
    }),
    
    // Company information (snapshot at time of invoice)
    companyInfo: v.object({
      name: v.string(),
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
      vatNumber: v.optional(v.string()),
      companyNumber: v.optional(v.string()),
    }),
    
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_contact", ["contactId"])
    .index("by_status", ["status"])
    .index("by_invoice_number", ["invoiceNumber"])
    .index("by_issue_date", ["issueDate"])
    .index("by_due_date", ["dueDate"]),

  companySettings: defineTable({
    // Company details
    companyName: v.string(),
    tradingName: v.optional(v.string()),
    companyNumber: v.optional(v.string()),
    vatNumber: v.optional(v.string()),
    
    // Address
    address: v.object({
      line1: v.string(),
      line2: v.optional(v.string()),
      city: v.string(),
      postcode: v.string(),
      country: v.string(),
    }),
    
    // Contact information
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    website: v.optional(v.string()),
    
    // Banking details
    bankDetails: v.optional(v.object({
      accountName: v.string(),
      accountNumber: v.string(),
      sortCode: v.string(),
      bankName: v.string(),
    })),
    
    // Invoice settings
    invoiceSettings: v.object({
      invoicePrefix: v.string(), // e.g., "INV-"
      nextInvoiceNumber: v.number(),
      defaultPaymentTerms: v.string(),
      defaultVATRate: v.number(),
      footerText: v.optional(v.string()),
    }),
    
    // Logo and branding
    logo: v.optional(v.string()), // Base64 encoded logo
    
    createdAt: v.number(),
    updatedAt: v.number(),
    updatedBy: v.id("users"),
  }),

  dashboards: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    layout: v.array(v.object({
      id: v.string(),
      type: v.union(
        v.literal("metric_card"),
        v.literal("line_chart"),
        v.literal("bar_chart"),
        v.literal("pie_chart"),
        v.literal("area_chart"),
        v.literal("donut_chart"),
        v.literal("table"),
        v.literal("progress_bar"),
        v.literal("gauge"),
        v.literal("heatmap"),
        v.literal("funnel"),
        v.literal("scatter"),
        v.literal("custom_metric")
      ),
      position: v.object({
        x: v.number(),
        y: v.number(),
        w: v.number(),
        h: v.number(),
      }),
      config: v.object({
        title: v.string(),
        dataSource: v.union(v.literal("projects"), v.literal("tasks"), v.literal("contacts"), v.literal("payments"), v.literal("invoices"), v.literal("custom")),
        filters: v.optional(v.array(v.object({
          field: v.string(),
          operator: v.union(v.literal("equals"), v.literal("not_equals"), v.literal("greater_than"), v.literal("less_than"), v.literal("contains"), v.literal("not_contains"), v.literal("starts_with"), v.literal("ends_with"), v.literal("in"), v.literal("not_in")),
          value: v.string(),
        }))),
        aggregation: v.optional(v.union(v.literal("count"), v.literal("sum"), v.literal("average"), v.literal("min"), v.literal("max"))),
        field: v.optional(v.string()),
        groupBy: v.optional(v.string()),
        dateRange: v.optional(v.string()),
        refreshInterval: v.optional(v.number()), // in minutes
        customColors: v.optional(v.array(v.string())),
        showLegend: v.optional(v.boolean()),
        showGrid: v.optional(v.boolean()),
        showTooltip: v.optional(v.boolean()),
        animationEnabled: v.optional(v.boolean()),
        customQuery: v.optional(v.string()), // For advanced users
      }),
    })),
    tags: v.optional(v.array(v.string())),
    isTemplate: v.optional(v.boolean()),
    isPublic: v.boolean(),
    isDefault: v.optional(v.boolean()),
    category: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    lastAccessedAt: v.optional(v.number()),
    accessCount: v.optional(v.number()),
  })
    .index("by_creator", ["createdBy"])
    .index("by_public", ["isPublic"])
    .index("by_template", ["isTemplate"])
    .index("by_category", ["category"])
    .index("by_default", ["createdBy", "isDefault"]),

  dashboardTemplates: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    category: v.string(), // e.g., "Sales", "Project Management", "Financial", "Executive"
    layout: v.array(v.object({
      id: v.string(),
      type: v.union(
        v.literal("metric_card"),
        v.literal("line_chart"),
        v.literal("bar_chart"),
        v.literal("pie_chart"),
        v.literal("area_chart"),
        v.literal("donut_chart"),
        v.literal("table"),
        v.literal("progress_bar"),
        v.literal("gauge"),
        v.literal("heatmap"),
        v.literal("funnel"),
        v.literal("scatter"),
        v.literal("custom_metric")
      ),
      position: v.object({
        x: v.number(),
        y: v.number(),
        w: v.number(),
        h: v.number(),
      }),
      config: v.object({
        title: v.string(),
        dataSource: v.union(v.literal("projects"), v.literal("tasks"), v.literal("contacts"), v.literal("payments"), v.literal("invoices"), v.literal("custom")),
        filters: v.optional(v.array(v.object({
          field: v.string(),
          operator: v.union(v.literal("equals"), v.literal("not_equals"), v.literal("greater_than"), v.literal("less_than"), v.literal("contains"), v.literal("not_contains"), v.literal("starts_with"), v.literal("ends_with"), v.literal("in"), v.literal("not_in")),
          value: v.string(),
        }))),
        aggregation: v.optional(v.union(v.literal("count"), v.literal("sum"), v.literal("average"), v.literal("min"), v.literal("max"))),
        field: v.optional(v.string()),
        groupBy: v.optional(v.string()),
        dateRange: v.optional(v.string()),
        refreshInterval: v.optional(v.number()),
        customColors: v.optional(v.array(v.string())),
        showLegend: v.optional(v.boolean()),
        showGrid: v.optional(v.boolean()),
        showTooltip: v.optional(v.boolean()),
        animationEnabled: v.optional(v.boolean()),
        customQuery: v.optional(v.string()),
      }),
    })),
    tags: v.optional(v.array(v.string())),
    isBuiltIn: v.optional(v.boolean()),
    usageCount: v.optional(v.number()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_creator", ["createdBy"])
    .index("by_builtin", ["isBuiltIn"])
    .index("by_usage", ["usageCount"]),

  scheduledReports: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    dashboardId: v.id("dashboards"),
    schedule: v.object({
      frequency: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"), v.literal("quarterly")),
      dayOfWeek: v.optional(v.number()), // 0-6, for weekly
      dayOfMonth: v.optional(v.number()), // 1-31, for monthly
      time: v.string(), // HH:MM format
      timezone: v.string(),
    }),
    recipients: v.array(v.object({
      email: v.string(),
      name: v.optional(v.string()),
      type: v.union(v.literal("user"), v.literal("external")),
    })),
    format: v.union(v.literal("pdf"), v.literal("excel"), v.literal("csv")),
    isActive: v.boolean(),
    lastSentAt: v.optional(v.number()),
    nextSendAt: v.number(),
    errorCount: v.optional(v.number()),
    lastError: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_dashboard", ["dashboardId"])
    .index("by_creator", ["createdBy"])
    .index("by_next_send", ["nextSendAt"])
    .index("by_active", ["isActive"]),

  reportExports: defineTable({
    dashboardId: v.id("dashboards"),
    format: v.union(v.literal("pdf"), v.literal("excel"), v.literal("csv"), v.literal("json")),
    status: v.union(v.literal("pending"), v.literal("processing"), v.literal("completed"), v.literal("failed")),
    fileUrl: v.optional(v.string()),
    fileName: v.string(),
    fileSize: v.optional(v.number()),
    parameters: v.optional(v.object({
      dateRange: v.optional(v.string()),
      filters: v.optional(v.array(v.object({
        field: v.string(),
        operator: v.string(),
        value: v.string(),
      }))),
      includeCharts: v.optional(v.boolean()),
      includeData: v.optional(v.boolean()),
    })),
    errorMessage: v.optional(v.string()),
    expiresAt: v.number(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_dashboard", ["dashboardId"])
    .index("by_creator", ["createdBy"])
    .index("by_status", ["status"])
    .index("by_expires", ["expiresAt"]),

  expenses: defineTable({
    description: v.string(),
    amount: v.number(),
    date: v.number(),
    projectId: v.optional(v.id("projects")), // Optional link to project
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
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("paid")
    ),
    // VAT fields
    netAmount: v.number(),
    vatAmount: v.number(),
    grossAmount: v.number(),
    vatRate: v.number(),
    isVATInclusive: v.boolean(),
    // Payment details
    paymentMethod: v.optional(v.union(
      v.literal("bank_transfer"),
      v.literal("card"),
      v.literal("cash"),
      v.literal("cheque"),
      v.literal("direct_debit")
    )),
    reference: v.optional(v.string()),
    vendor: v.optional(v.string()),
    // Documentation
    receiptUrl: v.optional(v.string()), // URL to uploaded receipt
    notes: v.optional(v.string()),
    // Recurring expenses
    isRecurring: v.optional(v.boolean()),
    recurringPattern: v.optional(v.union(
      v.literal("monthly"),
      v.literal("quarterly"),
      v.literal("yearly")
    )),
    recurringEndDate: v.optional(v.number()),
    parentExpenseId: v.optional(v.id("expenses")), // For linking recurring instances
    // Approval workflow
    approvedBy: v.optional(v.id("users")),
    approvedAt: v.optional(v.number()),
    rejectionReason: v.optional(v.string()),
    paidAt: v.optional(v.number()),
    // Tracking
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_category", ["category"])
    .index("by_status", ["status"])
    .index("by_date", ["date"])
    .index("by_vendor", ["vendor"])
    .index("by_creator", ["createdBy"])
    .index("by_recurring", ["isRecurring"])
    .index("by_parent", ["parentExpenseId"]),
})