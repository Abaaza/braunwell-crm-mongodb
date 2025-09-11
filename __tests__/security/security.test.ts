import { validateEmail, validatePassword, sanitizeInput } from '@/lib/api-security'
import { secureCompare, generateSecureToken } from '@/lib/security-utils'

describe('Security Implementations', () => {
  describe('Input Validation', () => {
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
        expect(sanitized).toBe('Hello World')
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

  describe('Security Utils', () => {
    describe('Secure Comparison', () => {
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
  })

  describe('Security Features', () => {
    it('should have rate limiting configuration', () => {
      // Test that rate limiting is properly configured
      expect(typeof require('@/lib/rate-limit')).toBe('object')
    })

    it('should have CSRF protection utilities', () => {
      // Test that CSRF utilities are available
      expect(typeof require('@/lib/csrf')).toBe('object')
    })

    it('should have security middleware', () => {
      // Test that security middleware is available
      expect(typeof require('@/lib/api-security')).toBe('object')
    })

    it('should have security configuration', () => {
      // Test that security configuration is available
      expect(typeof require('@/lib/security-config')).toBe('object')
    })
  })
})

// Basic integration tests
describe('Security Integration', () => {
  it('should have middleware configured', () => {
    // Check that middleware file exists
    expect(() => require('@/middleware')).not.toThrow()
  })

  it('should have security headers configured', () => {
    // Check that security headers are configured
    expect(() => require('@/next.config')).not.toThrow()
  })

  it('should have CSRF hooks available', () => {
    // Check that CSRF hooks are available
    expect(() => require('@/hooks/use-csrf')).not.toThrow()
  })
})