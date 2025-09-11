import { z } from "zod"

// UK phone number validation regex
const ukPhoneRegex = /^(?:(?:\+44)|(?:0))(?:\d\s?){9,10}$/

// Project validation schema
export const projectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100, "Project name is too long"),
  company: z.string().max(100, "Company name is too long").optional(),
  description: z.string().max(500, "Description is too long").optional(),
  status: z.enum(["open", "closed"]),
  expectedRevenueGBP: z
    .number()
    .min(0, "Revenue cannot be negative"),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return data.endDate >= data.startDate
  }
  return true
}, {
  message: "End date must be after start date",
  path: ["endDate"],
})

// Contact validation schema
export const contactSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(ukPhoneRegex, "Please enter a valid UK phone number"),
  company: z.string().max(100, "Company name is too long").optional(),
  notes: z.string().max(500, "Notes are too long").optional(),
})

// Task validation schema
export const taskSchema = z.object({
  title: z.string().min(1, "Task title is required").max(200, "Task title is too long"),
  description: z.string().max(500, "Description is too long").optional(),
  status: z.enum(["todo", "in_progress", "done"]),
  priority: z.enum(["low", "medium", "high"]).optional(),
  dueDate: z.date().optional(),
  projectId: z.string().min(1, "Project is required"),
  assignedTo: z.string().optional(),
})

// Login validation schema
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

// Change password validation schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

// Custom field validation schemas
export const customFieldSchema = z.object({
  name: z.string().min(1, "Field name is required").max(100, "Field name is too long"),
  fieldKey: z.string()
    .min(1, "Field key is required")
    .max(50, "Field key is too long")
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, "Field key must start with a letter and contain only letters, numbers, and underscores"),
  entityType: z.enum(["contacts", "projects", "tasks"]),
  fieldType: z.enum(["text", "number", "date", "dropdown", "checkbox", "textarea", "email", "phone", "url"]),
  description: z.string().max(500, "Description is too long").optional(),
  required: z.boolean(),
  defaultValue: z.string().optional(),
  options: z.array(z.string()).optional(),
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
    message: z.string().optional(),
  }).optional(),
})

export const customFieldValueSchema = z.object({
  fieldId: z.string(),
  value: z.string(),
})

// Dynamic validation for custom field values based on field type
export const createCustomFieldValueValidator = (fieldType: string, validation?: any) => {
  switch (fieldType) {
    case "text":
    case "textarea":
      let textSchema = z.string()
      if (validation?.min) textSchema = textSchema.min(validation.min, validation.message || `Minimum length is ${validation.min}`)
      if (validation?.max) textSchema = textSchema.max(validation.max, validation.message || `Maximum length is ${validation.max}`)
      if (validation?.pattern) textSchema = textSchema.regex(new RegExp(validation.pattern), validation.message || "Invalid format")
      return textSchema
    
    case "number":
      let numberSchema: any = z.string().refine(val => !isNaN(Number(val)), "Must be a valid number")
      if (validation?.min) numberSchema = numberSchema.refine((val: string) => Number(val) >= validation.min!, validation.message || `Minimum value is ${validation.min}`)
      if (validation?.max) numberSchema = numberSchema.refine((val: string) => Number(val) <= validation.max!, validation.message || `Maximum value is ${validation.max}`)
      return numberSchema
    
    case "email":
      return z.string().email("Invalid email address")
    
    case "phone":
      return z.string().regex(ukPhoneRegex, "Please enter a valid UK phone number")
    
    case "url":
      return z.string().url("Invalid URL")
    
    case "date":
      return z.string().refine(val => !isNaN(Date.parse(val)), "Invalid date")
    
    case "checkbox":
      return z.string().refine(val => val === "true" || val === "false", "Must be true or false")
    
    case "dropdown":
      return z.string().min(1, "Please select an option")
    
    default:
      return z.string()
  }
}

// Type exports
export type ProjectFormData = z.infer<typeof projectSchema>
export type ContactFormData = z.infer<typeof contactSchema>
export type TaskFormData = z.infer<typeof taskSchema>
export type LoginFormData = z.infer<typeof loginSchema>
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>
export type CustomFieldFormData = z.infer<typeof customFieldSchema>
export type CustomFieldValueFormData = z.infer<typeof customFieldValueSchema>