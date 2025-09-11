"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { formatCurrency, cn } from "@/lib/utils"
import { useCachedAnalytics, useCachedCustomMetrics, useCachedSavedReports } from "@/hooks/use-cached-queries"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  FolderOpen,
  CheckSquare,
  Users,
  Activity,
  FileDown,
  Calendar,
  BarChart3,
  PieChart,
  LineChart,
  Plus,
  Settings,
  Save,
  BookOpen,
  Star,
  Trash2,
  MoreVertical,
  FileText,
  Clock,
  Grid3X3,
  Share2,
  Edit3,
  Download,
} from "lucide-react"
import { 
  LazyRevenueChart as RevenueChart,
  LazyProjectStatusChart as ProjectStatusChart,
  LazyTaskCompletionChart as TaskCompletionChart,
  LazyContactGrowthChart as ContactGrowthChart,
} from "@/components/lazy/lazy-chart-components"
import { CustomMetricsDisplay } from "@/components/analytics/custom-metrics-display"
import { ExportDialog } from "@/components/dashboard/export-dialog"
import { ScheduleDialog } from "@/components/dashboard/schedule-dialog"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"

export default function AnalyticsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [dateRange, setDateRange] = useState("last30days")
  const [compareEnabled, setCompareEnabled] = useState(false)
  const [comparePeriod, setComparePeriod] = useState("previous")
  const [saveReportOpen, setSaveReportOpen] = useState(false)
  const [loadReportOpen, setLoadReportOpen] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
  const [reportName, setReportName] = useState("")
  const [reportDescription, setReportDescription] = useState("")
  const [reportIsPublic, setReportIsPublic] = useState(false)
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)
  
  const metrics = useCachedAnalytics(dateRange, compareEnabled ? comparePeriod : undefined)
  const customMetrics = user ? useCachedCustomMetrics(user.id) : undefined
  const savedReports = user ? useCachedSavedReports(user.id) : undefined
  const defaultReport = useQuery(api.savedReports.getDefault, user ? { userId: user.id } : "skip")
  const createReport = useMutation(api.savedReports.create)
  const updateReport = useMutation(api.savedReports.update)
  const deleteReport = useMutation(api.savedReports.remove)
  const setDefaultReport = useMutation(api.savedReports.setDefault)

  const MetricCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    color = "blue",
    format = "number"
  }: {
    title: string
    value: number | string
    change?: number
    icon: React.ComponentType<{ className?: string }>
    color?: "blue" | "green" | "yellow" | "red"
    format?: "number" | "currency" | "percentage"
  }) => {
    const colorClasses = {
      blue: "text-blue-600 bg-blue-100",
      green: "text-green-600 bg-green-100",
      yellow: "text-yellow-600 bg-yellow-100",
      red: "text-red-600 bg-red-100",
    }

    const formatValue = () => {
      if (format === "currency") return formatCurrency(Number(value))
      if (format === "percentage") return `${Number(value).toFixed(1)}%`
      return value.toString()
    }

    return (
      <Card variant="elevated" interactive className="transition-all duration-200 hover:scale-[1.01]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <div className={`rounded-lg p-2 ${colorClasses[color]}`}>
            <Icon className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatValue()}</div>
          {change !== undefined && (
            <div className="flex items-center pt-1">
              {change > 0 ? (
                <TrendingUp className="mr-1 h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="mr-1 h-4 w-4 text-red-600" />
              )}
              <span className={`text-xs ${change > 0 ? "text-green-600" : "text-red-600"}`}>
                {Math.abs(change)}% from last period
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const ChartPlaceholder = ({ title, type }: { title: string; type: "line" | "bar" | "pie" }) => {
    const ChartIcon = type === "line" ? LineChart : type === "bar" ? BarChart3 : PieChart
    
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center rounded-lg border-2 border-dashed border-muted">
            <div className="text-center">
              <ChartIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                Chart visualization placeholder
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Load default report on mount
  useEffect(() => {
    if (defaultReport && !selectedReportId) {
      loadReport(defaultReport)
    }
  }, [defaultReport])

  const handleSaveReport = async () => {
    if (!user || !reportName) return

    try {
      // Get current page configuration
      const configuration = {
        dateRange,
        metrics: customMetrics?.map(m => m._id),
        // Add other configuration options as needed
      }

      await createReport({
        name: reportName,
        description: reportDescription || undefined,
        type: "dashboard" as const,
        configuration,
        isPublic: reportIsPublic,
        userId: user.id,
      })

      toast.success("Report saved successfully")
      setSaveReportOpen(false)
      setReportName("")
      setReportDescription("")
      setReportIsPublic(false)
    } catch (error) {
      toast.error("Failed to save report")
    }
  }

  const loadReport = (report: any) => {
    // Apply report configuration
    if (report.configuration.dateRange) {
      setDateRange(report.configuration.dateRange)
    }
    // Add loading of other configuration options as implemented
    setSelectedReportId(report._id)
    toast.success(`Loaded report: ${report.name}`)
  }

  const handleSetDefault = async (reportId: string) => {
    if (!user) return

    try {
      await setDefaultReport({
        id: reportId as Id<"savedReports">,
        userId: user.id,
      })
      toast.success("Default report updated")
    } catch (error) {
      toast.error("Failed to set default report")
    }
  }

  const handleDeleteReport = async (reportId: string) => {
    if (!user) return

    try {
      await deleteReport({
        id: reportId as Id<"savedReports">,
        userId: user.id,
      })
      toast.success("Report deleted")
      if (selectedReportId === reportId) {
        setSelectedReportId(null)
      }
    } catch (error) {
      toast.error("Failed to delete report")
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Analytics"
        description="Track performance and insights"
      >
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Grid3X3 className="mr-2 h-4 w-4" />
                Dashboards
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => router.push('/analytics/builder')}>
                <Plus className="mr-2 h-4 w-4" />
                Create Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/analytics/templates')}>
                <FileText className="mr-2 h-4 w-4" />
                Browse Templates
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setLoadReportOpen(true)}>
                <BookOpen className="mr-2 h-4 w-4" />
                Load Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSaveReportOpen(true)}>
                <Save className="mr-2 h-4 w-4" />
                Save Current View
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {savedReports && savedReports.length > 0 ? (
                <>
                  <div className="px-2 py-1.5 text-sm font-semibold">Recent Dashboards</div>
                  {savedReports.slice(0, 5).map((report) => (
                    <DropdownMenuItem
                      key={report._id}
                      onClick={() => loadReport(report)}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="truncate">{report.name}</span>
                        {report.isDefault && <Star className="h-3 w-3 text-yellow-500" />}
                      </div>
                    </DropdownMenuItem>
                  ))}
                </>
              ) : (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">No saved dashboards</div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setExportDialogOpen(true)}>
                <FileDown className="mr-2 h-4 w-4" />
                Export Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setScheduleDialogOpen(true)}>
                <Clock className="mr-2 h-4 w-4" />
                Schedule Reports
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Link href="/analytics/metrics">
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Custom Metrics
            </Button>
          </Link>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[200px] glass">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="last7days">Last 7 days</SelectItem>
              <SelectItem value="last30days">Last 30 days</SelectItem>
              <SelectItem value="last3months">Last 3 months</SelectItem>
              <SelectItem value="last6months">Last 6 months</SelectItem>
              <SelectItem value="lastyear">Last year</SelectItem>
              <SelectItem value="thismonth">This month</SelectItem>
              <SelectItem value="lastmonth">Last month</SelectItem>
              <SelectItem value="thisquarter">This quarter</SelectItem>
              <SelectItem value="lastquarter">Last quarter</SelectItem>
              <SelectItem value="thisyear">This year</SelectItem>
            </SelectContent>
          </Select>
          {compareEnabled && (
            <Select value={comparePeriod} onValueChange={setComparePeriod}>
              <SelectTrigger className="w-[180px] glass">
                <SelectValue placeholder="Compare with" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="previous">Previous period</SelectItem>
                <SelectItem value="yearAgo">Year ago</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Button
            variant={compareEnabled ? "default" : "outline"}
            onClick={() => setCompareEnabled(!compareEnabled)}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Compare
          </Button>
          <Button variant="outline">
            <FileDown className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </PageHeader>

      {/* Comparison indicator */}
      {compareEnabled && metrics?.comparisonPeriod && (
        <div className="bg-muted/50 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BarChart3 className="h-4 w-4" />
            <span>
              Comparing {dateRange} with {comparePeriod === "previous" ? "previous period" : "same period last year"}
            </span>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics ? (
          <>
            <MetricCard
              title="Total Revenue"
              value={metrics.revenue.total}
              change={metrics.revenue.change}
              icon={DollarSign}
              color="green"
              format="currency"
            />
            <MetricCard
              title="Active Projects"
              value={metrics.projects.open}
              change={metrics.projects.change}
              icon={FolderOpen}
              color="blue"
            />
            <MetricCard
              title="Task Completion"
              value={metrics.tasks.completionRate}
              change={metrics.tasks.completionRateChange}
              icon={CheckSquare}
              color="yellow"
              format="percentage"
            />
            <MetricCard
              title="Total Contacts"
              value={metrics.contacts.total}
              change={metrics.contacts.change}
              icon={Users}
              color="red"
            />
          </>
        ) : (
          <>
            <Skeleton className="h-32 animate-shimmer" />
            <Skeleton className="h-32 animate-shimmer" style={{animationDelay: '150ms'}} />
            <Skeleton className="h-32 animate-shimmer" style={{animationDelay: '300ms'}} />
            <Skeleton className="h-32 animate-shimmer" style={{animationDelay: '450ms'}} />
          </>
        )}
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueChart dateRange={dateRange} />
        <ProjectStatusChart />
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-3">
        <TaskCompletionChart />
        <ContactGrowthChart dateRange={dateRange} />
        <Card variant="elevated" interactive>
          <CardHeader>
            <CardTitle>Task Priority Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <span className="text-sm">High Priority</span>
                  </div>
                  <span className="text-sm font-medium">{metrics.tasks.byPriority.high}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-yellow-500" />
                    <span className="text-sm">Medium Priority</span>
                  </div>
                  <span className="text-sm font-medium">{metrics.tasks.byPriority.medium}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-gray-500" />
                    <span className="text-sm">Low Priority</span>
                  </div>
                  <span className="text-sm font-medium">{metrics.tasks.byPriority.low}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-gray-300" />
                    <span className="text-sm">No Priority</span>
                  </div>
                  <span className="text-sm font-medium">{metrics.tasks.byPriority.none}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Custom Metrics */}
      {user && <CustomMetricsDisplay userId={user.id} dateRange={dateRange} />}

      {/* Top Projects Table */}
      <Card variant="elevated" interactive>
        <CardHeader>
          <CardTitle>Top Projects by Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          {metrics ? (
            <div className="space-y-4">
              {metrics.topProjects.map((project, index) => (
                <div key={project._id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium">{project.name}</p>
                      <Badge variant={project.status === "open" ? "default" : "success"}>
                        {project.status}
                      </Badge>
                    </div>
                  </div>
                  <span className="font-semibold">{formatCurrency(project.revenue)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full animate-shimmer" style={{animationDelay: `${i * 100}ms`}} />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card variant="elevated" interactive>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Activity Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metrics ? (
              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Activities last month</span>
                  <span className="font-medium">{metrics.activity.lastMonth}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">New projects</span>
                  <span className="font-medium">{metrics.projects.lastMonth}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">New contacts</span>
                  <span className="font-medium">{metrics.contacts.lastMonth}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Contact growth rate</span>
                  <span className="font-medium">{metrics.contacts.growthRate.toFixed(1)}%</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card variant="elevated" interactive>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Revenue Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metrics ? (
              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Open projects</span>
                  <span className="font-medium">{formatCurrency(metrics.revenue.open)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Closed projects</span>
                  <span className="font-medium">{formatCurrency(metrics.revenue.closed)}</span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Average project value</span>
                    <span className="font-medium">{formatCurrency(metrics.revenue.average)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card variant="elevated" interactive>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              Task Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metrics ? (
              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">To do</span>
                  <span className="font-medium">{metrics.tasks.todo}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">In progress</span>
                  <span className="font-medium">{metrics.tasks.inProgress}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Completed</span>
                  <span className="font-medium">{metrics.tasks.completed}</span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total tasks</span>
                    <span className="font-medium">{metrics.tasks.total}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Save Report Dialog */}
      <Dialog open={saveReportOpen} onOpenChange={setSaveReportOpen}>
        <DialogContent className="glass border-0">
          <DialogHeader>
            <DialogTitle>Save Report</DialogTitle>
            <DialogDescription>
              Save your current analytics view as a report for quick access later
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="report-name">Report Name</Label>
              <Input
                id="report-name"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                placeholder="e.g., Monthly Revenue Report"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="report-description">Description (Optional)</Label>
              <Textarea
                id="report-description"
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Describe what this report shows..."
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="report-public"
                checked={reportIsPublic}
                onCheckedChange={(checked) => setReportIsPublic(checked as boolean)}
                className="transition-all duration-200 hover:border-primary focus:ring-primary"
              />
              <Label htmlFor="report-public" className="text-sm font-normal">
                Make this report visible to all users
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveReportOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveReport} disabled={!reportName}>
              Save Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Report Dialog */}
      <Dialog open={loadReportOpen} onOpenChange={setLoadReportOpen}>
        <DialogContent className="max-w-2xl glass border-0">
          <DialogHeader>
            <DialogTitle>Load Report</DialogTitle>
            <DialogDescription>
              Select a saved report to load
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto py-4">
            {savedReports && savedReports.length > 0 ? (
              <div className="space-y-2">
                {savedReports.map((report) => (
                  <Card
                    key={report._id}
                    className={cn(
                      "cursor-pointer hover:bg-accent transition-colors",
                      selectedReportId === report._id && "ring-2 ring-primary"
                    )}
                    onClick={() => {
                      loadReport(report)
                      setLoadReportOpen(false)
                    }}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{report.name}</h3>
                            {report.isDefault && (
                              <Badge variant="secondary" className="text-xs">
                                <Star className="mr-1 h-3 w-3" />
                                Default
                              </Badge>
                            )}
                            {report.isPublic && (
                              <Badge variant="outline" className="text-xs">
                                Public
                              </Badge>
                            )}
                          </div>
                          {report.description && (
                            <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>By {report.creatorName}</span>
                            <span>•</span>
                            <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleSetDefault(report._id)
                              }}
                            >
                              <Star className="mr-2 h-4 w-4" />
                              Set as Default
                            </DropdownMenuItem>
                            {report.createdBy === user?.id && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteReport(report._id)
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No saved reports found
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLoadReportOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      {user && (
        <ExportDialog
          open={exportDialogOpen}
          onOpenChange={setExportDialogOpen}
          dashboardId={undefined}
          dashboardName="Analytics Dashboard"
        />
      )}

      {/* Schedule Dialog */}
      {user && (
        <ScheduleDialog
          open={scheduleDialogOpen}
          onOpenChange={setScheduleDialogOpen}
          dashboardId={undefined}
          dashboardName="Analytics Dashboard"
        />
      )}
    </div>
  )
}