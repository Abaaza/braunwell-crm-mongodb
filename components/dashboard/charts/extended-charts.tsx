"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart,
  ScatterChart,
  Scatter,
  FunnelChart,
  Funnel,
  LabelList,
  RadialBarChart,
  RadialBar,
  Legend
} from "recharts"
import { formatCurrency } from "@/lib/utils"
import { TrendingUp, TrendingDown } from "lucide-react"

interface ChartProps {
  title: string
  data: any[]
  config: {
    dataKey?: string
    xAxisKey?: string
    yAxisKey?: string
    customColors?: string[]
    showLegend?: boolean
    showGrid?: boolean
    showTooltip?: boolean
    animationEnabled?: boolean
    [key: string]: any
  }
  className?: string
}

const DEFAULT_COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // yellow
  "#ef4444", // red
  "#8b5cf6", // purple
  "#06b6d4", // cyan
  "#f97316", // orange
  "#84cc16", // lime
  "#ec4899", // pink
  "#6b7280", // gray
]

// Enhanced Bar Chart
export function EnhancedBarChart({ title, data, config, className }: ChartProps) {
  const colors = config.customColors || DEFAULT_COLORS

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium">{label}</p>
          {payload.map((item: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: item.color }}>
              {`${item.name}: ${typeof item.value === 'number' && config.dataKey?.includes('revenue') ? formatCurrency(item.value) : item.value}`}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            {config.showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
            <XAxis 
              dataKey={config.xAxisKey || "name"} 
              className="text-xs"
              tick={{ fill: 'currentColor' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'currentColor' }}
              tickFormatter={(value) => 
                config.dataKey?.includes('revenue') ? `£${(value / 1000).toFixed(0)}k` : value
              }
            />
            {config.showTooltip && <Tooltip content={customTooltip} />}
            <Bar 
              dataKey={config.dataKey || "value"} 
              fill={colors[0]}
              animationDuration={config.animationEnabled ? 1000 : 0}
              radius={[4, 4, 0, 0]}
            />
            {config.showLegend && <Legend />}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Enhanced Donut Chart
export function EnhancedDonutChart({ title, data, config, className }: ChartProps) {
  const colors = config.customColors || DEFAULT_COLORS

  const customTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-sm" style={{ color: payload[0].color }}>
            {`Value: ${payload[0].value}`}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={120}
              paddingAngle={2}
              dataKey={config.dataKey || "value"}
              animationDuration={config.animationEnabled ? 1000 : 0}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
              <LabelList 
                dataKey="name" 
                position="outside"
                className="text-xs"
              />
            </Pie>
            {config.showTooltip && <Tooltip content={customTooltip} />}
            {config.showLegend && <Legend />}
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Gauge Chart
export function GaugeChart({ title, data, config, className }: ChartProps) {
  const colors = config.customColors || DEFAULT_COLORS
  const value = data[0]?.value || 0
  const max = config.max || 100

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <RadialBarChart 
            cx="50%" 
            cy="50%" 
            innerRadius="60%" 
            outerRadius="90%" 
            data={[{ name: title, value, fill: colors[0] }]}
            startAngle={180}
            endAngle={0}
          >
            <RadialBar 
              dataKey="value" 
              cornerRadius={10}
              animationDuration={config.animationEnabled ? 1000 : 0}
            />
            <text 
              x="50%" 
              y="50%" 
              textAnchor="middle" 
              dominantBaseline="middle"
              className="text-2xl font-bold"
            >
              {`${value}%`}
            </text>
          </RadialBarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Funnel Chart
export function CustomFunnelChart({ title, data, config, className }: ChartProps) {
  const colors = config.customColors || DEFAULT_COLORS

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <FunnelChart>
            <Funnel
              dataKey={config.dataKey || "value"}
              data={data}
              animationDuration={config.animationEnabled ? 1000 : 0}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
              <LabelList position="center" className="text-xs" />
            </Funnel>
            {config.showTooltip && <Tooltip />}
          </FunnelChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Scatter Chart
export function EnhancedScatterChart({ title, data, config, className }: ChartProps) {
  const colors = config.customColors || DEFAULT_COLORS

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <ScatterChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            {config.showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
            <XAxis 
              dataKey={config.xAxisKey || "x"} 
              className="text-xs"
              tick={{ fill: 'currentColor' }}
            />
            <YAxis 
              dataKey={config.yAxisKey || "y"}
              className="text-xs"
              tick={{ fill: 'currentColor' }}
            />
            {config.showTooltip && <Tooltip />}
            <Scatter 
              name="Data Points" 
              fill={colors[0]}
              animationDuration={config.animationEnabled ? 1000 : 0}
            />
            {config.showLegend && <Legend />}
          </ScatterChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Combined Chart (Line + Bar)
export function CombinedChart({ title, data, config, className }: ChartProps) {
  const colors = config.customColors || DEFAULT_COLORS

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            {config.showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
            <XAxis 
              dataKey={config.xAxisKey || "name"} 
              className="text-xs"
              tick={{ fill: 'currentColor' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'currentColor' }}
            />
            {config.showTooltip && <Tooltip />}
            <Bar 
              dataKey={config.dataKey || "value"} 
              fill={colors[0]}
              animationDuration={config.animationEnabled ? 1000 : 0}
            />
            <Line 
              type="monotone" 
              dataKey={config.secondaryDataKey || "trend"} 
              stroke={colors[1]}
              strokeWidth={2}
              animationDuration={config.animationEnabled ? 1000 : 0}
            />
            {config.showLegend && <Legend />}
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Progress Bar Chart
export function ProgressChart({ title, data, config, className }: ChartProps) {
  const colors = config.customColors || DEFAULT_COLORS

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, index) => {
            const percentage = (item.value / item.max) * 100
            return (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{item.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {item.value} / {item.max} ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-1000"
                    style={{ 
                      width: `${percentage}%`, 
                      backgroundColor: colors[index % colors.length] 
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// Heatmap Chart (simplified grid representation)
export function HeatmapChart({ title, data, config, className }: ChartProps) {
  const colors = config.customColors || ["#f0f9ff", "#0369a1"]

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 text-xs">
          {data.map((item, index) => {
            const intensity = Math.min(item.value / (config.maxValue || 100), 1)
            return (
              <div
                key={index}
                className="aspect-square rounded flex items-center justify-center text-white font-medium"
                style={{
                  backgroundColor: `color-mix(in srgb, ${colors[1]} ${intensity * 100}%, ${colors[0]})`
                }}
                title={`${item.name}: ${item.value}`}
              >
                {item.value}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}