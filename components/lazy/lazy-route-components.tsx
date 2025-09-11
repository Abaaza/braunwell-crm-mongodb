"use client"

import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"

// Page loading skeleton
const PageSkeleton = () => (
  <div className="space-y-6">
    <div className="space-y-2">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
    </div>
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-32" />
      ))}
    </div>
    <Skeleton className="h-96 w-full" />
  </div>
)

// Lazy load heavy pages
export const LazyAnalyticsPage = dynamic(
  () => import("@/app/(dashboard)/analytics/page"),
  {
    loading: () => <PageSkeleton />,
  }
)

export const LazyAnalyticsMetricsPage = dynamic(
  () => import("@/app/(dashboard)/analytics/metrics/page"),
  {
    loading: () => <PageSkeleton />,
  }
)

export const LazyProjectDetailPage = dynamic(
  () => import("@/app/(dashboard)/projects/[id]/page"),
  {
    loading: () => <PageSkeleton />,
  }
)

export const LazyContactDetailPage = dynamic(
  () => import("@/app/(dashboard)/contacts/[id]/page"),
  {
    loading: () => <PageSkeleton />,
  }
)

export const LazySettingsPage = dynamic(
  () => import("@/app/(dashboard)/settings/page"),
  {
    loading: () => <PageSkeleton />,
  }
)

// Backup page not implemented yet
// export const LazyBackupPage = dynamic(
//   () => import("@/app/(dashboard)/settings/backup/page"),
//   {
//     loading: () => <PageSkeleton />,
//   }
// )

export const LazyLogsPage = dynamic(
  () => import("@/app/(dashboard)/settings/logs/page"),
  {
    loading: () => <PageSkeleton />,
  }
)