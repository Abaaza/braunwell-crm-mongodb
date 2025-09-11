import { useCachedQuery, invalidateQueries } from "@/lib/query-cache"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"

// Common cache TTLs
const TTL = {
  SHORT: 1 * 60 * 1000,      // 1 minute
  MEDIUM: 5 * 60 * 1000,      // 5 minutes  
  LONG: 15 * 60 * 1000,       // 15 minutes
  VERY_LONG: 60 * 60 * 1000,  // 1 hour
}

/**
 * Cached query hooks for commonly used queries
 */

// Projects
export function useCachedProjects(search?: string) {
  return useCachedQuery(
    api.projects.list,
    { search },
    { ttl: TTL.MEDIUM, staleWhileRevalidate: true }
  )
}

export function useCachedProject(id: Id<"projects"> | undefined) {
  if (!id) return undefined
  return useCachedQuery(
    api.projects.get,
    { id },
    { ttl: TTL.MEDIUM, staleWhileRevalidate: true }
  )
}

// Contacts
export function useCachedContacts(search?: string) {
  return useCachedQuery(
    api.contacts.list,
    { search },
    { ttl: TTL.MEDIUM, staleWhileRevalidate: true }
  )
}

export function useCachedContact(id: Id<"contacts"> | undefined) {
  if (!id) return undefined
  return useCachedQuery(
    api.contacts.get,
    { id },
    { ttl: TTL.MEDIUM, staleWhileRevalidate: true }
  )
}

// Tasks
export function useCachedTasks() {
  return useCachedQuery(
    api.tasks.list,
    {},
    { ttl: TTL.SHORT, staleWhileRevalidate: true }
  )
}

// Users
export function useCachedUsers() {
  return useCachedQuery(
    api.users.list,
    {},
    { ttl: TTL.LONG, staleWhileRevalidate: true }
  )
}

// Note: getByEmail doesn't exist in the users API
// If needed, this should be implemented in the backend first

// Analytics
export function useCachedAnalytics(dateRange: string, compareWith?: string) {
  return useCachedQuery(
    api.analytics.getMetrics,
    { dateRange, compareWith },
    { ttl: TTL.LONG, staleWhileRevalidate: true }
  )
}

// Templates
export function useCachedProjectTemplates() {
  return useCachedQuery(
    api.projectTemplates.list,
    {},
    { ttl: TTL.VERY_LONG, staleWhileRevalidate: true }
  )
}

export function useCachedTaskTemplates() {
  return useCachedQuery(
    api.taskTemplates.list,
    {},
    { ttl: TTL.VERY_LONG, staleWhileRevalidate: true }
  )
}

// Custom Metrics
export function useCachedCustomMetrics(userId: Id<"users">) {
  return useCachedQuery(
    api.customMetrics.list,
    { userId },
    { ttl: TTL.LONG, staleWhileRevalidate: true }
  )
}

// Saved Reports
export function useCachedSavedReports(userId: Id<"users">) {
  return useCachedQuery(
    api.savedReports.list,
    { userId },
    { ttl: TTL.LONG, staleWhileRevalidate: true }
  )
}

/**
 * Invalidation helpers
 */

export function invalidateProjectQueries() {
  invalidateQueries(["projects"])
}

export function invalidateContactQueries() {
  invalidateQueries(["contacts"])
}

export function invalidateTaskQueries() {
  invalidateQueries(["tasks"])
}

export function invalidateUserQueries() {
  invalidateQueries(["users"])
}

export function invalidateAnalyticsQueries() {
  invalidateQueries(["analytics"])
}

export function invalidateTemplateQueries() {
  invalidateQueries(["Templates"])
}

export function invalidateCustomMetricQueries() {
  invalidateQueries(["customMetrics"])
}