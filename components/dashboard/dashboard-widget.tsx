"use client"

import { useState, useEffect } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Settings, 
  RefreshCw, 
  MoreVertical, 
  Eye, 
  EyeOff,
  Copy,
  Trash2,
  Edit3
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatCurrency, cn } from "@/lib/utils"

// Chart imports
import { 
  EnhancedBarChart,
  EnhancedDonutChart,
  GaugeChart,
  CustomFunnelChart,
  EnhancedScatterChart,
  CombinedChart,
  ProgressChart,
  HeatmapChart
} from "./charts/extended-charts"

// Original chart imports
import { 
  LazyRevenueChart as RevenueChart,
  LazyProjectStatusChart as ProjectStatusChart,
  LazyTaskCompletionChart as TaskCompletionChart,
  LazyContactGrowthChart as ContactGrowthChart,
} from "@/components/lazy/lazy-chart-components"

interface DashboardWidgetProps {
  id: string
  type: "metric_card" | "line_chart" | "bar_chart" | "pie_chart" | "area_chart" | "donut_chart" | "table" | "progress_bar" | "gauge" | "heatmap" | "funnel" | "scatter" | "custom_metric"
  config: {
    title: string
    dataSource: "projects" | "tasks" | "contacts" | "payments" | "invoices" | "custom"
    filters?: Array<{
      field: string
      operator: string
      value: string
    }>
    aggregation?: "count" | "sum" | "average" | "min" | "max"
    field?: string
    groupBy?: string
    dateRange?: string
    refreshInterval?: number
    customColors?: string[]
    showLegend?: boolean
    showGrid?: boolean
    showTooltip?: boolean
    animationEnabled?: boolean
    customQuery?: string
  }
  className?: string
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onDuplicate?: (id: string) => void
  isEditing?: boolean
}

export function DashboardWidget({ 
  id, 
  type, 
  config, 
  className, 
  onEdit, 
  onDelete, 
  onDuplicate,
  isEditing = false 
}: DashboardWidgetProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now())

  // Fetch data based on widget configuration
  const widgetData = useQuery(
    api.dashboards.getDashboardData,
    config.dataSource === "custom" ? "skip" : {
      widgetId: id,
      dataSource: config.dataSource as "projects" | "tasks" | "contacts" | "payments" | "invoices",
      config: {
        aggregation: config.aggregation,
        field: config.field,
        groupBy: config.groupBy,
        dateRange: config.dateRange,
        filters: config.filters?.map(f => ({
          ...f,
          operator: f.operator as "equals" | "not_equals" | "greater_than" | "less_than" | "contains" | "not_contains" | "starts_with" | "ends_with" | "in" | "not_in"
        })),
      }
    }
  )

  // Auto-refresh based on refresh interval
  useEffect(() => {
    if (config.refreshInterval && config.refreshInterval > 0) {
      const interval = setInterval(() => {
        setLastRefresh(Date.now())
      }, config.refreshInterval * 60 * 1000) // Convert minutes to milliseconds

      return () => clearInterval(interval)
    }
  }, [config.refreshInterval])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    setLastRefresh(Date.now())
    
    // Simulate refresh delay
    setTimeout(() => {
      setIsRefreshing(false)
    }, 1000)
  }

  const formatValue = (value: number | string) => {
    if (typeof value === 'number') {
      if (config.field?.includes('revenue') || config.field?.includes('amount')) {
        return formatCurrency(value)
      }
      if (config.aggregation === 'average') {
        return value.toFixed(2)
      }
      return value.toLocaleString()
    }
    return value
  }

  if (!isVisible) {
    return (
      <Card className={cn("border-dashed border-2", className)}>
        <CardContent className="flex items-center justify-center h-full min-h-[200px]">
          <div className="text-center">
            <EyeOff className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Widget Hidden</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsVisible(true)}
              className="mt-2"
            >
              <Eye className="h-4 w-4 mr-2" />
              Show Widget
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderMetricCard = () => {
    const value = widgetData?.value || 0
    const data = widgetData?.data || []
    const hasError = widgetData?.error

    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{config.title}</CardTitle>
          <div className="flex items-center gap-2">
            {config.refreshInterval && (
              <Badge variant="outline" className="text-xs">
                {config.refreshInterval}m
              </Badge>
            )}
            {isEditing && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit?.(id)}>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit Widget
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDuplicate?.(id)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsVisible(false)}>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Hide Widget
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleRefresh} disabled={isRefreshing}>
                    <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
                    Refresh
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onDelete?.(id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {hasError ? (
            <div className="text-destructive text-sm">
              Error: {hasError}
            </div>
          ) : widgetData === undefined ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
          ) : (
            <div>
              <div className="text-2xl font-bold">{formatValue(value)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {data.length} {config.dataSource} records
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const renderChart = () => {
    const data = widgetData?.data || []
    const hasError = widgetData?.error

    if (hasError) {
      return (
        <Card className={className}>
          <CardHeader>
            <CardTitle>{config.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-destructive text-sm">
              Error: {hasError}
            </div>
          </CardContent>
        </Card>
      )
    }

    if (widgetData === undefined) {
      return (
        <Card className={className}>
          <CardHeader>
            <CardTitle>{config.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      )
    }

    // Transform data for charts
    const chartData = data.map((item: any, index: number) => ({
      name: item.name || item.title || `Item ${index + 1}`,
      value: item.value || item[config.field || 'value'] || 0,
      ...item
    }))

    switch (type) {
      case "bar_chart":
        return (
          <EnhancedBarChart
            title={config.title}
            data={chartData}
            config={config}
            className={className}
          />
        )
      case "donut_chart":
        return (
          <EnhancedDonutChart
            title={config.title}
            data={chartData}
            config={config}
            className={className}
          />
        )
      case "gauge":
        return (
          <GaugeChart
            title={config.title}
            data={chartData}
            config={config}
            className={className}
          />
        )
      case "funnel":
        return (
          <CustomFunnelChart
            title={config.title}
            data={chartData}
            config={config}
            className={className}
          />
        )
      case "scatter":
        return (
          <EnhancedScatterChart
            title={config.title}
            data={chartData}
            config={config}
            className={className}
          />
        )
      case "progress_bar":
        return (
          <ProgressChart
            title={config.title}
            data={chartData}
            config={config}
            className={className}
          />
        )
      case "heatmap":
        return (
          <HeatmapChart
            title={config.title}
            data={chartData}
            config={config}
            className={className}
          />
        )
      default:
        return (
          <Card className={className}>
            <CardHeader>
              <CardTitle>{config.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground text-sm">
                Chart type "{type}" not implemented yet
              </div>
            </CardContent>
          </Card>
        )
    }
  }

  const renderTable = () => {
    const data = widgetData?.data || []
    const hasError = widgetData?.error

    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{config.title}</CardTitle>
          {isEditing && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit?.(id)}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Widget
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate?.(id)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsVisible(false)}>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Hide Widget
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleRefresh} disabled={isRefreshing}>
                  <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
                  Refresh
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete?.(id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </CardHeader>
        <CardContent>
          {hasError ? (
            <div className="text-destructive text-sm">
              Error: {hasError}
            </div>
          ) : widgetData === undefined ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {data.slice(0, 10).map((item: any, index: number) => (
                <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                  <span className="text-sm">{item.name || item.title || `Item ${index + 1}`}</span>
                  <span className="text-sm font-medium">
                    {formatValue(item.value || item[config.field || 'value'] || 0)}
                  </span>
                </div>
              ))}
              {data.length > 10 && (
                <div className="text-xs text-muted-foreground text-center pt-2">
                  ... and {data.length - 10} more
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Main render logic
  switch (type) {
    case "metric_card":
      return renderMetricCard()
    case "table":
      return renderTable()
    case "line_chart":
    case "area_chart":
    case "pie_chart":
      // For now, fall back to existing chart components
      if (type === "line_chart") {
        return <RevenueChart dateRange={config.dateRange || "month"} />
      }
      return renderChart()
    default:
      return renderChart()
  }
}