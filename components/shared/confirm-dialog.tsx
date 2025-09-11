"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { AlertCircle, Info, AlertTriangle, CheckCircle } from "lucide-react"
import { ReactNode } from "react"

export type ConfirmDialogVariant = "destructive" | "warning" | "info" | "success"

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string | ReactNode
  confirmText?: string
  cancelText?: string
  onConfirm: () => void | Promise<void>
  variant?: ConfirmDialogVariant
  loading?: boolean
}

const variantConfig: Record<ConfirmDialogVariant, {
  icon: ReactNode
  confirmButtonVariant: "default" | "destructive" | "outline" | "secondary"
}> = {
  destructive: {
    icon: <AlertCircle className="h-5 w-5 text-destructive" />,
    confirmButtonVariant: "destructive",
  },
  warning: {
    icon: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
    confirmButtonVariant: "default",
  },
  info: {
    icon: <Info className="h-5 w-5 text-blue-600" />,
    confirmButtonVariant: "default",
  },
  success: {
    icon: <CheckCircle className="h-5 w-5 text-green-600" />,
    confirmButtonVariant: "default",
  },
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  variant = "info",
  loading = false,
}: ConfirmDialogProps) {
  const config = variantConfig[variant]

  const handleConfirm = async () => {
    await onConfirm()
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {config.icon}
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-sm text-muted-foreground">
              {description}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant={config.confirmButtonVariant}
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading ? "Loading..." : confirmText}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}