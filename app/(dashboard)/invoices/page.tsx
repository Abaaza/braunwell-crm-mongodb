"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { EmptyState } from "@/components/shared/empty-state"
import { SearchBar } from "@/components/shared/search-bar"
import { FilterBar } from "@/components/shared/filter-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth"
import { formatCurrency, formatDate } from "@/lib/utils"
import { exportInvoiceAsPDF, exportInvoiceAsExcel } from "@/lib/invoice-export"
import { toast } from "sonner"
import {
  FileText,
  Plus,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Send,
  Download,
  Filter,
  Receipt,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  FileSpreadsheet,
} from "lucide-react"
import { BraunwellInvoiceTemplate } from "@/components/invoices/braunwell-invoice-template"

export default function InvoicesPage() {
  const router = useRouter()
  const { user, isAdmin } = useAuth()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [createInvoiceDialogOpen, setCreateInvoiceDialogOpen] = useState(false)
  const [viewInvoiceDialogOpen, setViewInvoiceDialogOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  const [selectedProjectId, setSelectedProjectId] = useState<Id<"projects"> | "">("")
  const [dueDate, setDueDate] = useState("")
  const [lineItems, setLineItems] = useState([{ description: "", quantity: 1, unitPrice: 0 }])
  const [paymentTerms, setPaymentTerms] = useState("")
  const [notes, setNotes] = useState("")

  // Queries
  const invoices = useQuery(api.invoices.list, {
    status: statusFilter === "all" ? undefined : statusFilter as any,
    search: search || undefined,
  })
  const invoiceStats = useQuery(api.invoices.getInvoiceStats, {})
  const projects = useQuery(api.projects.list, { includeArchived: false })
  const companySettings = useQuery(api.companySettings.get, {})

  // Mutations
  const createInvoice = useMutation(api.invoices.create)
  const updateInvoiceStatus = useMutation(api.invoices.updateStatus)
  const deleteInvoice = useMutation(api.invoices.remove)

  const handleCreateInvoice = async () => {
    if (!user || !selectedProjectId || !dueDate || lineItems.length === 0) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      const invoiceId = await createInvoice({
        projectId: selectedProjectId as Id<"projects">,
        dueDate: new Date(dueDate).getTime(),
        lineItems,
        paymentTerms: paymentTerms || undefined,
        notes: notes || undefined,
        userId: user.id,
      })

      toast.success("Invoice created successfully")
      setCreateInvoiceDialogOpen(false)
      // Reset form
      setSelectedProjectId("")
      setDueDate("")
      setLineItems([{ description: "", quantity: 1, unitPrice: 0 }])
      setPaymentTerms("")
      setNotes("")
    } catch (error) {
      toast.error("Failed to create invoice")
    }
  }

  const handleStatusChange = async (invoiceId: Id<"invoices">, newStatus: any) => {
    if (!user) return

    try {
      await updateInvoiceStatus({
        id: invoiceId,
        status: newStatus,
        userId: user.id,
      })
      toast.success("Invoice status updated")
    } catch (error) {
      toast.error("Failed to update invoice status")
    }
  }

  const handleDeleteInvoice = async (invoiceId: Id<"invoices">) => {
    if (!user) return

    try {
      await deleteInvoice({
        id: invoiceId,
        userId: user.id,
      })
      toast.success("Invoice deleted successfully")
    } catch (error) {
      toast.error("Failed to delete invoice")
    }
  }

  const handleExportPDF = async (invoice: any) => {
    try {
      // First open the invoice in view mode
      setSelectedInvoice(invoice)
      setViewInvoiceDialogOpen(true)
      
      // Wait for the dialog to render
      setTimeout(async () => {
        await exportInvoiceAsPDF('braunwell-invoice-content', invoice)
        toast.success('Invoice exported as PDF')
      }, 500)
    } catch (error) {
      toast.error('Failed to export PDF')
      console.error(error)
    }
  }

  const handleExportExcel = (invoice: any) => {
    try {
      exportInvoiceAsExcel(invoice)
      toast.success('Invoice exported as Excel')
    } catch (error) {
      toast.error('Failed to export Excel')
      console.error(error)
    }
  }

  const addLineItem = () => {
    setLineItems([...lineItems, { description: "", quantity: 1, unitPrice: 0 }])
  }

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index))
  }

  const updateLineItem = (index: number, field: string, value: any) => {
    const updated = lineItems.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    )
    setLineItems(updated)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft": return <Edit className="h-4 w-4" />
      case "sent": return <Send className="h-4 w-4" />
      case "paid": return <CheckCircle className="h-4 w-4" />
      case "overdue": return <AlertCircle className="h-4 w-4" />
      case "cancelled": return <X className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "secondary"
      case "sent": return "default"
      case "paid": return "success"
      case "overdue": return "destructive"
      case "cancelled": return "outline"
      default: return "secondary"
    }
  }

  if (!companySettings) {
    return (
      <div className="container mx-auto py-8">
        <EmptyState
          icon={<AlertCircle className="h-12 w-12" />}
          title="Company Settings Required"
          description="Please configure your company settings before creating invoices"
          action={{
            label: "Configure Settings",
            onClick: () => router.push("/settings"),
          }}
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6 animate-fade-in">
      <PageHeader
        title="Invoices"
        description="Manage your UK invoices with VAT calculations"
      >
        {isAdmin && (
          <Button 
            onClick={() => setCreateInvoiceDialogOpen(true)}
            variant="gradient"
            animation="shine"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Invoice
          </Button>
        )}
      </PageHeader>

      {/* Stats */}
      {invoiceStats && (
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            title="Total Invoices"
            value={invoiceStats.total.toString()}
            icon={<FileText className="h-5 w-5" />}
            color="blue"
          />
          <StatCard
            title="Total Value"
            value={formatCurrency(invoiceStats.totalValue)}
            icon={<Receipt className="h-5 w-5" />}
            color="green"
          />
          <StatCard
            title="Paid Amount"
            value={formatCurrency(invoiceStats.paidValue)}
            description={`${invoiceStats.paid} invoices paid`}
            icon={<CheckCircle className="h-5 w-5" />}
            color="green"
          />
          <StatCard
            title="Outstanding"
            value={formatCurrency(invoiceStats.totalValue - invoiceStats.paidValue)}
            description={`${invoiceStats.sent + invoiceStats.overdue} invoices`}
            icon={<Clock className="h-5 w-5" />}
            color="yellow"
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <SearchBar
          placeholder="Search invoices..."
          value={search}
          onChange={setSearch}
          className="flex-1 glass"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48 glass">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Invoices List */}
      {invoices ? (
        invoices.length > 0 ? (
          <div className="grid gap-4">
            {invoices.map((invoice) => (
              <Card key={invoice._id} variant="elevated" interactive className="transition-all duration-200 hover:scale-[1.01]">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(invoice.status)}
                        <div>
                          <p className="font-semibold">Invoice #{invoice.invoiceNumber}</p>
                          <p className="text-sm text-muted-foreground">
                            {invoice.clientInfo.name} • {formatDate(invoice.issueDate)}
                          </p>
                        </div>
                      </div>
                      <Badge variant={getStatusColor(invoice.status)}>
                        {invoice.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(invoice.totalAmount)}</p>
                        <p className="text-sm text-muted-foreground">
                          Due: {formatDate(invoice.dueDate)}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedInvoice(invoice)
                              setViewInvoiceDialogOpen(true)
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleExportPDF(invoice)}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            Download PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleExportExcel(invoice)}
                          >
                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                            Download Excel
                          </DropdownMenuItem>
                          {invoice.status === "draft" && isAdmin && (
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(invoice._id, "sent")}
                            >
                              <Send className="mr-2 h-4 w-4" />
                              Send
                            </DropdownMenuItem>
                          )}
                          {invoice.status === "sent" && isAdmin && (
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(invoice._id, "paid")}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Mark as Paid
                            </DropdownMenuItem>
                          )}
                          {invoice.status === "draft" && isAdmin && (
                            <DropdownMenuItem
                              onClick={() => handleDeleteInvoice(invoice._id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<FileText className="h-12 w-12" />}
            title="No invoices found"
            description="Create your first invoice to get started"
            action={
              isAdmin
                ? {
                    label: "Create Invoice",
                    onClick: () => setCreateInvoiceDialogOpen(true),
                  }
                : undefined
            }
          />
        )
      ) : (
        <Card variant="elevated">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 animate-shimmer"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 animate-shimmer" style={{animationDelay: '150ms'}}></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 animate-shimmer" style={{animationDelay: '300ms'}}></div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Invoice Dialog */}
      <Dialog open={createInvoiceDialogOpen} onOpenChange={setCreateInvoiceDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto glass border-0">
          <DialogHeader>
            <DialogTitle>Create New Invoice</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="project">Project</Label>
                <Select value={selectedProjectId} onValueChange={(value) => setSelectedProjectId(value as Id<"projects"> | "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects?.map((project) => (
                      <SelectItem key={project._id} value={project._id}>
                        {project.name} {project.company && `(${project.company})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="due-date">Due Date</Label>
                <Input
                  id="due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Line Items</Label>
              <div className="space-y-2">
                {lineItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-6">
                      <Input
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => updateLineItem(index, "description", e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(index, "quantity", parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        placeholder="Unit Price"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateLineItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLineItem(index)}
                        disabled={lineItems.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button variant="outline" onClick={addLineItem}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Line Item
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="payment-terms">Payment Terms</Label>
                <Input
                  id="payment-terms"
                  placeholder="e.g., Net 30"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateInvoiceDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateInvoice}>
              Create Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Invoice Dialog */}
      <Dialog open={viewInvoiceDialogOpen} onOpenChange={setViewInvoiceDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto glass border-0">
          {selectedInvoice && (
            <BraunwellInvoiceTemplate invoice={selectedInvoice} showActions={true} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}