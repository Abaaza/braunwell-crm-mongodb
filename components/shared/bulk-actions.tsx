"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { X, Trash2, Archive, Tag, CheckSquare, Square, Edit } from "lucide-react"

interface BulkActionsProps {
  selectedCount: number
  onClearSelection: () => void
  actions: BulkAction[]
  className?: string
}

export interface BulkAction {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  disabled?: boolean
}

export function BulkActions({
  selectedCount,
  onClearSelection,
  actions,
  className,
}: BulkActionsProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(selectedCount > 0)
  }, [selectedCount])

  if (!isVisible) return null

  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
        "animate-in slide-in-from-bottom-5 fade-in duration-200",
        className
      )}
    >
      <Card className="shadow-2xl border-2">
        <div className="flex items-center gap-4 p-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-semibold">
              {selectedCount} selected
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              className="h-8 px-2"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Clear selection</span>
            </Button>
          </div>

          <div className="h-6 w-px bg-border" />

          <div className="flex items-center gap-2">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || "outline"}
                size="sm"
                onClick={action.onClick}
                disabled={action.disabled}
                className="h-8"
              >
                {action.icon}
                <span className={action.icon ? "ml-2" : ""}>{action.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}

// Helper component for select all checkbox
interface SelectAllCheckboxProps {
  checked: boolean
  indeterminate?: boolean
  onCheckedChange: (checked: boolean) => void
  className?: string
}

export function SelectAllCheckbox({
  checked,
  indeterminate,
  onCheckedChange,
  className,
}: SelectAllCheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "flex h-4 w-4 items-center justify-center rounded border border-input",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        checked || indeterminate ? "bg-primary text-primary-foreground" : "bg-background",
        className
      )}
    >
      {indeterminate ? (
        <div className="h-2 w-2 bg-current" />
      ) : checked ? (
        <CheckSquare className="h-3 w-3" />
      ) : (
        <Square className="h-3 w-3 opacity-0" />
      )}
    </button>
  )
}