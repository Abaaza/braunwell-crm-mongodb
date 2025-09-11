"use client"

import React, { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useAuth } from "@/lib/auth"
import { useSearchHistory } from "@/hooks/use-search-history"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Search,
  Users,
  FolderOpen,
  CheckSquare,
  Calendar,
  Clock,
  TrendingUp,
  Star,
  History,
  ArrowRight,
  Loader2,
} from "lucide-react"

interface GlobalSearchProps {
  trigger?: React.ReactNode
  placeholder?: string
  className?: string
}

const entityTypeConfig = {
  contacts: { 
    label: "Contacts", 
    icon: Users, 
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    route: "/contacts"
  },
  projects: { 
    label: "Projects", 
    icon: FolderOpen, 
    color: "text-green-600",
    bgColor: "bg-green-50",
    route: "/projects"
  },
  tasks: { 
    label: "Tasks", 
    icon: CheckSquare, 
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    route: "/tasks"
  },
}

export function GlobalSearch({ 
  trigger, 
  placeholder = "Search everything...",
  className 
}: GlobalSearchProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { addToHistory, getRecentSearches, getPopularSearches } = useSearchHistory()
  
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  // Search API call
  const searchArgs = query.trim().length >= 2 ? {
    query: query.trim(),
    entityType: "all" as const,
    limit: 20,
  } : "skip"
  
  const searchResults = useQuery(
    api.search.search,
    searchArgs
  )

  // Get search suggestions
  const suggestions = useQuery(
    api.search.searchSuggestions,
    query.trim().length >= 2 ? {
      query,
      entityType: "all",
      limit: 5,
    } : "skip"
  )


  // Handle search input change
  const handleSearchChange = useCallback((value: string) => {
    setQuery(value)
  }, [])

  // Handle result selection
  const handleSelect = useCallback((result: any) => {
    // Add to search history
    addToHistory({
      query,
      entityType: result.entityType,
      resultsCount: searchResults?.totalCount || 0,
    })

    // Navigate to the result
    let route = ""
    switch (result.entityType) {
      case "contacts":
        route = `/contacts/${result.entityId}`
        break
      case "projects":
        route = `/projects/${result.entityId}`
        break
      case "tasks":
        // Navigate to project page with task highlighted
        route = `/projects/${result.metadata.projectId || ""}?task=${result.entityId}`
        break
    }

    if (route) {
      router.push(route)
    }

    setOpen(false)
    setQuery("")
  }, [query, addToHistory, searchResults, router])

  // Handle history item selection
  const handleHistorySelect = useCallback((item: any) => {
    setQuery(item.query)
    handleSearchChange(item.query)
  }, [handleSearchChange])

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion: string) => {
    setQuery(suggestion)
    handleSearchChange(suggestion)
  }, [handleSearchChange])

  // Handle "View All Results" for entity type
  const handleViewAllResults = useCallback((entityType: string) => {
    addToHistory({
      query,
      entityType: entityType as any,
      resultsCount: searchResults?.totalCount || 0,
    })

    const route = entityTypeConfig[entityType as keyof typeof entityTypeConfig]?.route
    if (route) {
      router.push(`${route}?search=${encodeURIComponent(query)}`)
    }

    setOpen(false)
    setQuery("")
  }, [query, addToHistory, searchResults, router])

  // Get recent and popular searches
  const recentSearches = getRecentSearches(5)
  const popularSearches = getPopularSearches(3)

  // Group results by entity type
  const groupedResults = React.useMemo(() => {
    if (!searchResults || !searchResults.results || searchResults.results.length === 0) {
      return {}
    }

    return searchResults.results.reduce((acc, result) => {
      if (!acc[result.entityType]) {
        acc[result.entityType] = []
      }
      acc[result.entityType].push(result)
      return acc
    }, {} as Record<string, any[]>)
  }, [searchResults])


  const DefaultTrigger = (
    <Button
      variant="outline"
      className={cn(
        "relative w-full max-w-sm justify-start text-sm text-muted-foreground sm:pr-12 md:w-64 lg:w-80",
        className
      )}
    >
      <Search className="mr-2 h-4 w-4" />
      <span className="hidden lg:inline-flex">{placeholder}</span>
      <span className="inline-flex lg:hidden">Search...</span>
      <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
        <span className="text-xs">⌘</span>K
      </kbd>
    </Button>
  )

  // Keyboard shortcut
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(open => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  return (
    <>
      <div onClick={() => setOpen(true)}>
        {trigger || DefaultTrigger}
      </div>
      
      <CommandDialog open={open} onOpenChange={setOpen} shouldFilter={false}>
        <CommandInput
          placeholder={placeholder}
          value={query}
          onValueChange={handleSearchChange}
        />
        <CommandList>
          {!query && (
            <>
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <CommandGroup heading="Recent Searches">
                  {recentSearches.map((item, index) => (
                    <CommandItem
                      key={`recent-${index}`}
                      value={`recent-${index}-${item.query}`}
                      onSelect={() => handleHistorySelect(item)}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{item.query}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {item.entityType in entityTypeConfig ? entityTypeConfig[item.entityType as keyof typeof entityTypeConfig].label : item.entityType}
                        </Badge>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {/* Popular Searches */}
              {popularSearches.length > 0 && (
                <CommandGroup heading="Popular Searches">
                  {popularSearches.map((item, index) => (
                    <CommandItem
                      key={`popular-${index}`}
                      value={`popular-${index}-${item.query}`}
                      onSelect={() => handleHistorySelect(item)}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          <span>{item.query}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {item.entityType in entityTypeConfig ? entityTypeConfig[item.entityType as keyof typeof entityTypeConfig].label : item.entityType}
                        </Badge>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {/* Quick Navigation */}
              <CommandGroup heading="Quick Navigation">
                <CommandItem value="nav-contacts" onSelect={() => router.push("/contacts")}>
                  <Users className="mr-2 h-4 w-4 text-blue-600" />
                  <span>Browse All Contacts</span>
                </CommandItem>
                <CommandItem value="nav-projects" onSelect={() => router.push("/projects")}>
                  <FolderOpen className="mr-2 h-4 w-4 text-green-600" />
                  <span>Browse All Projects</span>
                </CommandItem>
                <CommandItem value="nav-tasks" onSelect={() => router.push("/tasks")}>
                  <CheckSquare className="mr-2 h-4 w-4 text-purple-600" />
                  <span>Browse All Tasks</span>
                </CommandItem>
              </CommandGroup>
            </>
          )}

          {query && !searchResults && (
            <CommandGroup>
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            </CommandGroup>
          )}

          {query && searchResults && (
            <>
              {/* Search Suggestions */}
              {suggestions && suggestions.length > 0 && (
                <CommandGroup heading="Suggestions">
                  {suggestions.map((suggestion, index) => (
                    <CommandItem
                      key={`suggestion-${index}`}
                      value={`suggestion-${index}-${suggestion}`}
                      onSelect={() => handleSuggestionSelect(suggestion)}
                    >
                      <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{suggestion}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {/* Search Results by Entity Type */}
              {Object.entries(groupedResults).map(([entityType, results]) => {
                const config = entityTypeConfig[entityType as keyof typeof entityTypeConfig]
                if (!config) return null

                const Icon = config.icon
                const showViewAll = results.length >= 3

                return (
                  <CommandGroup key={entityType} heading={config.label}>
                    {results.slice(0, 3).map((result, index) => (
                      <CommandItem
                        key={`${result.entityType}-${result.entityId}`}
                        value={`${result.entityType}-${result.entityId}-${index}`}
                        onSelect={() => {
                          console.log("onSelect triggered for:", result.title)
                          handleSelect(result)
                        }}
                        onClick={() => {
                          console.log("onClick triggered for:", result.title)
                          handleSelect(result)
                        }}
                      >
                        <div className="flex items-start space-x-3 py-3 w-full">
                          <Icon className={cn("h-4 w-4 mt-0.5", config.color)} />
                          <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium truncate">{result.title}</span>
                            {result.metadata.status && (
                              <Badge variant="secondary" className="text-xs">
                                {result.metadata.status}
                              </Badge>
                            )}
                          </div>
                          {result.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {result.description}
                            </p>
                          )}
                          <div className="flex items-center space-x-2 mt-1 text-xs text-muted-foreground">
                            {result.metadata.projectName && (
                              <span>{result.metadata.projectName}</span>
                            )}
                            {result.metadata.assigneeName && (
                              <span>• {result.metadata.assigneeName}</span>
                            )}
                            <span>• {new Date(result.metadata.createdAt).toLocaleDateString()}</span>
                          </div>
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                    
                    {showViewAll && (
                      <CommandItem
                        value={`view-all-${entityType}`}
                        onSelect={() => handleViewAllResults(entityType)}
                      >
                        <div className="flex items-center justify-between w-full text-sm font-medium">
                          <span>View all {results.length} {config.label.toLowerCase()}</span>
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      </CommandItem>
                    )}
                  </CommandGroup>
                )
              })}

              {/* No Results */}
              {searchResults && searchResults.results.length === 0 && (
                <CommandEmpty>
                  <div className="flex flex-col items-center space-y-2 py-6">
                    <Search className="h-8 w-8 text-muted-foreground/50" />
                    <div className="text-center">
                      <p className="text-sm font-medium">No results found</p>
                      <p className="text-xs text-muted-foreground">
                        Try different keywords or check your spelling
                      </p>
                    </div>
                  </div>
                </CommandEmpty>
              )}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}