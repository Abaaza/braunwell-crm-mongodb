"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { PageHeader } from "@/components/shared/page-header"
import { SearchBar } from "@/components/shared/search-bar"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/lib/auth"
import { formatDate } from "@/lib/utils"
import { toast } from "sonner"
import {
  BarChart3,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  TrendingUp,
  Users,
  CheckSquare,
  DollarSign,
  Activity,
  Filter,
  X,
} from "lucide-react"
import { Id } from "@/convex/_generated/dataModel"

interface MetricFilter {
  field: string
  operator: "equals" | "not_equals" | "greater_than" | "less_than" | "contains"
  value: string
}

interface MetricFormData {
  name: string
  description: string
  dataSource: "projects" | "tasks" | "contacts" | "payments"
  aggregation: "count" | "sum" | "average" | "min" | "max"
  field: string
  filters: MetricFilter[]
  groupBy: string
  chartType: "number" | "line" | "bar" | "pie" | "donut"
  color: string
  icon: string
  isPublic: boolean
}

const dataSourceFields: Record<string, { label: string; value: string; type: "number" | "string" | "date" | "boolean" }[]> = {
  projects: [
    { label: "Name", value: "name", type: "string" },
    { label: "Company", value: "company", type: "string" },
    { label: "Status", value: "status", type: "string" },
    { label: "Expected Revenue", value: "expectedRevenueGBP", type: "number" },
    { label: "Created Date", value: "createdAt", type: "date" },
    { label: "Start Date", value: "startDate", type: "date" },
    { label: "End Date", value: "endDate", type: "date" },
  ],
  tasks: [
    { label: "Title", value: "title", type: "string" },
    { label: "Status", value: "status", type: "string" },
    { label: "Priority", value: "priority", type: "string" },
    { label: "Due Date", value: "dueDate", type: "date" },
    { label: "Created Date", value: "createdAt", type: "date" },
  ],
  contacts: [
    { label: "Name", value: "name", type: "string" },
    { label: "Email", value: "email", type: "string" },
    { label: "Company", value: "company", type: "string" },
    { label: "Created Date", value: "createdAt", type: "date" },
  ],
  payments: [
    { label: "Amount", value: "amount", type: "number" },
    { label: "Method", value: "method", type: "string" },
    { label: "Date", value: "date", type: "date" },
  ],
}

const iconOptions = [
  { label: "Bar Chart", value: "BarChart3", icon: BarChart3 },
  { label: "Trending Up", value: "TrendingUp", icon: TrendingUp },
  { label: "Users", value: "Users", icon: Users },
  { label: "Check Square", value: "CheckSquare", icon: CheckSquare },
  { label: "Dollar Sign", value: "DollarSign", icon: DollarSign },
  { label: "Activity", value: "Activity", icon: Activity },
]

const colorOptions = [
  { label: "Blue", value: "blue", className: "bg-blue-500" },
  { label: "Green", value: "green", className: "bg-green-500" },
  { label: "Yellow", value: "yellow", className: "bg-yellow-500" },
  { label: "Red", value: "red", className: "bg-red-500" },
  { label: "Purple", value: "purple", className: "bg-purple-500" },
  { label: "Orange", value: "orange", className: "bg-orange-500" },
]

export default function CustomMetricsPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState("")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState<any>(null)
  const [formData, setFormData] = useState<MetricFormData>({
    name: "",
    description: "",
    dataSource: "projects",
    aggregation: "count",
    field: "",
    filters: [],
    groupBy: "",
    chartType: "number",
    color: "blue",
    icon: "BarChart3",
    isPublic: false,
  })

  const metrics = useQuery(api.customMetrics.list, user ? { userId: user.id } : "skip")
  const createMetric = useMutation(api.customMetrics.create)
  const updateMetric = useMutation(api.customMetrics.update)
  const deleteMetric = useMutation(api.customMetrics.remove)

  const filteredMetrics = metrics?.filter(metric =>
    search === "" ||
    metric.name.toLowerCase().includes(search.toLowerCase()) ||
    metric.description?.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreateMetric = async () => {
    if (!user || !formData.name) return

    try {
      await createMetric({
        name: formData.name,
        description: formData.description || undefined,
        dataSource: formData.dataSource,
        aggregation: formData.aggregation,
        field: formData.field || undefined,
        filters: formData.filters,
        groupBy: formData.groupBy || undefined,
        chartType: formData.chartType,
        color: formData.color,
        icon: formData.icon,
        isPublic: formData.isPublic,
        userId: user.id,
      })

      toast.success("Metric created successfully")
      setCreateDialogOpen(false)
      resetForm()
    } catch (error) {
      toast.error("Failed to create metric")
    }
  }

  const handleUpdateMetric = async () => {
    if (!user || !selectedMetric || !formData.name) return

    try {
      await updateMetric({
        id: selectedMetric._id,
        name: formData.name,
        description: formData.description || undefined,
        dataSource: formData.dataSource,
        aggregation: formData.aggregation,
        field: formData.field || undefined,
        filters: formData.filters,
        groupBy: formData.groupBy || undefined,
        chartType: formData.chartType,
        color: formData.color,
        icon: formData.icon,
        isPublic: formData.isPublic,
        userId: user.id,
      })

      toast.success("Metric updated successfully")
      setEditDialogOpen(false)
      resetForm()
    } catch (error) {
      toast.error("Failed to update metric")
    }
  }

  const handleDeleteMetric = async () => {
    if (!user || !selectedMetric) return

    try {
      await deleteMetric({
        id: selectedMetric._id,
        userId: user.id,
      })

      toast.success("Metric deleted successfully")
      setDeleteDialogOpen(false)
      setSelectedMetric(null)
    } catch (error) {
      toast.error("Failed to delete metric")
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      dataSource: "projects",
      aggregation: "count",
      field: "",
      filters: [],
      groupBy: "",
      chartType: "number",
      color: "blue",
      icon: "BarChart3",
      isPublic: false,
    })
    setSelectedMetric(null)
  }

  const openEditDialog = (metric: any) => {
    setSelectedMetric(metric)
    setFormData({
      name: metric.name,
      description: metric.description || "",
      dataSource: metric.dataSource,
      aggregation: metric.aggregation,
      field: metric.field || "",
      filters: metric.filters || [],
      groupBy: metric.groupBy || "",
      chartType: metric.chartType || "number",
      color: metric.color || "blue",
      icon: metric.icon || "BarChart3",
      isPublic: metric.isPublic,
    })
    setEditDialogOpen(true)
  }

  const openDeleteDialog = (metric: any) => {
    setSelectedMetric(metric)
    setDeleteDialogOpen(true)
  }

  const addFilter = () => {
    setFormData({
      ...formData,
      filters: [...formData.filters, { field: "", operator: "equals", value: "" }],
    })
  }

  const updateFilter = (index: number, field: keyof MetricFilter, value: any) => {
    const newFilters = [...formData.filters]
    newFilters[index] = { ...newFilters[index], [field]: value }
    setFormData({ ...formData, filters: newFilters })
  }

  const removeFilter = (index: number) => {
    setFormData({
      ...formData,
      filters: formData.filters.filter((_, i) => i !== index),
    })
  }

  const getIcon = (iconName: string) => {
    const option = iconOptions.find(opt => opt.value === iconName)
    return option?.icon || BarChart3
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Custom Metrics"
        description="Create and manage custom analytics metrics"
      >
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Metric
        </Button>
      </PageHeader>

      <div className="flex items-center justify-between">
        <SearchBar
          placeholder="Search metrics..."
          value={search}
          onChange={setSearch}
          className="max-w-md"
        />
      </div>

      {filteredMetrics ? (
        filteredMetrics.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredMetrics.map((metric) => {
              const Icon = getIcon(metric.icon || 'bar-chart')
              return (
                <Card key={metric._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-${metric.color}-100 text-${metric.color}-600`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{metric.name}</CardTitle>
                          {metric.description && (
                            <CardDescription className="mt-1">
                              {metric.description}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                      {metric.createdBy === user?.id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(metric)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => openDeleteDialog(metric)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">
                        {metric.dataSource}
                      </Badge>
                      <Badge variant="secondary">
                        {metric.aggregation}
                      </Badge>
                      {metric.field && (
                        <Badge variant="secondary">
                          {metric.field}
                        </Badge>
                      )}
                    </div>
                    {metric.filters.length > 0 && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Filter className="h-3 w-3" />
                        {metric.filters.length} filter{metric.filters.length !== 1 && 's'}
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {metric.isPublic ? "Public" : "Private"} • By {metric.creatorName}
                      </span>
                      <span>{formatDate(metric.createdAt)}</span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <EmptyState
            icon={<BarChart3 className="h-12 w-12" />}
            title="No metrics found"
            description={search ? "Try adjusting your search" : "Create your first custom metric"}
            action={{
              label: "Create Metric",
              onClick: () => setCreateDialogOpen(true)
            }}
          />
        )
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full mt-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Metric Dialog */}
      <Dialog open={createDialogOpen || editDialogOpen} onOpenChange={createDialogOpen ? setCreateDialogOpen : setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{createDialogOpen ? "Create" : "Edit"} Custom Metric</DialogTitle>
            <DialogDescription>
              Define a custom metric to track specific data points
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Metric Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., High Value Projects"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what this metric tracks..."
                rows={3}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="dataSource">Data Source *</Label>
                <Select
                  value={formData.dataSource}
                  onValueChange={(value: any) => setFormData({ ...formData, dataSource: value, field: "", filters: [] })}
                >
                  <SelectTrigger id="dataSource">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="projects">Projects</SelectItem>
                    <SelectItem value="tasks">Tasks</SelectItem>
                    <SelectItem value="contacts">Contacts</SelectItem>
                    <SelectItem value="payments">Payments</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="aggregation">Aggregation *</Label>
                <Select
                  value={formData.aggregation}
                  onValueChange={(value: any) => setFormData({ ...formData, aggregation: value })}
                >
                  <SelectTrigger id="aggregation">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="count">Count</SelectItem>
                    <SelectItem value="sum">Sum</SelectItem>
                    <SelectItem value="average">Average</SelectItem>
                    <SelectItem value="min">Minimum</SelectItem>
                    <SelectItem value="max">Maximum</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {formData.aggregation !== "count" && (
              <div className="grid gap-2">
                <Label htmlFor="field">Field to Aggregate *</Label>
                <Select
                  value={formData.field}
                  onValueChange={(value) => setFormData({ ...formData, field: value })}
                >
                  <SelectTrigger id="field">
                    <SelectValue placeholder="Select a field" />
                  </SelectTrigger>
                  <SelectContent>
                    {dataSourceFields[formData.dataSource]
                      .filter(field => field.type === "number")
                      .map(field => (
                        <SelectItem key={field.value} value={field.value}>
                          {field.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="groupBy">Group By (Optional)</Label>
              <Select
                value={formData.groupBy}
                onValueChange={(value) => setFormData({ ...formData, groupBy: value })}
              >
                <SelectTrigger id="groupBy">
                  <SelectValue placeholder="No grouping" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No grouping</SelectItem>
                  {dataSourceFields[formData.dataSource]
                    .filter(field => field.type === "string")
                    .map(field => (
                      <SelectItem key={field.value} value={field.value}>
                        {field.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Filters</Label>
                <Button type="button" variant="outline" size="sm" onClick={addFilter}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Filter
                </Button>
              </div>
              {formData.filters.map((filter, index) => (
                <div key={index} className="flex items-end gap-2">
                  <div className="flex-1">
                    <Select
                      value={filter.field}
                      onValueChange={(value) => updateFilter(index, "field", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        {dataSourceFields[formData.dataSource].map(field => (
                          <SelectItem key={field.value} value={field.value}>
                            {field.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-32">
                    <Select
                      value={filter.operator}
                      onValueChange={(value: any) => updateFilter(index, "operator", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">Equals</SelectItem>
                        <SelectItem value="not_equals">Not Equals</SelectItem>
                        <SelectItem value="greater_than">Greater Than</SelectItem>
                        <SelectItem value="less_than">Less Than</SelectItem>
                        <SelectItem value="contains">Contains</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Input
                      placeholder="Value"
                      value={filter.value}
                      onChange={(e) => updateFilter(index, "value", e.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFilter(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="chartType">Display Type</Label>
                <Select
                  value={formData.chartType}
                  onValueChange={(value: any) => setFormData({ ...formData, chartType: value })}
                >
                  <SelectTrigger id="chartType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="line">Line Chart</SelectItem>
                    <SelectItem value="bar">Bar Chart</SelectItem>
                    <SelectItem value="pie">Pie Chart</SelectItem>
                    <SelectItem value="donut">Donut Chart</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="color">Color</Label>
                <Select
                  value={formData.color}
                  onValueChange={(value) => setFormData({ ...formData, color: value })}
                >
                  <SelectTrigger id="color">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map(color => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded ${color.className}`} />
                          {color.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="icon">Icon</Label>
                <Select
                  value={formData.icon}
                  onValueChange={(value) => setFormData({ ...formData, icon: value })}
                >
                  <SelectTrigger id="icon">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map(option => {
                      const Icon = option.icon
                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {option.label}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPublic"
                checked={formData.isPublic}
                onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked as boolean })}
              />
              <Label htmlFor="isPublic" className="text-sm font-normal">
                Make this metric visible to all users
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setCreateDialogOpen(false)
              setEditDialogOpen(false)
              resetForm()
            }}>
              Cancel
            </Button>
            <Button
              onClick={createDialogOpen ? handleCreateMetric : handleUpdateMetric}
              disabled={!formData.name || (formData.aggregation !== "count" && !formData.field)}
            >
              {createDialogOpen ? "Create" : "Update"} Metric
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Metric</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedMetric?.name}"? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteMetric}>
              Delete Metric
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}