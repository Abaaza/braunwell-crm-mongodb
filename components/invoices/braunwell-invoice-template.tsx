"use client"

import { useState } from "react"
import { formatCurrency, formatDate, formatUKPostcode } from "@/lib/utils"
import { exportInvoiceAsPDF, exportInvoiceAsExcel } from "@/lib/invoice-export"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BraunwellLogo } from "@/components/shared/braunwell-logo"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download, FileText, FileSpreadsheet, Printer, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface BraunwellInvoiceTemplateProps {
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

export function BraunwellInvoiceTemplate({ invoice, showActions = false }: BraunwellInvoiceTemplateProps) {
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
      await exportInvoiceAsPDF('braunwell-invoice-content', invoice)
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

  // Get due date status
  const isOverdue = invoice.status === "overdue" || (
    invoice.status === "sent" && 
    invoice.dueDate < Date.now()
  )

  return (
    <div className="max-w-4xl mx-auto">
      {/* Actions Bar - Only show when showActions is true */}
      {showActions && (
        <div className="flex justify-end gap-2 mb-4 print:hidden">
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

      {/* Invoice Content */}
      <Card className="shadow-lg overflow-hidden" id="braunwell-invoice-content">
        {/* Header */}
        <div className="bg-black text-white p-12 flex flex-col items-center justify-center">
          <BraunwellLogo size="xl" theme="light" className="mb-4" />
          <p className="text-sm opacity-80 font-light">AI Software Services for Small & Medium Businesses</p>
        </div>

        {/* Invoice Details */}
        <div className="p-12 bg-white">
          {/* Invoice Title and Status */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-3xl font-light text-gray-800 mb-2">Invoice</h2>
              <p className="text-xl text-gray-600">#{invoice.invoiceNumber}</p>
            </div>
            <Badge 
              variant={getStatusColor(invoice.status)} 
              className="text-sm px-3 py-1"
            >
              {invoice.status.toUpperCase()}
            </Badge>
          </div>

          {/* Date Information */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Issue Date</p>
                <p className="text-lg text-gray-800">{formatDate(invoice.issueDate)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Due Date</p>
                <p className={`text-lg ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-800'}`}>
                  {formatDate(invoice.dueDate)}
                </p>
              </div>
            </div>
          </div>

          {/* Billing Information */}
          <div className="grid grid-cols-2 gap-12 mb-10">
            {/* From */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">From</h3>
              <div className="space-y-2">
                <p className="text-xl font-light text-gray-900">{invoice.companyInfo.name}</p>
                <div className="text-gray-600 space-y-1">
                  <p>{invoice.companyInfo.address.line1}</p>
                  {invoice.companyInfo.address.line2 && (
                    <p>{invoice.companyInfo.address.line2}</p>
                  )}
                  <p>
                    {invoice.companyInfo.address.city}, {formatUKPostcode(invoice.companyInfo.address.postcode)}
                  </p>
                  <p>{invoice.companyInfo.address.country}</p>
                  {invoice.companyInfo.phone && (
                    <p className="mt-2">Tel: {invoice.companyInfo.phone}</p>
                  )}
                  {invoice.companyInfo.email && (
                    <p>Email: {invoice.companyInfo.email}</p>
                  )}
                  {invoice.companyInfo.website && (
                    <p>Web: {invoice.companyInfo.website}</p>
                  )}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    {invoice.companyInfo.vatNumber && (
                      <p className="text-sm">VAT No: {invoice.companyInfo.vatNumber}</p>
                    )}
                    {invoice.companyInfo.companyNumber && (
                      <p className="text-sm">Company No: {invoice.companyInfo.companyNumber}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* To */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Bill To</h3>
              <div className="space-y-2">
                <p className="text-xl font-light text-gray-900">{invoice.clientInfo.name}</p>
                {invoice.clientInfo.company && (
                  <p className="text-lg text-gray-700">{invoice.clientInfo.company}</p>
                )}
                <div className="text-gray-600 space-y-1">
                  {invoice.clientInfo.address && (
                    <>
                      <p>{invoice.clientInfo.address.line1}</p>
                      {invoice.clientInfo.address.line2 && (
                        <p>{invoice.clientInfo.address.line2}</p>
                      )}
                      <p>
                        {invoice.clientInfo.address.city}, {formatUKPostcode(invoice.clientInfo.address.postcode)}
                      </p>
                      <p>{invoice.clientInfo.address.country}</p>
                    </>
                  )}
                  {invoice.clientInfo.email && (
                    <p className="mt-2">
                      Email: <a href={`mailto:${invoice.clientInfo.email}`} className="text-blue-600 hover:underline">
                        {invoice.clientInfo.email}
                      </a>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="mb-10">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-4 font-semibold text-sm uppercase tracking-wider text-gray-700">
                    Description
                  </th>
                  <th className="text-center py-4 font-semibold text-sm uppercase tracking-wider text-gray-700">
                    Qty
                  </th>
                  <th className="text-right py-4 font-semibold text-sm uppercase tracking-wider text-gray-700">
                    Unit Price
                  </th>
                  <th className="text-right py-4 font-semibold text-sm uppercase tracking-wider text-gray-700">
                    Net
                  </th>
                  <th className="text-center py-4 font-semibold text-sm uppercase tracking-wider text-gray-700">
                    VAT
                  </th>
                  <th className="text-right py-4 font-semibold text-sm uppercase tracking-wider text-gray-700">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems.map((item, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="py-4 text-gray-800">{item.description}</td>
                    <td className="py-4 text-center text-gray-800">{item.quantity}</td>
                    <td className="py-4 text-right text-gray-800">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-4 text-right text-gray-800">{formatCurrency(item.netAmount)}</td>
                    <td className="py-4 text-center text-gray-800">{(item.vatRate * 100).toFixed(0)}%</td>
                    <td className="py-4 text-right font-medium text-gray-900">{formatCurrency(item.grossAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-10">
            <div className="bg-gray-50 rounded-lg p-6 w-80">
              <div className="space-y-3">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal (Net)</span>
                  <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>VAT Total</span>
                  <span className="font-medium">{formatCurrency(invoice.totalVAT)}</span>
                </div>
                <div className="pt-3 border-t-2 border-gray-300">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-gray-900">Total Amount</span>
                    <span className="text-2xl font-bold text-gray-900">{formatCurrency(invoice.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Terms and Notes */}
          {(invoice.paymentTerms || invoice.notes) && (
            <div className="bg-gray-50 rounded-lg p-6 mb-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {invoice.paymentTerms && (
                  <div>
                    <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-700 mb-2">
                      Payment Terms
                    </h4>
                    <p className="text-gray-600">{invoice.paymentTerms}</p>
                  </div>
                )}
                {invoice.notes && (
                  <div>
                    <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-700 mb-2">
                      Notes
                    </h4>
                    <p className="text-gray-600">{invoice.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Thank You Message */}
          <div className="text-center p-6 bg-black text-white rounded-lg">
            <p className="text-lg font-light mb-2">Thank you for your business</p>
            <p className="text-sm opacity-80">Payment is due within {Math.ceil((invoice.dueDate - invoice.issueDate) / (1000 * 60 * 60 * 24))} days of invoice date</p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-100 px-12 py-6 text-center">
          <p className="text-sm text-gray-600 mb-2">
            This invoice was generated by Braunwell CRM
          </p>
          <p className="text-xs text-gray-500">
            <a href="https://www.braunwell.co.uk" className="text-blue-600 hover:underline">www.braunwell.co.uk</a>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            London, UK • Dublin, Ireland • Vancouver, Canada
          </p>
        </div>
      </Card>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          
          #braunwell-invoice-content {
            box-shadow: none !important;
            border: none !important;
          }
          
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}