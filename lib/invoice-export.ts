import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { formatCurrency, formatDate, formatUKPostcode } from './utils'

interface InvoiceData {
  invoiceNumber: string
  issueDate: number
  dueDate: number
  status: string
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

/**
 * Export invoice as PDF using html2canvas for accurate rendering
 */
export async function exportInvoiceAsPDF(
  elementId: string,
  invoice: InvoiceData,
  filename?: string
): Promise<void> {
  try {
    const element = document.getElementById(elementId)
    if (!element) {
      throw new Error('Invoice element not found')
    }

    // Create a clone of the element to modify for PDF
    const clonedElement = element.cloneNode(true) as HTMLElement
    
    // Remove any action buttons from the clone
    const buttons = clonedElement.querySelectorAll('button')
    buttons.forEach(button => button.remove())
    
    // Apply print styles to the clone
    clonedElement.style.backgroundColor = 'white'
    clonedElement.style.color = 'black'
    clonedElement.style.padding = '0'
    clonedElement.style.width = '794px' // A4 width in pixels at 96 DPI
    
    // Temporarily append to body
    document.body.appendChild(clonedElement)
    
    // Convert to canvas
    const canvas = await html2canvas(clonedElement, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
    })
    
    // Remove the clone
    document.body.removeChild(clonedElement)
    
    // Create PDF
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })
    
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = canvas.width
    const imgHeight = canvas.height
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight) * 0.95
    const imgX = (pdfWidth - imgWidth * ratio) / 2
    const imgY = 10
    
    pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio)
    
    // Save the PDF
    const defaultFilename = `${invoice.invoiceNumber}-${invoice.companyInfo.name.replace(/\s+/g, '-')}.pdf`
    pdf.save(filename || defaultFilename)
  } catch (error) {
    console.error('Error generating PDF:', error)
    throw new Error('Failed to generate PDF. Please try again.')
  }
}

/**
 * Export invoice as Excel file with proper formatting
 */
export function exportInvoiceAsExcel(
  invoice: InvoiceData,
  filename?: string
): void {
  try {
    // Create a new workbook
    const wb = XLSX.utils.book_new()
    
    // Build the invoice data structure
    const invoiceData: any[][] = []
    
    // Header - BRAUNWELL (with visual enhancement using symbols)
    invoiceData.push(['═══════════════════ BRAUNWELL ═══════════════════', '', '', '', '', '', ''])
    invoiceData.push(['AI Software Services for Small & Medium Businesses', '', '', '', '', '', ''])
    invoiceData.push(['━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', '', '', '', '', '', ''])
    invoiceData.push(['', '', '', '', '', '', ''])
    invoiceData.push(['INVOICE #' + invoice.invoiceNumber, '', '', '', '', '', ''])
    invoiceData.push(['', '', '', '', '', '', ''])
    
    // Invoice details in a structured format
    invoiceData.push(['Status:', invoice.status.toUpperCase(), '', '', '', '', ''])
    invoiceData.push(['Issue Date:', formatDate(invoice.issueDate), '', '', '', '', ''])
    invoiceData.push(['Due Date:', formatDate(invoice.dueDate), '', '', '', '', ''])
    invoiceData.push(['', '', '', '', '', '', ''])
    
    // FROM section with visual separator
    invoiceData.push(['──────────── FROM ────────────', '', '', '', '', '', ''])
    invoiceData.push([invoice.companyInfo.name, '', '', '', '', '', ''])
    invoiceData.push([invoice.companyInfo.address.line1, '', '', '', '', '', ''])
    if (invoice.companyInfo.address.line2) {
      invoiceData.push([invoice.companyInfo.address.line2, '', '', '', '', '', ''])
    }
    invoiceData.push([`${invoice.companyInfo.address.city}, ${formatUKPostcode(invoice.companyInfo.address.postcode)}`, '', '', '', '', '', ''])
    invoiceData.push([invoice.companyInfo.address.country, '', '', '', '', '', ''])
    if (invoice.companyInfo.phone) {
      invoiceData.push([`Tel: ${invoice.companyInfo.phone}`, '', '', '', '', '', ''])
    }
    if (invoice.companyInfo.email) {
      invoiceData.push([`Email: ${invoice.companyInfo.email}`, '', '', '', '', '', ''])
    }
    if (invoice.companyInfo.website) {
      invoiceData.push([`Web: ${invoice.companyInfo.website}`, '', '', '', '', '', ''])
    }
    if (invoice.companyInfo.vatNumber) {
      invoiceData.push([`VAT No: ${invoice.companyInfo.vatNumber}`, '', '', '', '', '', ''])
    }
    if (invoice.companyInfo.companyNumber) {
      invoiceData.push([`Company No: ${invoice.companyInfo.companyNumber}`, '', '', '', '', '', ''])
    }
    invoiceData.push(['', '', '', '', '', '', ''])
    
    // BILL TO section with visual separator
    invoiceData.push(['──────────── BILL TO ────────────', '', '', '', '', '', ''])
    invoiceData.push([invoice.clientInfo.name, '', '', '', '', '', ''])
    if (invoice.clientInfo.company) {
      invoiceData.push([invoice.clientInfo.company, '', '', '', '', '', ''])
    }
    if (invoice.clientInfo.address) {
      invoiceData.push([invoice.clientInfo.address.line1, '', '', '', '', '', ''])
      if (invoice.clientInfo.address.line2) {
        invoiceData.push([invoice.clientInfo.address.line2, '', '', '', '', '', ''])
      }
      invoiceData.push([`${invoice.clientInfo.address.city}, ${formatUKPostcode(invoice.clientInfo.address.postcode)}`, '', '', '', '', '', ''])
      invoiceData.push([invoice.clientInfo.address.country, '', '', '', '', '', ''])
    }
    if (invoice.clientInfo.email) {
      invoiceData.push([`Email: ${invoice.clientInfo.email}`, '', '', '', '', '', ''])
    }
    invoiceData.push(['', '', '', '', '', '', ''])
    invoiceData.push(['━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', '', '', '', '', '', ''])
    invoiceData.push(['', '', '', '', '', '', ''])
    
    // Line items header with visual enhancement
    invoiceData.push(['DESCRIPTION', 'QTY', 'UNIT PRICE', 'NET AMOUNT', 'VAT %', 'VAT AMOUNT', 'TOTAL'])
    invoiceData.push(['───────────', '───', '──────────', '──────────', '─────', '──────────', '─────'])
    
    // Line items
    invoice.lineItems.forEach(item => {
      invoiceData.push([
        item.description,
        item.quantity,
        formatCurrency(item.unitPrice),
        formatCurrency(item.netAmount),
        `${(item.vatRate * 100).toFixed(0)}%`,
        formatCurrency(item.vatAmount),
        formatCurrency(item.grossAmount)
      ])
    })
    
    invoiceData.push(['───────────', '───', '──────────', '──────────', '─────', '──────────', '─────'])
    invoiceData.push(['', '', '', '', '', '', ''])
    
    // Totals with visual enhancement
    invoiceData.push(['', '', '', '', '', 'Subtotal (Net):', formatCurrency(invoice.subtotal)])
    invoiceData.push(['', '', '', '', '', 'VAT Total:', formatCurrency(invoice.totalVAT)])
    invoiceData.push(['', '', '', '', '', '═══════════════', '═══════════'])
    invoiceData.push(['', '', '', '', '', 'TOTAL AMOUNT:', formatCurrency(invoice.totalAmount)])
    invoiceData.push(['', '', '', '', '', '═══════════════', '═══════════'])
    
    // Payment terms and notes
    if (invoice.paymentTerms) {
      invoiceData.push(['', '', '', '', '', '', ''])
      invoiceData.push(['──────────── PAYMENT TERMS ────────────', '', '', '', '', '', ''])
      invoiceData.push([invoice.paymentTerms, '', '', '', '', '', ''])
    }
    
    if (invoice.notes) {
      invoiceData.push(['', '', '', '', '', '', ''])
      invoiceData.push(['──────────── NOTES ────────────', '', '', '', '', '', ''])
      invoiceData.push([invoice.notes, '', '', '', '', '', ''])
    }
    
    // Footer with Braunwell branding
    invoiceData.push(['', '', '', '', '', '', ''])
    invoiceData.push(['━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', '', '', '', '', '', ''])
    invoiceData.push(['Thank you for your business!', '', '', '', '', '', ''])
    invoiceData.push(['', '', '', '', '', '', ''])
    invoiceData.push(['This invoice was generated by Braunwell CRM', '', '', '', '', '', ''])
    invoiceData.push(['www.braunwell.co.uk', '', '', '', '', '', ''])
    invoiceData.push(['London, UK • Dublin, Ireland • Vancouver, Canada', '', '', '', '', '', ''])
    invoiceData.push(['━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', '', '', '', '', '', ''])
    
    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(invoiceData)
    
    // Define merged cells for centered content
    const merges = []
    
    // Find and merge specific rows
    for (let i = 0; i < invoiceData.length; i++) {
      const cell = invoiceData[i][0]
      // Merge header and footer rows
      if (cell && (
          cell.includes('BRAUNWELL') ||
          cell === 'AI Software Services for Small & Medium Businesses' ||
          cell.includes('━━━') ||
          cell.includes('FROM ──') ||
          cell.includes('BILL TO ──') ||
          cell.includes('PAYMENT TERMS ──') ||
          cell.includes('NOTES ──') ||
          cell === 'Thank you for your business!' ||
          cell === 'This invoice was generated by Braunwell CRM' ||
          cell === 'www.braunwell.co.uk' ||
          cell === 'London, UK • Dublin, Ireland • Vancouver, Canada'
      )) {
        merges.push({ s: { r: i, c: 0 }, e: { r: i, c: 6 } })
      }
      // Merge company and client info rows (except line items)
      if (i > 10 && invoiceData[i][0] && invoiceData[i][1] === '' && 
          !invoiceData[i][0].includes('──') && !invoiceData[i][0].includes('━━') &&
          invoiceData[i][0] !== 'DESCRIPTION' && i < invoiceData.length - 10) {
        merges.push({ s: { r: i, c: 0 }, e: { r: i, c: 6 } })
      }
    }
    
    ws['!merges'] = merges
    
    // Set column widths
    ws['!cols'] = [
      { wch: 35 }, // Description
      { wch: 8 },  // Quantity
      { wch: 12 }, // Unit Price
      { wch: 12 }, // Net Amount
      { wch: 8 },  // VAT Rate
      { wch: 12 }, // VAT Amount
      { wch: 12 }, // Total
    ]
    
    // Add worksheet to workbook with Braunwell branding
    XLSX.utils.book_append_sheet(wb, ws, 'Braunwell Invoice')
    
    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    
    // Save file
    const defaultFilename = `${invoice.invoiceNumber}-${invoice.companyInfo.name.replace(/\s+/g, '-')}.xlsx`
    saveAs(blob, filename || defaultFilename)
  } catch (error) {
    console.error('Error generating Excel:', error)
    throw new Error('Failed to generate Excel file. Please try again.')
  }
}

/**
 * Generate filename for invoice exports
 */
export function generateInvoiceFilename(
  invoice: InvoiceData,
  extension: 'pdf' | 'xlsx'
): string {
  const companyName = invoice.companyInfo.name.replace(/\s+/g, '-')
  const date = new Date(invoice.issueDate).toISOString().split('T')[0]
  return `${invoice.invoiceNumber}-${companyName}-${date}.${extension}`
}