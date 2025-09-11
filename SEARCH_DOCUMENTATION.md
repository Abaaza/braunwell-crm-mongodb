# Advanced Search System Documentation

This document describes the comprehensive search system implemented in the Braunwell CRM application, featuring full-text search capabilities, advanced filtering, search history, and saved searches.

## Overview

The advanced search system provides powerful search capabilities across all entities in the CRM:
- **Contacts**: Name, email, phone, company, notes, tags
- **Projects**: Name, company, description, status
- **Tasks**: Title, description, status, priority

## Components

### 1. Search Backend (`/convex/search.ts`)

The core search functionality is implemented as Convex queries and mutations:

#### Key Functions:
- `search()` - Main search function with full-text search and filtering
- `searchSuggestions()` - Provides intelligent search suggestions
- `updateSearchIndex()` - Maintains search index for entities
- `saveSearch()` - Saves search queries for later use
- `getSearchHistory()` - Retrieves user's search history

#### Search Index:
The search index (`searchIndex` table) contains:
- `entityType` - Type of entity (contacts/projects/tasks)
- `entityId` - ID of the entity
- `searchableContent` - Concatenated searchable fields
- `keywords` - Extracted keywords for fast matching
- `metadata` - Entity metadata for display

#### Relevance Scoring:
Search results are ranked by relevance using:
- Exact phrase matches (100 points)
- Individual word matches in keywords (20 points)
- Partial content matches (10 points)
- Title matches (50 point bonus)

### 2. Global Search Component (`/components/shared/global-search.tsx`)

A command palette-style search interface accessible from any page.

#### Features:
- Keyboard shortcut (Cmd/Ctrl + K)
- Real-time search suggestions
- Recent and popular searches
- Grouped results by entity type
- Quick navigation to results

#### Usage:
```tsx
import { GlobalSearch } from "@/components/shared/global-search"

// Renders a search button that opens the global search dialog
<GlobalSearch />

// With custom trigger
<GlobalSearch trigger={<CustomButton />} />
```

### 3. Advanced Search Component (`/components/shared/advanced-search.tsx`)

A comprehensive search interface with advanced filtering and saved searches.

#### Features:
- Entity type selection
- Advanced filters (date range, status, priority, etc.)
- Search suggestions and autocomplete
- Saved searches with public/private visibility
- Search history
- Sort options
- Result highlighting

#### Usage:
```tsx
import { AdvancedSearch } from "@/components/shared/advanced-search"

<AdvancedSearch
  entityType="contacts"
  placeholder="Search contacts..."
  onResultSelect={(result) => {
    // Handle result selection
    console.log("Selected:", result)
  }}
  showSuggestions={true}
  showFilters={true}
  showSavedSearches={true}
  compact={false}
/>
```

### 4. Enhanced Search Bar (`/components/shared/enhanced-search-bar.tsx`)

An improved search input with suggestions and history for individual pages.

#### Features:
- Search suggestions based on entity type
- Recent search history
- Keyboard navigation
- Debounced input for performance

#### Usage:
```tsx
import { EnhancedSearchBar } from "@/components/shared/enhanced-search-bar"

<EnhancedSearchBar
  placeholder="Search..."
  value={searchQuery}
  onChange={setSearchQuery}
  entityType="contacts"
  showSuggestions={true}
  showHistory={true}
  onSearch={(query) => {
    // Handle search execution
    executeSearch(query)
  }}
/>
```

### 5. Search History Hook (`/hooks/use-search-history.ts`)

A React hook for managing search history in local storage.

#### Features:
- Persistent search history
- Duplicate removal
- Popular searches calculation
- History search functionality

#### Usage:
```tsx
import { useSearchHistory } from "@/hooks/use-search-history"

const {
  history,
  addToHistory,
  removeFromHistory,
  clearHistory,
  getRecentSearches,
  getPopularSearches,
  searchHistory,
} = useSearchHistory()

// Add a search to history
addToHistory({
  query: "John Smith",
  entityType: "contacts",
  resultsCount: 5
})
```

## Database Schema

### Search-Related Tables:

#### `savedSearches`
```typescript
{
  name: string,
  description?: string,
  entityType: "contacts" | "projects" | "tasks" | "all",
  query: string,
  filters: SearchFilters,
  sortBy?: SortConfig,
  isPublic: boolean,
  isDefault?: boolean,
  usageCount?: number,
  lastUsed?: number,
  createdBy: Id<"users">,
  createdAt: number,
  updatedAt: number,
}
```

#### `searchHistory`
```typescript
{
  userId: Id<"users">,
  query: string,
  entityType: "contacts" | "projects" | "tasks" | "all",
  resultsCount: number,
  searchTime: number,
  timestamp: number,
}
```

#### `searchIndex`
```typescript
{
  entityType: "contacts" | "projects" | "tasks",
  entityId: string,
  searchableContent: string,
  keywords: string[],
  metadata: {
    title?: string,
    description?: string,
    status?: string,
    priority?: string,
    tags?: string[],
    createdAt: number,
    updatedAt: number,
  },
  createdAt: number,
  updatedAt: number,
}
```

## Search Features

### 1. Full-Text Search
- Searches across all relevant fields of entities
- Supports phrase matching and individual word matching
- Case-insensitive search
- Partial word matching

### 2. Advanced Filtering
- **Date Range**: Filter by creation/update dates
- **Status**: Filter by entity status (open/closed for projects, todo/in_progress/done for tasks)
- **Priority**: Filter by priority levels (low/medium/high for tasks)
- **Tags**: Filter by associated tags
- **Custom Fields**: Advanced field-specific filtering with operators

### 3. Search Operators
- `equals` - Exact match
- `not_equals` - Exclude exact match
- `contains` - Partial match
- `not_contains` - Exclude partial match
- `greater_than` - Numeric/date comparison
- `less_than` - Numeric/date comparison
- `starts_with` - Prefix match
- `ends_with` - Suffix match

### 4. Saved Searches
- Save frequently used search queries
- Public/private visibility settings
- Usage tracking for popular searches
- Default search per user
- Quick access from dropdown menus

### 5. Search History
- Automatic tracking of search queries
- Recent searches (last 20)
- Popular searches based on frequency
- Local storage persistence
- Search within history

### 6. Search Suggestions
- Real-time suggestions based on existing data
- Entity-specific suggestions
- Keyword-based matching
- Debounced for performance

### 7. Result Highlighting
- Highlight matching terms in search results
- Context snippets showing relevant content
- Visual indicators for different entity types

## Performance Optimizations

### 1. Search Index
- Pre-built search index for fast queries
- Keyword extraction for efficient matching
- Automatic index updates on entity changes

### 2. Debouncing
- Input debouncing (300ms for search, 150ms for suggestions)
- Prevents excessive API calls
- Improves user experience

### 3. Pagination
- Configurable result limits
- Offset-based pagination for large result sets

### 4. Caching
- Query result caching via Convex
- Local storage for search history
- Suggestion caching

## Integration Guide

### 1. Adding Search to Existing Pages

Replace existing search bars with the enhanced version:

```tsx
// Before
import { SearchBar } from "@/components/shared/search-bar"

<SearchBar 
  placeholder="Search..." 
  value={search} 
  onChange={setSearch} 
/>

// After
import { EnhancedSearchBar } from "@/components/shared/enhanced-search-bar"

<EnhancedSearchBar
  placeholder="Search contacts..."
  value={search}
  onChange={setSearch}
  entityType="contacts"
  onSearch={(query) => {
    // Optional: Custom search logic
  }}
/>
```

### 2. Adding Advanced Search Modal

```tsx
const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false)

// Button to open advanced search
<Button onClick={() => setAdvancedSearchOpen(true)}>
  <Filter className="h-4 w-4 mr-2" />
  Advanced Search
</Button>

// Advanced search modal
<Dialog open={advancedSearchOpen} onOpenChange={setAdvancedSearchOpen}>
  <DialogContent className="max-w-4xl">
    <AdvancedSearch
      entityType="all"
      onResultSelect={(result) => {
        // Handle result selection
        setAdvancedSearchOpen(false)
      }}
    />
  </DialogContent>
</Dialog>
```

### 3. Maintaining Search Index

The search index is automatically maintained when entities are created, updated, or deleted. For existing entities, run the rebuild function:

```typescript
// In Convex dashboard or via admin interface
await api.search.rebuildSearchIndex({ userId: adminUserId })
```

## API Reference

### Search Query Parameters

```typescript
interface SearchParams {
  query: string
  entityType?: "contacts" | "projects" | "tasks" | "all"
  filters?: {
    dateRange?: { start?: number, end?: number }
    status?: string[]
    priority?: string[]
    assignedTo?: Id<"users">[]
    projectId?: Id<"projects">[]
    contactId?: Id<"contacts">[]
    tags?: string[]
    customFields?: CustomFieldFilter[]
  }
  sortBy?: { field: string, order: "asc" | "desc" }
  limit?: number
  offset?: number
}
```

### Search Response

```typescript
interface SearchResponse {
  results: SearchResult[]
  totalCount: number
  searchTime: number
}

interface SearchResult {
  entityType: "contacts" | "projects" | "tasks"
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
```

## Best Practices

### 1. Search Performance
- Use entity-specific searches when possible
- Implement result pagination for large datasets
- Consider search result caching for frequently accessed queries

### 2. User Experience
- Provide clear search feedback and loading states
- Use debouncing for search inputs
- Show search suggestions and recent searches
- Highlight matching terms in results

### 3. Search Quality
- Regularly review and update search relevance scoring
- Monitor search analytics to improve user experience
- Provide search filters relevant to your data

### 4. Maintenance
- Monitor search index size and performance
- Implement regular index cleanup if needed
- Test search functionality after schema changes

## Troubleshooting

### Common Issues:

1. **Search results not appearing**
   - Check if search index is built (`rebuildSearchIndex`)
   - Verify entity permissions
   - Check console for API errors

2. **Slow search performance**
   - Review search query complexity
   - Check if pagination is implemented
   - Monitor Convex function execution time

3. **Suggestions not working**
   - Ensure minimum query length (2 characters)
   - Check if entity type is correctly specified
   - Verify search index contains keywords

4. **Search history not persisting**
   - Check browser localStorage permissions
   - Verify `useSearchHistory` hook implementation
   - Check for localStorage quota limits

## Future Enhancements

Potential improvements to consider:

1. **Fuzzy Search**: Implement fuzzy matching for typo tolerance
2. **Search Analytics**: Add detailed search analytics and metrics
3. **AI-Powered Search**: Integrate semantic search capabilities
4. **Search Shortcuts**: Add keyboard shortcuts for common searches
5. **Export Results**: Allow exporting search results
6. **Search Templates**: Pre-defined search templates for common use cases

## Conclusion

The advanced search system provides a comprehensive solution for finding and filtering data across the CRM application. It combines powerful backend search capabilities with intuitive user interfaces to deliver a superior search experience.

For technical support or feature requests, please refer to the development team or create an issue in the project repository.