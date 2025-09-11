"use client"

import * as React from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { cn } from "@/lib/utils"

interface VirtualListProps<T> {
  items: T[]
  height: number | string
  itemHeight?: number
  estimateSize?: (index: number) => number
  overscan?: number
  renderItem: (item: T, index: number) => React.ReactNode
  className?: string
  onScroll?: (event: React.UIEvent<HTMLDivElement>) => void
}

export function VirtualList<T>({
  items,
  height,
  itemHeight = 80,
  estimateSize,
  overscan = 5,
  renderItem,
  className,
  onScroll,
}: VirtualListProps<T>) {
  const parentRef = React.useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: estimateSize || (() => itemHeight),
    overscan,
  })

  const virtualItems = virtualizer.getVirtualItems()

  return (
    <div
      ref={parentRef}
      className={cn("overflow-auto", className)}
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
      onScroll={onScroll}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualRow) => {
          const item = items[virtualRow.index]
          return (
            <div
              key={virtualRow.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {renderItem(item, virtualRow.index)}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Grid variant for card layouts
interface VirtualGridProps<T> {
  items: T[]
  height: number | string
  columnCount: number
  itemHeight?: number
  estimateSize?: (index: number) => number
  overscan?: number
  gap?: number
  renderItem: (item: T, index: number) => React.ReactNode
  className?: string
  onScroll?: (event: React.UIEvent<HTMLDivElement>) => void
}

export function VirtualGrid<T>({
  items,
  height,
  columnCount,
  itemHeight = 200,
  estimateSize,
  overscan = 2,
  gap = 16,
  renderItem,
  className,
  onScroll,
}: VirtualGridProps<T>) {
  const parentRef = React.useRef<HTMLDivElement>(null)

  // Calculate rows from items
  const rowCount = Math.ceil(items.length / columnCount)
  const rows = React.useMemo(() => {
    const result: T[][] = []
    for (let i = 0; i < rowCount; i++) {
      const start = i * columnCount
      const end = Math.min(start + columnCount, items.length)
      result.push(items.slice(start, end))
    }
    return result
  }, [items, rowCount, columnCount])

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: estimateSize || (() => itemHeight),
    overscan,
    paddingStart: gap / 2,
    paddingEnd: gap / 2,
  })

  const virtualRows = virtualizer.getVirtualItems()

  return (
    <div
      ref={parentRef}
      className={cn("overflow-auto", className)}
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
      onScroll={onScroll}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualRows.map((virtualRow) => {
          const row = rows[virtualRow.index]
          return (
            <div
              key={virtualRow.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
                  gap: `${gap}px`,
                  height: '100%',
                }}
              >
                {row.map((item, colIndex) => {
                  const itemIndex = virtualRow.index * columnCount + colIndex
                  return (
                    <div key={itemIndex}>
                      {renderItem(item, itemIndex)}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}