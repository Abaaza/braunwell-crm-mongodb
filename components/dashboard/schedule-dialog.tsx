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
import { Switch } from "@/components/ui/switch"
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
import { formatDate } from "@/lib/utils"
import { 
  Clock,
  Plus,
  Calendar,
  Mail,
  Users,
  Edit3,
  Trash2,
  MoreVertical,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  FileSpreadsheet,
  File
} from "lucide-react"

interface ScheduleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dashboardId?: string
  dashboardName: string
}

const FREQUENCY_OPTIONS = [
  { id: "daily", name: "Daily", description: "Every day at the specified time" },
  { id: "weekly", name: "Weekly", description: "Every week on the selected day" },
  { id: "monthly", name: "Monthly", description: "Every month on the selected date" },
  { id: "quarterly", name: "Quarterly", description: "Every quarter on the selected date" },
] as const

const DAYS_OF_WEEK = [
  { id: 0, name: "Sunday" },
  { id: 1, name: "Monday" },
  { id: 2, name: "Tuesday" },
  { id: 3, name: "Wednesday" },
  { id: 4, name: "Thursday" },
  { id: 5, name: "Friday" },
  { id: 6, name: "Saturday" },
] as const

const FORMAT_OPTIONS = [
  { id: "pdf", name: "PDF", icon: FileText },
  { id: "excel", name: "Excel", icon: FileSpreadsheet },
  { id: "csv", name: "CSV", icon: File },
] as const

const TIMEZONES = [
  { id: "UTC", name: "UTC" },
  { id: "America/New_York", name: "Eastern Time" },
  { id: "America/Chicago", name: "Central Time" },
  { id: "America/Denver", name: "Mountain Time" },
  { id: "America/Los_Angeles", name: "Pacific Time" },
  { id: "Europe/London", name: "London Time" },
  { id: "Europe/Paris", name: "Central European Time" },
  { id: "Asia/Tokyo", name: "Tokyo Time" },
] as const

export function ScheduleDialog({ open, onOpenChange, dashboardId, dashboardName }: ScheduleDialogProps) {
  const { user } = useAuth()
  const [isCreateMode, setIsCreateMode] = useState(false)
  
  // Form state
  const [scheduleName, setScheduleName] = useState("")
  const [scheduleDescription, setScheduleDescription] = useState("")
  const [frequency, setFrequency] = useState<string>("weekly")
  const [dayOfWeek, setDayOfWeek] = useState<number>(1) // Monday
  const [dayOfMonth, setDayOfMonth] = useState<number>(1)
  const [time, setTime] = useState("09:00")
  const [timezone, setTimezone] = useState("UTC")
  const [format, setFormat] = useState<string>("pdf")
  const [recipients, setRecipients] = useState<Array<{ email: string; name?: string; type: "user" | "external" }>>([])
  const [newRecipientEmail, setNewRecipientEmail] = useState("")
  const [newRecipientName, setNewRecipientName] = useState("")

  // API calls
  const scheduledReports = useQuery(api.scheduledReports.list, user?.id ? {
    userId: user.id,
    ...(dashboardId && { dashboardId: dashboardId as Id<"dashboards"> }),
  } : "skip")
  const createScheduledReport = useMutation(api.scheduledReports.create)
  const updateScheduledReport = useMutation(api.scheduledReports.update)
  const deleteScheduledReport = useMutation(api.scheduledReports.remove)
  const toggleActiveReport = useMutation(api.scheduledReports.toggleActive)

  const handleCreateSchedule = async () => {
    if (!user || !scheduleName || recipients.length === 0) {
      toast.error("Please provide a name and at least one recipient")
      return
    }
    if (!dashboardId) {
      toast.error("Dashboard ID is required for scheduled reports")
      return
    }

    try {
      await createScheduledReport({
        name: scheduleName,
        description: scheduleDescription || undefined,
        dashboardId: dashboardId as Id<"dashboards">,
        schedule: {
          frequency: frequency as any,
          dayOfWeek: frequency === "weekly" ? dayOfWeek : undefined,
          dayOfMonth: frequency === "monthly" || frequency === "quarterly" ? dayOfMonth : undefined,
          time,
          timezone,
        },
        recipients,
        format: format as any,
        userId: user.id,
      })

      toast.success("Scheduled report created successfully")
      resetForm()
      setIsCreateMode(false)
    } catch (error) {
      toast.error("Failed to create scheduled report")
    }
  }

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!user) return

    try {
      await deleteScheduledReport({
        id: scheduleId as Id<"scheduledReports">,
        userId: user.id,
      })
      toast.success("Scheduled report deleted successfully")
    } catch (error) {
      toast.error("Failed to delete scheduled report")
    }
  }

  const handleToggleActive = async (scheduleId: string) => {
    if (!user) return

    try {
      await toggleActiveReport({
        id: scheduleId as Id<"scheduledReports">,
        userId: user.id,
      })
      toast.success("Scheduled report updated successfully")
    } catch (error) {
      toast.error("Failed to update scheduled report")
    }
  }

  const handleAddRecipient = () => {
    if (!newRecipientEmail) return

    const newRecipient = {
      email: newRecipientEmail,
      name: newRecipientName || undefined,
      type: "external" as const,
    }

    setRecipients([...recipients, newRecipient])
    setNewRecipientEmail("")
    setNewRecipientName("")
  }

  const handleRemoveRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index))
  }

  const resetForm = () => {
    setScheduleName("")
    setScheduleDescription("")
    setFrequency("weekly")
    setDayOfWeek(1)
    setDayOfMonth(1)
    setTime("09:00")
    setTimezone("UTC")
    setFormat("pdf")
    setRecipients([])
    setNewRecipientEmail("")
    setNewRecipientName("")
  }

  const getNextSendTime = (schedule: any) => {
    if (schedule.nextSendAt) {
      return new Date(schedule.nextSendAt).toLocaleDateString() + " at " + new Date(schedule.nextSendAt).toLocaleTimeString()
    }
    return "Not scheduled"
  }

  const getScheduleDescription = (schedule: any) => {
    const freq = schedule.schedule.frequency
    const time = schedule.schedule.time
    
    switch (freq) {
      case "daily":
        return `Daily at ${time}`
      case "weekly":
        const dayName = DAYS_OF_WEEK.find(d => d.id === schedule.schedule.dayOfWeek)?.name || "Unknown"
        return `Weekly on ${dayName} at ${time}`
      case "monthly":
        return `Monthly on day ${schedule.schedule.dayOfMonth} at ${time}`
      case "quarterly":
        return `Quarterly on day ${schedule.schedule.dayOfMonth} at ${time}`
      default:
        return "Custom schedule"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Scheduled Reports</DialogTitle>
          <DialogDescription>
            Automatically send "{dashboardName}" reports to recipients
          </DialogDescription>
        </DialogHeader>
        
        {!isCreateMode ? (
          // List Mode
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Active Schedules</h3>
              <Button onClick={() => setIsCreateMode(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Schedule
              </Button>
            </div>

            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {scheduledReports === undefined ? (
                  // Loading state
                  Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-48" />
                          </div>
                          <Skeleton className="h-8 w-16" />
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : scheduledReports.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No scheduled reports yet</p>
                    <p className="text-sm">Create your first automated report</p>
                  </div>
                ) : (
                  scheduledReports.map(schedule => {
                    const formatData = FORMAT_OPTIONS.find(f => f.id === schedule.format)
                    const FormatIcon = formatData?.icon || FileText

                    return (
                      <Card key={schedule._id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <FormatIcon className="h-5 w-5 text-primary mt-0.5" />
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium">{schedule.name}</h4>
                                  <Badge 
                                    variant={schedule.isActive ? "default" : "secondary"}
                                    className="text-xs"
                                  >
                                    {schedule.isActive ? "Active" : "Inactive"}
                                  </Badge>
                                  {schedule.errorCount && schedule.errorCount > 0 && (
                                    <Badge variant="destructive" className="text-xs">
                                      <AlertTriangle className="h-3 w-3 mr-1" />
                                      {schedule.errorCount} errors
                                    </Badge>
                                  )}
                                </div>
                                {schedule.description && (
                                  <p className="text-sm text-muted-foreground">{schedule.description}</p>
                                )}
                                <div className="text-xs text-muted-foreground space-y-1">
                                  <p>{getScheduleDescription(schedule)}</p>
                                  <p>Next send: {getNextSendTime(schedule)}</p>
                                  <p>{schedule.recipients.length} recipient(s)</p>
                                  {schedule.lastSentAt && (
                                    <p>Last sent: {formatDate(schedule.lastSentAt)}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={schedule.isActive}
                                onCheckedChange={() => handleToggleActive(schedule._id)}
                              />
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Edit3 className="h-4 w-4 mr-2" />
                                    Edit Schedule
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Mail className="h-4 w-4 mr-2" />
                                    Test Send
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteSchedule(schedule._id)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })
                )}
              </div>
            </ScrollArea>
          </div>
        ) : (
          // Create Mode
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Create New Schedule</h3>
              <Button variant="outline" onClick={() => setIsCreateMode(false)}>
                Back to List
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Schedule Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="schedule-name">Schedule Name</Label>
                      <Input
                        id="schedule-name"
                        value={scheduleName}
                        onChange={(e) => setScheduleName(e.target.value)}
                        placeholder="Weekly Sales Report"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="schedule-description">Description (Optional)</Label>
                      <Textarea
                        id="schedule-description"
                        value={scheduleDescription}
                        onChange={(e) => setScheduleDescription(e.target.value)}
                        placeholder="Automated weekly sales dashboard..."
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="frequency">Frequency</Label>
                      <Select value={frequency} onValueChange={setFrequency}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FREQUENCY_OPTIONS.map(option => (
                            <SelectItem key={option.id} value={option.id}>
                              <div>
                                <div className="font-medium">{option.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {option.description}
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {frequency === "weekly" && (
                      <div className="space-y-2">
                        <Label htmlFor="day-of-week">Day of Week</Label>
                        <Select value={dayOfWeek.toString()} onValueChange={(value) => setDayOfWeek(Number(value))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DAYS_OF_WEEK.map(day => (
                              <SelectItem key={day.id} value={day.id.toString()}>
                                {day.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {(frequency === "monthly" || frequency === "quarterly") && (
                      <div className="space-y-2">
                        <Label htmlFor="day-of-month">Day of Month</Label>
                        <Input
                          id="day-of-month"
                          type="number"
                          min="1"
                          max="31"
                          value={dayOfMonth}
                          onChange={(e) => setDayOfMonth(Number(e.target.value))}
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="time">Time</Label>
                        <Input
                          id="time"
                          type="time"
                          value={time}
                          onChange={(e) => setTime(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="timezone">Timezone</Label>
                        <Select value={timezone} onValueChange={setTimezone}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TIMEZONES.map(tz => (
                              <SelectItem key={tz.id} value={tz.id}>
                                {tz.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="format">Export Format</Label>
                      <Select value={format} onValueChange={setFormat}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FORMAT_OPTIONS.map(option => {
                            const Icon = option.icon
                            return (
                              <SelectItem key={option.id} value={option.id}>
                                <div className="flex items-center gap-2">
                                  <Icon className="h-4 w-4" />
                                  {option.name}
                                </div>
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Recipients</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="recipient-email">Add Recipient</Label>
                        <div className="flex gap-2">
                          <Input
                            id="recipient-email"
                            type="email"
                            placeholder="email@example.com"
                            value={newRecipientEmail}
                            onChange={(e) => setNewRecipientEmail(e.target.value)}
                            className="flex-1"
                          />
                          <Button onClick={handleAddRecipient} disabled={!newRecipientEmail}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="recipient-name">Name (Optional)</Label>
                        <Input
                          id="recipient-name"
                          placeholder="John Doe"
                          value={newRecipientName}
                          onChange={(e) => setNewRecipientName(e.target.value)}
                        />
                      </div>
                    </div>

                    {recipients.length > 0 && (
                      <div className="space-y-2">
                        <Label>Recipients ({recipients.length})</Label>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {recipients.map((recipient, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                              <div>
                                <div className="text-sm font-medium">{recipient.email}</div>
                                {recipient.name && (
                                  <div className="text-xs text-muted-foreground">{recipient.name}</div>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveRecipient(index)}
                                className="h-6 w-6"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateMode(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateSchedule} disabled={!scheduleName || recipients.length === 0}>
                Create Schedule
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}