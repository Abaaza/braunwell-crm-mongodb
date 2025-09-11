"use client"

import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
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
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth"
import { formatDate, formatFileSize } from "@/lib/utils"
import { 
  Download,
  FileText,
  FileSpreadsheet,
  File,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  RefreshCw,
  Trash2,
  ExternalLink,
  Settings,
  Filter,
  MoreVertical
} from "lucide-react"

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dashboardId?: string
  dashboardName: string
}

const EXPORT_FORMATS = [
  { id: "pdf", name: "PDF", icon: FileText, description: "Best for sharing and printing" },
  { id: "excel", name: "Excel", icon: FileSpreadsheet, description: "Best for data analysis" },
  { id: "csv", name: "CSV", icon: File, description: "Best for data import/export" },
  { id: "json", name: "JSON", icon: File, description: "Best for developers" },
] as const

const DATE_RANGE_OPTIONS = [
  { id: "today", name: "Today" },
  { id: "week", name: "This Week" },
  { id: "month", name: "This Month" },
  { id: "quarter", name: "This Quarter" },
  { id: "year", name: "This Year" },
  { id: "all", name: "All Time" },
] as const

const STATUS_ICONS = {
  pending: Clock,
  processing: RefreshCw,
  completed: CheckCircle,
  failed: XCircle,
}

const STATUS_COLORS = {
  pending: "text-yellow-600 bg-yellow-100",
  processing: "text-blue-600 bg-blue-100",
  completed: "text-green-600 bg-green-100",
  failed: "text-red-600 bg-red-100",
}

export function ExportDialog({ open, onOpenChange, dashboardId, dashboardName }: ExportDialogProps) {
  const { user } = useAuth()
  const [selectedFormat, setSelectedFormat] = useState<string>("pdf")
  const [dateRange, setDateRange] = useState<string>("month")
  const [includeCharts, setIncludeCharts] = useState(true)
  const [includeData, setIncludeData] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  // API calls
  const exports = useQuery(api.reportExports.list, user?.id ? {
    userId: user.id,
    ...(dashboardId && { dashboardId: dashboardId as Id<"dashboards"> }),
  } : "skip")
  const createExport = useMutation(api.reportExports.create)
  const deleteExport = useMutation(api.reportExports.remove)
  const processExport = useMutation(api.reportExports.processExport)

  const handleStartExport = async () => {
    if (!user) return
    if (!dashboardId) {
      toast.error("Dashboard ID is required for export")
      return
    }

    try {
      setIsExporting(true)
      
      const exportId = await createExport({
        dashboardId: dashboardId as Id<"dashboards">,
        format: selectedFormat as any,
        parameters: {
          dateRange,
          includeCharts,
          includeData,
        },
        userId: user.id,
      })

      // Start processing the export
      await processExport({ id: exportId })
      
      toast.success("Export started successfully")
      
      // Reset form
      setSelectedFormat("pdf")
      setDateRange("month")
      setIncludeCharts(true)
      setIncludeData(true)
    } catch (error) {
      toast.error("Failed to start export")
    } finally {
      setIsExporting(false)
    }
  }

  const handleDeleteExport = async (exportId: string) => {
    if (!user) return

    try {
      await deleteExport({
        id: exportId as Id<"reportExports">,
        userId: user.id,
      })
      toast.success("Export deleted successfully")
    } catch (error) {
      toast.error("Failed to delete export")
    }
  }

  const handleDownload = (exportRecord: any) => {
    if (exportRecord.status === "completed" && exportRecord.fileUrl) {
      window.open(exportRecord.fileUrl, "_blank")
    } else {
      toast.error("Export is not ready for download")
    }
  }

  const selectedFormatData = EXPORT_FORMATS.find(f => f.id === selectedFormat)
  const FormatIcon = selectedFormatData?.icon || FileText

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Export Dashboard</DialogTitle>
          <DialogDescription>
            Export "{dashboardName}" in your preferred format
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Export Configuration */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Export Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="format">Format</Label>
                  <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPORT_FORMATS.map(format => {
                        const Icon = format.icon
                        return (
                          <SelectItem key={format.id} value={format.id}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              <div>
                                <div className="font-medium">{format.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {format.description}
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date-range">Date Range</Label>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DATE_RANGE_OPTIONS.map(option => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Include in Export</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="include-charts"
                        checked={includeCharts}
                        onCheckedChange={(checked) => setIncludeCharts(checked as boolean)}
                      />
                      <Label htmlFor="include-charts" className="text-sm font-normal">
                        Include charts and visualizations
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="include-data"
                        checked={includeData}
                        onCheckedChange={(checked) => setIncludeData(checked as boolean)}
                      />
                      <Label htmlFor="include-data" className="text-sm font-normal">
                        Include raw data tables
                      </Label>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleStartExport}
                  disabled={isExporting}
                  className="w-full"
                >
                  {isExporting ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Starting Export...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Start Export
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Export History */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Export History</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {exports === undefined ? (
                      // Loading state
                      Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex items-center space-x-3 p-3 border rounded-lg">
                          <Skeleton className="h-8 w-8 rounded" />
                          <div className="flex-1 space-y-1">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                          <Skeleton className="h-6 w-16" />
                        </div>
                      ))
                    ) : exports.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Download className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No exports yet</p>
                        <p className="text-sm">Your exports will appear here</p>
                      </div>
                    ) : (
                      exports.map(exportRecord => {
                        const StatusIcon = STATUS_ICONS[exportRecord.status]
                        const formatData = EXPORT_FORMATS.find(f => f.id === exportRecord.format)
                        const FormatIcon = formatData?.icon || FileText

                        return (
                          <div
                            key={exportRecord._id}
                            className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex-shrink-0">
                              <FormatIcon className="h-8 w-8 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium truncate">
                                  {exportRecord.fileName}
                                </p>
                                <Badge 
                                  variant="secondary" 
                                  className={`text-xs ${STATUS_COLORS[exportRecord.status]}`}
                                >
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {exportRecord.status}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(exportRecord.createdAt)}
                                </p>
                                {exportRecord.fileSize && (
                                  <>
                                    <span className="text-xs text-muted-foreground">•</span>
                                    <p className="text-xs text-muted-foreground">
                                      {formatFileSize(exportRecord.fileSize)}
                                    </p>
                                  </>
                                )}
                              </div>
                              {exportRecord.status === "processing" && (
                                <Progress value={65} className="mt-2 h-1" />
                              )}
                              {exportRecord.status === "failed" && exportRecord.errorMessage && (
                                <p className="text-xs text-destructive mt-1">
                                  {exportRecord.errorMessage}
                                </p>
                              )}
                            </div>
                            <div className="flex-shrink-0">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {exportRecord.status === "completed" && (
                                    <DropdownMenuItem onClick={() => handleDownload(exportRecord)}>
                                      <Download className="h-4 w-4 mr-2" />
                                      Download
                                    </DropdownMenuItem>
                                  )}
                                  {exportRecord.status === "completed" && exportRecord.fileUrl && (
                                    <DropdownMenuItem onClick={() => window.open(exportRecord.fileUrl, "_blank")}>
                                      <ExternalLink className="h-4 w-4 mr-2" />
                                      Open in New Tab
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteExport(exportRecord._id)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}