"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend,
  Tooltip 
} from "recharts"
import { formatCurrency } from "@/lib/utils"

const COLORS = {
  open: "#3b82f6",
  closed: "#10b981",
}

export function ProjectStatusChart() {
  const metrics = useQuery(api.analytics.getMetrics, {})
  
  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Projects by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    )
  }

  const data = [
    {
      name: "Open Projects",
      value: metrics.projects.open,
      revenue: metrics.revenue.open,
    },
    {
      name: "Closed Projects",
      value: metrics.projects.closed,
      revenue: metrics.revenue.closed,
    },
  ]

  const customTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-sm">Count: {payload[0].value}</p>
          <p className="text-sm text-primary">
            Revenue: {formatCurrency(payload[0].payload.revenue)}
          </p>
        </div>
      )
    }
    return null
  }

  const renderCustomLabel = (entry: any) => {
    const total = data.reduce((sum, item) => sum + item.value, 0)
    const percentage = ((entry.value / total) * 100).toFixed(0)
    return `${entry.value} (${percentage}%)`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Projects by Status</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.name.includes("Open") ? COLORS.open : COLORS.closed} 
                />
              ))}
            </Pie>
            <Tooltip content={customTooltip} />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value) => value}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}