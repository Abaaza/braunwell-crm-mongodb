"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

export interface TabItem {
  value: string
  label: string
  icon?: React.ReactNode
  badge?: string | number
  disabled?: boolean
}

interface TabsLayoutProps {
  tabs: TabItem[]
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  className?: string
  orientation?: "horizontal" | "vertical"
}

export function TabsLayout({
  tabs,
  defaultValue,
  value,
  onValueChange,
  children,
  className,
  orientation = "horizontal",
}: TabsLayoutProps) {
  return (
    <Tabs
      defaultValue={defaultValue || tabs[0]?.value}
      value={value}
      onValueChange={onValueChange}
      orientation={orientation}
      className={cn("space-y-4", className)}
    >
      <TabsList className={cn(
        "grid w-full",
        orientation === "horizontal" 
          ? `grid-cols-${tabs.length}` 
          : "grid-flow-row auto-rows-fr"
      )}>
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            disabled={tab.disabled}
            className="flex items-center gap-2"
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-muted px-1 text-xs">
                {tab.badge}
              </span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
      {children}
    </Tabs>
  )
}

// Export TabsContent for convenience
export { TabsContent }