import {
  cn,
  formatCurrency,
  formatDate,
  formatDateTime,
  getInitials,
  validateUKPhone,
} from '@/lib/utils'

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('px-2', 'py-1')).toBe('px-2 py-1')
    })

    it('should handle conditional classes', () => {
      expect(cn('base', undefined, 'active')).toBe('base active')
    })

    it('should merge tailwind classes correctly', () => {
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
    })

    it('should handle arrays', () => {
      expect(cn(['px-2', 'py-1'], 'mt-2')).toBe('px-2 py-1 mt-2')
    })

    it('should handle objects', () => {
      expect(cn({ 'px-2': true, 'py-1': false, 'mt-2': true })).toBe('px-2 mt-2')
    })
  })

  describe('formatCurrency', () => {
    it('should format positive amounts correctly', () => {
      expect(formatCurrency(1000)).toBe('£1,000.00')
      expect(formatCurrency(1500.50)).toBe('£1,500.50')
    })

    it('should format negative amounts correctly', () => {
      expect(formatCurrency(-500)).toBe('-£500.00')
    })

    it('should format zero correctly', () => {
      expect(formatCurrency(0)).toBe('£0.00')
    })

    it('should handle decimal places', () => {
      expect(formatCurrency(99.99)).toBe('£99.99')
      expect(formatCurrency(99.999)).toBe('£100.00')
    })
  })

  describe('formatDate', () => {
    it('should format date from timestamp', () => {
      const timestamp = new Date('2024-03-15').getTime()
      expect(formatDate(timestamp)).toBe('15/03/2024')
    })

    it('should format date from Date object', () => {
      const date = new Date('2024-12-25')
      expect(formatDate(date)).toBe('25/12/2024')
    })

    it('should handle single digit days and months', () => {
      const date = new Date('2024-01-05')
      expect(formatDate(date)).toBe('05/01/2024')
    })
  })

  describe('formatDateTime', () => {
    it('should format date and time from timestamp', () => {
      const timestamp = new Date('2024-03-15T14:30:00').getTime()
      expect(formatDateTime(timestamp)).toMatch(/15\/03\/2024/)
    })

    it('should format date and time from Date object', () => {
      const date = new Date('2024-12-25T09:15:00')
      expect(formatDateTime(date)).toMatch(/25\/12\/2024/)
    })

    it('should include hours and minutes', () => {
      const date = new Date('2024-03-15T14:30:00')
      const formatted = formatDateTime(date)
      expect(formatted).toMatch(/14:30|2:30/)
    })
  })

  describe('getInitials', () => {
    it('should get initials from full name', () => {
      expect(getInitials('John Doe')).toBe('JD')
      expect(getInitials('Jane Mary Smith')).toBe('JM')
    })

    it('should handle single name', () => {
      expect(getInitials('John')).toBe('J')
    })

    it('should handle empty string', () => {
      expect(getInitials('')).toBe('')
    })

    it('should limit to 2 characters', () => {
      expect(getInitials('John Middle Doe Smith')).toBe('JM')
    })

    it('should handle lowercase names', () => {
      expect(getInitials('john doe')).toBe('JD')
    })
  })

  describe('validateUKPhone', () => {
    it('should validate UK landline numbers', () => {
      expect(validateUKPhone('01234567890')).toBe(true)
      expect(validateUKPhone('020 1234 5678')).toBe(true)
    })

    it('should validate UK mobile numbers', () => {
      expect(validateUKPhone('07123456789')).toBe(true)
      expect(validateUKPhone('07123 456789')).toBe(true)
    })

    it('should validate with +44 prefix', () => {
      expect(validateUKPhone('+447123456789')).toBe(true)
      expect(validateUKPhone('+44 7123 456789')).toBe(true)
    })

    it('should reject invalid numbers', () => {
      expect(validateUKPhone('123')).toBe(false)
      expect(validateUKPhone('abcdefghijk')).toBe(false)
      expect(validateUKPhone('')).toBe(false)
    })

    it('should reject numbers with wrong length', () => {
      expect(validateUKPhone('071234567')).toBe(false) // Too short (8 digits after 0)
      expect(validateUKPhone('0712345678901')).toBe(false) // Too long (13 digits after 0)
    })

    it('should handle spaces in numbers', () => {
      expect(validateUKPhone('0 7 1 2 3 4 5 6 7 8 9')).toBe(true)
    })
  })
})