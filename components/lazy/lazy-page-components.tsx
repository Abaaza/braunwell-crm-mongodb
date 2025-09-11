"use client"

import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

// Loading skeletons
const TableSkeleton = () => (
  <Card className="p-8">
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  </Card>
)

const FormSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-20 w-full" />
    <Skeleton className="h-10 w-32" />
  </div>
)

const GridSkeleton = () => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: 6 }).map((_, i) => (
      <Card key={i}>
        <Skeleton className="h-48 w-full" />
      </Card>
    ))}
  </div>
)

// Lazy load heavy form components
export const LazyProjectForm = dynamic(
  () => import("@/components/forms/project-form"),
  {
    loading: () => <FormSkeleton />,
  }
)

export const LazyContactForm = dynamic(
  () => import("@/components/forms/contact-form"),
  {
    loading: () => <FormSkeleton />,
  }
)

export const LazyTaskForm = dynamic(
  () => import("@/components/forms/task-form"),
  {
    loading: () => <FormSkeleton />,
  }
)

// Lazy load data tables
export const LazyDataTable = dynamic(
  () => import("@/components/ui/data-table").then(mod => ({ default: mod.DataTable })),
  {
    loading: () => <TableSkeleton />,
  }
)

// Lazy load filter components
export const LazyFilterBar = dynamic(
  () => import("@/components/shared/filter-bar").then(mod => ({ default: mod.FilterBar })),
  {
    loading: () => <Skeleton className="h-10 w-full" />,
  }
)

// Lazy load bulk action components
export const LazyBulkActions = dynamic(
  () => import("@/components/shared/bulk-actions").then(mod => ({ default: mod.BulkActions })),
  {
    loading: () => null,
  }
)

// Lazy load virtual scrolling components
export const LazyVirtualList = dynamic(
  () => import("@/components/shared/virtual-list").then(mod => ({ default: mod.VirtualList })),
  {
    loading: () => <GridSkeleton />,
  }
)

export const LazyVirtualGrid = dynamic(
  () => import("@/components/shared/virtual-list").then(mod => ({ default: mod.VirtualGrid })),
  {
    loading: () => <GridSkeleton />,
  }
)

// Lazy load heavy dialog components
export const LazyImportDialog = dynamic(
  () => import("@/components/shared/import-dialog").then(mod => ({ default: mod.ImportDialog })),
  {
    loading: () => null,
  }
)

// Lazy load activity timeline
export const LazyActivityTimeline = dynamic(
  () => import("@/components/shared/activity-timeline").then(mod => ({ default: mod.ActivityTimeline })),
  {
    loading: () => <TableSkeleton />,
  }
)