"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { formatDate, cn } from "@/lib/utils"
import {
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Flag,
  Milestone,
  Users,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Id } from "@/convex/_generated/dataModel"

interface TimelineProps {
  projectId: Id<"projects">
  startDate?: number
  endDate?: number
}

type TimelineItem = {
  id: string
  type: "task" | "payment" | "milestone"
  title: string
  date: number
  status?: string
  priority?: string
  assignee?: string
  amount?: number
}

export function ProjectTimeline({ projectId, startDate, endDate }: TimelineProps) {
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month")
  const [currentDate, setCurrentDate] = useState(new Date())
  
  const tasks = useQuery(api.tasks.listByProject, { projectId })
  const payments = useQuery(api.projectPayments.list, { projectId })
  
  if (!tasks || !payments) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    )
  }

  // Combine all timeline items
  const timelineItems: TimelineItem[] = [
    ...tasks.map(task => ({
      id: task._id,
      type: "task" as const,
      title: task.title,
      date: task.dueDate || task.createdAt,
      status: task.status,
      priority: task.priority,
      assignee: task.assigneeName,
    })),
    ...payments.map(payment => ({
      id: payment.id,
      type: "payment" as const,
      title: `Payment Received`,
      date: payment.date,
      amount: payment.amount,
    })),
  ].sort((a, b) => a.date - b.date)

  // Calculate date range
  const projectStart = startDate || Math.min(...timelineItems.map(item => item.date))
  const projectEnd = endDate || Math.max(...timelineItems.map(item => item.date))
  const totalDays = Math.ceil((projectEnd - projectStart) / (1000 * 60 * 60 * 24))

  // Group items by date
  const itemsByDate = timelineItems.reduce((acc, item) => {
    const dateKey = new Date(item.date).toDateString()
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push(item)
    return acc
  }, {} as Record<string, TimelineItem[]>)

  const getItemIcon = (item: TimelineItem) => {
    if (item.type === "payment") {
      return <CheckCircle2 className="h-4 w-4 text-green-600" />
    }
    if (item.type === "milestone") {
      return <Milestone className="h-4 w-4 text-purple-600" />
    }
    
    // Task icon based on status
    if (item.status === "done") {
      return <CheckCircle2 className="h-4 w-4 text-green-600" />
    }
    if (item.status === "in_progress") {
      return <Clock className="h-4 w-4 text-blue-600" />
    }
    return <Circle className="h-4 w-4 text-gray-400" />
  }

  const getItemColor = (item: TimelineItem) => {
    if (item.type === "payment") return "bg-green-100 border-green-300"
    if (item.type === "milestone") return "bg-purple-100 border-purple-300"
    
    if (item.priority === "high") return "bg-red-100 border-red-300"
    if (item.priority === "medium") return "bg-yellow-100 border-yellow-300"
    if (item.status === "done") return "bg-green-100 border-green-300"
    if (item.status === "in_progress") return "bg-blue-100 border-blue-300"
    
    return "bg-gray-100 border-gray-300"
  }

  const navigateTimeline = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate)
    if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1))
    } else if (viewMode === "week") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7))
    } else {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1))
    }
    setCurrentDate(newDate)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Project Timeline</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateTimeline("prev")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[120px] text-center">
              {currentDate.toLocaleDateString('en-GB', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateTimeline("next")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full">
          <div className="relative min-h-[300px]">
            {/* Timeline line */}
            <div className="absolute top-12 left-0 right-0 h-0.5 bg-border" />
            
            {/* Timeline items */}
            <div className="relative pt-20">
              {Object.entries(itemsByDate).map(([dateKey, items]) => {
                const date = new Date(dateKey)
                const daysSinceStart = Math.floor((date.getTime() - projectStart) / (1000 * 60 * 60 * 24))
                const leftPosition = (daysSinceStart / totalDays) * 100
                
                return (
                  <div
                    key={dateKey}
                    className="absolute"
                    style={{ left: `${leftPosition}%` }}
                  >
                    {/* Date marker */}
                    <div className="absolute -top-20 left-1/2 -translate-x-1/2">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <div className="h-12 w-0.5 bg-border" />
                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                          {date.toLocaleDateString('en-GB', { 
                            day: 'numeric',
                            month: 'short' 
                          })}
                        </div>
                      </div>
                    </div>
                    
                    {/* Items for this date */}
                    <div className="space-y-2 pt-2">
                      {items.map((item, index) => (
                        <div
                          key={item.id}
                          className={cn(
                            "p-2 rounded-lg border text-xs max-w-[200px]",
                            getItemColor(item)
                          )}
                          style={{ marginTop: index * 40 }}
                        >
                          <div className="flex items-start gap-2">
                            {getItemIcon(item)}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{item.title}</p>
                              {item.type === "task" && item.assignee && (
                                <p className="text-muted-foreground flex items-center gap-1 mt-1">
                                  <Users className="h-3 w-3" />
                                  {item.assignee}
                                </p>
                              )}
                              {item.type === "payment" && item.amount && (
                                <p className="font-medium text-green-700 mt-1">
                                  £{(item.amount / 1000).toFixed(1)}k
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        
        {/* Legend */}
        <div className="flex items-center gap-4 mt-6 pt-4 border-t text-xs">
          <div className="flex items-center gap-2">
            <Circle className="h-3 w-3 text-gray-400" />
            <span>To Do</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3 text-blue-600" />
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3 w-3 text-green-600" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-600" />
            <span>Payment</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}