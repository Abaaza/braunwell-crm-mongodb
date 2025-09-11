"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { format } from "date-fns"
import { CalendarIcon, Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface ExpenseFormProps {
  expense?: any
  projectId?: Id<"projects">
  onSuccess?: () => void
  onCancel?: () => void
}

const categories = [
  { value: "travel", label: "Travel" },
  { value: "equipment", label: "Equipment" },
  { value: "software", label: "Software" },
  { value: "office", label: "Office Supplies" },
  { value: "marketing", label: "Marketing" },
  { value: "professional_services", label: "Professional Services" },
  { value: "utilities", label: "Utilities" },
  { value: "insurance", label: "Insurance" },
  { value: "other", label: "Other" },
]

const paymentMethods = [
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "card", label: "Card" },
  { value: "cash", label: "Cash" },
  { value: "cheque", label: "Cheque" },
  { value: "direct_debit", label: "Direct Debit" },
]

export function ExpenseForm({
  expense,
  projectId,
  onSuccess,
  onCancel,
}: ExpenseFormProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()

  const create = useMutation(api.expenses.create)
  const update = useMutation(api.expenses.update)
  const projects = useQuery(api.projects.list, { status: "open" })

  const [formData, setFormData] = useState({
    description: expense?.description || "",
    amount: expense?.amount || "",
    date: expense?.date ? new Date(expense.date) : new Date(),
    projectId: expense?.projectId || projectId || undefined,
    category: expense?.category || "other",
    isVATInclusive: expense?.isVATInclusive ?? true,
    vatRate: expense?.vatRate || 0.20,
    paymentMethod: expense?.paymentMethod || "bank_transfer",
    reference: expense?.reference || "",
    vendor: expense?.vendor || "",
    notes: expense?.notes || "",
    receiptUrl: expense?.receiptUrl || "",
    isRecurring: expense?.isRecurring || false,
    recurringPattern: expense?.recurringPattern || "monthly",
    recurringEndDate: expense?.recurringEndDate
      ? new Date(expense.recurringEndDate)
      : undefined,
  })

  const [vatDetails, setVatDetails] = useState({
    netAmount: 0,
    vatAmount: 0,
    grossAmount: 0,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Calculate VAT whenever amount, VAT rate, or VAT inclusive changes
  useEffect(() => {
    if (!formData.amount || isNaN(parseFloat(formData.amount))) {
      setVatDetails({ netAmount: 0, vatAmount: 0, grossAmount: 0 })
      return
    }

    const amount = parseFloat(formData.amount)
    let netAmount: number
    let vatAmount: number
    let grossAmount: number

    if (formData.isVATInclusive) {
      // Amount includes VAT
      grossAmount = amount
      netAmount = grossAmount / (1 + formData.vatRate)
      vatAmount = grossAmount - netAmount
    } else {
      // Amount excludes VAT
      netAmount = amount
      vatAmount = netAmount * formData.vatRate
      grossAmount = netAmount + vatAmount
    }

    setVatDetails({
      netAmount: Math.round(netAmount * 100) / 100,
      vatAmount: Math.round(vatAmount * 100) / 100,
      grossAmount: Math.round(grossAmount * 100) / 100,
    })
  }, [formData.amount, formData.vatRate, formData.isVATInclusive])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsSubmitting(true)

    try {
      const data = {
        description: formData.description,
        amount: parseFloat(formData.amount),
        date: formData.date.getTime(),
        projectId: formData.projectId as Id<"projects"> | undefined,
        category: formData.category as any,
        isVATInclusive: formData.isVATInclusive,
        vatRate: formData.vatRate,
        paymentMethod: formData.paymentMethod as any,
        reference: formData.reference || undefined,
        vendor: formData.vendor || undefined,
        notes: formData.notes || undefined,
        receiptUrl: formData.receiptUrl || undefined,
        isRecurring: formData.isRecurring || undefined,
        recurringPattern: formData.isRecurring
          ? (formData.recurringPattern as any)
          : undefined,
        recurringEndDate: formData.isRecurring && formData.recurringEndDate
          ? formData.recurringEndDate.getTime()
          : undefined,
        userId: user.id,
      }

      if (expense) {
        await update({ id: expense._id, ...data })
        toast({
          title: "Success",
          description: "Expense updated successfully",
        })
      } else {
        await create(data)
        toast({
          title: "Success",
          description: "Expense created successfully",
        })
      }

      if (onSuccess) {
        onSuccess()
      } else {
        router.push("/expenses")
      }
    } catch (error) {
      console.error("Error saving expense:", error)
      toast({
        title: "Error",
        description: "Failed to save expense",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="description">Description *</Label>
          <Input
            id="description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="e.g., Train tickets to client meeting"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="vendor">Vendor</Label>
          <Input
            id="vendor"
            value={formData.vendor}
            onChange={(e) =>
              setFormData({ ...formData, vendor: e.target.value })
            }
            placeholder="e.g., National Rail"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Amount (£) *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) =>
              setFormData({ ...formData, amount: e.target.value })
            }
            placeholder="0.00"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">Date *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.date ? format(formData.date, "PPP") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.date}
                onSelect={(date) =>
                  setFormData({ ...formData, date: date || new Date() })
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select
            value={formData.category}
            onValueChange={(value) =>
              setFormData({ ...formData, category: value })
            }
          >
            <SelectTrigger id="category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="projectId">Project (Optional)</Label>
          <Select
            value={formData.projectId}
            onValueChange={(value) =>
              setFormData({ ...formData, projectId: value as Id<"projects"> })
            }
          >
            <SelectTrigger id="projectId">
              <SelectValue placeholder="Not linked to project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Not linked to project</SelectItem>
              {projects?.map((project) => (
                <SelectItem key={project._id} value={project._id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="paymentMethod">Payment Method</Label>
          <Select
            value={formData.paymentMethod}
            onValueChange={(value) =>
              setFormData({ ...formData, paymentMethod: value })
            }
          >
            <SelectTrigger id="paymentMethod">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {paymentMethods.map((method) => (
                <SelectItem key={method.value} value={method.value}>
                  {method.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reference">Reference</Label>
          <Input
            id="reference"
            value={formData.reference}
            onChange={(e) =>
              setFormData({ ...formData, reference: e.target.value })
            }
            placeholder="e.g., INV-001"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border p-4 space-y-4">
          <h3 className="font-medium">VAT Calculation</h3>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="vat-inclusive"
              checked={formData.isVATInclusive}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isVATInclusive: checked })
              }
            />
            <Label htmlFor="vat-inclusive">
              Amount includes VAT
            </Label>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-1">
              <Label htmlFor="vatRate">VAT Rate (%)</Label>
              <Input
                id="vatRate"
                type="number"
                step="0.01"
                value={(formData.vatRate * 100).toFixed(0)}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    vatRate: parseFloat(e.target.value) / 100,
                  })
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Net Amount</Label>
              <div className="text-sm font-medium">
                £{vatDetails.netAmount.toFixed(2)}
              </div>
            </div>
            <div className="space-y-1">
              <Label>VAT Amount</Label>
              <div className="text-sm font-medium">
                £{vatDetails.vatAmount.toFixed(2)}
              </div>
            </div>
            <div className="space-y-1">
              <Label>Gross Amount</Label>
              <div className="text-sm font-medium">
                £{vatDetails.grossAmount.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            placeholder="Additional notes..."
            rows={3}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="recurring"
            checked={formData.isRecurring}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, isRecurring: checked })
            }
          />
          <Label htmlFor="recurring">Recurring expense</Label>
        </div>

        {formData.isRecurring && (
          <div className="grid gap-4 md:grid-cols-2 border rounded-lg p-4">
            <div className="space-y-2">
              <Label htmlFor="recurringPattern">Recurring Pattern</Label>
              <Select
                value={formData.recurringPattern}
                onValueChange={(value) =>
                  setFormData({ ...formData, recurringPattern: value })
                }
              >
                <SelectTrigger id="recurringPattern">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recurringEndDate">End Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.recurringEndDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.recurringEndDate
                      ? format(formData.recurringEndDate, "PPP")
                      : "No end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.recurringEndDate}
                    onSelect={(date) =>
                      setFormData({ ...formData, recurringEndDate: date })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? expense
              ? "Updating..."
              : "Creating..."
            : expense
            ? "Update Expense"
            : "Create Expense"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel || (() => router.back())}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}