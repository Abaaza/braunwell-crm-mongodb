import { NextRequest } from 'next/server'

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

// In-memory store for rate limiting
// In production, you'd want to use Redis or a distributed cache
const store: RateLimitStore = {}

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  keyGenerator?: (req: NextRequest) => string
}

interface RateLimitResult {
  success: boolean
  retryAfter?: number
  remaining?: number
}

class RateLimit {
  private configs: Map<string, RateLimitConfig> = new Map()
  
  constructor() {
    // Default configurations for different endpoints
    this.configs.set('default', {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100
    })
    
    this.configs.set('/api/auth/login', {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5
    })
    
    this.configs.set('/api/auth/register', {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 3
    })
    
    this.configs.set('/api/auth/password-reset', {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 3
    })
    
    // API routes
    this.configs.set('/api', {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 300
    })
    
    // Form submissions
    this.configs.set('/forms', {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 20
    })
  }
  
  private getConfig(path: string): RateLimitConfig {
    // Find the most specific matching config
    for (const [configPath, config] of this.configs.entries()) {
      if (path.startsWith(configPath)) {
        return config
      }
    }
    return this.configs.get('default')!
  }
  
  private generateKey(ip: string, path: string): string {
    return `${ip}:${path}`
  }
  
  private cleanup() {
    const now = Date.now()
    for (const key in store) {
      if (store[key].resetTime <= now) {
        delete store[key]
      }
    }
  }
  
  async check(ip: string, path: string): Promise<RateLimitResult> {
    const config = this.getConfig(path)
    const key = this.generateKey(ip, path)
    const now = Date.now()
    
    // Cleanup expired entries
    this.cleanup()
    
    // Get or create entry
    let entry = store[key]
    if (!entry || entry.resetTime <= now) {
      entry = {
        count: 0,
        resetTime: now + config.windowMs
      }
      store[key] = entry
    }
    
    // Increment count
    entry.count++
    
    // Check if limit exceeded
    if (entry.count > config.maxRequests) {
      return {
        success: false,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000)
      }
    }
    
    return {
      success: true,
      remaining: config.maxRequests - entry.count
    }
  }
  
  async reset(ip: string, path: string): Promise<void> {
    const key = this.generateKey(ip, path)
    delete store[key]
  }
  
  // Additional method to check specific endpoints
  async checkEndpoint(req: NextRequest): Promise<RateLimitResult> {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1'
    const path = req.nextUrl.pathname
    
    return this.check(ip, path)
  }
}

export const rateLimit = new RateLimit()

// Helper function for API routes
export async function withRateLimit<T>(
  req: NextRequest,
  handler: () => Promise<T>
): Promise<T> {
  const result = await rateLimit.checkEndpoint(req)
  
  if (!result.success) {
    throw new Error(`Rate limit exceeded. Retry after ${result.retryAfter} seconds.`)
  }
  
  return handler()
}

// Specific rate limiters for different use cases
export const authRateLimit = {
  login: async (ip: string) => rateLimit.check(ip, '/api/auth/login'),
  register: async (ip: string) => rateLimit.check(ip, '/api/auth/register'),
  passwordReset: async (ip: string) => rateLimit.check(ip, '/api/auth/password-reset')
}

export const apiRateLimit = {
  general: async (ip: string) => rateLimit.check(ip, '/api'),
  uploads: async (ip: string) => rateLimit.check(ip, '/api/uploads'),
  webhooks: async (ip: string) => rateLimit.check(ip, '/api/webhooks')
}

export const formRateLimit = {
  contact: async (ip: string) => rateLimit.check(ip, '/forms/contact'),
  feedback: async (ip: string) => rateLimit.check(ip, '/forms/feedback')
}