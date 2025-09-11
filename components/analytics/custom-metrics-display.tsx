"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import {
  BarChart3,
  TrendingUp,
  Users,
  CheckSquare,
  DollarSign,
  Activity,
} from "lucide-react"
import { Id } from "@/convex/_generated/dataModel"

interface CustomMetricsDisplayProps {
  userId: string
  dateRange?: string
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BarChart3: BarChart3,
  TrendingUp: TrendingUp,
  Users: Users,
  CheckSquare: CheckSquare,
  DollarSign: DollarSign,
  Activity: Activity,
}

export function CustomMetricsDisplay({ userId, dateRange }: CustomMetricsDisplayProps) {
  const metrics = useQuery(api.customMetrics.list, { userId: userId as Id<"users"> })

  const MetricCard = ({ metric }: { metric: any }) => {
    const result = useQuery(api.customMetrics.calculate, {
      metricId: metric._id,
      dateRange,
    })

    const Icon = iconMap[metric.icon] || BarChart3
    
    const colorClasses: Record<string, string> = {
      blue: "text-blue-600 bg-blue-100",
      green: "text-green-600 bg-green-100",
      yellow: "text-yellow-600 bg-yellow-100",
      red: "text-red-600 bg-red-100",
      purple: "text-purple-600 bg-purple-100",
      orange: "text-orange-600 bg-orange-100",
    }

    const formatValue = (value: number | Record<string, number>) => {
      if (typeof value === "number") {
        // Check if it's a currency field
        if (metric.field?.includes("Revenue") || metric.field?.includes("amount")) {
          return formatCurrency(value)
        }
        // Check if it's a percentage
        if (metric.aggregation === "average" && metric.field?.includes("Rate")) {
          return `${value.toFixed(1)}%`
        }
        // For counts and other numbers
        return metric.aggregation === "average" ? value.toFixed(2) : value.toLocaleString()
      }
      // For grouped results, show the count
      return `${Object.keys(value).length} groups`
    }

    if (!result) {
      return (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-32" />
          </CardContent>
        </Card>
      )
    }

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
            {metric.description && (
              <p className="text-xs text-muted-foreground">{metric.description}</p>
            )}
          </div>
          <div className={`rounded-lg p-2 ${colorClasses[metric.color] || colorClasses.blue}`}>
            <Icon className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatValue(result.result)}</div>
          {metric.filters.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Filtered: {result.dataCount} items
            </p>
          )}
          {metric.groupBy && typeof result.result === "object" && (
            <div className="mt-2 space-y-1">
              {Object.entries(result.result)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{key}:</span>
                    <span className="font-medium">{formatValue(value)}</span>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (!metrics || metrics.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Custom Metrics</h3>
        <Badge variant="secondary">{metrics.length} metrics</Badge>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.slice(0, 8).map((metric) => (
          <MetricCard key={metric._id} metric={metric} />
        ))}
      </div>
    </div>
  )
}