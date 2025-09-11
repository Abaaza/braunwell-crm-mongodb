"use client"

import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"

// Loading component for charts
const ChartSkeleton = () => (
  <div className="w-full h-[300px] flex items-center justify-center">
    <Skeleton className="w-full h-full" />
  </div>
)

// Lazy load chart components
export const LazyRevenueChart = dynamic(
  () => import("@/components/analytics/revenue-chart").then(mod => ({ default: mod.RevenueChart })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false, // Disable SSR for chart components
  }
)

export const LazyProjectStatusChart = dynamic(
  () => import("@/components/analytics/project-status-chart").then(mod => ({ default: mod.ProjectStatusChart })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
)

export const LazyTaskCompletionChart = dynamic(
  () => import("@/components/analytics/task-completion-chart").then(mod => ({ default: mod.TaskCompletionChart })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
)

export const LazyContactGrowthChart = dynamic(
  () => import("@/components/analytics/contact-growth-chart").then(mod => ({ default: mod.ContactGrowthChart })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
)

export const LazyProjectTimelineChart = dynamic(
  () => import("@/components/analytics/project-timeline-chart").then(mod => ({ default: mod.ProjectTimelineChart })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
)

export const LazyRevenueTrackingChart = dynamic(
  () => import("@/components/analytics/revenue-tracking-chart").then(mod => ({ default: mod.RevenueTrackingChart })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
)