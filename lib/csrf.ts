import { SignJWT, jwtVerify } from 'jose'
import { v4 as uuidv4 } from 'uuid'

const JWT_SECRET = process.env.CSRF_SECRET || 'your-csrf-secret-key-change-in-production'
const secret = new TextEncoder().encode(JWT_SECRET)

export interface CSRFTokenPayload {
  sessionId: string
  timestamp: number
  nonce: string
}

export async function generateCSRFToken(sessionId?: string): Promise<string> {
  const payload: CSRFTokenPayload = {
    sessionId: sessionId || 'anonymous',
    timestamp: Date.now(),
    nonce: uuidv4()
  }

  const token = await new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h') // Token expires in 1 hour
    .sign(secret)

  return token
}

export async function validateCSRFToken(token: string, sessionId?: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, secret)
    const csrfPayload = payload as unknown as CSRFTokenPayload

    // Check if token is expired (additional check beyond JWT expiry)
    const tokenAge = Date.now() - csrfPayload.timestamp
    const maxAge = 60 * 60 * 1000 // 1 hour in milliseconds
    
    if (tokenAge > maxAge) {
      return false
    }

    // If sessionId is provided, it must match
    if (sessionId && csrfPayload.sessionId !== sessionId) {
      return false
    }

    return true
  } catch (error) {
    console.error('CSRF token validation error:', error)
    return false
  }
}

// Store for used tokens to prevent replay attacks
const usedTokens = new Set<string>()

export async function validateAndConsumeCSRFToken(token: string, sessionId?: string): Promise<boolean> {
  // Check if token was already used
  if (usedTokens.has(token)) {
    return false
  }

  const isValid = await validateCSRFToken(token, sessionId)
  
  if (isValid) {
    // Mark token as used
    usedTokens.add(token)
    
    // Clean up old tokens periodically (simple cleanup)
    if (usedTokens.size > 10000) {
      usedTokens.clear()
    }
  }

  return isValid
}

// Helper function to get CSRF token from headers or body
export function getCSRFTokenFromRequest(req: Request): string | null {
  // Check headers first
  const headerToken = req.headers.get('x-csrf-token')
  if (headerToken) {
    return headerToken
  }

  // For form submissions, check body (this would need to be implemented per form)
  return null
}

// Double submit cookie pattern implementation
export function generateDoubleSubmitToken(): string {
  return uuidv4()
}

export function validateDoubleSubmitToken(cookieToken: string, headerToken: string): boolean {
  return cookieToken === headerToken && cookieToken.length > 0
}

// CSRF protection middleware for API routes
export async function withCSRFProtection<T>(
  req: Request,
  handler: () => Promise<T>,
  options?: { sessionId?: string; skipMethods?: string[] }
): Promise<T> {
  const method = req.method
  const skipMethods = options?.skipMethods || ['GET', 'HEAD', 'OPTIONS']
  
  // Skip CSRF protection for safe methods
  if (skipMethods.includes(method)) {
    return handler()
  }

  const csrfToken = getCSRFTokenFromRequest(req)
  
  if (!csrfToken) {
    throw new Error('CSRF token missing')
  }

  const isValid = await validateAndConsumeCSRFToken(csrfToken, options?.sessionId)
  
  if (!isValid) {
    throw new Error('Invalid CSRF token')
  }

  return handler()
}

// React hook for CSRF protection
export function useCSRFToken() {
  const getToken = async (): Promise<string> => {
    const response = await fetch('/api/csrf-token', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error('Failed to get CSRF token')
    }
    
    const data = await response.json()
    return data.token
  }

  const setTokenInHeaders = (token: string) => {
    return {
      'x-csrf-token': token,
      'Content-Type': 'application/json',
    }
  }

  return { getToken, setTokenInHeaders }
}

// CSRF token validation for forms
export async function validateFormCSRF(formData: FormData): Promise<boolean> {
  const token = formData.get('_csrf') as string
  
  if (!token) {
    return false
  }

  return validateCSRFToken(token)
}

// Generate CSRF token for server-side rendering
export async function getServerSideCSRFToken(sessionId?: string): Promise<string> {
  return generateCSRFToken(sessionId)
}