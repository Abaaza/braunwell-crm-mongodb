"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts"
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns"
import { cn } from "@/lib/utils"

const categoryColors: Record<string, string> = {
  travel: "#3b82f6",
  equipment: "#10b981",
  software: "#8b5cf6",
  office: "#f59e0b",
  marketing: "#ef4444",
  professional_services: "#06b6d4",
  utilities: "#ec4899",
  insurance: "#84cc16",
  other: "#6b7280",
}

const categoryLabels: Record<string, string> = {
  travel: "Travel",
  equipment: "Equipment",
  software: "Software",
  office: "Office Supplies",
  marketing: "Marketing",
  professional_services: "Professional Services",
  utilities: "Utilities",
  insurance: "Insurance",
  other: "Other",
}

interface ExpenseAnalyticsProps {
  projectId?: string
  dateRange?: {
    from: Date
    to: Date
  }
}

export function ExpenseAnalytics({
  projectId,
  dateRange,
}: ExpenseAnalyticsProps) {
  const defaultDateRange = {
    from: dateRange?.from || startOfMonth(subMonths(new Date(), 5)),
    to: dateRange?.to || endOfMonth(new Date()),
  }

  const categoryData = useQuery(api.expenses.getByCategory, {
    dateFrom: defaultDateRange.from.getTime(),
    dateTo: defaultDateRange.to.getTime(),
  })

  const expenses = useQuery(api.expenses.list, {
    projectId: projectId as any,
    dateFrom: defaultDateRange.from.getTime(),
    dateTo: defaultDateRange.to.getTime(),
  })

  // Calculate monthly expense trends
  const monthlyData = []
  if (expenses) {
    const monthlyTotals = new Map<string, number>()

    expenses.forEach((expense) => {
      const month = format(expense.date, "MMM yyyy")
      const current = monthlyTotals.get(month) || 0
      monthlyTotals.set(month, current + expense.grossAmount)
    })

    // Fill in missing months
    const current = new Date(defaultDateRange.from)
    while (current <= defaultDateRange.to) {
      const monthKey = format(current, "MMM yyyy")
      monthlyData.push({
        month: monthKey,
        amount: monthlyTotals.get(monthKey) || 0,
      })
      current.setMonth(current.getMonth() + 1)
    }
  }

  // Calculate status breakdown
  const statusData: { status: string; amount: number }[] = []
  if (expenses) {
    const statusTotals = {
      pending: 0,
      approved: 0,
      rejected: 0,
      paid: 0,
    }

    expenses.forEach((expense) => {
      statusTotals[expense.status] += expense.grossAmount
    })

    Object.entries(statusTotals).forEach(([status, amount]) => {
      if (amount > 0) {
        statusData.push({
          status: status.charAt(0).toUpperCase() + status.slice(1),
          amount,
        })
      }
    })
  }

  const chartData = categoryData?.map((item) => ({
    category: categoryLabels[item.category] || item.category,
    amount: item.total,
    fill: categoryColors[item.category] || "#6b7280",
  }))

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Expenses by Category</CardTitle>
          <CardDescription>
            Breakdown of expenses across different categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chartData && chartData.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ category, amount }) =>
                      `${category}: £${amount.toFixed(2)}`
                    }
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => `£${value.toFixed(2)}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              No expense data available
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Expense Trend</CardTitle>
          <CardDescription>
            Expense totals over the past months
          </CardDescription>
        </CardHeader>
        <CardContent>
          {monthlyData.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `£${value}`}
                  />
                  <Tooltip
                    formatter={(value: number) => `£${value.toFixed(2)}`}
                  />
                  <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              No expense data available
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Expense Status Breakdown</CardTitle>
          <CardDescription>
            Current status of all expenses
          </CardDescription>
        </CardHeader>
        <CardContent>
          {statusData.length > 0 ? (
            <div className="space-y-4">
              {statusData.map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "h-3 w-3 rounded-full",
                        item.status === "Pending" && "bg-yellow-500",
                        item.status === "Approved" && "bg-green-500",
                        item.status === "Rejected" && "bg-red-500",
                        item.status === "Paid" && "bg-blue-500"
                      )}
                    />
                    <span className="text-sm font-medium">{item.status}</span>
                  </div>
                  <span className="text-sm font-medium">
                    £{item.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-muted-foreground">
              No expense data available
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Vendors</CardTitle>
          <CardDescription>
            Vendors with the highest expense totals
          </CardDescription>
        </CardHeader>
        <CardContent>
          {expenses && expenses.length > 0 ? (
            <div className="space-y-4">
              {(() => {
                const vendorTotals = new Map<string, number>()
                expenses.forEach((expense) => {
                  if (expense.vendor) {
                    const current = vendorTotals.get(expense.vendor) || 0
                    vendorTotals.set(expense.vendor, current + expense.grossAmount)
                  }
                })

                const topVendors = Array.from(vendorTotals.entries())
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)

                return topVendors.length > 0 ? (
                  topVendors.map(([vendor, amount]) => (
                    <div
                      key={vendor}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm truncate max-w-[200px]">
                        {vendor}
                      </span>
                      <span className="text-sm font-medium">
                        £{amount.toFixed(2)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground">
                    No vendor data available
                  </div>
                )
              })()}
            </div>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-muted-foreground">
              No expense data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}