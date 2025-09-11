"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from "recharts"
import { formatCurrency } from "@/lib/utils"
import { TrendingUp, PoundSterling } from "lucide-react"
import { Id } from "@/convex/_generated/dataModel"

export function ProjectRevenueChart({ 
  projectId,
  expectedRevenue 
}: { 
  projectId: Id<"projects">
  expectedRevenue: number 
}) {
  const payments = useQuery(api.projectPayments.list, { projectId })
  
  if (!payments) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    )
  }

  // Calculate cumulative revenue over time
  const sortedPayments = [...payments].sort((a: any, b: any) => a.date - b.date)
  let cumulativeRevenue = 0
  const chartData = sortedPayments.map((payment: any) => {
    cumulativeRevenue += payment.amount
    return {
      date: new Date(payment.date).toLocaleDateString('en-GB', { 
        day: 'numeric', 
        month: 'short' 
      }),
      amount: payment.amount,
      cumulative: cumulativeRevenue,
      timestamp: payment.date
    }
  })

  // Add today's point if there are payments
  if (chartData.length > 0) {
    chartData.push({
      date: 'Today',
      amount: 0,
      cumulative: cumulativeRevenue,
      timestamp: Date.now()
    })
  }

  const customTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium">{payload[0].payload.date}</p>
          {payload[0].payload.amount > 0 && (
            <p className="text-sm text-primary">
              Payment: {formatCurrency(payload[0].payload.amount)}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            Total: {formatCurrency(payload[0].value)}
          </p>
        </div>
      )
    }
    return null
  }

  const totalReceived = payments.reduce((sum, p: any) => sum + p.amount, 0)
  const percentageReceived = (totalReceived / expectedRevenue) * 100

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Revenue Tracking</CardTitle>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <PoundSterling className="h-4 w-4" />
              <span>Received: {formatCurrency(totalReceived)}</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="font-medium">{percentageReceived.toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'currentColor' }}
                tickFormatter={(value) => `£${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={customTooltip} />
              <ReferenceLine 
                y={expectedRevenue} 
                stroke="#3b82f6"
                strokeDasharray="3 3"
                label={{ value: "Target", position: "right" }}
              />
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorRevenue)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-48 border-2 border-dashed border-muted rounded-lg">
            <div className="text-center">
              <PoundSterling className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No payments recorded yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Target: {formatCurrency(expectedRevenue)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}