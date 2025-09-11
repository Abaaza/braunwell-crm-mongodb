import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from './rate-limit'
import { validateCSRFToken } from './csrf'
import { getCookie } from 'cookies-next'

export interface SecurityOptions {
  requireAuth?: boolean
  requireCSRF?: boolean
  rateLimit?: {
    windowMs?: number
    maxRequests?: number
  }
  allowedMethods?: string[]
  requireRole?: 'admin' | 'user'
}

export class SecurityError extends Error {
  constructor(
    message: string,
    public statusCode: number = 403,
    public retryAfter?: number
  ) {
    super(message)
    this.name = 'SecurityError'
  }
}

// Security middleware for API routes
export async function withSecurity(
  req: NextRequest,
  options: SecurityOptions = {}
): Promise<void> {
  const {
    requireAuth = true,
    requireCSRF = true,
    allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    requireRole,
  } = options

  // Method validation
  if (!allowedMethods.includes(req.method)) {
    throw new SecurityError(`Method ${req.method} not allowed`, 405)
  }

  // Rate limiting
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1'
  const rateLimitResult = await rateLimit.check(ip, req.nextUrl.pathname)
  
  if (!rateLimitResult.success) {
    throw new SecurityError(
      'Too many requests',
      429,
      rateLimitResult.retryAfter
    )
  }

  // CSRF protection for state-changing methods
  if (requireCSRF && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const csrfToken = req.headers.get('x-csrf-token')
    
    if (!csrfToken) {
      throw new SecurityError('CSRF token missing', 403)
    }

    const sessionToken = getCookie('session-token', { req })
    const isValidCSRF = await validateCSRFToken(csrfToken, sessionToken as string)
    
    if (!isValidCSRF) {
      throw new SecurityError('Invalid CSRF token', 403)
    }
  }

  // Origin validation
  const origin = req.headers.get('origin')
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'https://localhost:3000',
    'http://localhost:3001',
    'https://localhost:3001'
  ]
  
  if (origin && !allowedOrigins.includes(origin)) {
    throw new SecurityError('Invalid origin', 403)
  }

  // Content-Type validation for POST/PUT requests
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers.get('content-type')
    
    if (!contentType || !contentType.includes('application/json')) {
      throw new SecurityError('Invalid content type', 400)
    }
  }

  // User-Agent validation (basic bot detection)
  const userAgent = req.headers.get('user-agent')
  const suspiciousAgents = [
    'curl',
    'wget',
    'python-requests',
    'bot',
    'crawler',
    'spider'
  ]
  
  if (userAgent && suspiciousAgents.some(agent => 
    userAgent.toLowerCase().includes(agent.toLowerCase())
  )) {
    // Log suspicious activity but don't block (could be legitimate)
    console.warn('Suspicious user agent detected:', userAgent)
  }
}

// Wrapper function for API route handlers
export function secureApiRoute<T extends any[]>(
  handler: (...args: T) => Promise<Response>,
  options: SecurityOptions = {}
) {
  return async (...args: T): Promise<Response> => {
    const req = args[0] as NextRequest
    
    try {
      await withSecurity(req, options)
      return await handler(...args)
    } catch (error) {
      if (error instanceof SecurityError) {
        const response = NextResponse.json(
          { error: error.message },
          { status: error.statusCode }
        )
        
        if (error.retryAfter) {
          response.headers.set('Retry-After', error.retryAfter.toString())
        }
        
        return response
      }
      
      // Re-throw other errors
      throw error
    }
  }
}

// Input validation helpers
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePassword(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export function sanitizeInput(input: string): string {
  // Remove HTML tags and potentially dangerous characters
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>'"&]/g, '') // Remove dangerous characters
    .trim()
}

// Request size validation
export function validateRequestSize(req: NextRequest, maxSize: number = 1024 * 1024): boolean {
  const contentLength = req.headers.get('content-length')
  
  if (contentLength && parseInt(contentLength) > maxSize) {
    return false
  }
  
  return true
}

// IP whitelist/blacklist functionality
const ipWhitelist = new Set<string>()
const ipBlacklist = new Set<string>()

export function addToWhitelist(ip: string): void {
  ipWhitelist.add(ip)
}

export function addToBlacklist(ip: string): void {
  ipBlacklist.add(ip)
}

export function isIpAllowed(ip: string): boolean {
  if (ipBlacklist.has(ip)) {
    return false
  }
  
  if (ipWhitelist.size > 0 && !ipWhitelist.has(ip)) {
    return false
  }
  
  return true
}

// Security headers utility
export function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  
  return response
}