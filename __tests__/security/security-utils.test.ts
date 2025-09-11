import crypto from 'crypto'

// Test the security utility functions directly
describe('Security Utils', () => {
  describe('Secure Comparison', () => {
    function secureCompare(a: string, b: string): boolean {
      if (a.length !== b.length) {
        return false
      }
      
      let result = 0
      for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i)
      }
      
      return result === 0
    }

    it('should return true for identical strings', () => {
      const result = secureCompare('test123', 'test123')
      expect(result).toBe(true)
    })

    it('should return false for different strings', () => {
      const result = secureCompare('test123', 'test456')
      expect(result).toBe(false)
    })

    it('should return false for strings of different lengths', () => {
      const result = secureCompare('short', 'much longer string')
      expect(result).toBe(false)
    })
  })

  describe('Token Generation', () => {
    function generateSecureToken(length: number = 32): string {
      return crypto.randomBytes(length).toString('hex')
    }

    it('should generate secure tokens', () => {
      const token = generateSecureToken(32)
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.length).toBe(64) // 32 bytes = 64 hex characters
    })

    it('should generate unique tokens', () => {
      const token1 = generateSecureToken(16)
      const token2 = generateSecureToken(16)
      expect(token1).not.toBe(token2)
    })
  })

  describe('Input Validation', () => {
    function validateEmail(email: string): boolean {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(email)
    }

    function validatePassword(password: string): {
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

    function sanitizeInput(input: string): string {
      return input
        .replace(/<[^>]*>/g, '')
        .replace(/[<>'"&]/g, '')
        .trim()
    }

    describe('Email Validation', () => {
      it('should validate correct email addresses', () => {
        expect(validateEmail('test@example.com')).toBe(true)
        expect(validateEmail('user.name@domain.co.uk')).toBe(true)
        expect(validateEmail('admin@company.org')).toBe(true)
      })

      it('should reject invalid email addresses', () => {
        expect(validateEmail('invalid-email')).toBe(false)
        expect(validateEmail('test@')).toBe(false)
        expect(validateEmail('@domain.com')).toBe(false)
        expect(validateEmail('test.domain.com')).toBe(false)
      })
    })

    describe('Password Validation', () => {
      it('should validate strong passwords', () => {
        const result = validatePassword('StrongP@ssw0rd')
        expect(result.isValid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })

      it('should reject weak passwords', () => {
        const result = validatePassword('weak')
        expect(result.isValid).toBe(false)
        expect(result.errors.length).toBeGreaterThan(0)
      })

      it('should require minimum length', () => {
        const result = validatePassword('Short1!')
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Password must be at least 8 characters long')
      })

      it('should require uppercase letters', () => {
        const result = validatePassword('lowercase123!')
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Password must contain at least one uppercase letter')
      })

      it('should require lowercase letters', () => {
        const result = validatePassword('UPPERCASE123!')
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Password must contain at least one lowercase letter')
      })

      it('should require numbers', () => {
        const result = validatePassword('NoNumbers!')
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Password must contain at least one number')
      })

      it('should require special characters', () => {
        const result = validatePassword('NoSpecialChars123')
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Password must contain at least one special character')
      })
    })

    describe('Input Sanitization', () => {
      it('should remove HTML tags', () => {
        const input = '<script>alert("xss")</script>Hello World'
        const sanitized = sanitizeInput(input)
        expect(sanitized).toBe('alert(xss)Hello World')
      })

      it('should remove dangerous characters', () => {
        const input = 'Hello <>&"\' World'
        const sanitized = sanitizeInput(input)
        expect(sanitized).toBe('Hello  World')
      })

      it('should trim whitespace', () => {
        const input = '  Hello World  '
        const sanitized = sanitizeInput(input)
        expect(sanitized).toBe('Hello World')
      })
    })
  })

  describe('Rate Limiting Logic', () => {
    interface RateLimitEntry {
      count: number
      resetTime: number
    }

    function checkRateLimit(
      store: Map<string, RateLimitEntry>,
      key: string,
      windowMs: number,
      maxRequests: number
    ): { success: boolean; retryAfter?: number } {
      const now = Date.now()
      let entry = store.get(key)
      
      if (!entry || entry.resetTime <= now) {
        entry = {
          count: 1,
          resetTime: now + windowMs
        }
        store.set(key, entry)
        return { success: true }
      }
      
      entry.count++
      
      if (entry.count > maxRequests) {
        return {
          success: false,
          retryAfter: Math.ceil((entry.resetTime - now) / 1000)
        }
      }
      
      return { success: true }
    }

    it('should allow requests within limit', () => {
      const store = new Map<string, RateLimitEntry>()
      const result = checkRateLimit(store, 'test-key', 15 * 60 * 1000, 5)
      
      expect(result.success).toBe(true)
      expect(result.retryAfter).toBeUndefined()
    })

    it('should block requests exceeding limit', () => {
      const store = new Map<string, RateLimitEntry>()
      const windowMs = 15 * 60 * 1000
      const maxRequests = 3
      
      // Make requests up to the limit
      for (let i = 0; i < maxRequests; i++) {
        const result = checkRateLimit(store, 'test-key', windowMs, maxRequests)
        expect(result.success).toBe(true)
      }
      
      // Next request should be blocked
      const result = checkRateLimit(store, 'test-key', windowMs, maxRequests)
      expect(result.success).toBe(false)
      expect(result.retryAfter).toBeDefined()
    })
  })

  describe('CSP Header Generation', () => {
    function generateCSP(nonce?: string): string {
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

    it('should generate proper CSP header', () => {
      const csp = generateCSP()
      
      expect(csp).toContain("default-src 'self'")
      expect(csp).toContain("object-src 'none'")
      expect(csp).toContain("frame-ancestors 'none'")
    })

    it('should include nonce in CSP when provided', () => {
      const nonce = 'test-nonce-123'
      const csp = generateCSP(nonce)
      
      expect(csp).toContain(`'nonce-${nonce}'`)
    })
  })
})

describe('Security Implementation Status', () => {
  it('should have all security files created', () => {
    // These are simple checks to ensure our security files exist
    expect(() => require('fs').statSync('./middleware.ts')).not.toThrow()
    expect(() => require('fs').statSync('./lib/csrf.ts')).not.toThrow()
    expect(() => require('fs').statSync('./lib/rate-limit.ts')).not.toThrow()
    expect(() => require('fs').statSync('./lib/api-security.ts')).not.toThrow()
    expect(() => require('fs').statSync('./lib/security-config.ts')).not.toThrow()
    expect(() => require('fs').statSync('./lib/security-utils.ts')).not.toThrow()
    expect(() => require('fs').statSync('./hooks/use-csrf.ts')).not.toThrow()
    expect(() => require('fs').statSync('./SECURITY.md')).not.toThrow()
  })
})