import { NextRequest, NextResponse } from 'next/server'
import { secureApiRoute } from '@/lib/api-security'

// Example of a secure API route
export const GET = secureApiRoute(async (req: NextRequest) => {
  // This route is automatically protected by security middleware
  return NextResponse.json({ 
    message: 'This is a secure endpoint',
    timestamp: new Date().toISOString()
  })
}, {
  requireAuth: true,
  requireCSRF: false, // GET requests don't need CSRF
  allowedMethods: ['GET'],
})

export const POST = secureApiRoute(async (req: NextRequest) => {
  const body = await req.json()
  
  // This route is automatically protected by security middleware
  // Including CSRF protection, rate limiting, and input validation
  return NextResponse.json({ 
    message: 'Data processed securely',
    data: body,
    timestamp: new Date().toISOString()
  })
}, {
  requireAuth: true,
  requireCSRF: true,
  allowedMethods: ['POST'],
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 20,
  },
})