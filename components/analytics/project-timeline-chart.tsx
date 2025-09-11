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
  Legend,
  ResponsiveContainer 
} from "recharts"
import { format } from "date-fns"

export function ProjectTimelineChart() {
  const projects = useQuery(api.projects.list, {})
  
  if (!projects) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    )
  }

  // Group projects by month
  const monthlyData = projects.reduce((acc: any[], project) => {
    const monthKey = format(new Date(project._creationTime), 'MMM yyyy')
    const existingMonth = acc.find(item => item.month === monthKey)
    
    if (existingMonth) {
      if (project.status === 'open') {
        existingMonth.open += 1
      } else {
        existingMonth.closed += 1
      }
    } else {
      acc.push({
        month: monthKey,
        open: project.status === 'open' ? 1 : 0,
        closed: project.status === 'closed' ? 1 : 0,
      })
    }
    
    return acc
  }, [])

  // Sort by date and take last 6 months
  const sortedData = monthlyData
    .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
    .slice(-6)

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={sortedData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="month" 
              className="text-xs"
              tick={{ fill: 'currentColor' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'currentColor' }}
            />
            <Tooltip content={customTooltip} />
            <Legend />
            <Bar 
              dataKey="open" 
              name="Open Projects"
              fill="#3b82f6" 
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="closed" 
              name="Closed Projects"
              fill="#10b981" 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}