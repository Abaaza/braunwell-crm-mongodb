"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"

export interface TableColumn<T> {
  key: string
  header: string
  accessor: (item: T) => React.ReactNode
  sortable?: boolean
  className?: string
  headerClassName?: string
}

interface TableLayoutProps<T> {
  columns: TableColumn<T>[]
  data: T[]
  keyExtractor: (item: T) => string
  onRowClick?: (item: T) => void
  emptyMessage?: string
  className?: string
  showBorder?: boolean
  stickyHeader?: boolean
}

export function TableLayout<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  emptyMessage = "No data found",
  className,
  showBorder = true,
  stickyHeader = false,
}: TableLayoutProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortOrder("asc")
    }
  }

  const getSortIcon = (key: string) => {
    if (sortKey !== key) {
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
    }
    return sortOrder === "asc" 
      ? <ArrowUp className="h-4 w-4" />
      : <ArrowDown className="h-4 w-4" />
  }

  // Sort data if a sort key is selected
  const sortedData = sortKey
    ? [...data].sort((a, b) => {
        const column = columns.find(col => col.key === sortKey)
        if (!column) return 0

        const aValue = column.accessor(a)
        const bValue = column.accessor(b)

        // Convert to string for comparison
        const aStr = String(aValue || "")
        const bStr = String(bValue || "")

        if (sortOrder === "asc") {
          return aStr.localeCompare(bStr)
        } else {
          return bStr.localeCompare(aStr)
        }
      })
    : data

  const tableContent = (
    <div className={cn("overflow-x-auto", className)}>
      <Table>
        <TableHeader className={stickyHeader ? "sticky top-0 bg-background z-10" : ""}>
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={cn(column.headerClassName)}
              >
                {column.sortable ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort(column.key)}
                    className="h-auto p-0 font-medium hover:bg-transparent"
                  >
                    {column.header}
                    <span className="ml-2">{getSortIcon(column.key)}</span>
                  </Button>
                ) : (
                  column.header
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.length > 0 ? (
            sortedData.map((item) => (
              <TableRow
                key={keyExtractor(item)}
                className={cn(
                  onRowClick && "cursor-pointer hover:bg-muted/50"
                )}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    className={column.className}
                  >
                    {column.accessor(item)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )

  return showBorder ? <Card>{tableContent}</Card> : tableContent
}