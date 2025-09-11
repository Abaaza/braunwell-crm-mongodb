"use client"

import { createContext, useContext, useEffect } from "react"
import { useMutation as useConvexMutation } from "convex/react"
import { FunctionReference } from "convex/server"
import { 
  invalidateProjectQueries,
  invalidateContactQueries,
  invalidateTaskQueries,
  invalidateUserQueries,
  invalidateAnalyticsQueries,
  invalidateTemplateQueries,
  invalidateCustomMetricQueries,
} from "@/hooks/use-cached-queries"

interface CacheInvalidationRules {
  [key: string]: () => void
}

// Helper function to combine multiple invalidation functions
const combineInvalidations = (...fns: (() => void)[]) => {
  return () => {
    fns.forEach(fn => fn())
  }
}

// Define which queries should be invalidated after specific mutations
const invalidationRules: CacheInvalidationRules = {
  // Projects (also invalidate analytics)
  "projects.create": combineInvalidations(invalidateProjectQueries, invalidateAnalyticsQueries),
  "projects.update": combineInvalidations(invalidateProjectQueries, invalidateAnalyticsQueries),
  "projects.remove": combineInvalidations(invalidateProjectQueries, invalidateAnalyticsQueries),
  "projects.removeMultiple": invalidateProjectQueries,
  "projects.archive": invalidateProjectQueries,
  "projects.unarchive": invalidateProjectQueries,
  "projects.updateMultipleStatus": invalidateProjectQueries,
  
  // Contacts (also invalidate analytics for create/remove)
  "contacts.create": combineInvalidations(invalidateContactQueries, invalidateAnalyticsQueries),
  "contacts.update": invalidateContactQueries,
  "contacts.remove": combineInvalidations(invalidateContactQueries, invalidateAnalyticsQueries),
  "contacts.removeMultiple": invalidateContactQueries,
  
  // Tasks (also invalidate analytics)
  "tasks.create": combineInvalidations(invalidateTaskQueries, invalidateAnalyticsQueries),
  "tasks.update": combineInvalidations(invalidateTaskQueries, invalidateAnalyticsQueries),
  "tasks.remove": combineInvalidations(invalidateTaskQueries, invalidateAnalyticsQueries),
  "tasks.removeMultiple": invalidateTaskQueries,
  "tasks.updateStatus": invalidateTaskQueries,
  "tasks.updateMultipleStatus": invalidateTaskQueries,
  
  // Users
  "users.create": invalidateUserQueries,
  "users.update": invalidateUserQueries,
  "users.remove": invalidateUserQueries,
  "users.updateRole": invalidateUserQueries,
  
  // Templates
  "projectTemplates.create": invalidateTemplateQueries,
  "projectTemplates.update": invalidateTemplateQueries,
  "projectTemplates.remove": invalidateTemplateQueries,
  "taskTemplates.create": invalidateTemplateQueries,
  "taskTemplates.update": invalidateTemplateQueries,
  "taskTemplates.remove": invalidateTemplateQueries,
  
  // Custom Metrics
  "customMetrics.create": invalidateCustomMetricQueries,
  "customMetrics.update": invalidateCustomMetricQueries,
  "customMetrics.remove": invalidateCustomMetricQueries,
}

const CacheContext = createContext<{
  invalidateAfterMutation: (mutationName: string) => void
}>({
  invalidateAfterMutation: () => {},
})

export function CacheProvider({ children }: { children: React.ReactNode }) {
  const invalidateAfterMutation = (mutationName: string) => {
    // Find all matching invalidation rules
    Object.entries(invalidationRules).forEach(([pattern, invalidateFn]) => {
      if (mutationName.includes(pattern) || pattern.includes(mutationName)) {
        invalidateFn()
      }
    })
  }
  
  return (
    <CacheContext.Provider value={{ invalidateAfterMutation }}>
      {children}
    </CacheContext.Provider>
  )
}

export function useCache() {
  return useContext(CacheContext)
}

/**
 * Enhanced mutation hook that automatically invalidates relevant caches
 */
export function useMutation<Mutation extends FunctionReference<"mutation">>(
  mutation: Mutation
): ReturnType<typeof useConvexMutation<Mutation>> {
  const { invalidateAfterMutation } = useCache()
  const convexMutation = useConvexMutation(mutation)
  
  // For now, just return the original mutation
  // TODO: Add cache invalidation logic once we can extract mutation name
  return convexMutation
}