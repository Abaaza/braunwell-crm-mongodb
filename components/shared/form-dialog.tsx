"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface FormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
  onSubmit: () => void | Promise<void>
  submitText?: string
  cancelText?: string
  isSubmitting?: boolean
  variant?: "default" | "destructive"
  size?: "sm" | "default" | "lg" | "xl" | "2xl"
}

const sizeClasses = {
  sm: "max-w-sm",
  default: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
}

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSubmit,
  submitText = "Submit",
  cancelText = "Cancel",
  isSubmitting = false,
  variant = "default",
  size = "default",
}: FormDialogProps) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={sizeClasses[size]}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {children}
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {cancelText}
            </Button>
            <Button
              type="submit"
              variant={variant}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitText}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Wrapper component for form fields with consistent spacing
interface FormFieldProps {
  children: React.ReactNode
  className?: string
}

export function FormDialogField({ children, className }: FormFieldProps) {
  return <div className={className || "grid gap-2"}>{children}</div>
}

// Grid layout for form fields
interface FormDialogGridProps {
  children: React.ReactNode
  columns?: 1 | 2 | 3
  className?: string
}

export function FormDialogGrid({ 
  children, 
  columns = 1,
  className 
}: FormDialogGridProps) {
  const gridClasses = {
    1: "",
    2: "grid gap-4 md:grid-cols-2",
    3: "grid gap-4 md:grid-cols-3",
  }
  
  return (
    <div className={className || gridClasses[columns]}>
      {children}
    </div>
  )
}