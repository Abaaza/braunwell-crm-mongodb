"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Filter, X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface FilterOption {
  value: string
  label: string
  count?: number
}

export interface FilterConfig {
  key: string
  label: string
  options: FilterOption[]
}

interface FilterBarProps {
  filters: FilterConfig[]
  values: Record<string, string[]>
  onChange: (key: string, values: string[]) => void
  className?: string
}

export function FilterBar({ filters, values, onChange, className }: FilterBarProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  const getActiveFiltersCount = () => {
    return Object.values(values).reduce((count, vals) => count + vals.length, 0)
  }

  const clearAllFilters = () => {
    filters.forEach(filter => {
      onChange(filter.key, [])
    })
  }

  const clearFilter = (key: string) => {
    onChange(key, [])
  }

  const toggleOption = (filterKey: string, optionValue: string) => {
    const currentValues = values[filterKey] || []
    const newValues = currentValues.includes(optionValue)
      ? currentValues.filter(v => v !== optionValue)
      : [...currentValues, optionValue]
    onChange(filterKey, newValues)
  }

  const activeFiltersCount = getActiveFiltersCount()

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Filters</span>
        {activeFiltersCount > 0 && (
          <>
            <Badge variant="secondary" className="h-5 px-1.5 text-xs">
              {activeFiltersCount}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="ml-auto h-7 text-xs"
            >
              Clear all
            </Button>
          </>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => {
          const selectedValues = values[filter.key] || []
          const isOpen = openDropdown === filter.key

          return (
            <DropdownMenu
              key={filter.key}
              open={isOpen}
              onOpenChange={(open) => setOpenDropdown(open ? filter.key : null)}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant={selectedValues.length > 0 ? "secondary" : "outline"}
                  size="sm"
                  className="h-8"
                >
                  {filter.label}
                  {selectedValues.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-2 h-4 px-1 text-xs bg-background"
                    >
                      {selectedValues.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel className="flex items-center justify-between">
                  {filter.label}
                  {selectedValues.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault()
                        clearFilter(filter.key)
                      }}
                      className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Clear
                    </Button>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-64 overflow-y-auto">
                  {filter.options.map((option) => (
                    <DropdownMenuCheckboxItem
                      key={option.value}
                      checked={selectedValues.includes(option.value)}
                      onCheckedChange={() => toggleOption(filter.key, option.value)}
                      className="pr-2"
                    >
                      <span className="flex-1">{option.label}</span>
                      {option.count !== undefined && (
                        <span className="text-xs text-muted-foreground">
                          ({option.count})
                        </span>
                      )}
                    </DropdownMenuCheckboxItem>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        })}
      </div>

      {/* Active filters */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => {
            const selectedValues = values[filter.key] || []
            if (selectedValues.length === 0) return null

            return selectedValues.map((value) => {
              const option = filter.options.find(o => o.value === value)
              if (!option) return null

              return (
                <Badge
                  key={`${filter.key}-${value}`}
                  variant="secondary"
                  className="h-6 pl-2 pr-1"
                >
                  <span className="text-xs">
                    {filter.label}: {option.label}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleOption(filter.key, value)}
                    className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )
            })
          })}
        </div>
      )}
    </div>
  )
}