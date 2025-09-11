import { useQuery as useConvexQuery } from "convex/react"
import { FunctionReference, FunctionReturnType } from "convex/server"
import { useState, useEffect, useRef } from "react"

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class QueryCache {
  private cache = new Map<string, CacheEntry<any>>()
  private defaultTTL = 5 * 60 * 1000 // 5 minutes default TTL

  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const isExpired = Date.now() - entry.timestamp > entry.ttl
    if (isExpired) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  clear(): void {
    this.cache.clear()
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }

  // Invalidate queries matching patterns
  invalidateByPatterns(patterns: string[]): void {
    for (const [key] of this.cache.entries()) {
      const parsed = JSON.parse(key)
      if (patterns.some(pattern => parsed.query.includes(pattern))) {
        this.cache.delete(key)
      }
    }
  }
}

// Global cache instance
const queryCache = new QueryCache()

// Run cleanup every minute
if (typeof window !== 'undefined') {
  setInterval(() => queryCache.cleanup(), 60 * 1000)
}

export interface UseCachedQueryOptions {
  ttl?: number // Time to live in milliseconds
  staleWhileRevalidate?: boolean // Return stale data while fetching fresh data
  enabled?: boolean // Whether the query is enabled
}

/**
 * A hook that wraps Convex's useQuery with caching capabilities
 * 
 * @param query - The Convex query function
 * @param args - The arguments for the query
 * @param options - Caching options
 * @returns The query result with caching
 */
export function useCachedQuery<
  Query extends FunctionReference<"query">
>(
  query: Query,
  args: Query["_args"],
  options: UseCachedQueryOptions = {}
): FunctionReturnType<Query> | undefined {
  const { ttl = 5 * 60 * 1000, staleWhileRevalidate = true, enabled = true } = options
  
  // Create a stable cache key from query and args
  const cacheKey = JSON.stringify({ query: (query as any)._name || query.toString(), args })
  
  // Use state to trigger re-renders
  const [cachedData, setCachedData] = useState<FunctionReturnType<Query> | undefined>(
    () => queryCache.get(cacheKey)
  )
  
  // Track if we're serving stale data
  const isStaleRef = useRef(false)
  
  // Fetch fresh data from Convex
  const freshData = useConvexQuery(query, enabled ? args : "skip" as any)
  
  useEffect(() => {
    if (freshData !== undefined && enabled) {
      // Update cache with fresh data
      queryCache.set(cacheKey, freshData, ttl)
      setCachedData(freshData)
      isStaleRef.current = false
    }
  }, [freshData, cacheKey, ttl, enabled])
  
  // Handle stale while revalidate
  useEffect(() => {
    if (staleWhileRevalidate && enabled) {
      const cached = queryCache.get<FunctionReturnType<Query>>(cacheKey)
      if (cached !== null && cached !== cachedData) {
        setCachedData(cached)
        isStaleRef.current = true
      }
    }
  }, [cacheKey, staleWhileRevalidate, enabled])
  
  // Return fresh data if available, otherwise cached data
  return freshData !== undefined ? freshData : cachedData
}

/**
 * Invalidate cached queries
 * 
 * @param patterns - Array of query name patterns to invalidate
 */
export function invalidateQueries(patterns: string[]): void {
  queryCache.invalidateByPatterns(patterns)
}

/**
 * Clear all cached queries
 */
export function clearQueryCache(): void {
  queryCache.clear()
}

/**
 * Prefetch a query and cache the result
 * 
 * @param query - The Convex query function
 * @param args - The arguments for the query
 * @param options - Caching options
 */
export async function prefetchQuery<
  Query extends FunctionReference<"query">
>(
  query: Query,
  args: Query["_args"],
  options: { ttl?: number } = {}
): Promise<void> {
  // This would require access to the Convex client directly
  // For now, this is a placeholder for future implementation
  console.warn("prefetchQuery is not yet implemented")
}

// Export the cache instance for advanced usage
export { queryCache }