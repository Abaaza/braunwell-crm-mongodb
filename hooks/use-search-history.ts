"use client"

import { useState, useEffect, useCallback } from "react"

interface SearchHistoryItem {
  query: string
  entityType: "contacts" | "projects" | "tasks" | "all"
  timestamp: number
  resultsCount?: number
}

const STORAGE_KEY = "crm_search_history"
const MAX_HISTORY_ITEMS = 50

export function useSearchHistory() {
  const [history, setHistory] = useState<SearchHistoryItem[]>([])

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsedHistory = JSON.parse(stored)
        setHistory(Array.isArray(parsedHistory) ? parsedHistory : [])
      }
    } catch (error) {
      console.error("Failed to load search history:", error)
      setHistory([])
    }
  }, [])

  // Save history to localStorage whenever it changes
  const saveHistory = useCallback((newHistory: SearchHistoryItem[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory))
      setHistory(newHistory)
    } catch (error) {
      console.error("Failed to save search history:", error)
    }
  }, [])

  // Add a new search to history
  const addToHistory = useCallback((item: Omit<SearchHistoryItem, "timestamp">) => {
    if (!item.query.trim()) return

    const newItem: SearchHistoryItem = {
      ...item,
      timestamp: Date.now(),
    }

    setHistory(currentHistory => {
      // Remove any existing identical queries
      const filteredHistory = currentHistory.filter(
        historyItem => historyItem.query.toLowerCase() !== item.query.toLowerCase() ||
                      historyItem.entityType !== item.entityType
      )

      // Add new item to the beginning
      const newHistory = [newItem, ...filteredHistory]

      // Limit to MAX_HISTORY_ITEMS
      const limitedHistory = newHistory.slice(0, MAX_HISTORY_ITEMS)

      // Save to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedHistory))
      } catch (error) {
        console.error("Failed to save search history:", error)
      }

      return limitedHistory
    })
  }, [])

  // Remove a specific item from history
  const removeFromHistory = useCallback((index: number) => {
    setHistory(currentHistory => {
      const newHistory = currentHistory.filter((_, i) => i !== index)
      saveHistory(newHistory)
      return newHistory
    })
  }, [saveHistory])

  // Clear all history
  const clearHistory = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
      setHistory([])
    } catch (error) {
      console.error("Failed to clear search history:", error)
    }
  }, [])

  // Get recent searches (last N items)
  const getRecentSearches = useCallback((limit: number = 10) => {
    return history.slice(0, limit)
  }, [history])

  // Get popular searches (most frequently used)
  const getPopularSearches = useCallback((limit: number = 5) => {
    const queryCount = new Map<string, { count: number; item: SearchHistoryItem }>()

    // Count occurrences of each query
    history.forEach(item => {
      const key = `${item.query.toLowerCase()}-${item.entityType}`
      const existing = queryCount.get(key)
      if (existing) {
        existing.count++
        // Keep the most recent instance
        if (item.timestamp > existing.item.timestamp) {
          existing.item = item
        }
      } else {
        queryCount.set(key, { count: 1, item })
      }
    })

    // Sort by count and return top items
    return Array.from(queryCount.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(entry => entry.item)
  }, [history])

  // Search within history
  const searchHistory = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return history

    const query = searchQuery.toLowerCase()
    return history.filter(item =>
      item.query.toLowerCase().includes(query)
    )
  }, [history])

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
    getRecentSearches,
    getPopularSearches,
    searchHistory,
  }
}