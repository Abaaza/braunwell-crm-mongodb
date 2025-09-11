"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useAuth } from "@/lib/auth"
import { ExpenseList } from "@/components/expenses/expense-list"
import { ExpenseForm } from "@/components/expenses/expense-form"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Receipt, TrendingUp, TrendingDown, Wallet } from "lucide-react"
import { ExpenseAnalytics } from "@/components/expenses/expense-analytics"

export default function ExpensesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [showNewExpenseDialog, setShowNewExpenseDialog] = useState(false)

  const expenses = useQuery(api.expenses.list, {})
  const categoryTotals = useQuery(api.expenses.getByCategory, {})

  // Calculate summary statistics
  const stats = {
    total: 0,
    pending: 0,
    approved: 0,
    paid: 0,
    count: 0,
  }

  if (expenses) {
    expenses.forEach((expense) => {
      stats.count++
      stats.total += expense.grossAmount
      if (expense.status === "pending") stats.pending += expense.grossAmount
      if (expense.status === "approved") stats.approved += expense.grossAmount
      if (expense.status === "paid") stats.paid += expense.grossAmount
    })
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Expenses</h2>
          <p className="text-muted-foreground">
            Track and manage organizational expenses
          </p>
        </div>
        <Button 
          onClick={() => setShowNewExpenseDialog(true)}
          variant="gradient"
          animation="shine"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Expense
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card variant="elevated" interactive className="hover:scale-[1.02] transition-transform duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Expenses
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              £{stats.total.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.count} expense{stats.count !== 1 ? "s" : ""} tracked
            </p>
          </CardContent>
        </Card>

        <Card variant="elevated" interactive className="hover:scale-[1.02] transition-transform duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Approval
            </CardTitle>
            <Receipt className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              £{stats.pending.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card variant="elevated" interactive className="hover:scale-[1.02] transition-transform duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Approved
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              £{stats.approved.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Ready for payment
            </p>
          </CardContent>
        </Card>

        <Card variant="elevated" interactive className="hover:scale-[1.02] transition-transform duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Paid
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              £{stats.paid.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Completed payments
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Expenses</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <ExpenseList />
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <ExpenseList />
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          <ExpenseList />
        </TabsContent>

        <TabsContent value="paid" className="space-y-4">
          <ExpenseList />
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          <ExpenseList />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <ExpenseAnalytics />
        </TabsContent>
      </Tabs>

      <Dialog
        open={showNewExpenseDialog}
        onOpenChange={setShowNewExpenseDialog}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass border-0">
          <DialogHeader>
            <DialogTitle>Create New Expense</DialogTitle>
            <DialogDescription>
              Add a new expense record
            </DialogDescription>
          </DialogHeader>
          <ExpenseForm
            onSuccess={() => {
              setShowNewExpenseDialog(false)
            }}
            onCancel={() => setShowNewExpenseDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}