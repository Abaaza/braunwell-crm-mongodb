import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { Id } from "./_generated/dataModel"

// Types for search functionality
type SearchEntityType = "contacts" | "projects" | "tasks" | "all"
type SearchOperator = "equals" | "not_equals" | "contains" | "not_contains" | "greater_than" | "less_than" | "starts_with" | "ends_with"
type SortOrder = "asc" | "desc"

interface SearchFilters {
  dateRange?: {
    start?: number
    end?: number
  }
  status?: string[]
  priority?: string[]
  assignedTo?: Id<"users">[]
  projectId?: Id<"projects">[]
  contactId?: Id<"contacts">[]
  tags?: string[]
  customFields?: {
    field: string
    operator: SearchOperator
    value: string
  }[]
}

interface SearchResult {
  entityType: SearchEntityType
  entityId: string
  title: string
  description?: string
  relevanceScore: number
  highlights: string[]
  metadata: {
    status?: string
    priority?: string
    tags?: string[]
    createdAt: number
    updatedAt: number
    projectName?: string
    assigneeName?: string
    contactName?: string
  }
}

// Helper function to extract keywords from text
function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(word => word.length > 2)
    .slice(0, 50) // Limit to 50 keywords per entity
}

// Helper function to calculate relevance score
function calculateRelevanceScore(query: string, content: string, keywords: string[]): number {
  const queryLower = query.toLowerCase()
  const contentLower = content.toLowerCase()
  
  let score = 0
  
  // Exact phrase match (highest score)
  if (contentLower.includes(queryLower)) {
    score += 100
  }
  
  // Individual word matches
  const queryWords = queryLower.split(/\s+/)
  for (const word of queryWords) {
    if (word.length > 2) {
      // Keyword exact match
      if (keywords.includes(word)) {
        score += 20
      }
      // Partial content match
      if (contentLower.includes(word)) {
        score += 10
      }
    }
  }
  
  // Boost score for title matches
  const titleMatch = content.split('\n')[0] || ""
  if (titleMatch.toLowerCase().includes(queryLower)) {
    score += 50
  }
  
  return score
}

// Helper function to create search highlights
function createHighlights(query: string, content: string, maxHighlights: number = 3): string[] {
  const queryLower = query.toLowerCase()
  const contentLower = content.toLowerCase()
  const highlights: string[] = []
  
  // Find sentences containing the query
  const sentences = content.split(/[.!?]\s+/)
  
  for (const sentence of sentences) {
    if (highlights.length >= maxHighlights) break
    
    const sentenceLower = sentence.toLowerCase()
    if (sentenceLower.includes(queryLower)) {
      // Highlight the matching text
      const highlightedSentence = sentence.replace(
        new RegExp(`(${query})`, 'gi'),
        '<mark>$1</mark>'
      )
      highlights.push(highlightedSentence.trim())
    }
  }
  
  return highlights
}

// Update search index when entities are modified
export const updateSearchIndex = mutation({
  args: {
    entityType: v.union(v.literal("contacts"), v.literal("projects"), v.literal("tasks")),
    entityId: v.string(),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    const { entityType, entityId, data } = args
    
    // Build searchable content based on entity type
    let searchableContent = ""
    let keywords: string[] = []
    let metadata: any = {}
    
    switch (entityType) {
      case "contacts":
        searchableContent = [
          data.name,
          data.email,
          data.phone,
          data.company,
          data.notes,
          ...(data.tags || [])
        ].filter(Boolean).join(" ")
        
        metadata = {
          title: data.name,
          description: data.notes,
          tags: data.tags,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        }
        break
        
      case "projects":
        searchableContent = [
          data.name,
          data.company,
          data.description,
          data.status,
        ].filter(Boolean).join(" ")
        
        metadata = {
          title: data.name,
          description: data.description,
          status: data.status,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        }
        break
        
      case "tasks":
        searchableContent = [
          data.title,
          data.description,
          data.status,
          data.priority,
        ].filter(Boolean).join(" ")
        
        metadata = {
          title: data.title,
          description: data.description,
          status: data.status,
          priority: data.priority,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        }
        break
    }
    
    keywords = extractKeywords(searchableContent)
    
    // Check if index entry exists
    const existing = await ctx.db
      .query("searchIndex")
      .withIndex("by_entity", (q) => q.eq("entityType", entityType).eq("entityId", entityId))
      .first()
    
    const now = Date.now()
    
    if (existing) {
      // Update existing entry
      await ctx.db.patch(existing._id, {
        searchableContent,
        keywords,
        metadata,
        updatedAt: now,
      })
    } else {
      // Create new entry
      await ctx.db.insert("searchIndex", {
        entityType,
        entityId,
        searchableContent,
        keywords,
        metadata,
        createdAt: now,
        updatedAt: now,
      })
    }
  },
})

// Remove from search index
export const removeFromSearchIndex = mutation({
  args: {
    entityType: v.union(v.literal("contacts"), v.literal("projects"), v.literal("tasks")),
    entityId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("searchIndex")
      .withIndex("by_entity", (q) => q.eq("entityType", args.entityType).eq("entityId", args.entityId))
      .first()
    
    if (existing) {
      await ctx.db.delete(existing._id)
    }
  },
})

// Main search function with advanced capabilities
export const search = query({
  args: {
    query: v.string(),
    entityType: v.optional(v.union(v.literal("contacts"), v.literal("projects"), v.literal("tasks"), v.literal("all"))),
    filters: v.optional(v.object({
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
    })),
    sortBy: v.optional(v.object({
      field: v.string(),
      order: v.union(v.literal("asc"), v.literal("desc")),
    })),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { query, entityType = "all", filters, sortBy, limit = 50, offset = 0 } = args
    
    if (!query.trim()) {
      return {
        results: [],
        totalCount: 0,
        searchTime: 0,
      }
    }
    
    const startTime = Date.now()
    
    // Get search index entries
    let searchEntries = await ctx.db.query("searchIndex").collect()
    
    // Filter by entity type
    if (entityType !== "all") {
      searchEntries = searchEntries.filter(entry => entry.entityType === entityType)
    }
    
    // Calculate relevance scores and filter
    const scoredResults: (typeof searchEntries[0] & { relevanceScore: number })[] = []
    
    for (const entry of searchEntries) {
      const score = calculateRelevanceScore(query, entry.searchableContent, entry.keywords)
      if (score > 0) {
        scoredResults.push({ ...entry, relevanceScore: score })
      }
    }
    
    // Sort by relevance score
    scoredResults.sort((a, b) => b.relevanceScore - a.relevanceScore)
    
    // Apply additional filters
    let filteredResults = scoredResults
    
    if (filters) {
      filteredResults = filteredResults.filter(result => {
        // Date range filter
        if (filters.dateRange) {
          const { start, end } = filters.dateRange
          const createdAt = result.metadata.createdAt
          if (start && createdAt < start) return false
          if (end && createdAt > end) return false
        }
        
        // Status filter
        if (filters.status && filters.status.length > 0) {
          if (!result.metadata.status || !filters.status.includes(result.metadata.status)) {
            return false
          }
        }
        
        // Priority filter
        if (filters.priority && filters.priority.length > 0) {
          if (!result.metadata.priority || !filters.priority.includes(result.metadata.priority)) {
            return false
          }
        }
        
        // Tags filter
        if (filters.tags && filters.tags.length > 0) {
          const resultTags = result.metadata.tags || []
          if (!filters.tags.some(tag => resultTags.includes(tag))) {
            return false
          }
        }
        
        return true
      })
    }
    
    // Apply sorting if specified
    if (sortBy) {
      filteredResults.sort((a, b) => {
        const aVal = (a.metadata as any)[sortBy.field]
        const bVal = (b.metadata as any)[sortBy.field]
        
        if (sortBy.order === "asc") {
          return aVal > bVal ? 1 : -1
        } else {
          return aVal < bVal ? 1 : -1
        }
      })
    }
    
    // Apply pagination
    const paginatedResults = filteredResults.slice(offset, offset + limit)
    
    // Enrich results with additional data
    const enrichedResults: SearchResult[] = []
    
    for (const result of paginatedResults) {
      const highlights = createHighlights(query, result.searchableContent)
      
      // Get additional metadata based on entity type
      let additionalMetadata: any = {}
      
      if (result.entityType === "tasks") {
        const task = await ctx.db.get(result.entityId as Id<"tasks">)
        if (task) {
          const project = await ctx.db.get(task.projectId)
          const assignee = task.assignedTo ? await ctx.db.get(task.assignedTo) : null
          additionalMetadata = {
            projectId: task.projectId,
            projectName: project?.name,
            assigneeName: assignee?.name,
          }
        }
      } else if (result.entityType === "projects") {
        const project = await ctx.db.get(result.entityId as Id<"projects">)
        if (project) {
          const creator = await ctx.db.get(project.createdBy)
          additionalMetadata = {
            creatorName: creator?.name,
          }
        }
      }
      
      enrichedResults.push({
        entityType: result.entityType,
        entityId: result.entityId,
        title: result.metadata.title || "Untitled",
        description: result.metadata.description,
        relevanceScore: result.relevanceScore,
        highlights,
        metadata: {
          ...result.metadata,
          ...additionalMetadata,
        },
      })
    }
    
    const searchTime = Date.now() - startTime
    
    return {
      results: enrichedResults,
      totalCount: filteredResults.length,
      searchTime,
    }
  },
})

// Search suggestions based on query
export const searchSuggestions = query({
  args: {
    query: v.string(),
    entityType: v.optional(v.union(v.literal("contacts"), v.literal("projects"), v.literal("tasks"), v.literal("all"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { query, entityType = "all", limit = 10 } = args
    
    if (!query.trim() || query.length < 2) {
      return []
    }
    
    const queryLower = query.toLowerCase()
    
    // Get search index entries
    let searchEntries = await ctx.db.query("searchIndex").collect()
    
    // Filter by entity type
    if (entityType !== "all") {
      searchEntries = searchEntries.filter(entry => entry.entityType === entityType)
    }
    
    // Find matching suggestions
    const suggestions: string[] = []
    const seenSuggestions = new Set<string>()
    
    for (const entry of searchEntries) {
      if (suggestions.length >= limit) break
      
      // Check if title starts with query
      const title = entry.metadata.title || ""
      if (title.toLowerCase().startsWith(queryLower)) {
        if (!seenSuggestions.has(title)) {
          suggestions.push(title)
          seenSuggestions.add(title)
        }
      }
      
      // Check keywords
      for (const keyword of entry.keywords) {
        if (suggestions.length >= limit) break
        
        if (keyword.startsWith(queryLower) && keyword.length > query.length) {
          if (!seenSuggestions.has(keyword)) {
            suggestions.push(keyword)
            seenSuggestions.add(keyword)
          }
        }
      }
    }
    
    return suggestions
  },
})

// Save search query
export const saveSearch = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    entityType: v.union(v.literal("contacts"), v.literal("projects"), v.literal("tasks"), v.literal("all")),
    query: v.string(),
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
    isPublic: v.optional(v.boolean()),
    isDefault: v.optional(v.boolean()),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { userId, ...searchData } = args
    const now = Date.now()
    
    // If setting as default, unset previous default
    if (args.isDefault) {
      const existingDefault = await ctx.db
        .query("savedSearches")
        .withIndex("by_creator", (q) => q.eq("createdBy", userId))
        .filter((q) => q.eq(q.field("isDefault"), true))
        .first()
      
      if (existingDefault) {
        await ctx.db.patch(existingDefault._id, { isDefault: false })
      }
    }
    
    const searchId = await ctx.db.insert("savedSearches", {
      ...searchData,
      isPublic: args.isPublic || false,
      usageCount: 0,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    })
    
    return searchId
  },
})

// Get saved searches
export const getSavedSearches = query({
  args: {
    userId: v.optional(v.id("users")),
    entityType: v.optional(v.union(v.literal("contacts"), v.literal("projects"), v.literal("tasks"), v.literal("all"))),
  },
  handler: async (ctx, args) => {
    let searches = await ctx.db.query("savedSearches").collect()
    
    // Filter by entity type
    if (args.entityType) {
      searches = searches.filter(s => s.entityType === args.entityType)
    }
    
    // Filter by user (own searches + public searches)
    if (args.userId) {
      searches = searches.filter(s => s.isPublic || s.createdBy === args.userId)
    } else {
      searches = searches.filter(s => s.isPublic)
    }
    
    // Sort by usage count and creation date
    searches.sort((a, b) => {
      const aUsage = a.usageCount || 0
      const bUsage = b.usageCount || 0
      
      if (aUsage !== bUsage) {
        return bUsage - aUsage
      }
      
      return b.createdAt - a.createdAt
    })
    
    return searches
  },
})

// Update saved search usage
export const updateSearchUsage = mutation({
  args: {
    searchId: v.id("savedSearches"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const search = await ctx.db.get(args.searchId)
    if (!search) return
    
    const now = Date.now()
    await ctx.db.patch(args.searchId, {
      usageCount: (search.usageCount || 0) + 1,
      lastUsed: now,
      updatedAt: now,
    })
  },
})

// Record search in history
export const recordSearchHistory = mutation({
  args: {
    userId: v.id("users"),
    query: v.string(),
    entityType: v.union(v.literal("contacts"), v.literal("projects"), v.literal("tasks"), v.literal("all")),
    resultsCount: v.number(),
    searchTime: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    
    await ctx.db.insert("searchHistory", {
      ...args,
      timestamp: now,
    })
    
    // Clean up old history entries (keep last 100 per user)
    const userHistory = await ctx.db
      .query("searchHistory")
      .withIndex("by_user_timestamp", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect()
    
    if (userHistory.length > 100) {
      const toDelete = userHistory.slice(100)
      for (const entry of toDelete) {
        await ctx.db.delete(entry._id)
      }
    }
  },
})

// Check search index status
export const checkSearchIndex = query({
  args: {},
  handler: async (ctx) => {
    const indexEntries = await ctx.db.query("searchIndex").collect()
    const contacts = await ctx.db.query("contacts").collect()
    const projects = await ctx.db.query("projects").collect()
    const tasks = await ctx.db.query("tasks").collect()
    
    return {
      indexCount: indexEntries.length,
      contactsCount: contacts.length,
      projectsCount: projects.length,
      tasksCount: tasks.length,
      sampleEntries: indexEntries.slice(0, 5)
    }
  },
})

// Get search history
export const getSearchHistory = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20
    
    const history = await ctx.db
      .query("searchHistory")
      .withIndex("by_user_timestamp", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit)
    
    return history
  },
})

// Delete saved search
export const deleteSavedSearch = mutation({
  args: {
    searchId: v.id("savedSearches"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const search = await ctx.db.get(args.searchId)
    if (!search) throw new Error("Search not found")
    
    // Only creator can delete their own search
    if (search.createdBy !== args.userId) {
      throw new Error("Unauthorized")
    }
    
    await ctx.db.delete(args.searchId)
  },
})

// Rebuild search index (simplified version for testing)
export const rebuildSearchIndexSimple = mutation({
  args: {},
  handler: async (ctx) => {
    // Clear existing index
    const existingEntries = await ctx.db.query("searchIndex").collect()
    for (const entry of existingEntries) {
      await ctx.db.delete(entry._id)
    }
    
    // Rebuild contacts index
    const contacts = await ctx.db.query("contacts").collect()
    for (const contact of contacts) {
      const searchableContent = [
        contact.name,
        contact.email,
        contact.phone,
        contact.company,
        contact.notes,
        ...(contact.tags || [])
      ].filter(Boolean).join(" ")
      
      const keywords = extractKeywords(searchableContent)
      const now = Date.now()
      
      await ctx.db.insert("searchIndex", {
        entityType: "contacts",
        entityId: contact._id,
        searchableContent,
        keywords,
        metadata: {
          title: contact.name,
          description: contact.notes,
          tags: contact.tags,
          createdAt: contact.createdAt,
          updatedAt: contact.updatedAt,
        },
        createdAt: now,
        updatedAt: now,
      })
    }
    
    // Rebuild projects index
    const projects = await ctx.db.query("projects").collect()
    for (const project of projects) {
      const searchableContent = [
        project.name,
        project.company,
        project.description,
        project.status,
      ].filter(Boolean).join(" ")
      
      const keywords = extractKeywords(searchableContent)
      const now = Date.now()
      
      await ctx.db.insert("searchIndex", {
        entityType: "projects",
        entityId: project._id,
        searchableContent,
        keywords,
        metadata: {
          title: project.name,
          description: project.description,
          status: project.status,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        },
        createdAt: now,
        updatedAt: now,
      })
    }
    
    // Rebuild tasks index
    const tasks = await ctx.db.query("tasks").collect()
    for (const task of tasks) {
      const searchableContent = [
        task.title,
        task.description,
        task.status,
        task.priority,
      ].filter(Boolean).join(" ")
      
      const keywords = extractKeywords(searchableContent)
      const now = Date.now()
      
      await ctx.db.insert("searchIndex", {
        entityType: "tasks",
        entityId: task._id,
        searchableContent,
        keywords,
        metadata: {
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
        },
        createdAt: now,
        updatedAt: now,
      })
    }
    
    return { 
      success: true,
      indexed: {
        contacts: contacts.length,
        projects: projects.length,
        tasks: tasks.length
      }
    }
  },
})

// Rebuild search index (admin function)
export const rebuildSearchIndex = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if user is admin
    const user = await ctx.db.get(args.userId)
    if (!user || user.role !== "admin") {
      throw new Error("Unauthorized")
    }
    
    // Clear existing index
    const existingEntries = await ctx.db.query("searchIndex").collect()
    for (const entry of existingEntries) {
      await ctx.db.delete(entry._id)
    }
    
    // Note: In production, we would rebuild the search index by iterating through
    // all entities and calling updateSearchIndex via scheduler for each one.
    // For now, return a placeholder result to avoid mutation calling mutation error.
    
    return { success: true }
  },
})