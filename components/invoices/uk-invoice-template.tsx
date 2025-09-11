"use client"

import { useState } from "react"
import { formatCurrency, formatDate, formatUKPostcode } from "@/lib/utils"
import { exportInvoiceAsPDF, exportInvoiceAsExcel } from "@/lib/invoice-export"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download, FileText, FileSpreadsheet, Printer, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface UKInvoiceTemplateProps {
  invoice: {
    invoiceNumber: string
    issueDate: number
    dueDate: number
    status: "draft" | "sent" | "paid" | "overdue" | "cancelled"
    lineItems: Array<{
      description: string
      quantity: number
      unitPrice: number
      netAmount: number
      vatRate: number
      vatAmount: number
      grossAmount: number
    }>
    subtotal: number
    totalVAT: number
    totalAmount: number
    paymentTerms?: string
    notes?: string
    vatNumber?: string
    clientInfo: {
      name: string
      email?: string
      company?: string
      address?: {
        line1: string
        line2?: string
        city: string
        postcode: string
        country: string
      }
    }
    companyInfo: {
      name: string
      address: {
        line1: string
        line2?: string
        city: string
        postcode: string
        country: string
      }
      phone?: string
      email?: string
      website?: string
      vatNumber?: string
      companyNumber?: string
    }
  }
  showActions?: boolean
}

export function UKInvoiceTemplate({ invoice, showActions = false }: UKInvoiceTemplateProps) {
  const [isExporting, setIsExporting] = useState(false)
  
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

  const handlePrint = () => {
    window.print()
  }

  const handleExportPDF = async () => {
    setIsExporting(true)
    try {
      await exportInvoiceAsPDF('invoice-content', invoice)
      toast.success('Invoice exported as PDF')
    } catch (error) {
      toast.error('Failed to export PDF')
      console.error(error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportExcel = () => {
    setIsExporting(true)
    try {
      exportInvoiceAsExcel(invoice)
      toast.success('Invoice exported as Excel')
    } catch (error) {
      toast.error('Failed to export Excel')
      console.error(error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardContent className="p-8" id="invoice-content">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary mb-2">INVOICE</h1>
            <div className="space-y-1">
              <p className="text-lg font-semibold">Invoice #{invoice.invoiceNumber}</p>
              <p className="text-sm text-muted-foreground">
                Issue Date: {formatDate(invoice.issueDate)}
              </p>
              <p className="text-sm text-muted-foreground">
                Due Date: {formatDate(invoice.dueDate)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <Badge variant={getStatusColor(invoice.status)} className="mb-4">
              {invoice.status.toUpperCase()}
            </Badge>
            {showActions && (
              <div className="flex gap-2 mt-2 print:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  disabled={isExporting}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isExporting}
                    >
                      {isExporting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="mr-2 h-4 w-4" />
                      )}
                      Download
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleExportPDF}>
                      <FileText className="mr-2 h-4 w-4" />
                      Download as PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportExcel}>
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Download as Excel
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </div>

        {/* Company and Client Info */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* From */}
          <div>
            <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">
              From
            </h3>
            <div className="space-y-1">
              <p className="font-semibold text-lg">{invoice.companyInfo.name}</p>
              <p className="text-sm">{invoice.companyInfo.address.line1}</p>
              {invoice.companyInfo.address.line2 && (
                <p className="text-sm">{invoice.companyInfo.address.line2}</p>
              )}
              <p className="text-sm">
                {invoice.companyInfo.address.city}, {formatUKPostcode(invoice.companyInfo.address.postcode)}
              </p>
              <p className="text-sm">{invoice.companyInfo.address.country}</p>
              {invoice.companyInfo.phone && (
                <p className="text-sm">Tel: {invoice.companyInfo.phone}</p>
              )}
              {invoice.companyInfo.email && (
                <p className="text-sm">Email: {invoice.companyInfo.email}</p>
              )}
              {invoice.companyInfo.website && (
                <p className="text-sm">Web: {invoice.companyInfo.website}</p>
              )}
              {invoice.companyInfo.companyNumber && (
                <p className="text-sm">Company No: {invoice.companyInfo.companyNumber}</p>
              )}
              {invoice.companyInfo.vatNumber && (
                <p className="text-sm">VAT No: {invoice.companyInfo.vatNumber}</p>
              )}
            </div>
          </div>

          {/* To */}
          <div>
            <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">
              Bill To
            </h3>
            <div className="space-y-1">
              <p className="font-semibold text-lg">{invoice.clientInfo.name}</p>
              {invoice.clientInfo.company && (
                <p className="text-sm">{invoice.clientInfo.company}</p>
              )}
              {invoice.clientInfo.address && (
                <>
                  <p className="text-sm">{invoice.clientInfo.address.line1}</p>
                  {invoice.clientInfo.address.line2 && (
                    <p className="text-sm">{invoice.clientInfo.address.line2}</p>
                  )}
                  <p className="text-sm">
                    {invoice.clientInfo.address.city}, {formatUKPostcode(invoice.clientInfo.address.postcode)}
                  </p>
                  <p className="text-sm">{invoice.clientInfo.address.country}</p>
                </>
              )}
              {invoice.clientInfo.email && (
                <p className="text-sm">Email: {invoice.clientInfo.email}</p>
              )}
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="mb-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-2 font-semibold text-sm uppercase tracking-wide">
                  Description
                </th>
                <th className="text-right py-3 px-2 font-semibold text-sm uppercase tracking-wide">
                  Qty
                </th>
                <th className="text-right py-3 px-2 font-semibold text-sm uppercase tracking-wide">
                  Unit Price
                </th>
                <th className="text-right py-3 px-2 font-semibold text-sm uppercase tracking-wide">
                  Net Amount
                </th>
                <th className="text-right py-3 px-2 font-semibold text-sm uppercase tracking-wide">
                  VAT Rate
                </th>
                <th className="text-right py-3 px-2 font-semibold text-sm uppercase tracking-wide">
                  VAT Amount
                </th>
                <th className="text-right py-3 px-2 font-semibold text-sm uppercase tracking-wide">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.map((item, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-3 px-2">{item.description}</td>
                  <td className="py-3 px-2 text-right">{item.quantity}</td>
                  <td className="py-3 px-2 text-right">{formatCurrency(item.unitPrice)}</td>
                  <td className="py-3 px-2 text-right">{formatCurrency(item.netAmount)}</td>
                  <td className="py-3 px-2 text-right">{(item.vatRate * 100).toFixed(0)}%</td>
                  <td className="py-3 px-2 text-right">{formatCurrency(item.vatAmount)}</td>
                  <td className="py-3 px-2 text-right font-semibold">{formatCurrency(item.grossAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-64">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Subtotal (Net):</span>
                <span className="text-sm font-semibold">{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">VAT Total:</span>
                <span className="text-sm font-semibold">{formatCurrency(invoice.totalVAT)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="font-semibold">Total Amount:</span>
                <span className="font-bold text-lg">{formatCurrency(invoice.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Terms and Notes */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          {invoice.paymentTerms && (
            <div>
              <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">
                Payment Terms
              </h4>
              <p className="text-sm">{invoice.paymentTerms}</p>
            </div>
          )}
          {invoice.notes && (
            <div>
              <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">
                Notes
              </h4>
              <p className="text-sm">{invoice.notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground border-t pt-4">
          <p>Thank you for your business!</p>
          {invoice.companyInfo.vatNumber && (
            <p className="mt-1">
              This invoice is VAT registered. VAT Number: {invoice.companyInfo.vatNumber}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}