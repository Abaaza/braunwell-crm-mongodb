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
  Legend 
} from "recharts"
import { Users } from "lucide-react"

export function ContactGrowthChart({ dateRange }: { dateRange: string }) {
  const contactGrowthData = useQuery(api.analytics.getContactGrowthData, { dateRange })
  
  if (!contactGrowthData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contact Growth</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    )
  }

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-primary">
            New Contacts: {payload[0].value}
          </p>
          {payload[1] && (
            <p className="text-sm text-muted-foreground">
              Total: {payload[1].value}
            </p>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Contact Growth</CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          Total: {contactGrowthData.totalContacts}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={contactGrowthData.chartData}>
            <defs>
              <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="period" 
              className="text-xs"
              tick={{ fill: 'currentColor' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'currentColor' }}
            />
            <Tooltip content={customTooltip} />
            <Area
              type="monotone"
              dataKey="newContacts"
              stackId="1"
              stroke="#10b981"
              fillOpacity={1}
              fill="url(#colorNew)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="totalContacts"
              stackId="2"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorTotal)"
              strokeWidth={2}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              iconType="line"
              formatter={(value) => value === 'newContacts' ? 'New Contacts' : 'Total Contacts'}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}