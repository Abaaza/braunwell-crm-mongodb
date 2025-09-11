"use client"

import { useState, useEffect, useRef } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth"
import { cn } from "@/lib/utils"
import { 
  Plus,
  Save,
  Eye,
  Edit3,
  Trash2,
  Copy,
  Grid3X3,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  Gauge,
  Table,
  TrendingUp,
  Settings,
  Download,
  Upload,
  Palette,
  Filter,
  Calendar,
  RefreshCw,
  Move,
  X
} from "lucide-react"

import { DashboardWidget } from "./dashboard-widget"

interface WidgetConfig {
  id: string
  type: "metric_card" | "line_chart" | "bar_chart" | "pie_chart" | "area_chart" | "donut_chart" | "table" | "progress_bar" | "gauge" | "heatmap" | "funnel" | "scatter" | "custom_metric"
  position: {
    x: number
    y: number
    w: number
    h: number
  }
  config: {
    title: string
    dataSource: "projects" | "tasks" | "contacts" | "payments" | "invoices" | "custom"
    filters?: Array<{
      field: string
      operator: "equals" | "not_equals" | "greater_than" | "less_than" | "contains" | "not_contains" | "starts_with" | "ends_with" | "in" | "not_in"
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
}

interface DashboardBuilderProps {
  dashboardId?: string
  onSave?: (dashboard: any) => void
  onCancel?: () => void
}

const WIDGET_TYPES = [
  { id: "metric_card", name: "Metric Card", icon: Activity, description: "Display a single metric value" },
  { id: "bar_chart", name: "Bar Chart", icon: BarChart3, description: "Compare values across categories" },
  { id: "line_chart", name: "Line Chart", icon: LineChart, description: "Show trends over time" },
  { id: "pie_chart", name: "Pie Chart", icon: PieChart, description: "Show proportions of a whole" },
  { id: "donut_chart", name: "Donut Chart", icon: PieChart, description: "Modern pie chart with center space" },
  { id: "table", name: "Table", icon: Table, description: "Display data in tabular format" },
  { id: "gauge", name: "Gauge", icon: Gauge, description: "Show progress or percentage" },
  { id: "progress_bar", name: "Progress Bar", icon: TrendingUp, description: "Show multiple progress indicators" },
] as const

const DATA_SOURCES = [
  { id: "projects", name: "Projects", fields: ["name", "expectedRevenueGBP", "status", "createdAt"] },
  { id: "tasks", name: "Tasks", fields: ["title", "status", "priority", "createdAt"] },
  { id: "contacts", name: "Contacts", fields: ["name", "email", "company", "createdAt"] },
  { id: "payments", name: "Payments", fields: ["amount", "date", "method"] },
  { id: "invoices", name: "Invoices", fields: ["totalAmount", "status", "dueDate"] },
] as const

const AGGREGATIONS = [
  { id: "count", name: "Count" },
  { id: "sum", name: "Sum" },
  { id: "average", name: "Average" },
  { id: "min", name: "Minimum" },
  { id: "max", name: "Maximum" },
] as const

const DATE_RANGES = [
  { id: "today", name: "Today" },
  { id: "week", name: "This Week" },
  { id: "month", name: "This Month" },
  { id: "quarter", name: "This Quarter" },
  { id: "year", name: "This Year" },
] as const

export function DashboardBuilder({ dashboardId, onSave, onCancel }: DashboardBuilderProps) {
  const { user } = useAuth()
  const [widgets, setWidgets] = useState<WidgetConfig[]>([])
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null)
  const [isAddWidgetOpen, setIsAddWidgetOpen] = useState(false)
  const [isEditWidgetOpen, setIsEditWidgetOpen] = useState(false)
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const gridRef = useRef<HTMLDivElement>(null)

  // Dashboard details
  const [dashboardName, setDashboardName] = useState("")
  const [dashboardDescription, setDashboardDescription] = useState("")
  const [dashboardTags, setDashboardTags] = useState<string[]>([])
  const [dashboardIsPublic, setDashboardIsPublic] = useState(false)

  // Widget configuration
  const [widgetType, setWidgetType] = useState<string>("")
  const [widgetTitle, setWidgetTitle] = useState("")
  const [widgetDataSource, setWidgetDataSource] = useState<string>("")
  const [widgetAggregation, setWidgetAggregation] = useState<string>("")
  const [widgetField, setWidgetField] = useState<string>("")
  const [widgetGroupBy, setWidgetGroupBy] = useState<string>("")
  const [widgetDateRange, setWidgetDateRange] = useState<string>("")
  const [widgetRefreshInterval, setWidgetRefreshInterval] = useState<number>(0)
  const [widgetColors, setWidgetColors] = useState<string[]>([])
  const [widgetShowLegend, setWidgetShowLegend] = useState(true)
  const [widgetShowGrid, setWidgetShowGrid] = useState(true)
  const [widgetShowTooltip, setWidgetShowTooltip] = useState(true)
  const [widgetAnimationEnabled, setWidgetAnimationEnabled] = useState(true)

  // API calls
  const existingDashboard = useQuery(
    api.dashboards.get, 
    dashboardId ? { id: dashboardId as Id<"dashboards"> } : "skip"
  )
  const createDashboard = useMutation(api.dashboards.create)
  const updateDashboard = useMutation(api.dashboards.update)

  // Load existing dashboard
  useEffect(() => {
    if (existingDashboard) {
      setDashboardName(existingDashboard.name)
      setDashboardDescription(existingDashboard.description || "")
      setDashboardTags(existingDashboard.tags || [])
      setDashboardIsPublic(existingDashboard.isPublic)
      setWidgets(existingDashboard.layout || [])
    }
  }, [existingDashboard])

  // Grid layout functions
  const getGridPosition = (x: number, y: number) => {
    const gridSize = 100 // 100px grid
    return {
      x: Math.floor(x / gridSize) * gridSize,
      y: Math.floor(y / gridSize) * gridSize,
    }
  }

  const handleAddWidget = () => {
    if (!widgetType || !widgetTitle || !widgetDataSource) {
      toast.error("Please fill in all required fields")
      return
    }

    const newWidget: WidgetConfig = {
      id: `widget-${Date.now()}`,
      type: widgetType as any,
      position: { x: 0, y: 0, w: 4, h: 3 },
      config: {
        title: widgetTitle,
        dataSource: widgetDataSource as any,
        aggregation: widgetAggregation as any,
        field: widgetField,
        groupBy: widgetGroupBy,
        dateRange: widgetDateRange,
        refreshInterval: widgetRefreshInterval,
        customColors: widgetColors,
        showLegend: widgetShowLegend,
        showGrid: widgetShowGrid,
        showTooltip: widgetShowTooltip,
        animationEnabled: widgetAnimationEnabled,
      },
    }

    setWidgets([...widgets, newWidget])
    setIsAddWidgetOpen(false)
    resetWidgetForm()
    toast.success("Widget added successfully")
  }

  const handleEditWidget = (id: string) => {
    const widget = widgets.find(w => w.id === id)
    if (widget) {
      setSelectedWidget(id)
      setWidgetType(widget.type)
      setWidgetTitle(widget.config.title)
      setWidgetDataSource(widget.config.dataSource)
      setWidgetAggregation(widget.config.aggregation || "")
      setWidgetField(widget.config.field || "")
      setWidgetGroupBy(widget.config.groupBy || "")
      setWidgetDateRange(widget.config.dateRange || "")
      setWidgetRefreshInterval(widget.config.refreshInterval || 0)
      setWidgetColors(widget.config.customColors || [])
      setWidgetShowLegend(widget.config.showLegend !== false)
      setWidgetShowGrid(widget.config.showGrid !== false)
      setWidgetShowTooltip(widget.config.showTooltip !== false)
      setWidgetAnimationEnabled(widget.config.animationEnabled !== false)
      setIsEditWidgetOpen(true)
    }
  }

  const handleUpdateWidget = () => {
    if (!selectedWidget) return

    const updatedWidgets = widgets.map(widget => 
      widget.id === selectedWidget 
        ? {
            ...widget,
            config: {
              ...widget.config,
              title: widgetTitle,
              dataSource: widgetDataSource as any,
              aggregation: widgetAggregation as any,
              field: widgetField,
              groupBy: widgetGroupBy,
              dateRange: widgetDateRange,
              refreshInterval: widgetRefreshInterval,
              customColors: widgetColors,
              showLegend: widgetShowLegend,
              showGrid: widgetShowGrid,
              showTooltip: widgetShowTooltip,
              animationEnabled: widgetAnimationEnabled,
            }
          }
        : widget
    )

    setWidgets(updatedWidgets)
    setIsEditWidgetOpen(false)
    setSelectedWidget(null)
    resetWidgetForm()
    toast.success("Widget updated successfully")
  }

  const handleDeleteWidget = (id: string) => {
    setWidgets(widgets.filter(w => w.id !== id))
    toast.success("Widget deleted successfully")
  }

  const handleDuplicateWidget = (id: string) => {
    const widget = widgets.find(w => w.id === id)
    if (widget) {
      const duplicatedWidget: WidgetConfig = {
        ...widget,
        id: `widget-${Date.now()}`,
        config: {
          ...widget.config,
          title: `${widget.config.title} (Copy)`,
        },
        position: {
          ...widget.position,
          x: widget.position.x + 100,
          y: widget.position.y + 100,
        },
      }
      setWidgets([...widgets, duplicatedWidget])
      toast.success("Widget duplicated successfully")
    }
  }

  const resetWidgetForm = () => {
    setWidgetType("")
    setWidgetTitle("")
    setWidgetDataSource("")
    setWidgetAggregation("")
    setWidgetField("")
    setWidgetGroupBy("")
    setWidgetDateRange("")
    setWidgetRefreshInterval(0)
    setWidgetColors([])
    setWidgetShowLegend(true)
    setWidgetShowGrid(true)
    setWidgetShowTooltip(true)
    setWidgetAnimationEnabled(true)
  }

  const handleSaveDashboard = async () => {
    if (!user || !dashboardName) {
      toast.error("Please provide a dashboard name")
      return
    }

    try {
      const dashboardData = {
        name: dashboardName,
        description: dashboardDescription,
        layout: widgets,
        tags: dashboardTags,
        isPublic: dashboardIsPublic,
        userId: user.id,
      }

      if (dashboardId) {
        await updateDashboard({ id: dashboardId as Id<"dashboards">, ...dashboardData })
        toast.success("Dashboard updated successfully")
      } else {
        const newDashboardId = await createDashboard(dashboardData)
        toast.success("Dashboard created successfully")
      }

      onSave?.(dashboardData)
      setIsSaveDialogOpen(false)
    } catch (error) {
      toast.error("Failed to save dashboard")
    }
  }

  const availableFields = DATA_SOURCES.find(ds => ds.id === widgetDataSource)?.fields || []

  return (
    <div className="h-screen flex flex-col">
      <PageHeader
        title={dashboardId ? "Edit Dashboard" : "Dashboard Builder"}
        description={dashboardId ? "Modify your dashboard layout" : "Create a new custom dashboard"}
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
          >
            {isPreviewMode ? <Edit3 className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
            {isPreviewMode ? "Edit" : "Preview"}
          </Button>
          <Button onClick={() => setIsSaveDialogOpen(true)}>
            <Save className="mr-2 h-4 w-4" />
            Save Dashboard
          </Button>
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </PageHeader>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {!isPreviewMode && (
          <div className="w-80 border-r bg-muted/10 p-4 overflow-y-auto">
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Add Widget</h3>
                <Button 
                  className="w-full" 
                  onClick={() => setIsAddWidgetOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Widget
                </Button>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Widget Types</h3>
                <div className="grid grid-cols-2 gap-2">
                  {WIDGET_TYPES.map(type => {
                    const Icon = type.icon
                    return (
                      <Button
                        key={type.id}
                        variant="outline"
                        className="h-auto p-3 flex flex-col items-center gap-2"
                        onClick={() => {
                          setWidgetType(type.id)
                          setIsAddWidgetOpen(true)
                        }}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-xs">{type.name}</span>
                      </Button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Widgets ({widgets.length})</h3>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {widgets.map(widget => (
                      <div
                        key={widget.id}
                        className="flex items-center justify-between p-2 bg-background rounded-lg border"
                      >
                        <div className="flex items-center gap-2">
                          <Grid3X3 className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm font-medium">{widget.config.title}</div>
                            <div className="text-xs text-muted-foreground">{widget.type}</div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditWidget(widget.id)}>
                              <Edit3 className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicateWidget(widget.id)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteWidget(widget.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
        )}

        {/* Main Canvas */}
        <div className="flex-1 p-6 overflow-auto">
          <div
            ref={gridRef}
            className={cn(
              "min-h-full relative",
              !isPreviewMode && "bg-grid-pattern"
            )}
          >
            {widgets.length === 0 ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <Grid3X3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No widgets added yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Add your first widget to get started
                  </p>
                  <Button onClick={() => setIsAddWidgetOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Widget
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {widgets.map(widget => (
                  <div
                    key={widget.id}
                    className={cn(
                      "relative",
                      !isPreviewMode && "hover:ring-2 hover:ring-primary/50 rounded-lg"
                    )}
                  >
                    <DashboardWidget
                      id={widget.id}
                      type={widget.type}
                      config={widget.config}
                      onEdit={handleEditWidget}
                      onDelete={handleDeleteWidget}
                      onDuplicate={handleDuplicateWidget}
                      isEditing={!isPreviewMode}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Widget Dialog */}
      <Dialog open={isAddWidgetOpen} onOpenChange={setIsAddWidgetOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Widget</DialogTitle>
            <DialogDescription>
              Configure your widget settings and data source
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="widget-type">Widget Type</Label>
                <Select value={widgetType} onValueChange={setWidgetType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select widget type" />
                  </SelectTrigger>
                  <SelectContent>
                    {WIDGET_TYPES.map(type => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="widget-title">Title</Label>
                <Input
                  id="widget-title"
                  value={widgetTitle}
                  onChange={(e) => setWidgetTitle(e.target.value)}
                  placeholder="Widget title"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="widget-data-source">Data Source</Label>
                <Select value={widgetDataSource} onValueChange={setWidgetDataSource}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select data source" />
                  </SelectTrigger>
                  <SelectContent>
                    {DATA_SOURCES.map(source => (
                      <SelectItem key={source.id} value={source.id}>
                        {source.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="widget-aggregation">Aggregation</Label>
                <Select value={widgetAggregation} onValueChange={setWidgetAggregation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select aggregation" />
                  </SelectTrigger>
                  <SelectContent>
                    {AGGREGATIONS.map(agg => (
                      <SelectItem key={agg.id} value={agg.id}>
                        {agg.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="widget-field">Field</Label>
                <Select value={widgetField} onValueChange={setWidgetField}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableFields.map(field => (
                      <SelectItem key={field} value={field}>
                        {field}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="widget-date-range">Date Range</Label>
                <Select value={widgetDateRange} onValueChange={setWidgetDateRange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select date range" />
                  </SelectTrigger>
                  <SelectContent>
                    {DATE_RANGES.map(range => (
                      <SelectItem key={range.id} value={range.id}>
                        {range.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="widget-refresh">Refresh Interval (minutes)</Label>
              <Input
                id="widget-refresh"
                type="number"
                value={widgetRefreshInterval}
                onChange={(e) => setWidgetRefreshInterval(Number(e.target.value))}
                placeholder="0 for manual refresh"
                min="0"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="widget-legend"
                  checked={widgetShowLegend}
                  onCheckedChange={(checked) => setWidgetShowLegend(checked as boolean)}
                />
                <Label htmlFor="widget-legend">Show Legend</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="widget-grid"
                  checked={widgetShowGrid}
                  onCheckedChange={(checked) => setWidgetShowGrid(checked as boolean)}
                />
                <Label htmlFor="widget-grid">Show Grid</Label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="widget-tooltip"
                  checked={widgetShowTooltip}
                  onCheckedChange={(checked) => setWidgetShowTooltip(checked as boolean)}
                />
                <Label htmlFor="widget-tooltip">Show Tooltip</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="widget-animation"
                  checked={widgetAnimationEnabled}
                  onCheckedChange={(checked) => setWidgetAnimationEnabled(checked as boolean)}
                />
                <Label htmlFor="widget-animation">Enable Animation</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddWidgetOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddWidget}>Add Widget</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Widget Dialog */}
      <Dialog open={isEditWidgetOpen} onOpenChange={setIsEditWidgetOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Widget</DialogTitle>
            <DialogDescription>
              Update your widget configuration
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-widget-type">Widget Type</Label>
                <Select value={widgetType} onValueChange={setWidgetType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select widget type" />
                  </SelectTrigger>
                  <SelectContent>
                    {WIDGET_TYPES.map(type => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-widget-title">Title</Label>
                <Input
                  id="edit-widget-title"
                  value={widgetTitle}
                  onChange={(e) => setWidgetTitle(e.target.value)}
                  placeholder="Widget title"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-widget-data-source">Data Source</Label>
                <Select value={widgetDataSource} onValueChange={setWidgetDataSource}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select data source" />
                  </SelectTrigger>
                  <SelectContent>
                    {DATA_SOURCES.map(source => (
                      <SelectItem key={source.id} value={source.id}>
                        {source.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-widget-aggregation">Aggregation</Label>
                <Select value={widgetAggregation} onValueChange={setWidgetAggregation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select aggregation" />
                  </SelectTrigger>
                  <SelectContent>
                    {AGGREGATIONS.map(agg => (
                      <SelectItem key={agg.id} value={agg.id}>
                        {agg.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-widget-field">Field</Label>
                <Select value={widgetField} onValueChange={setWidgetField}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableFields.map(field => (
                      <SelectItem key={field} value={field}>
                        {field}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-widget-date-range">Date Range</Label>
                <Select value={widgetDateRange} onValueChange={setWidgetDateRange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select date range" />
                  </SelectTrigger>
                  <SelectContent>
                    {DATE_RANGES.map(range => (
                      <SelectItem key={range.id} value={range.id}>
                        {range.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-widget-refresh">Refresh Interval (minutes)</Label>
              <Input
                id="edit-widget-refresh"
                type="number"
                value={widgetRefreshInterval}
                onChange={(e) => setWidgetRefreshInterval(Number(e.target.value))}
                placeholder="0 for manual refresh"
                min="0"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-widget-legend"
                  checked={widgetShowLegend}
                  onCheckedChange={(checked) => setWidgetShowLegend(checked as boolean)}
                />
                <Label htmlFor="edit-widget-legend">Show Legend</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-widget-grid"
                  checked={widgetShowGrid}
                  onCheckedChange={(checked) => setWidgetShowGrid(checked as boolean)}
                />
                <Label htmlFor="edit-widget-grid">Show Grid</Label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-widget-tooltip"
                  checked={widgetShowTooltip}
                  onCheckedChange={(checked) => setWidgetShowTooltip(checked as boolean)}
                />
                <Label htmlFor="edit-widget-tooltip">Show Tooltip</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-widget-animation"
                  checked={widgetAnimationEnabled}
                  onCheckedChange={(checked) => setWidgetAnimationEnabled(checked as boolean)}
                />
                <Label htmlFor="edit-widget-animation">Enable Animation</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditWidgetOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateWidget}>Update Widget</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Dashboard Dialog */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Dashboard</DialogTitle>
            <DialogDescription>
              Configure your dashboard settings
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dashboard-name">Dashboard Name</Label>
              <Input
                id="dashboard-name"
                value={dashboardName}
                onChange={(e) => setDashboardName(e.target.value)}
                placeholder="My Dashboard"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dashboard-description">Description</Label>
              <Textarea
                id="dashboard-description"
                value={dashboardDescription}
                onChange={(e) => setDashboardDescription(e.target.value)}
                placeholder="Dashboard description..."
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="dashboard-public"
                checked={dashboardIsPublic}
                onCheckedChange={(checked) => setDashboardIsPublic(checked as boolean)}
              />
              <Label htmlFor="dashboard-public">Make dashboard public</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveDashboard}>Save Dashboard</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}