import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { validateCSRFToken } from '@/lib/csrf'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  
  // Strict Transport Security for HTTPS
  if (request.nextUrl.protocol === 'https:') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Relaxed for Next.js dev
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "connect-src 'self' wss: ws:",
  ].join('; ')
  
  response.headers.set('Content-Security-Policy', csp)

  // Rate limiting check
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1'
  const rateLimitResult = await rateLimit.check(ip, request.nextUrl.pathname)
  
  if (!rateLimitResult.success) {
    return new NextResponse(
      JSON.stringify({ 
        error: 'Too many requests',
        retryAfter: rateLimitResult.retryAfter 
      }),
      { 
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': rateLimitResult.retryAfter?.toString() || '60'
        }
      }
    )
  }

  // CSRF protection for POST, PUT, DELETE, PATCH requests
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    const csrfToken = request.headers.get('x-csrf-token')
    const origin = request.headers.get('origin')
    const referer = request.headers.get('referer')
    
    // Skip CSRF validation for API routes that don't require it (like login)
    const skipCSRFPaths = ['/api/auth/login', '/api/auth/register']
    const shouldSkipCSRF = skipCSRFPaths.some(path => 
      request.nextUrl.pathname.startsWith(path)
    )
    
    if (!shouldSkipCSRF) {
      // Validate CSRF token
      if (!csrfToken || !(await validateCSRFToken(csrfToken))) {
        return new NextResponse(
          JSON.stringify({ error: 'Invalid CSRF token' }),
          { 
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
      
      // Origin validation
      const allowedOrigins = [
        process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'https://localhost:3000',
        'https://crm.braunwell.co.uk'
      ]
      
      if (origin && !allowedOrigins.includes(origin)) {
        return new NextResponse(
          JSON.stringify({ error: 'Invalid origin' }),
          { 
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}