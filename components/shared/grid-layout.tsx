"use client"

import { cn } from "@/lib/utils"

interface GridLayoutProps {
  children: React.ReactNode
  columns?: 1 | 2 | 3 | 4 | 5 | 6
  gap?: "sm" | "md" | "lg" | "xl"
  className?: string
  responsive?: boolean
}

const columnClasses = {
  1: "grid-cols-1",
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  5: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
  6: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
}

const gapClasses = {
  sm: "gap-2",
  md: "gap-4",
  lg: "gap-6",
  xl: "gap-8",
}

export function GridLayout({
  children,
  columns = 1,
  gap = "md",
  className,
  responsive = true,
}: GridLayoutProps) {
  return (
    <div
      className={cn(
        "grid",
        responsive ? columnClasses[columns] : `grid-cols-${columns}`,
        gapClasses[gap],
        className
      )}
    >
      {children}
    </div>
  )
}

// Responsive grid item with optional span
interface GridItemProps {
  children: React.ReactNode
  span?: 1 | 2 | 3 | 4 | 5 | 6 | "full"
  className?: string
}

const spanClasses = {
  1: "col-span-1",
  2: "col-span-2",
  3: "col-span-3",
  4: "col-span-4",
  5: "col-span-5",
  6: "col-span-6",
  full: "col-span-full",
}

export function GridItem({ children, span = 1, className }: GridItemProps) {
  return (
    <div className={cn(spanClasses[span], className)}>
      {children}
    </div>
  )
}