import React, { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Calendar as CalendarIcon, X } from "lucide-react"
import { createCustomFieldValueValidator } from "@/lib/validations"

interface CustomFieldInputProps {
  field: {
    _id: string
    name: string
    fieldKey: string
    fieldType: string
    description?: string
    required: boolean
    defaultValue?: string
    options?: string[]
    validation?: {
      min?: number
      max?: number
      pattern?: string
      message?: string
    }
  }
  value?: string
  onChange: (value: string) => void
  onBlur?: () => void
  error?: string
  disabled?: boolean
}

export function CustomFieldInput({
  field,
  value = "",
  onChange,
  onBlur,
  error,
  disabled = false,
}: CustomFieldInputProps) {
  const [date, setDate] = useState<Date | undefined>(
    field.fieldType === "date" && value ? new Date(value) : undefined
  )

  const handleDateChange = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    onChange(selectedDate ? selectedDate.toISOString() : "")
  }

  const validateValue = (inputValue: string) => {
    if (!inputValue && field.required) {
      return `${field.name} is required`
    }

    if (inputValue) {
      try {
        const validator = createCustomFieldValueValidator(field.fieldType, field.validation)
        validator.parse(inputValue)
        return null
      } catch (error) {
        if (error instanceof Error) {
          return error.message
        }
        return "Invalid value"
      }
    }

    return null
  }

  const handleInputChange = (newValue: string) => {
    onChange(newValue)
    // You could add real-time validation here if needed
  }

  const renderInput = () => {
    switch (field.fieldType) {
      case "text":
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => handleInputChange(e.target.value)}
            onBlur={onBlur}
            placeholder={field.defaultValue || `Enter ${field.name.toLowerCase()}`}
            disabled={disabled}
            className={cn(error && "border-destructive")}
          />
        )

      case "textarea":
        return (
          <Textarea
            value={value}
            onChange={(e) => handleInputChange(e.target.value)}
            onBlur={onBlur}
            placeholder={field.defaultValue || `Enter ${field.name.toLowerCase()}`}
            disabled={disabled}
            className={cn(error && "border-destructive")}
            rows={3}
          />
        )

      case "number":
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleInputChange(e.target.value)}
            onBlur={onBlur}
            placeholder={field.defaultValue || "0"}
            disabled={disabled}
            className={cn(error && "border-destructive")}
            min={field.validation?.min}
            max={field.validation?.max}
          />
        )

      case "email":
        return (
          <Input
            type="email"
            value={value}
            onChange={(e) => handleInputChange(e.target.value)}
            onBlur={onBlur}
            placeholder={field.defaultValue || "email@example.com"}
            disabled={disabled}
            className={cn(error && "border-destructive")}
          />
        )

      case "phone":
        return (
          <Input
            type="tel"
            value={value}
            onChange={(e) => handleInputChange(e.target.value)}
            onBlur={onBlur}
            placeholder={field.defaultValue || "Enter phone number"}
            disabled={disabled}
            className={cn(error && "border-destructive")}
          />
        )

      case "url":
        return (
          <Input
            type="url"
            value={value}
            onChange={(e) => handleInputChange(e.target.value)}
            onBlur={onBlur}
            placeholder={field.defaultValue || "https://example.com"}
            disabled={disabled}
            className={cn(error && "border-destructive")}
          />
        )

      case "date":
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground",
                  error && "border-destructive"
                )}
                disabled={disabled}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? date.toLocaleDateString() : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        )

      case "dropdown":
        return (
          <Select value={value} onValueChange={handleInputChange} disabled={disabled}>
            <SelectTrigger className={cn(error && "border-destructive")}>
              <SelectValue 
                placeholder={field.defaultValue || `Select ${field.name.toLowerCase()}`} 
              />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case "checkbox":
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={value === "true"}
              onCheckedChange={(checked) => handleInputChange(checked ? "true" : "false")}
              disabled={disabled}
            />
            <Label htmlFor={field.fieldKey} className="text-sm font-normal">
              {field.description || field.name}
            </Label>
          </div>
        )

      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => handleInputChange(e.target.value)}
            onBlur={onBlur}
            placeholder={field.defaultValue || `Enter ${field.name.toLowerCase()}`}
            disabled={disabled}
            className={cn(error && "border-destructive")}
          />
        )
    }
  }

  return (
    <div className="space-y-2">
      <Label 
        htmlFor={field.fieldKey}
        className={cn(
          "text-sm font-medium",
          field.required && "after:content-['*'] after:ml-0.5 after:text-destructive"
        )}
      >
        {field.name}
      </Label>
      {renderInput()}
      {field.description && field.fieldType !== "checkbox" && (
        <p className="text-xs text-muted-foreground">{field.description}</p>
      )}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}

// Component for rendering multiple custom fields in a form
interface CustomFieldsFormProps {
  fields: Array<{
    _id: string
    name: string
    fieldKey: string
    fieldType: string
    description?: string
    required: boolean
    defaultValue?: string
    options?: string[]
    validation?: {
      min?: number
      max?: number
      pattern?: string
      message?: string
    }
  }>
  values: Record<string, string>
  onChange: (fieldId: string, value: string) => void
  errors?: Record<string, string>
  disabled?: boolean
}

export function CustomFieldsForm({
  fields,
  values,
  onChange,
  errors = {},
  disabled = false,
}: CustomFieldsFormProps) {
  if (fields.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="border-t pt-4">
        <h3 className="text-lg font-semibold mb-4">Custom Fields</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {fields.map((field) => (
            <CustomFieldInput
              key={field._id}
              field={field}
              value={values[field._id] || field.defaultValue || ""}
              onChange={(value) => onChange(field._id, value)}
              error={errors[field._id]}
              disabled={disabled}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// Component for displaying custom field values in read-only mode
interface CustomFieldsDisplayProps {
  fields: Array<{
    _id: string
    name: string
    fieldKey: string
    fieldType: string
    description?: string
    options?: string[]
  }>
  values: Record<string, string>
  className?: string
}

export function CustomFieldsDisplay({
  fields,
  values,
  className,
}: CustomFieldsDisplayProps) {
  if (fields.length === 0) {
    return null
  }

  const formatValue = (field: any, value: string) => {
    if (!value) return "-"

    switch (field.fieldType) {
      case "date":
        try {
          return new Date(value).toLocaleDateString()
        } catch {
          return value
        }
      case "checkbox":
        return value === "true" ? "Yes" : "No"
      case "email":
        return (
          <a href={`mailto:${value}`} className="text-primary hover:underline">
            {value}
          </a>
        )
      case "phone":
        return (
          <a href={`tel:${value}`} className="text-primary hover:underline">
            {value}
          </a>
        )
      case "url":
        return (
          <a 
            href={value} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {value}
          </a>
        )
      default:
        return value
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="border-t pt-4">
        <h3 className="text-lg font-semibold mb-4">Custom Fields</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {fields.map((field) => {
            const value = values[field._id]
            if (!value && field.fieldType !== "checkbox") return null
            
            return (
              <div key={field._id} className="space-y-1">
                <Label className="text-sm font-medium text-muted-foreground">
                  {field.name}
                </Label>
                <div className="text-sm">
                  {formatValue(field, value)}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}