import { mutation } from "./_generated/server"
import { v } from "convex/values"
import { encryptNumber } from "./lib/encryption"

export const seedDatabase = mutation({
  handler: async (ctx) => {
    // First initialize users
    const adminUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", "admin@braunwell.com"))
      .first()
    
    const regularUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", "user@braunwell.com"))
      .first()
    
    if (!adminUser || !regularUser) {
      throw new Error("Please run auth.initializeUsers first")
    }

    const now = Date.now()
    
    // Create sample contacts
    const contacts = [
      {
        name: "John Smith",
        email: "john.smith@techcorp.co.uk",
        phone: "07700 900123",
        company: "TechCorp UK",
        notes: "Key decision maker for enterprise solutions. Met at London Tech Summit 2024. Very interested in our API integration capabilities.",
        createdBy: adminUser._id,
        createdAt: now - 45 * 24 * 60 * 60 * 1000, // 45 days ago
        updatedAt: now - 2 * 24 * 60 * 60 * 1000,
      },
      {
        name: "Sarah Johnson",
        email: "sarah@innovate.uk",
        phone: "+44 20 7946 0958",
        company: "Innovate Solutions",
        notes: "CTO looking for project management tools. Prefers cloud-based solutions with mobile access. Budget approved for Q1 2024.",
        createdBy: adminUser._id,
        createdAt: now - 38 * 24 * 60 * 60 * 1000, // 38 days ago
        updatedAt: now - 5 * 24 * 60 * 60 * 1000,
      },
      {
        name: "Michael Brown",
        email: "m.brown@retailchain.com",
        phone: "07911 123456",
        company: "Retail Chain Ltd",
        notes: "Operations Director - Expanding from 32 to 50+ stores nationwide. Needs CRM with inventory management integration. High priority client.",
        createdBy: regularUser._id,
        createdAt: now - 30 * 24 * 60 * 60 * 1000, // 30 days ago
        updatedAt: now - 1 * 24 * 60 * 60 * 1000,
      },
      {
        name: "Emma Wilson",
        email: "emma.wilson@startupventures.io",
        phone: "07700 900789",
        company: "Startup Ventures",
        notes: "Partner at venture capital firm. Looking for scalable solutions for portfolio companies. Potential for multiple deployments.",
        createdBy: adminUser._id,
        createdAt: now - 25 * 24 * 60 * 60 * 1000, // 25 days ago
        updatedAt: now - 3 * 24 * 60 * 60 * 1000,
      },
      {
        name: "David Lee",
        email: "d.lee@manufacturingco.uk",
        phone: "+44 161 123 4567",
        company: "Manufacturing Co",
        notes: "IT Director - Needs CRM integration with SAP ERP system. Has team of 5 developers for implementation support.",
        createdBy: regularUser._id,
        createdAt: now - 20 * 24 * 60 * 60 * 1000, // 20 days ago
        updatedAt: now - 7 * 24 * 60 * 60 * 1000,
      },
      {
        name: "Sophie Chen",
        email: "sophie.chen@globalfinance.com",
        phone: "07456 789012",
        company: "Global Finance Ltd",
        notes: "Head of Digital Transformation. Needs compliance-ready CRM with audit trails. GDPR and FCA compliance critical.",
        createdBy: adminUser._id,
        createdAt: now - 18 * 24 * 60 * 60 * 1000,
        updatedAt: now - 4 * 24 * 60 * 60 * 1000,
      },
      {
        name: "James Patterson",
        email: "j.patterson@healthtech.nhs.uk",
        phone: "+44 20 3456 7890",
        company: "HealthTech NHS Trust",
        notes: "Procurement lead for NHS trust. Requires extensive security documentation and ISO27001 compliance.",
        createdBy: regularUser._id,
        createdAt: now - 15 * 24 * 60 * 60 * 1000,
        updatedAt: now - 6 * 24 * 60 * 60 * 1000,
      },
      {
        name: "Rebecca Thompson",
        email: "rebecca@digitalagency.co.uk",
        phone: "07321 654987",
        company: "Digital Agency Partners",
        notes: "Managing Director of 50-person agency. Needs CRM for client project tracking and time management.",
        createdBy: adminUser._id,
        createdAt: now - 12 * 24 * 60 * 60 * 1000,
        updatedAt: now - 2 * 60 * 60 * 1000, // 2 hours ago
      },
      {
        name: "Oliver Hughes",
        email: "o.hughes@logistics.uk",
        phone: "07890 123456",
        company: "Express Logistics UK",
        notes: "COO - Interested in CRM with real-time tracking integration. Fleet of 200+ vehicles. Decision expected Q2 2024.",
        createdBy: regularUser._id,
        createdAt: now - 10 * 24 * 60 * 60 * 1000,
        updatedAt: now - 8 * 60 * 60 * 1000,
      },
      {
        name: "Amelia Roberts",
        email: "amelia@edtech-solutions.ac.uk",
        phone: "07555 987654",
        company: "EdTech Solutions",
        notes: "CEO of education technology startup. Needs CRM for managing school partnerships and student data. FERPA compliance needed.",
        createdBy: adminUser._id,
        createdAt: now - 7 * 24 * 60 * 60 * 1000,
        updatedAt: now - 12 * 60 * 60 * 1000,
      },
      {
        name: "Thomas Mitchell",
        email: "t.mitchell@propertygroup.co.uk",
        phone: "+44 121 234 5678",
        company: "Property Group Holdings",
        notes: "Property management firm with 1000+ properties. Needs tenant management and maintenance tracking features.",
        createdBy: regularUser._id,
        createdAt: now - 5 * 24 * 60 * 60 * 1000,
        updatedAt: now - 1 * 24 * 60 * 60 * 1000,
      },
      {
        name: "Charlotte Davies",
        email: "charlotte@greentech.org",
        phone: "07123 456789",
        company: "GreenTech Innovations",
        notes: "Sustainability consultant. Interested in carbon footprint tracking features. Strong ESG focus.",
        createdBy: adminUser._id,
        createdAt: now - 3 * 24 * 60 * 60 * 1000,
        updatedAt: now - 5 * 60 * 60 * 1000,
      },
    ]

    const contactIds = []
    for (const contact of contacts) {
      const existing = await ctx.db
        .query("contacts")
        .withIndex("by_email", (q) => q.eq("email", contact.email))
        .first()
      
      if (!existing) {
        const id = await ctx.db.insert("contacts", contact)
        contactIds.push(id)
      } else {
        contactIds.push(existing._id)
      }
    }

    // Create sample projects
    const projects = [
      {
        name: "Enterprise CRM Implementation",
        company: "TechCorp UK",
        description: "Full CRM rollout for TechCorp UK including custom API integrations, data migration from legacy systems, and comprehensive training program for 200+ users across 5 locations.",
        status: "open" as const,
        expectedRevenueGBP: encryptNumber(185000),
        startDate: now - 30 * 24 * 60 * 60 * 1000, // 30 days ago
        endDate: now + 90 * 24 * 60 * 60 * 1000, // 90 days from now
        createdBy: adminUser._id,
        createdAt: now - 30 * 24 * 60 * 60 * 1000,
        updatedAt: now - 2 * 60 * 60 * 1000,
      },
      {
        name: "POS Integration Phase 1",
        company: "Retail Chain Ltd",
        description: "Integrate CRM with existing POS systems across 32 stores. Real-time inventory sync, customer loyalty program integration, and automated reporting dashboards.",
        status: "open" as const,
        expectedRevenueGBP: encryptNumber(120000),
        startDate: now - 15 * 24 * 60 * 60 * 1000,
        endDate: now + 75 * 24 * 60 * 60 * 1000,
        createdBy: regularUser._id,
        createdAt: now - 15 * 24 * 60 * 60 * 1000,
        updatedAt: now - 1 * 24 * 60 * 60 * 1000,
      },
      {
        name: "Portfolio CRM Development",
        company: "Startup Ventures Capital",
        description: "Multi-tenant CRM solution for venture capital portfolio. Includes deal flow tracking, portfolio analytics, and investor reporting modules.",
        status: "open" as const,
        expectedRevenueGBP: encryptNumber(95000),
        startDate: now - 20 * 24 * 60 * 60 * 1000,
        endDate: now + 40 * 24 * 60 * 60 * 1000,
        createdBy: adminUser._id,
        createdAt: now - 20 * 24 * 60 * 60 * 1000,
        updatedAt: now - 6 * 60 * 60 * 1000,
      },
      {
        name: "Manufacturing ERP Bridge - Completed",
        description: "Custom integration bridge between CRM and SAP ERP. Bidirectional sync of customer data, orders, and inventory levels. Successfully deployed.",
        status: "closed" as const,
        expectedRevenueGBP: encryptNumber(65000),
        startDate: now - 120 * 24 * 60 * 60 * 1000,
        endDate: now - 30 * 24 * 60 * 60 * 1000,
        createdBy: regularUser._id,
        createdAt: now - 120 * 24 * 60 * 60 * 1000,
        updatedAt: now - 30 * 24 * 60 * 60 * 1000,
      },
      {
        name: "Global Finance Compliance Suite",
        description: "GDPR and FCA compliant CRM with advanced audit trails, data retention policies, and automated compliance reporting.",
        status: "open" as const,
        expectedRevenueGBP: encryptNumber(150000),
        startDate: now - 10 * 24 * 60 * 60 * 1000,
        endDate: now + 120 * 24 * 60 * 60 * 1000,
        createdBy: adminUser._id,
        createdAt: now - 10 * 24 * 60 * 60 * 1000,
        updatedAt: now - 4 * 60 * 60 * 1000,
      },
      {
        name: "HealthTech NHS Integration",
        description: "Secure CRM deployment for NHS trust. ISO27001 compliant infrastructure, HL7 integration, and patient data management.",
        status: "open" as const,
        expectedRevenueGBP: encryptNumber(225000),
        startDate: now - 5 * 24 * 60 * 60 * 1000,
        endDate: now + 180 * 24 * 60 * 60 * 1000,
        createdBy: regularUser._id,
        createdAt: now - 5 * 24 * 60 * 60 * 1000,
        updatedAt: now - 3 * 60 * 60 * 1000,
      },
      {
        name: "Digital Agency Client Portal",
        description: "Custom client portal with project tracking, time management, invoicing, and collaborative workspaces for 200+ clients.",
        status: "open" as const,
        expectedRevenueGBP: encryptNumber(78000),
        startDate: now - 8 * 24 * 60 * 60 * 1000,
        endDate: now + 45 * 24 * 60 * 60 * 1000,
        createdBy: adminUser._id,
        createdAt: now - 8 * 24 * 60 * 60 * 1000,
        updatedAt: now - 1 * 60 * 60 * 1000,
      },
      {
        name: "Express Logistics Fleet Tracking",
        description: "Real-time fleet tracking integration with CRM. GPS tracking for 200+ vehicles, route optimization, and customer delivery notifications.",
        status: "open" as const,
        expectedRevenueGBP: encryptNumber(165000),
        startDate: now - 3 * 24 * 60 * 60 * 1000,
        endDate: now + 60 * 24 * 60 * 60 * 1000,
        createdBy: regularUser._id,
        createdAt: now - 3 * 24 * 60 * 60 * 1000,
        updatedAt: now - 8 * 60 * 60 * 1000,
      },
      {
        name: "EdTech Student Management System",
        description: "Comprehensive student data management for educational institutions. FERPA compliant with parent portal and learning analytics.",
        status: "open" as const,
        expectedRevenueGBP: encryptNumber(92000),
        startDate: now - 12 * 24 * 60 * 60 * 1000,
        endDate: now + 30 * 24 * 60 * 60 * 1000,
        createdBy: adminUser._id,
        createdAt: now - 12 * 24 * 60 * 60 * 1000,
        updatedAt: now - 5 * 60 * 60 * 1000,
      },
      {
        name: "Property Management Platform - Phase 2",
        company: "LondonLets Property Group",
        description: "Tenant management system for 1000+ properties. Maintenance ticketing, rent collection, document management, and tenant portal.",
        status: "closed" as const,
        expectedRevenueGBP: encryptNumber(110000),
        startDate: now - 180 * 24 * 60 * 60 * 1000,
        endDate: now - 60 * 24 * 60 * 60 * 1000,
        createdBy: regularUser._id,
        createdAt: now - 180 * 24 * 60 * 60 * 1000,
        updatedAt: now - 60 * 24 * 60 * 60 * 1000,
      },
    ]

    const projectIds = []
    for (const project of projects) {
      const id = await ctx.db.insert("projects", project)
      projectIds.push(id)
      
      // Log project creation
      await ctx.db.insert("auditLogs", {
        action: "created",
        entityType: "project",
        entityId: id,
        userId: project.createdBy,
        timestamp: project.createdAt,
      })
    }

    // Create sample tasks
    const tasks = [
      // Tasks for TechCorp Enterprise CRM Implementation
      {
        title: "Stakeholder requirements gathering",
        description: "Conduct interviews with department heads and document detailed requirements for each business unit",
        status: "done" as const,
        priority: "high" as const,
        projectId: projectIds[0],
        assignedTo: adminUser._id,
        createdBy: adminUser._id,
        createdAt: now - 29 * 24 * 60 * 60 * 1000,
        updatedAt: now - 25 * 24 * 60 * 60 * 1000,
      },
      {
        title: "System architecture design document",
        description: "Create comprehensive architecture design including API specifications, data flow diagrams, and security protocols",
        status: "done" as const,
        priority: "high" as const,
        projectId: projectIds[0],
        assignedTo: adminUser._id,
        createdBy: adminUser._id,
        createdAt: now - 25 * 24 * 60 * 60 * 1000,
        updatedAt: now - 20 * 24 * 60 * 60 * 1000,
      },
      {
        title: "Develop REST API endpoints",
        description: "Build custom APIs for TechCorp integration - 25 endpoints for customer, order, and inventory management",
        status: "in_progress" as const,
        priority: "high" as const,
        dueDate: now + 7 * 24 * 60 * 60 * 1000,
        projectId: projectIds[0],
        assignedTo: regularUser._id,
        createdBy: adminUser._id,
        createdAt: now - 15 * 24 * 60 * 60 * 1000,
        updatedAt: now - 2 * 60 * 60 * 1000,
      },
      {
        title: "Data migration scripts",
        description: "Develop and test migration scripts for 50,000+ customer records from legacy system",
        status: "in_progress" as const,
        priority: "high" as const,
        dueDate: now + 10 * 24 * 60 * 60 * 1000,
        projectId: projectIds[0],
        assignedTo: adminUser._id,
        createdBy: adminUser._id,
        createdAt: now - 10 * 24 * 60 * 60 * 1000,
        updatedAt: now - 4 * 60 * 60 * 1000,
      },
      {
        title: "Security audit and penetration testing",
        description: "Conduct comprehensive security audit and fix any vulnerabilities before deployment",
        status: "todo" as const,
        priority: "high" as const,
        dueDate: now + 25 * 24 * 60 * 60 * 1000,
        projectId: projectIds[0],
        assignedTo: regularUser._id,
        createdBy: adminUser._id,
        createdAt: now - 5 * 24 * 60 * 60 * 1000,
        updatedAt: now - 5 * 24 * 60 * 60 * 1000,
      },
      {
        title: "User training materials",
        description: "Create video tutorials and documentation for end-user training",
        status: "todo" as const,
        priority: "medium" as const,
        dueDate: now + 30 * 24 * 60 * 60 * 1000,
        projectId: projectIds[0],
        assignedTo: adminUser._id,
        createdBy: adminUser._id,
        createdAt: now - 3 * 24 * 60 * 60 * 1000,
        updatedAt: now - 3 * 24 * 60 * 60 * 1000,
      },
      
      // Tasks for Retail Chain POS Integration
      {
        title: "POS system compatibility analysis",
        description: "Document all 5 different POS systems across stores and identify integration points",
        status: "done" as const,
        priority: "high" as const,
        projectId: projectIds[1],
        assignedTo: regularUser._id,
        createdBy: regularUser._id,
        createdAt: now - 14 * 24 * 60 * 60 * 1000,
        updatedAt: now - 10 * 24 * 60 * 60 * 1000,
      },
      {
        title: "Real-time sync framework",
        description: "Implement message queue system for real-time inventory and sales data synchronization",
        status: "in_progress" as const,
        priority: "high" as const,
        dueDate: now + 5 * 24 * 60 * 60 * 1000,
        projectId: projectIds[1],
        assignedTo: regularUser._id,
        createdBy: regularUser._id,
        createdAt: now - 7 * 24 * 60 * 60 * 1000,
        updatedAt: now - 1 * 60 * 60 * 1000,
      },
      {
        title: "Loyalty program integration",
        description: "Connect existing customer loyalty program with new CRM system",
        status: "in_progress" as const,
        priority: "medium" as const,
        dueDate: now + 12 * 24 * 60 * 60 * 1000,
        projectId: projectIds[1],
        assignedTo: adminUser._id,
        createdBy: regularUser._id,
        createdAt: now - 5 * 24 * 60 * 60 * 1000,
        updatedAt: now - 6 * 60 * 60 * 1000,
      },
      {
        title: "Store pilot deployment - Manchester",
        description: "Deploy and test integration in Manchester flagship store",
        status: "todo" as const,
        priority: "high" as const,
        dueDate: now + 20 * 24 * 60 * 60 * 1000,
        projectId: projectIds[1],
        assignedTo: regularUser._id,
        createdBy: regularUser._id,
        createdAt: now - 3 * 24 * 60 * 60 * 1000,
        updatedAt: now - 3 * 24 * 60 * 60 * 1000,
      },
      {
        title: "Performance optimization",
        description: "Optimize data sync to handle Black Friday traffic levels (10x normal load)",
        status: "todo" as const,
        priority: "high" as const,
        dueDate: now + 35 * 24 * 60 * 60 * 1000,
        projectId: projectIds[1],
        assignedTo: regularUser._id,
        createdBy: adminUser._id,
        createdAt: now - 2 * 24 * 60 * 60 * 1000,
        updatedAt: now - 2 * 24 * 60 * 60 * 1000,
      },
      
      // Tasks for Global Finance Compliance Suite
      {
        title: "GDPR compliance audit",
        description: "Review all data handling processes for GDPR compliance and create documentation",
        status: "done" as const,
        priority: "high" as const,
        projectId: projectIds[4],
        assignedTo: adminUser._id,
        createdBy: adminUser._id,
        createdAt: now - 9 * 24 * 60 * 60 * 1000,
        updatedAt: now - 7 * 24 * 60 * 60 * 1000,
      },
      {
        title: "Implement audit trail system",
        description: "Create comprehensive audit logging for all data access and modifications",
        status: "in_progress" as const,
        priority: "high" as const,
        dueDate: now + 8 * 24 * 60 * 60 * 1000,
        projectId: projectIds[4],
        assignedTo: regularUser._id,
        createdBy: adminUser._id,
        createdAt: now - 6 * 24 * 60 * 60 * 1000,
        updatedAt: now - 3 * 60 * 60 * 1000,
      },
      {
        title: "FCA reporting module",
        description: "Build automated FCA compliance reporting with scheduled report generation",
        status: "todo" as const,
        priority: "high" as const,
        dueDate: now + 15 * 24 * 60 * 60 * 1000,
        projectId: projectIds[4],
        assignedTo: adminUser._id,
        createdBy: adminUser._id,
        createdAt: now - 4 * 24 * 60 * 60 * 1000,
        updatedAt: now - 4 * 24 * 60 * 60 * 1000,
      },
      
      // Tasks for HealthTech NHS Integration
      {
        title: "ISO27001 infrastructure setup",
        description: "Configure secure infrastructure meeting ISO27001 requirements",
        status: "in_progress" as const,
        priority: "high" as const,
        dueDate: now + 10 * 24 * 60 * 60 * 1000,
        projectId: projectIds[5],
        assignedTo: regularUser._id,
        createdBy: regularUser._id,
        createdAt: now - 4 * 24 * 60 * 60 * 1000,
        updatedAt: now - 2 * 60 * 60 * 1000,
      },
      {
        title: "HL7 message parser",
        description: "Develop HL7 message parser for patient data exchange",
        status: "todo" as const,
        priority: "high" as const,
        dueDate: now + 20 * 24 * 60 * 60 * 1000,
        projectId: projectIds[5],
        assignedTo: adminUser._id,
        createdBy: regularUser._id,
        createdAt: now - 3 * 24 * 60 * 60 * 1000,
        updatedAt: now - 3 * 24 * 60 * 60 * 1000,
      },
      {
        title: "NHS login integration",
        description: "Integrate with NHS identity service for single sign-on",
        status: "todo" as const,
        priority: "medium" as const,
        dueDate: now + 30 * 24 * 60 * 60 * 1000,
        projectId: projectIds[5],
        assignedTo: regularUser._id,
        createdBy: regularUser._id,
        createdAt: now - 2 * 24 * 60 * 60 * 1000,
        updatedAt: now - 2 * 24 * 60 * 60 * 1000,
      },
      
      // Tasks for Digital Agency Client Portal
      {
        title: "Project template system",
        description: "Create reusable project templates for common agency workflows",
        status: "done" as const,
        priority: "medium" as const,
        projectId: projectIds[6],
        assignedTo: adminUser._id,
        createdBy: adminUser._id,
        createdAt: now - 7 * 24 * 60 * 60 * 1000,
        updatedAt: now - 5 * 24 * 60 * 60 * 1000,
      },
      {
        title: "Time tracking integration",
        description: "Integrate with Toggl and Harvest APIs for automatic time import",
        status: "in_progress" as const,
        priority: "high" as const,
        dueDate: now + 6 * 24 * 60 * 60 * 1000,
        projectId: projectIds[6],
        assignedTo: adminUser._id,
        createdBy: adminUser._id,
        createdAt: now - 4 * 24 * 60 * 60 * 1000,
        updatedAt: now - 1 * 60 * 60 * 1000,
      },
      {
        title: "Client collaboration features",
        description: "Build real-time commenting and file sharing for client projects",
        status: "todo" as const,
        priority: "medium" as const,
        dueDate: now + 18 * 24 * 60 * 60 * 1000,
        projectId: projectIds[6],
        assignedTo: regularUser._id,
        createdBy: adminUser._id,
        createdAt: now - 2 * 24 * 60 * 60 * 1000,
        updatedAt: now - 2 * 24 * 60 * 60 * 1000,
      },
      
      // Tasks for Express Logistics Fleet Tracking
      {
        title: "GPS device integration",
        description: "Connect with fleet GPS devices via API for real-time location data",
        status: "in_progress" as const,
        priority: "high" as const,
        dueDate: now + 5 * 24 * 60 * 60 * 1000,
        projectId: projectIds[7],
        assignedTo: regularUser._id,
        createdBy: regularUser._id,
        createdAt: now - 2 * 24 * 60 * 60 * 1000,
        updatedAt: now - 5 * 60 * 60 * 1000,
      },
      {
        title: "Route optimization algorithm",
        description: "Implement ML-based route optimization for delivery efficiency",
        status: "todo" as const,
        priority: "high" as const,
        dueDate: now + 15 * 24 * 60 * 60 * 1000,
        projectId: projectIds[7],
        assignedTo: adminUser._id,
        createdBy: regularUser._id,
        createdAt: now - 1 * 24 * 60 * 60 * 1000,
        updatedAt: now - 1 * 24 * 60 * 60 * 1000,
      },
      {
        title: "Customer delivery notifications",
        description: "SMS and email notifications with real-time delivery tracking links",
        status: "todo" as const,
        priority: "medium" as const,
        dueDate: now + 25 * 24 * 60 * 60 * 1000,
        projectId: projectIds[7],
        assignedTo: regularUser._id,
        createdBy: regularUser._id,
        createdAt: now - 8 * 60 * 60 * 1000,
        updatedAt: now - 8 * 60 * 60 * 1000,
      },
    ]

    for (const task of tasks) {
      const id = await ctx.db.insert("tasks", task)
      
      // Log task creation
      await ctx.db.insert("auditLogs", {
        action: "created",
        entityType: "task",
        entityId: id,
        userId: task.createdBy,
        timestamp: task.createdAt,
      })
    }

    // Create project-contact associations
    const projectContactAssociations = [
      // TechCorp Enterprise CRM Implementation
      { projectId: projectIds[0], contactId: contactIds[0], role: "Project Manager" },
      { projectId: projectIds[0], contactId: contactIds[1], role: "Technical Lead" },
      
      // FinanceHub Annual Audit System
      { projectId: projectIds[1], contactId: contactIds[2], role: "Primary Contact" },
      { projectId: projectIds[1], contactId: contactIds[3], role: "Finance Director" },
      
      // HealthPlus Appointment Booking
      { projectId: projectIds[2], contactId: contactIds[4], role: "IT Manager" },
      { projectId: projectIds[2], contactId: contactIds[5], role: "Operations Lead" },
      
      // EduTech Learning Management
      { projectId: projectIds[3], contactId: contactIds[6], role: "Principal" },
      { projectId: projectIds[3], contactId: contactIds[7], role: "IT Coordinator" },
      
      // TechCorp Infrastructure Upgrade
      { projectId: projectIds[4], contactId: contactIds[0], role: "Infrastructure Lead" },
      { projectId: projectIds[4], contactId: contactIds[8], role: "Network Administrator" },
      
      // FinanceHub Blockchain Integration
      { projectId: projectIds[5], contactId: contactIds[2], role: "Blockchain Specialist" },
      { projectId: projectIds[5], contactId: contactIds[9], role: "Security Officer" },
      
      // HealthPlus Patient Portal
      { projectId: projectIds[6], contactId: contactIds[4], role: "Portal Administrator" },
      { projectId: projectIds[6], contactId: contactIds[10], role: "Patient Experience Manager" },
      
      // Express Logistics Fleet Tracking
      { projectId: projectIds[7], contactId: contactIds[11], role: "Operations Director" },
      
      // EduTech Mobile App
      { projectId: projectIds[8], contactId: contactIds[6], role: "Mobile Strategy Lead" },
    ]

    for (const association of projectContactAssociations) {
      await ctx.db.insert("projectContacts", {
        projectId: association.projectId,
        contactId: association.contactId,
        role: association.role,
        notes: `Key stakeholder for project implementation`,
        createdBy: adminUser._id,
        createdAt: now - 20 * 24 * 60 * 60 * 1000,
      })
    }

    // Create contact communications
    const communications = [
      {
        contactId: contactIds[0],
        type: "email" as const,
        subject: "Initial consultation meeting",
        notes: "Sent project proposal and pricing information. They're very interested in our API integration capabilities.",
        date: now - 30 * 24 * 60 * 60 * 1000,
        createdBy: adminUser._id,
        createdAt: now - 30 * 24 * 60 * 60 * 1000,
      },
      {
        contactId: contactIds[0],
        type: "call" as const,
        subject: "Follow-up on proposal",
        notes: "Discussed technical requirements in detail. They need 25 API endpoints. Budget approved.",
        date: now - 25 * 24 * 60 * 60 * 1000,
        createdBy: adminUser._id,
        createdAt: now - 25 * 24 * 60 * 60 * 1000,
      },
      {
        contactId: contactIds[0],
        type: "meeting" as const,
        subject: "Technical architecture review",
        notes: "Met with their tech team. Went through API specifications and security requirements.",
        date: now - 15 * 24 * 60 * 60 * 1000,
        createdBy: regularUser._id,
        createdAt: now - 15 * 24 * 60 * 60 * 1000,
      },
      {
        contactId: contactIds[1],
        type: "email" as const,
        subject: "Introduction to cloud migration services",
        notes: "Sent case studies from similar projects. They're interested in our Kubernetes expertise.",
        date: now - 20 * 24 * 60 * 60 * 1000,
        createdBy: adminUser._id,
        createdAt: now - 20 * 24 * 60 * 60 * 1000,
      },
      {
        contactId: contactIds[2],
        type: "call" as const,
        subject: "Quarterly business review",
        notes: "Discussed expansion plans for 2024. They're happy with current progress.",
        date: now - 5 * 24 * 60 * 60 * 1000,
        createdBy: regularUser._id,
        createdAt: now - 5 * 24 * 60 * 60 * 1000,
      },
    ]

    for (const comm of communications) {
      await ctx.db.insert("contactCommunications", comm)
    }

    // Create contact notes
    const notes = [
      {
        contactId: contactIds[0],
        content: "John is the key decision maker for all technical purchases. Prefers detailed technical documentation before meetings. Best to reach him early mornings (8-9 AM).",
        createdBy: adminUser._id,
        createdAt: now - 35 * 24 * 60 * 60 * 1000,
      },
      {
        contactId: contactIds[0],
        content: "Update: Budget has been increased by 20% for Q1 2024. They're looking to accelerate the timeline.",
        createdBy: adminUser._id,
        createdAt: now - 10 * 24 * 60 * 60 * 1000,
      },
      {
        contactId: contactIds[1],
        content: "Sarah mentioned they're evaluating 3 vendors. Our main competition is CloudTech Solutions. Our advantage is local UK support.",
        createdBy: regularUser._id,
        createdAt: now - 18 * 24 * 60 * 60 * 1000,
      },
      {
        contactId: contactIds[2],
        content: "Michael is expanding operations significantly. 18 new stores planned for 2024. Each store will need full POS integration.",
        createdBy: adminUser._id,
        createdAt: now - 22 * 24 * 60 * 60 * 1000,
      },
      {
        contactId: contactIds[3],
        content: "Emma requires detailed compliance documentation for each deliverable. All work must meet ISO 27001 standards.",
        createdBy: regularUser._id,
        createdAt: now - 28 * 24 * 60 * 60 * 1000,
      },
    ]

    for (const note of notes) {
      await ctx.db.insert("contactNotes", note)
    }

    // Create some recent audit logs
    const recentLogs = [
      {
        action: "updated",
        entityType: "project",
        entityId: projectIds[0],
        userId: adminUser._id,
        changes: JSON.stringify({ status: "in_progress" }),
        timestamp: now - 2 * 60 * 60 * 1000, // 2 hours ago
      },
      {
        action: "created",
        entityType: "contact",
        entityId: contactIds.length > 0 ? contactIds[contactIds.length - 1] : "temp",
        userId: regularUser._id,
        timestamp: now - 4 * 60 * 60 * 1000, // 4 hours ago
      },
      {
        action: "updated",
        entityType: "task",
        entityId: "temp-task-id",
        userId: regularUser._id,
        changes: JSON.stringify({ status: "in_progress" }),
        timestamp: now - 6 * 60 * 60 * 1000, // 6 hours ago
      },
    ]

    for (const log of recentLogs) {
      await ctx.db.insert("auditLogs", log)
    }

    // Create project payments
    const payments = [
      {
        projectId: projectIds[0],
        amount: 50000,
        date: now - 25 * 24 * 60 * 60 * 1000,
        method: "bank_transfer" as const,
        reference: "INV-001-DEPOSIT",
        notes: "Initial deposit payment - 27% of total",
        createdBy: adminUser._id,
        createdAt: now - 25 * 24 * 60 * 60 * 1000,
      },
      {
        projectId: projectIds[0],
        amount: 35000,
        date: now - 10 * 24 * 60 * 60 * 1000,
        method: "bank_transfer" as const,
        reference: "INV-001-MILESTONE1",
        notes: "Milestone 1 completion - API development",
        createdBy: adminUser._id,
        createdAt: now - 10 * 24 * 60 * 60 * 1000,
      },
      {
        projectId: projectIds[1],
        amount: 40000,
        date: now - 12 * 24 * 60 * 60 * 1000,
        method: "bank_transfer" as const,
        reference: "PO-2024-0892",
        notes: "First phase payment - 33% of total",
        createdBy: regularUser._id,
        createdAt: now - 12 * 24 * 60 * 60 * 1000,
      },
      {
        projectId: projectIds[2],
        amount: 30000,
        date: now - 15 * 24 * 60 * 60 * 1000,
        method: "cheque" as const,
        reference: "CHQ-190845",
        notes: "Initial payment",
        createdBy: adminUser._id,
        createdAt: now - 15 * 24 * 60 * 60 * 1000,
      },
      {
        projectId: projectIds[3],
        amount: 22000,
        date: now - 40 * 24 * 60 * 60 * 1000,
        method: "bank_transfer" as const,
        reference: "SWIFT-UK2024-JAN",
        notes: "Full payment received",
        createdBy: regularUser._id,
        createdAt: now - 40 * 24 * 60 * 60 * 1000,
      },
    ]

    for (const payment of payments) {
      await ctx.db.insert("projectPayments", payment)
    }

    // Seed expenses inline since dynamic imports don't work in Convex
    const expenseCount = await seedExpensesInline(ctx, adminUser._id)

    return {
      message: "Database seeded successfully with comprehensive test data",
      contacts: contacts.length,
      projects: projects.length,
      tasks: tasks.length,
      communications: communications.length,
      notes: notes.length,
      payments: payments.length,
      expenses: expenseCount,
      auditLogs: recentLogs.length + projects.length + tasks.length,
    }
  },
})

async function seedExpensesInline(ctx: any, userId: any) {
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

  // Create 30 expenses with various statuses
  const expenses = []
  const now = Date.now()
  const oneDay = 24 * 60 * 60 * 1000
  
  for (let i = 0; i < 30; i++) {
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
    
    const expense: any = {
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
      createdBy: userId,
      createdAt: date,
      updatedAt: date,
    }
    
    // Set approval/payment details based on status
    if (status === "approved" || status === "paid") {
      expense.approvedBy = userId
      expense.approvedAt = date + (7 * oneDay) // Approved after 7 days
    }
    
    if (status === "paid") {
      expense.paidAt = date + (14 * oneDay) // Paid after 14 days
    }
    
    if (status === "rejected") {
      expense.rejectionReason = getRandomRejectionReason()
    }
    
    await ctx.db.insert("expenses", expense)
  }
  
  return 30
}

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