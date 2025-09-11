import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amount)
}

export function formatDate(date: number | Date): string {
  const d = typeof date === "number" ? new Date(date) : date
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d)
}

export function formatDateTime(date: number | Date): string {
  const d = typeof date === "number" ? new Date(date) : date
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d)
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function validateUKPhone(phone: string): boolean {
  const ukPhoneRegex = /^(?:(?:\+44)|(?:0))(?:\d\s?){9,10}$/
  return ukPhoneRegex.test(phone.replace(/\s/g, ""))
}

// UK VAT utilities
export const UK_VAT_RATE = 0.20 // 20% UK VAT rate

export function calculateVAT(netAmount: number): number {
  return netAmount * UK_VAT_RATE
}

export function calculateGrossAmount(netAmount: number): number {
  return netAmount + calculateVAT(netAmount)
}

export function calculateNetFromGross(grossAmount: number): number {
  return grossAmount / (1 + UK_VAT_RATE)
}

export function formatCurrencyWithVAT(netAmount: number): {
  net: string
  vat: string
  gross: string
} {
  const vat = calculateVAT(netAmount)
  const gross = netAmount + vat
  
  return {
    net: formatCurrency(netAmount),
    vat: formatCurrency(vat),
    gross: formatCurrency(gross)
  }
}

export function formatUKPostcode(postcode: string): string {
  // Remove any spaces and convert to uppercase
  const clean = postcode.replace(/\s/g, '').toUpperCase()
  
  // UK postcode format: first part (1-2 letters + 1-2 numbers + optional letter) + space + second part (1 number + 2 letters)
  if (clean.length >= 5 && clean.length <= 7) {
    const firstPart = clean.slice(0, -3)
    const secondPart = clean.slice(-3)
    return `${firstPart} ${secondPart}`
  }
  
  return postcode // Return original if doesn't match expected format
}

export function validateUKPostcode(postcode: string): boolean {
  const ukPostcodeRegex = /^[A-Z]{1,2}[0-9]{1,2}[A-Z]?\s?[0-9][A-Z]{2}$/i
  return ukPostcodeRegex.test(postcode.replace(/\s/g, ''))
}

export function formatDistanceToNow(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) {
    return 'just now'
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`
  }
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`
  }
  
  const diffInWeeks = Math.floor(diffInDays / 7)
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks === 1 ? '' : 's'} ago`
  }
  
  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths === 1 ? '' : 's'} ago`
  }
  
  const diffInYears = Math.floor(diffInDays / 365)
  return `${diffInYears} year${diffInYears === 1 ? '' : 's'} ago`
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}