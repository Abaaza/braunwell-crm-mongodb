"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useAuth } from "@/lib/auth"
import { cn } from "@/lib/utils"
import { debounce } from "lodash"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Search,
  Filter,
  Save,
  History,
  Star,
  X,
  Plus,
  ChevronDown,
  Clock,
  Users,
  FolderOpen,
  CheckSquare,
  Calendar,
  Tag,
  SortAsc,
  SortDesc,
  BookOpen,
  MoreHorizontal,
  Trash2,
  Edit,
  Copy,
} from "lucide-react"

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
  assignedTo?: string[]
  projectId?: string[]
  contactId?: string[]
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

interface AdvancedSearchProps {
  entityType?: SearchEntityType
  placeholder?: string
  onResultSelect?: (result: SearchResult) => void
  showSuggestions?: boolean
  showFilters?: boolean
  showSavedSearches?: boolean
  compact?: boolean
  className?: string
}

const entityTypeConfig = {
  all: { label: "All", icon: Search, color: "text-gray-600" },
  contacts: { label: "Contacts", icon: Users, color: "text-blue-600" },
  projects: { label: "Projects", icon: FolderOpen, color: "text-green-600" },
  tasks: { label: "Tasks", icon: CheckSquare, color: "text-purple-600" },
}

const statusOptions = {
  contacts: [],
  projects: ["open", "closed"],
  tasks: ["todo", "in_progress", "done"],
  all: ["open", "closed", "todo", "in_progress", "done"],
}

const priorityOptions = {
  contacts: [],
  projects: [],
  tasks: ["low", "medium", "high"],
  all: ["low", "medium", "high"],
}

export function AdvancedSearch({
  entityType: defaultEntityType = "all",
  placeholder = "Search everything...",
  onResultSelect,
  showSuggestions = true,
  showFilters = true,
  showSavedSearches = true,
  compact = false,
  className,
}: AdvancedSearchProps) {
  const { user } = useAuth()
  const router = useRouter()
  
  // Search state
  const [query, setQuery] = useState("")
  const [entityType, setEntityType] = useState<SearchEntityType>(defaultEntityType)
  const [filters, setFilters] = useState<SearchFilters>({})
  const [sortBy, setSortBy] = useState<{ field: string; order: SortOrder } | undefined>()
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  
  // Suggestions state
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestionsList, setShowSuggestionsList] = useState(false)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
  
  // Saved searches state
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [savedSearchName, setSavedSearchName] = useState("")
  const [savedSearchDescription, setSavedSearchDescription] = useState("")
  const [savedSearchPublic, setSavedSearchPublic] = useState(false)
  
  // Search history state
  const [searchHistory, setSearchHistory] = useState<any[]>([])
  const [showHistory, setShowHistory] = useState(false)
  
  // API calls
  const searchResults = useQuery(
    api.search.search,
    query.trim() ? {
      query,
      entityType,
      filters: {
        ...filters,
        projectId: filters.projectId?.map(id => id as Id<"projects">),
        contactId: filters.contactId?.map(id => id as Id<"contacts">),
        assignedTo: filters.assignedTo?.map(id => id as Id<"users">),
      },
      sortBy,
      limit: 50,
      offset: 0,
    } : "skip"
  )
  
  const searchSuggestions = useQuery(
    api.search.searchSuggestions,
    query.trim() && query.length >= 2 ? {
      query,
      entityType,
      limit: 10,
    } : "skip"
  )
  
  const savedSearches = useQuery(
    api.search.getSavedSearches,
    user ? {
      userId: user.id,
      entityType,
    } : "skip"
  )
  
  const userSearchHistory = useQuery(
    api.search.getSearchHistory,
    user ? {
      userId: user.id,
      limit: 10,
    } : "skip"
  )
  
  const saveSearch = useMutation(api.search.saveSearch)
  const recordHistory = useMutation(api.search.recordSearchHistory)
  const updateUsage = useMutation(api.search.updateSearchUsage)
  const deleteSavedSearch = useMutation(api.search.deleteSavedSearch)
  
  // Debounced search function
  const debouncedSearch = useMemo(
    () => debounce((searchQuery: string) => {
      if (searchQuery.trim()) {
        setIsSearching(true)
        setShowResults(true)
        setShowSuggestionsList(false)
      } else {
        setShowResults(false)
        setIsSearching(false)
      }
    }, 300),
    []
  )
  
  // Debounced suggestions function
  const debouncedSuggestions = useMemo(
    () => debounce((searchQuery: string) => {
      if (searchQuery.trim() && searchQuery.length >= 2 && showSuggestions) {
        setShowSuggestionsList(true)
      } else {
        setShowSuggestionsList(false)
      }
    }, 150),
    [showSuggestions]
  )
  
  // Handle search input change
  const handleSearchChange = useCallback((value: string) => {
    setQuery(value)
    setSelectedSuggestionIndex(-1)
    
    if (value.trim()) {
      debouncedSearch(value)
      debouncedSuggestions(value)
    } else {
      setShowResults(false)
      setShowSuggestionsList(false)
      setIsSearching(false)
    }
  }, [debouncedSearch, debouncedSuggestions])
  
  // Handle search execution
  const executeSearch = useCallback(async (searchQuery?: string) => {
    const finalQuery = searchQuery || query
    if (!finalQuery.trim() || !user) return
    
    setIsSearching(true)
    setShowResults(true)
    setShowSuggestionsList(false)
    setShowHistory(false)
    
    // Record search in history
    if (searchResults) {
      await recordHistory({
        userId: user.id,
        query: finalQuery,
        entityType,
        resultsCount: searchResults.totalCount || 0,
        searchTime: searchResults.searchTime || 0,
      })
    }
  }, [query, entityType, user, searchResults, recordHistory])
  
  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion: string) => {
    setQuery(suggestion)
    setShowSuggestionsList(false)
    executeSearch(suggestion)
  }, [executeSearch])
  
  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showSuggestionsList || !searchSuggestions) return
    
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedSuggestionIndex(prev => 
          prev < searchSuggestions.length - 1 ? prev + 1 : -1
        )
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedSuggestionIndex(prev => 
          prev > -1 ? prev - 1 : searchSuggestions.length - 1
        )
        break
      case "Enter":
        e.preventDefault()
        if (selectedSuggestionIndex >= 0 && searchSuggestions[selectedSuggestionIndex]) {
          handleSuggestionSelect(searchSuggestions[selectedSuggestionIndex])
        } else {
          executeSearch()
        }
        break
      case "Escape":
        setShowSuggestionsList(false)
        setShowHistory(false)
        setSelectedSuggestionIndex(-1)
        break
    }
  }, [showSuggestionsList, searchSuggestions, selectedSuggestionIndex, handleSuggestionSelect, executeSearch])
  
  // Handle saved search selection
  const handleSavedSearchSelect = useCallback(async (savedSearch: any) => {
    setQuery(savedSearch.query)
    setEntityType(savedSearch.entityType)
    setFilters(savedSearch.filters)
    setSortBy(savedSearch.sortBy)
    
    // Update usage count
    await updateUsage({
      searchId: savedSearch._id,
      userId: user!.id,
    })
    
    executeSearch(savedSearch.query)
  }, [user, updateUsage, executeSearch])
  
  // Handle search history selection
  const handleHistorySelect = useCallback((historyItem: any) => {
    setQuery(historyItem.query)
    setEntityType(historyItem.entityType)
    setShowHistory(false)
    executeSearch(historyItem.query)
  }, [executeSearch])
  
  // Handle save search
  const handleSaveSearch = useCallback(async () => {
    if (!user || !query.trim() || !savedSearchName.trim()) return
    
    try {
      await saveSearch({
        name: savedSearchName,
        description: savedSearchDescription,
        entityType,
        query,
        filters: {
          ...filters,
          projectId: filters.projectId?.map(id => id as Id<"projects">),
          contactId: filters.contactId?.map(id => id as Id<"contacts">),
          assignedTo: filters.assignedTo?.map(id => id as Id<"users">),
        },
        sortBy,
        isPublic: savedSearchPublic,
        userId: user.id,
      })
      
      toast.success("Search saved successfully")
      setSaveDialogOpen(false)
      setSavedSearchName("")
      setSavedSearchDescription("")
      setSavedSearchPublic(false)
    } catch (error) {
      toast.error("Failed to save search")
    }
  }, [user, query, savedSearchName, savedSearchDescription, entityType, filters, sortBy, savedSearchPublic, saveSearch])
  
  // Handle result selection
  const handleResultClick = useCallback((result: SearchResult) => {
    if (onResultSelect) {
      onResultSelect(result)
    } else {
      // Default navigation behavior
      switch (result.entityType) {
        case "contacts":
          router.push(`/contacts/${result.entityId}`)
          break
        case "projects":
          router.push(`/projects/${result.entityId}`)
          break
        case "tasks":
          router.push(`/projects/${result.metadata.projectName || ""}?task=${result.entityId}`)
          break
      }
    }
    setShowResults(false)
  }, [onResultSelect, router])
  
  // Update suggestions when API data changes
  useEffect(() => {
    if (searchSuggestions) {
      setSuggestions(searchSuggestions)
    }
  }, [searchSuggestions])
  
  // Update search history when API data changes
  useEffect(() => {
    if (userSearchHistory) {
      setSearchHistory(userSearchHistory)
    }
  }, [userSearchHistory])
  
  // Update search state when results arrive
  useEffect(() => {
    if (searchResults && isSearching) {
      setIsSearching(false)
    }
  }, [searchResults, isSearching])
  
  const EntityIcon = entityTypeConfig[entityType].icon
  
  return (
    <div className={cn("relative w-full max-w-2xl", className)}>
      {/* Main Search Input */}
      <div className="relative">
        <div className="flex items-center space-x-2">
          {/* Entity Type Selector */}
          {!compact && (
            <Select
              value={entityType}
              onValueChange={(value: SearchEntityType) => setEntityType(value)}
            >
              <SelectTrigger className="w-32">
                <div className="flex items-center space-x-2">
                  <EntityIcon className={cn("h-4 w-4", entityTypeConfig[entityType].color)} />
                  <span className="text-sm">{entityTypeConfig[entityType].label}</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(entityTypeConfig).map(([key, config]) => {
                  const Icon = config.icon
                  return (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center space-x-2">
                        <Icon className={cn("h-4 w-4", config.color)} />
                        <span>{config.label}</span>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          )}
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder={placeholder}
              value={query}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (query.trim() && searchSuggestions) {
                  setShowSuggestionsList(true)
                }
              }}
              className="pl-10 pr-20"
            />
            
            {/* Search Actions */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
              {query && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setQuery("")
                    setShowResults(false)
                    setShowSuggestionsList(false)
                  }}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
              
              {showFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={cn(
                    "h-6 w-6 p-0",
                    showAdvancedFilters && "bg-muted"
                  )}
                >
                  <Filter className="h-3 w-3" />
                </Button>
              )}
              
              {showSavedSearches && user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <BookOpen className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <DropdownMenuLabel>Saved Searches</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {savedSearches && savedSearches.length > 0 ? (
                      savedSearches.map((search) => (
                        <DropdownMenuItem
                          key={search._id}
                          onClick={() => handleSavedSearchSelect(search)}
                          className="flex items-center justify-between"
                        >
                          <div className="flex-1">
                            <div className="font-medium">{search.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {search.query}
                            </div>
                          </div>
                          <Badge variant="outline" className="ml-2">
                            {entityTypeConfig[search.entityType].label}
                          </Badge>
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <DropdownMenuItem disabled>
                        No saved searches
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setShowHistory(!showHistory)}
                      className="flex items-center space-x-2"
                    >
                      <History className="h-4 w-4" />
                      <span>Search History</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
          
          {/* Save Search Button */}
          {query.trim() && !compact && (
            <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save Search</DialogTitle>
                  <DialogDescription>
                    Save this search for quick access later
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Search Name</Label>
                    <Input
                      id="name"
                      value={savedSearchName}
                      onChange={(e) => setSavedSearchName(e.target.value)}
                      placeholder="Enter a name for this search"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description (optional)</Label>
                    <Textarea
                      id="description"
                      value={savedSearchDescription}
                      onChange={(e) => setSavedSearchDescription(e.target.value)}
                      placeholder="Describe what this search is for"
                      rows={3}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="public"
                      checked={savedSearchPublic}
                      onCheckedChange={(checked) => setSavedSearchPublic(!!checked)}
                    />
                    <Label htmlFor="public" className="text-sm">
                      Make this search public (other users can use it)
                    </Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveSearch} disabled={!savedSearchName.trim()}>
                    Save Search
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
        
        {/* Suggestions Dropdown */}
        {showSuggestionsList && suggestions.length > 0 && (
          <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto">
            <CardContent className="p-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionSelect(suggestion)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors",
                    index === selectedSuggestionIndex && "bg-muted"
                  )}
                >
                  <Search className="h-3 w-3 inline mr-2 text-muted-foreground" />
                  {suggestion}
                </button>
              ))}
            </CardContent>
          </Card>
        )}
        
        {/* Search History Dropdown */}
        {showHistory && searchHistory.length > 0 && (
          <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Recent Searches</CardTitle>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              {searchHistory.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleHistorySelect(item)}
                  className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span>{item.query}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {entityTypeConfig[item.entityType as SearchEntityType]?.label || "Unknown"}
                      </Badge>
                      <span>{item.resultsCount} results</span>
                    </div>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <Card className="mt-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Advanced Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Status Filter */}
              {statusOptions[entityType].length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Select
                    value={filters.status?.[0] || ""}
                    onValueChange={(value) => 
                      setFilters(prev => ({
                        ...prev,
                        status: value ? [value] : undefined
                      }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Any status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any status</SelectItem>
                      {statusOptions[entityType].map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.replace("_", " ").toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {/* Priority Filter */}
              {priorityOptions[entityType].length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Priority</Label>
                  <Select
                    value={filters.priority?.[0] || ""}
                    onValueChange={(value) => 
                      setFilters(prev => ({
                        ...prev,
                        priority: value ? [value] : undefined
                      }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Any priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any priority</SelectItem>
                      {priorityOptions[entityType].map((priority) => (
                        <SelectItem key={priority} value={priority}>
                          {priority.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {/* Date Range Filter */}
              <div>
                <Label className="text-sm font-medium">Date Range</Label>
                <div className="flex space-x-2">
                  <Input
                    type="date"
                    placeholder="Start date"
                    onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value).getTime() : undefined
                      setFilters(prev => ({
                        ...prev,
                        dateRange: {
                          ...prev.dateRange,
                          start: date
                        }
                      }))
                    }}
                  />
                  <Input
                    type="date"
                    placeholder="End date"
                    onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value).getTime() : undefined
                      setFilters(prev => ({
                        ...prev,
                        dateRange: {
                          ...prev.dateRange,
                          end: date
                        }
                      }))
                    }}
                  />
                </div>
              </div>
            </div>
            
            {/* Sort Options */}
            <div>
              <Label className="text-sm font-medium">Sort By</Label>
              <div className="flex space-x-2">
                <Select
                  value={sortBy?.field || ""}
                  onValueChange={(value) => 
                    setSortBy(prev => value ? {
                      field: value,
                      order: prev?.order || "desc"
                    } : undefined)
                  }
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Sort field" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Relevance</SelectItem>
                    <SelectItem value="createdAt">Created Date</SelectItem>
                    <SelectItem value="updatedAt">Updated Date</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                  </SelectContent>
                </Select>
                
                {sortBy && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => 
                      setSortBy(prev => prev ? {
                        ...prev,
                        order: prev.order === "asc" ? "desc" : "asc"
                      } : undefined)
                    }
                  >
                    {sortBy.order === "asc" ? (
                      <SortAsc className="h-4 w-4" />
                    ) : (
                      <SortDesc className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
            
            {/* Clear Filters */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFilters({})
                setSortBy(undefined)
              }}
              className="w-fit"
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* Search Results */}
      {showResults && (
        <Card className="mt-2 max-h-96 overflow-y-auto">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                Search Results
                {searchResults && (
                  <span className="ml-2 text-muted-foreground font-normal">
                    ({searchResults.totalCount} found in {searchResults.searchTime}ms)
                  </span>
                )}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowResults(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {isSearching ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : searchResults && searchResults.results.length > 0 ? (
              <div className="space-y-3">
                {searchResults.results.map((result, index) => {
                  const EntityResultIcon = entityTypeConfig[result.entityType].icon
                  return (
                    <button
                      key={index}
                      onClick={() => handleResultClick(result)}
                      className="w-full text-left p-3 rounded-md border hover:bg-muted transition-colors"
                    >
                      <div className="flex items-start space-x-3">
                        <EntityResultIcon className={cn(
                          "h-5 w-5 mt-0.5",
                          entityTypeConfig[result.entityType].color
                        )} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium">{result.title}</span>
                            <Badge variant="outline" className="text-xs">
                              {entityTypeConfig[result.entityType].label}
                            </Badge>
                            {result.metadata.status && (
                              <Badge variant="secondary" className="text-xs">
                                {result.metadata.status}
                              </Badge>
                            )}
                          </div>
                          
                          {result.description && (
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {result.description}
                            </p>
                          )}
                          
                          {result.highlights.length > 0 && (
                            <div className="space-y-1">
                              {result.highlights.map((highlight, i) => (
                                <p
                                  key={i}
                                  className="text-xs text-muted-foreground"
                                  dangerouslySetInnerHTML={{ __html: highlight }}
                                />
                              ))}
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-3 mt-2 text-xs text-muted-foreground">
                            {result.metadata.projectName && (
                              <span className="flex items-center space-x-1">
                                <FolderOpen className="h-3 w-3" />
                                <span>{result.metadata.projectName}</span>
                              </span>
                            )}
                            {result.metadata.assigneeName && (
                              <span className="flex items-center space-x-1">
                                <Users className="h-3 w-3" />
                                <span>{result.metadata.assigneeName}</span>
                              </span>
                            )}
                            <span className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(result.metadata.createdAt).toLocaleDateString()}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No results found for "{query}"</p>
                <p className="text-sm">Try adjusting your search terms or filters</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}