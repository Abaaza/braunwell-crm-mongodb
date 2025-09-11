"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts"
import { format } from "date-fns"
import { formatCurrency } from "@/lib/utils"

export function RevenueTrackingChart() {
  const projects = useQuery(api.projects.list, {})
  
  if (!projects) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    )
  }

  // Calculate cumulative revenue over time
  const revenueData = projects
    .filter(p => p.status === 'closed' && p.expectedRevenueGBP)
    .sort((a, b) => a._creationTime - b._creationTime)
    .reduce((acc: any[], project) => {
      const monthKey = format(new Date(project._creationTime), 'MMM yyyy')
      const lastEntry = acc[acc.length - 1]
      const currentRevenue = project.expectedRevenueGBP || 0
      const cumulativeRevenue = (lastEntry?.cumulative || 0) + currentRevenue
      
      const existingMonth = acc.find(item => item.month === monthKey)
      
      if (existingMonth) {
        existingMonth.revenue += currentRevenue
        existingMonth.cumulative = cumulativeRevenue
      } else {
        acc.push({
          month: monthKey,
          revenue: currentRevenue,
          cumulative: cumulativeRevenue,
        })
      }
      
      return acc
    }, [])

  // Take last 12 months
  const displayData = revenueData.slice(-12)

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
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
        <CardTitle>Revenue Tracking</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={displayData}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="month" 
              className="text-xs"
              tick={{ fill: 'currentColor' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'currentColor' }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={customTooltip} />
            <Legend />
            <Area
              type="monotone"
              dataKey="revenue"
              name="Monthly Revenue"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorRevenue)"
            />
            <Area
              type="monotone"
              dataKey="cumulative"
              name="Cumulative Revenue"
              stroke="#10b981"
              fillOpacity={1}
              fill="url(#colorCumulative)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}