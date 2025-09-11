import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { TrendingUp, TrendingDown } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon?: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: "blue" | "red" | "green" | "yellow" | "purple" | "indigo" | "pink"
  href?: string
  loading?: boolean
}

const colorVariants = {
  blue: {
    gradient: "from-blue-500 to-blue-600",
    icon: "bg-blue-100 text-blue-600 group-hover:scale-110",
    shadow: "hover:shadow-blue-500/25",
  },
  red: {
    gradient: "from-red-500 to-red-600",
    icon: "bg-red-100 text-red-600 group-hover:scale-110",
    shadow: "hover:shadow-red-500/25",
  },
  green: {
    gradient: "from-green-500 to-green-600",
    icon: "bg-green-100 text-green-600 group-hover:scale-110",
    shadow: "hover:shadow-green-500/25",
  },
  yellow: {
    gradient: "from-yellow-500 to-yellow-600",
    icon: "bg-yellow-100 text-yellow-600 group-hover:scale-110",
    shadow: "hover:shadow-yellow-500/25",
  },
  purple: {
    gradient: "from-purple-500 to-purple-600",
    icon: "bg-purple-100 text-purple-600 group-hover:scale-110",
    shadow: "hover:shadow-purple-500/25",
  },
  indigo: {
    gradient: "from-indigo-500 to-indigo-600",
    icon: "bg-indigo-100 text-indigo-600 group-hover:scale-110",
    shadow: "hover:shadow-indigo-500/25",
  },
  pink: {
    gradient: "from-pink-500 to-pink-600",
    icon: "bg-pink-100 text-pink-600 group-hover:scale-110",
    shadow: "hover:shadow-pink-500/25",
  },
}

export function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  color = "blue",
  href,
  loading = false,
}: StatCardProps) {
  const content = (
    <>
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-5 rounded-xl transition-opacity duration-300 group-hover:opacity-10",
        colorVariants[color].gradient
      )} />
      <CardHeader className="relative flex flex-row items-center justify-between pb-2">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        {icon && (
          <div className={cn(
            "rounded-lg p-3 transition-all duration-300",
            colorVariants[color].icon
          )}>
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent className="relative">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        ) : (
          <>
            <div className="text-3xl font-bold animate-fade-in-up">{value}</div>
            {description && (
              <p className="text-xs text-muted-foreground mt-1 animate-fade-in">
                {description}
              </p>
            )}
            {trend && (
              <div className={cn(
                "flex items-center gap-1 mt-3 text-sm font-medium animate-fade-in-up",
                trend.isPositive ? "text-green-600" : "text-red-600"
              )}>
                {trend.isPositive ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span>{Math.abs(trend.value)}%</span>
                <span className="text-xs text-muted-foreground ml-1">vs last period</span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </>
  )

  const card = (
    <Card
      variant="elevated"
      interactive={!!href}
      className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:-translate-y-1",
        colorVariants[color].shadow,
        href && "cursor-pointer"
      )}
    >
      {content}
    </Card>
  )

  if (href) {
    return <Link href={href}>{card}</Link>
  }

  return card
}