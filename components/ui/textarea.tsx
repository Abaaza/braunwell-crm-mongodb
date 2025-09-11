import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-lg border border-input bg-white/50 backdrop-blur-sm px-3 py-2 text-sm ring-offset-background transition-all duration-200 resize-none",
          "placeholder:text-muted-foreground",
          "hover:border-primary/50 hover:bg-white/70",
          "focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-0",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-input disabled:hover:bg-white/50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }