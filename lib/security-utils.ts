import crypto from 'crypto'
import { NextRequest } from 'next/server'

// Generate secure random tokens
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

// Generate cryptographically secure random string
export function generateSecureRandomString(length: number = 16): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, charset.length)
    result += charset.charAt(randomIndex)
  }
  
  return result
}

// Hash data with salt
export function hashWithSalt(data: string, salt?: string): { hash: string; salt: string } {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(data, actualSalt, 10000, 64, 'sha512').toString('hex')
  
  return { hash, salt: actualSalt }
}

// Verify hashed data
export function verifyHash(data: string, hash: string, salt: string): boolean {
  const computedHash = crypto.pbkdf2Sync(data, salt, 10000, 64, 'sha512').toString('hex')
  return computedHash === hash
}

// Secure comparison to prevent timing attacks
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }
  
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  
  return result === 0
}

// Extract client IP address
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const real = req.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (real) {
    return real
  }
  
  return '127.0.0.1'
}

// Validate IP address format
export function isValidIp(ip: string): boolean {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip)
}

// Sanitize string for XSS prevention
export function sanitizeHtml(input: string): string {
  const htmlEntities: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  }
  
  return input.replace(/[&<>"'/]/g, (match) => htmlEntities[match])
}

// Validate and sanitize SQL input
export function sanitizeSqlInput(input: string): string {
  // Remove SQL injection patterns
  const sqlPatterns = [
    /(\b(ALTER|CREATE|DELETE|DROP|EXEC(UTE)?|INSERT|MERGE|SELECT|UPDATE|UNION|USE)\b)/gi,
    /(--|\*|\||;|'|"|`)/g,
    /(\bor\b|\band\b)/gi,
  ]
  
  let sanitized = input
  sqlPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '')
  })
  
  return sanitized.trim()
}

// Detect suspicious patterns
export function detectSuspiciousActivity(req: NextRequest): string[] {
  const suspiciousPatterns: string[] = []
  const userAgent = req.headers.get('user-agent') || ''
  const url = req.url
  
  // Check for bot patterns
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python-requests/i,
  ]
  
  if (botPatterns.some(pattern => pattern.test(userAgent))) {
    suspiciousPatterns.push('suspicious_user_agent')
  }
  
  // Check for SQL injection patterns
  const sqlPatterns = [
    /union.*select/i,
    /or.*1.*=.*1/i,
    /drop.*table/i,
    /select.*from.*information_schema/i,
  ]
  
  if (sqlPatterns.some(pattern => pattern.test(url))) {
    suspiciousPatterns.push('sql_injection_attempt')
  }
  
  // Check for XSS patterns
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /eval\s*\(/i,
  ]
  
  if (xssPatterns.some(pattern => pattern.test(url))) {
    suspiciousPatterns.push('xss_attempt')
  }
  
  // Check for path traversal
  const pathTraversalPatterns = [
    /\.\.\//,
    /\.\.\\/,
    /%2e%2e/i,
    /etc\/passwd/i,
    /windows\/system32/i,
  ]
  
  if (pathTraversalPatterns.some(pattern => pattern.test(url))) {
    suspiciousPatterns.push('path_traversal_attempt')
  }
  
  return suspiciousPatterns
}

// Generate Content Security Policy header
export function generateCSP(nonce?: string): string {
  const directives = [
    "default-src 'self'",
    nonce ? `script-src 'self' 'nonce-${nonce}'` : "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "connect-src 'self' wss: ws:",
    "upgrade-insecure-requests",
  ]
  
  return directives.join('; ')
}

// Encrypt sensitive data
export function encryptSensitiveData(data: string, key?: string): string {
  const secretKey = key || process.env.ENCRYPTION_KEY || 'default-key-change-in-production'
  // Create a 32-byte key from the secret key
  const keyBuffer = crypto.createHash('sha256').update(secretKey).digest()
  // Create a random IV
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, iv)
  
  let encrypted = cipher.update(data, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  // Prepend IV to encrypted data
  return iv.toString('hex') + ':' + encrypted
}

// Decrypt sensitive data
export function decryptSensitiveData(encryptedData: string, key?: string): string {
  const secretKey = key || process.env.ENCRYPTION_KEY || 'default-key-change-in-production'
  // Create a 32-byte key from the secret key
  const keyBuffer = crypto.createHash('sha256').update(secretKey).digest()
  
  // Extract IV and encrypted text
  const parts = encryptedData.split(':')
  if (parts.length !== 2) {
    throw new Error('Invalid encrypted data format')
  }
  
  const iv = Buffer.from(parts[0], 'hex')
  const encrypted = parts[1]
  
  const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, iv)
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

// Validate file upload
export function validateFileUpload(file: File): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  const maxSize = 10 * 1024 * 1024 // 10MB
  
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ]
  
  if (file.size > maxSize) {
    errors.push('File size exceeds maximum allowed size (10MB)')
  }
  
  if (!allowedTypes.includes(file.type)) {
    errors.push('File type not allowed')
  }
  
  // Check for suspicious file extensions
  const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.vbs', '.js']
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
  
  if (suspiciousExtensions.includes(fileExtension)) {
    errors.push('File extension not allowed')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Rate limiting token bucket implementation
export class TokenBucket {
  private tokens: number
  private lastRefill: number
  
  constructor(
    private capacity: number,
    private refillRate: number, // tokens per second
    private refillPeriod: number = 1000 // milliseconds
  ) {
    this.tokens = capacity
    this.lastRefill = Date.now()
  }
  
  consume(tokens: number = 1): boolean {
    this.refill()
    
    if (this.tokens >= tokens) {
      this.tokens -= tokens
      return true
    }
    
    return false
  }
  
  private refill(): void {
    const now = Date.now()
    const timePassed = now - this.lastRefill
    
    if (timePassed >= this.refillPeriod) {
      const tokensToAdd = Math.floor(timePassed / this.refillPeriod) * this.refillRate
      this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd)
      this.lastRefill = now
    }
  }
}

// Create audit log entry
export interface AuditLogEntry {
  action: string
  userId?: string
  ip: string
  userAgent: string
  timestamp: number
  details?: Record<string, any>
}

export function createAuditLog(
  action: string,
  req: NextRequest,
  details?: Record<string, any>
): AuditLogEntry {
  return {
    action,
    ip: getClientIp(req),
    userAgent: req.headers.get('user-agent') || '',
    timestamp: Date.now(),
    details,
  }
}

// Security headers factory
export function createSecurityHeaders(nonce?: string): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), speaker=(), bluetooth=(), midi=(), document-domain=()',
    'Content-Security-Policy': generateCSP(nonce),
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  }
}