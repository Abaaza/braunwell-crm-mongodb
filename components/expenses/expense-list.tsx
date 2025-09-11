"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useAuth } from "@/lib/auth"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { format } from "date-fns"
import {
  MoreHorizontal,
  Edit,
  Trash,
  CheckCircle,
  XCircle,
  DollarSign,
  FileText,
  Receipt,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { ExpenseFilters } from "./expense-filters"

interface ExpenseListProps {
  projectId?: Id<"projects">
  hideProjectColumn?: boolean
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

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  paid: "bg-blue-100 text-blue-800",
}

export function ExpenseList({ projectId, hideProjectColumn }: ExpenseListProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()

  const [filters, setFilters] = useState({
    search: "",
    category: "",
    status: "",
    dateFrom: undefined as Date | undefined,
    dateTo: undefined as Date | undefined,
  })

  const [selectedExpenses, setSelectedExpenses] = useState<Set<Id<"expenses">>>(
    new Set()
  )
  const [deleteExpenseId, setDeleteExpenseId] = useState<Id<"expenses"> | null>(
    null
  )

  const expenses = useQuery(api.expenses.list, {
    projectId,
    category: filters.category || undefined,
    status: filters.status || undefined,
    dateFrom: filters.dateFrom?.getTime(),
    dateTo: filters.dateTo?.getTime(),
    search: filters.search || undefined,
  })

  const approve = useMutation(api.expenses.approve)
  const reject = useMutation(api.expenses.reject)
  const markAsPaid = useMutation(api.expenses.markAsPaid)
  const remove = useMutation(api.expenses.remove)
  const bulkApprove = useMutation(api.expenses.bulkApprove)

  const handleApprove = async (id: Id<"expenses">) => {
    if (!user) return

    try {
      await approve({ id, userId: user.id })
      toast({
        title: "Success",
        description: "Expense approved successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve expense",
        variant: "destructive",
      })
    }
  }

  const handleReject = async (id: Id<"expenses">) => {
    if (!user) return

    const reason = prompt("Please provide a reason for rejection:")
    if (!reason) return

    try {
      await reject({ id, reason, userId: user.id })
      toast({
        title: "Success",
        description: "Expense rejected successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject expense",
        variant: "destructive",
      })
    }
  }

  const handleMarkAsPaid = async (id: Id<"expenses">) => {
    if (!user) return

    try {
      await markAsPaid({ id, userId: user.id })
      toast({
        title: "Success",
        description: "Expense marked as paid",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark expense as paid",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    if (!user || !deleteExpenseId) return

    try {
      await remove({ id: deleteExpenseId, userId: user.id })
      toast({
        title: "Success",
        description: "Expense deleted successfully",
      })
      setDeleteExpenseId(null)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete expense",
        variant: "destructive",
      })
    }
  }

  const handleBulkApprove = async () => {
    if (!user || selectedExpenses.size === 0) return

    try {
      const result = await bulkApprove({
        ids: Array.from(selectedExpenses),
        userId: user.id,
      })
      
      const successCount = result.filter(r => r.success).length
      toast({
        title: "Success",
        description: `${successCount} expenses approved successfully`,
      })
      
      setSelectedExpenses(new Set())
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve expenses",
        variant: "destructive",
      })
    }
  }

  const toggleExpenseSelection = (id: Id<"expenses">) => {
    const newSelection = new Set(selectedExpenses)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    setSelectedExpenses(newSelection)
  }

  const toggleAllSelection = () => {
    if (!expenses) return

    if (selectedExpenses.size === expenses.length) {
      setSelectedExpenses(new Set())
    } else {
      setSelectedExpenses(new Set(expenses.map(e => e._id)))
    }
  }

  if (!expenses) {
    return <div>Loading expenses...</div>
  }

  return (
    <div className="space-y-4">
      <ExpenseFilters filters={filters} onFiltersChange={setFilters} />

      {user?.role === "admin" && selectedExpenses.size > 0 && (
        <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
          <span className="text-sm">
            {selectedExpenses.size} expense(s) selected
          </span>
          <Button size="sm" onClick={handleBulkApprove}>
            Approve Selected
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSelectedExpenses(new Set())}
          >
            Clear Selection
          </Button>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {user?.role === "admin" && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      expenses.length > 0 &&
                      selectedExpenses.size === expenses.length
                    }
                    onCheckedChange={toggleAllSelection}
                  />
                </TableHead>
              )}
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              {!hideProjectColumn && <TableHead>Project</TableHead>}
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={hideProjectColumn ? 8 : 9}
                  className="text-center text-muted-foreground"
                >
                  No expenses found
                </TableCell>
              </TableRow>
            ) : (
              expenses.map((expense) => (
                <TableRow key={expense._id}>
                  {user?.role === "admin" && (
                    <TableCell>
                      <Checkbox
                        checked={selectedExpenses.has(expense._id)}
                        onCheckedChange={() => toggleExpenseSelection(expense._id)}
                        disabled={expense.status !== "pending"}
                      />
                    </TableCell>
                  )}
                  <TableCell>{format(expense.date, "MMM d, yyyy")}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{expense.description}</div>
                      {expense.vendor && (
                        <div className="text-sm text-muted-foreground">
                          {expense.vendor}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {categoryLabels[expense.category] || expense.category}
                    </Badge>
                  </TableCell>
                  {!hideProjectColumn && (
                    <TableCell>
                      {expense.projectName ? (
                        <Button
                          variant="link"
                          className="p-0 h-auto"
                          onClick={() =>
                            router.push(`/projects/${expense.projectId}`)
                          }
                        >
                          {expense.projectName}
                        </Button>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        £{expense.grossAmount.toFixed(2)}
                      </div>
                      {expense.vatAmount > 0 && (
                        <div className="text-xs text-muted-foreground">
                          (inc. £{expense.vatAmount.toFixed(2)} VAT)
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("text-xs", statusColors[expense.status])}>
                      {expense.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{expense.createdByName}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => router.push(`/expenses/${expense._id}`)}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {expense.receiptUrl && (
                          <DropdownMenuItem
                            onClick={() => window.open(expense.receiptUrl, "_blank")}
                          >
                            <Receipt className="mr-2 h-4 w-4" />
                            View Receipt
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {expense.status === "pending" &&
                          (expense.createdBy === user?.id ||
                            user?.role === "admin") && (
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/expenses/${expense._id}/edit`)
                              }
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          )}
                        {user?.role === "admin" && (
                          <>
                            {expense.status === "pending" && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleApprove(expense._id)}
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleReject(expense._id)}
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Reject
                                </DropdownMenuItem>
                              </>
                            )}
                            {expense.status === "approved" && (
                              <DropdownMenuItem
                                onClick={() => handleMarkAsPaid(expense._id)}
                              >
                                <DollarSign className="mr-2 h-4 w-4" />
                                Mark as Paid
                              </DropdownMenuItem>
                            )}
                          </>
                        )}
                        {(expense.status === "pending" ||
                          expense.status === "rejected") &&
                          (expense.createdBy === user?.id ||
                            user?.role === "admin") && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setDeleteExpenseId(expense._id)}
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={!!deleteExpenseId}
        onOpenChange={() => setDeleteExpenseId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this expense? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}