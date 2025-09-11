import {
  projectSchema,
  contactSchema,
  taskSchema,
  loginSchema,
  changePasswordSchema,
} from '@/lib/validations'

describe('Validation Schemas', () => {
  describe('projectSchema', () => {
    it('should validate a valid project', () => {
      const validProject = {
        name: 'Test Project',
        company: 'Test Company',
        description: 'Test description',
        status: 'open' as const,
        expectedRevenueGBP: 1000,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      }
      
      expect(() => projectSchema.parse(validProject)).not.toThrow()
    })

    it('should require project name', () => {
      const invalidProject = {
        status: 'open' as const,
        expectedRevenueGBP: 1000,
      }
      
      const result = projectSchema.safeParse(invalidProject)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Required')
      }
    })

    it('should validate revenue is positive', () => {
      const invalidProject = {
        name: 'Test Project',
        status: 'open' as const,
        expectedRevenueGBP: -100,
      }
      
      expect(() => projectSchema.parse(invalidProject)).toThrow('Revenue must be a positive number')
    })

    it('should validate end date is after start date', () => {
      const invalidProject = {
        name: 'Test Project',
        status: 'open' as const,
        expectedRevenueGBP: 1000,
        startDate: new Date('2024-12-31'),
        endDate: new Date('2024-01-01'),
      }
      
      expect(() => projectSchema.parse(invalidProject)).toThrow('End date must be after start date')
    })

    it('should accept minimal valid project', () => {
      const minimalProject = {
        name: 'Test',
        status: 'closed' as const,
        expectedRevenueGBP: 0.01,
      }
      
      expect(() => projectSchema.parse(minimalProject)).not.toThrow()
    })
  })

  describe('contactSchema', () => {
    it('should validate a valid contact', () => {
      const validContact = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '07123456789',
        company: 'Test Company',
        notes: 'Test notes',
      }
      
      expect(() => contactSchema.parse(validContact)).not.toThrow()
    })

    it('should validate email format', () => {
      const invalidContact = {
        name: 'John Doe',
        email: 'invalid-email',
        phone: '07123456789',
      }
      
      expect(() => contactSchema.parse(invalidContact)).toThrow('Invalid email address')
    })

    it('should validate UK phone numbers', () => {
      const validPhones = [
        '07123456789',
        '+447123456789',
        '020 1234 5678',
        '01234567890',
      ]
      
      validPhones.forEach(phone => {
        const contact = {
          name: 'John Doe',
          email: 'john@example.com',
          phone,
        }
        expect(() => contactSchema.parse(contact)).not.toThrow()
      })
    })

    it('should reject invalid phone numbers', () => {
      const invalidContact = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '123',
      }
      
      expect(() => contactSchema.parse(invalidContact)).toThrow('Please enter a valid UK phone number')
    })
  })

  describe('taskSchema', () => {
    it('should validate a valid task', () => {
      const validTask = {
        title: 'Test Task',
        description: 'Test description',
        status: 'todo' as const,
        priority: 'high' as const,
        dueDate: new Date('2024-12-31'),
        projectId: 'project_123',
        assignedTo: 'user_123',
      }
      
      expect(() => taskSchema.parse(validTask)).not.toThrow()
    })

    it('should require task title', () => {
      const invalidTask = {
        status: 'todo' as const,
        projectId: 'project_123',
      }
      
      const result = taskSchema.safeParse(invalidTask)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Required')
      }
    })

    it('should require projectId', () => {
      const invalidTask = {
        title: 'Test Task',
        status: 'todo' as const,
        projectId: '',
      }
      
      expect(() => taskSchema.parse(invalidTask)).toThrow('Project is required')
    })

    it('should validate status enum', () => {
      const invalidTask = {
        title: 'Test Task',
        status: 'invalid' as any,
        projectId: 'project_123',
      }
      
      expect(() => taskSchema.parse(invalidTask)).toThrow()
    })
  })

  describe('loginSchema', () => {
    it('should validate valid login credentials', () => {
      const validLogin = {
        email: 'user@example.com',
        password: 'password123',
      }
      
      expect(() => loginSchema.parse(validLogin)).not.toThrow()
    })

    it('should validate email format', () => {
      const invalidLogin = {
        email: 'not-an-email',
        password: 'password123',
      }
      
      expect(() => loginSchema.parse(invalidLogin)).toThrow('Invalid email address')
    })

    it('should require password', () => {
      const invalidLogin = {
        email: 'user@example.com',
        password: '',
      }
      
      expect(() => loginSchema.parse(invalidLogin)).toThrow('Password is required')
    })
  })

  describe('changePasswordSchema', () => {
    it('should validate valid password change', () => {
      const validPasswordChange = {
        currentPassword: 'oldPassword123',
        newPassword: 'NewPassword123',
        confirmPassword: 'NewPassword123',
      }
      
      expect(() => changePasswordSchema.parse(validPasswordChange)).not.toThrow()
    })

    it('should enforce password requirements', () => {
      const weakPasswords = [
        { password: 'short', error: 'Password must be at least 8 characters' },
        { password: 'alllowercase123', error: 'Password must contain at least one uppercase letter' },
        { password: 'ALLUPPERCASE123', error: 'Password must contain at least one lowercase letter' },
        { password: 'NoNumbersHere', error: 'Password must contain at least one number' },
      ]
      
      weakPasswords.forEach(({ password, error }) => {
        const passwordChange = {
          currentPassword: 'oldPassword123',
          newPassword: password,
          confirmPassword: password,
        }
        
        expect(() => changePasswordSchema.parse(passwordChange)).toThrow(error)
      })
    })

    it('should validate passwords match', () => {
      const mismatchedPasswords = {
        currentPassword: 'oldPassword123',
        newPassword: 'NewPassword123',
        confirmPassword: 'DifferentPassword123',
      }
      
      expect(() => changePasswordSchema.parse(mismatchedPasswords)).toThrow("Passwords don't match")
    })
  })
})