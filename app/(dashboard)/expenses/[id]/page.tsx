"use client"

import { useRouter } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  FileText,
  Receipt,
  User,
  Building,
  Hash,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
} from "lucide-react"
import { cn } from "@/lib/utils"

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

const statusConfig: Record<
  string,
  { label: string; color: string; icon: React.ComponentType<any> }
> = {
  pending: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock,
  },
  approved: {
    label: "Approved",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-100 text-red-800",
    icon: XCircle,
  },
  paid: {
    label: "Paid",
    color: "bg-blue-100 text-blue-800",
    icon: DollarSign,
  },
}

const paymentMethodLabels: Record<string, string> = {
  bank_transfer: "Bank Transfer",
  card: "Card",
  cash: "Cash",
  cheque: "Cheque",
  direct_debit: "Direct Debit",
}

export default async function ExpenseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  return <ExpenseDetailContent id={id} />
}

function ExpenseDetailContent({ id }: { id: string }) {
  const router = useRouter()
  const expense = useQuery(api.expenses.get, {
    id: id as Id<"expenses">,
  })

  if (!expense) {
    return <div>Loading...</div>
  }

  const statusInfo = statusConfig[expense.status]
  const StatusIcon = statusInfo.icon

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/expenses")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">Expense Details</h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Expense Information</CardTitle>
                <Badge className={cn("text-xs", statusInfo.color)}>
                  <StatusIcon className="mr-1 h-3 w-3" />
                  {statusInfo.label}
                </Badge>
              </div>
              <CardDescription>{expense.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="mr-2 h-4 w-4" />
                    Date
                  </div>
                  <p className="font-medium">
                    {format(expense.date, "MMMM d, yyyy")}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <FileText className="mr-2 h-4 w-4" />
                    Category
                  </div>
                  <p className="font-medium">
                    {categoryLabels[expense.category] || expense.category}
                  </p>
                </div>

                {expense.vendor && (
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Building className="mr-2 h-4 w-4" />
                      Vendor
                    </div>
                    <p className="font-medium">{expense.vendor}</p>
                  </div>
                )}

                {expense.reference && (
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Hash className="mr-2 h-4 w-4" />
                      Reference
                    </div>
                    <p className="font-medium">{expense.reference}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Payment Method
                  </div>
                  <p className="font-medium">
                    {expense.paymentMethod
                      ? paymentMethodLabels[expense.paymentMethod]
                      : "Not specified"}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <User className="mr-2 h-4 w-4" />
                    Created By
                  </div>
                  <p className="font-medium">{expense.createdByName}</p>
                </div>
              </div>

              {expense.notes && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Notes
                  </h4>
                  <p className="text-sm">{expense.notes}</p>
                </div>
              )}

              {expense.projectName && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Linked Project
                  </h4>
                  <Button
                    variant="link"
                    className="p-0 h-auto justify-start"
                    onClick={() => router.push(`/projects/${expense.projectId}`)}
                  >
                    {expense.projectName}
                  </Button>
                </div>
              )}

              {expense.receiptUrl && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Receipt
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(expense.receiptUrl, "_blank")}
                  >
                    <Receipt className="mr-2 h-4 w-4" />
                    View Receipt
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {expense.rejectionReason && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-800">Rejection Reason</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{expense.rejectionReason}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Financial Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Amount ({expense.isVATInclusive ? "inc" : "exc"} VAT)
                  </span>
                  <span className="font-medium">
                    £{expense.amount.toFixed(2)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Net Amount
                  </span>
                  <span>£{expense.netAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    VAT ({(expense.vatRate * 100).toFixed(0)}%)
                  </span>
                  <span>£{expense.vatAmount.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="font-medium">Gross Total</span>
                  <span className="font-medium">
                    £{expense.grossAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <div className="font-medium">Created</div>
                <div className="text-muted-foreground">
                  {format(expense.createdAt, "MMM d, yyyy 'at' h:mm a")}
                </div>
              </div>

              {expense.approvedAt && expense.approvedByName && (
                <div className="text-sm">
                  <div className="font-medium">Approved</div>
                  <div className="text-muted-foreground">
                    {format(expense.approvedAt, "MMM d, yyyy 'at' h:mm a")}
                  </div>
                  <div className="text-muted-foreground">
                    by {expense.approvedByName}
                  </div>
                </div>
              )}

              {expense.paidAt && (
                <div className="text-sm">
                  <div className="font-medium">Paid</div>
                  <div className="text-muted-foreground">
                    {format(expense.paidAt, "MMM d, yyyy 'at' h:mm a")}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {expense.isRecurring && (
            <Card>
              <CardHeader>
                <CardTitle>Recurring Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm">
                  <div className="font-medium">Pattern</div>
                  <div className="text-muted-foreground capitalize">
                    {expense.recurringPattern}
                  </div>
                </div>
                {expense.recurringEndDate && (
                  <div className="text-sm">
                    <div className="font-medium">End Date</div>
                    <div className="text-muted-foreground">
                      {format(expense.recurringEndDate, "MMM d, yyyy")}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}