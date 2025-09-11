"use client"

import React, { useState, useCallback, useMemo } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useSearchHistory } from "@/hooks/use-search-history"
import { cn } from "@/lib/utils"
import { debounce } from "lodash"

import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Search,
  Clock,
  Star,
  X,
  ChevronDown,
} from "lucide-react"

type SearchEntityType = "contacts" | "projects" | "tasks" | "all"

interface EnhancedSearchBarProps {
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  entityType?: SearchEntityType
  showSuggestions?: boolean
  showHistory?: boolean
  className?: string
  onSearch?: (query: string) => void
}

export function EnhancedSearchBar({
  placeholder = "Search...",
  value: controlledValue,
  onChange: controlledOnChange,
  entityType = "all",
  showSuggestions = true,
  showHistory = true,
  className,
  onSearch,
}: EnhancedSearchBarProps) {
  const [internalValue, setInternalValue] = useState("")
  const [showSuggestionsList, setShowSuggestionsList] = useState(false)
  const [showHistoryList, setShowHistoryList] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  
  const { addToHistory, getRecentSearches } = useSearchHistory()
  
  // Use controlled or uncontrolled value
  const value = controlledValue !== undefined ? controlledValue : internalValue
  const onChange = controlledOnChange || setInternalValue

  // Get search suggestions
  const suggestions = useQuery(
    api.search.searchSuggestions,
    value.trim().length >= 2 && showSuggestions ? {
      query: value,
      entityType,
      limit: 8,
    } : "skip"
  )

  // Get recent searches
  const recentSearches = useMemo(() => {
    if (!showHistory) return []
    return getRecentSearches(5).filter(item => 
      entityType === "all" || item.entityType === entityType
    )
  }, [showHistory, getRecentSearches, entityType])

  // Debounced suggestion loading
  const debouncedShowSuggestions = useMemo(
    () => debounce((query: string) => {
      if (query.trim().length >= 2 && showSuggestions) {
        setShowSuggestionsList(true)
        setShowHistoryList(false)
      } else {
        setShowSuggestionsList(false)
      }
    }, 200),
    [showSuggestions]
  )

  // Handle input change
  const handleInputChange = useCallback((newValue: string) => {
    onChange(newValue)
    setSelectedIndex(-1)
    debouncedShowSuggestions(newValue)
  }, [onChange, debouncedShowSuggestions])

  // Handle search execution
  const executeSearch = useCallback((searchQuery?: string) => {
    const finalQuery = searchQuery || value
    if (!finalQuery.trim()) return

    // Add to history
    addToHistory({
      query: finalQuery,
      entityType,
    })

    // Close dropdowns
    setShowSuggestionsList(false)
    setShowHistoryList(false)
    setSelectedIndex(-1)

    // Execute search callback
    if (onSearch) {
      onSearch(finalQuery)
    }
  }, [value, entityType, addToHistory, onSearch])

  // Handle suggestion/history selection
  const handleItemSelect = useCallback((item: string) => {
    onChange(item)
    executeSearch(item)
  }, [onChange, executeSearch])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const isShowingSuggestions = showSuggestionsList && suggestions && suggestions.length > 0
    const isShowingHistory = showHistoryList && recentSearches.length > 0
    
    if (!isShowingSuggestions && !isShowingHistory) {
      if (e.key === "Enter") {
        executeSearch()
      }
      return
    }

    const items = isShowingSuggestions ? suggestions! : recentSearches.map(h => h.query)
    const maxIndex = items.length - 1

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedIndex(prev => prev < maxIndex ? prev + 1 : 0)
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : maxIndex)
        break
      case "Enter":
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < items.length) {
          handleItemSelect(items[selectedIndex])
        } else {
          executeSearch()
        }
        break
      case "Escape":
        setShowSuggestionsList(false)
        setShowHistoryList(false)
        setSelectedIndex(-1)
        break
    }
  }, [showSuggestionsList, showHistoryList, suggestions, recentSearches, selectedIndex, executeSearch, handleItemSelect])

  // Handle input focus
  const handleFocus = useCallback(() => {
    if (value.trim().length >= 2 && showSuggestions) {
      setShowSuggestionsList(true)
    } else if (recentSearches.length > 0 && showHistory) {
      setShowHistoryList(true)
    }
  }, [value, showSuggestions, recentSearches, showHistory])

  // Handle input blur (with delay to allow clicks)
  const handleBlur = useCallback(() => {
    setTimeout(() => {
      setShowSuggestionsList(false)
      setShowHistoryList(false)
      setSelectedIndex(-1)
    }, 150)
  }, [])

  const hasDropdown = (showSuggestionsList && suggestions && suggestions.length > 0) || 
                     (showHistoryList && recentSearches.length > 0)

  return (
    <div className={cn("relative w-full", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder={placeholder}
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="pl-10 pr-20"
        />
        
        {/* Action buttons */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
          {value && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onChange("")
                setShowSuggestionsList(false)
                setShowHistoryList(false)
              }}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          
          {showHistory && recentSearches.length > 0 && (
            <DropdownMenu 
              open={showHistoryList} 
              onOpenChange={setShowHistoryList}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => {
                    setShowHistoryList(!showHistoryList)
                    setShowSuggestionsList(false)
                  }}
                >
                  <Clock className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Recent Searches</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {recentSearches.map((item, index) => (
                  <DropdownMenuItem
                    key={index}
                    onClick={() => handleItemSelect(item.query)}
                    className="flex items-center justify-between"
                  >
                    <span className="flex items-center space-x-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span>{item.query}</span>
                    </span>
                    {item.resultsCount !== undefined && (
                      <Badge variant="outline" className="text-xs">
                        {item.resultsCount} results
                      </Badge>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      
      {/* Suggestions dropdown */}
      {showSuggestionsList && suggestions && suggestions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto">
          <CardContent className="p-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleItemSelect(suggestion)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors flex items-center space-x-2",
                  index === selectedIndex && "bg-muted"
                )}
              >
                <Search className="h-3 w-3 text-muted-foreground" />
                <span>{suggestion}</span>
              </button>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}