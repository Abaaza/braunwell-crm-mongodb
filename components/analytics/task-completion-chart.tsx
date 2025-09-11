"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  Cell 
} from "recharts"

export function TaskCompletionChart() {
  const metrics = useQuery(api.analytics.getMetrics, {})
  
  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Task Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    )
  }

  const data = [
    {
      status: "To Do",
      count: metrics.tasks.todo,
      fill: "#94a3b8",
    },
    {
      status: "In Progress",
      count: metrics.tasks.inProgress,
      fill: "#3b82f6",
    },
    {
      status: "Completed",
      count: metrics.tasks.completed,
      fill: "#10b981",
    },
  ]

  const customTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const percentage = ((payload[0].value / metrics.tasks.total) * 100).toFixed(1)
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium">{payload[0].payload.status}</p>
          <p className="text-sm">Count: {payload[0].value}</p>
          <p className="text-sm text-muted-foreground">{percentage}% of total</p>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Task Status Distribution</CardTitle>
        <div className="text-sm text-muted-foreground">
          Total: {metrics.tasks.total} tasks
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="status" 
              className="text-xs"
              tick={{ fill: 'currentColor' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'currentColor' }}
            />
            <Tooltip content={customTooltip} />
            <Bar 
              dataKey="count" 
              radius={[8, 8, 0, 0]}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-[#94a3b8]" />
            <span>To Do</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-[#3b82f6]" />
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-[#10b981]" />
            <span>Completed</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}