import { ReactNode } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { formatDateTime } from "@/lib/utils"
import {
  Clock,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  User,
  FileText,
  Users,
  Folder,
  Calendar,
  Activity,
} from "lucide-react"

export type ActivityType = 
  | "created"
  | "updated"
  | "deleted"
  | "completed"
  | "assigned"
  | "commented"
  | "associated"
  | "disassociated"

export type EntityType = 
  | "project"
  | "contact"
  | "task"
  | "user"
  | "projectContacts"

interface ActivityItemProps {
  action: ActivityType
  entityType: EntityType
  entityName?: string
  entityId?: string
  userName: string
  userId?: string
  timestamp: number
  changes?: string
  className?: string
  showTimeline?: boolean
  isLast?: boolean
}

const actionConfig: Record<ActivityType, {
  label: string
  icon: ReactNode
  color: string
}> = {
  created: {
    label: "created",
    icon: <Plus className="h-4 w-4" />,
    color: "text-green-600 bg-green-50",
  },
  updated: {
    label: "updated",
    icon: <Edit className="h-4 w-4" />,
    color: "text-blue-600 bg-blue-50",
  },
  deleted: {
    label: "deleted",
    icon: <Trash2 className="h-4 w-4" />,
    color: "text-red-600 bg-red-50",
  },
  completed: {
    label: "completed",
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: "text-green-600 bg-green-50",
  },
  assigned: {
    label: "assigned",
    icon: <User className="h-4 w-4" />,
    color: "text-purple-600 bg-purple-50",
  },
  commented: {
    label: "commented on",
    icon: <FileText className="h-4 w-4" />,
    color: "text-gray-600 bg-gray-50",
  },
  associated: {
    label: "linked",
    icon: <Users className="h-4 w-4" />,
    color: "text-indigo-600 bg-indigo-50",
  },
  disassociated: {
    label: "unlinked",
    icon: <Users className="h-4 w-4" />,
    color: "text-orange-600 bg-orange-50",
  },
}

const entityConfig: Record<EntityType, {
  label: string
  icon: ReactNode
  getHref: (id: string) => string | null
}> = {
  project: {
    label: "project",
    icon: <Folder className="h-3 w-3" />,
    getHref: (id) => `/projects/${id}`,
  },
  contact: {
    label: "contact",
    icon: <User className="h-3 w-3" />,
    getHref: (id) => `/contacts/${id}`,
  },
  task: {
    label: "task",
    icon: <CheckCircle2 className="h-3 w-3" />,
    getHref: (id) => `/tasks`,
  },
  user: {
    label: "user",
    icon: <User className="h-3 w-3" />,
    getHref: (id) => `/users`,
  },
  projectContacts: {
    label: "project contact",
    icon: <Users className="h-3 w-3" />,
    getHref: (id) => null,
  },
}

export function ActivityItem({
  action,
  entityType,
  entityName,
  entityId,
  userName,
  userId,
  timestamp,
  changes,
  className,
  showTimeline = false,
  isLast = false,
}: ActivityItemProps) {
  const actionInfo = actionConfig[action]
  const entityInfo = entityConfig[entityType]
  const href = entityId && entityInfo.getHref ? entityInfo.getHref(entityId) : null

  const changesData = changes ? (() => {
    try {
      return JSON.parse(changes)
    } catch {
      return null
    }
  })() : null

  const renderChanges = () => {
    if (!changesData || typeof changesData !== 'object') return null

    return (
      <div className="mt-2 text-xs text-muted-foreground space-y-1">
        {Object.entries(changesData).map(([key, value]) => {
          if (typeof value === 'object' && value !== null && 'from' in value && 'to' in value) {
            const { from, to } = value as { from: any; to: any }
            return (
              <div key={key} className="pl-4">
                <span className="font-medium">{key}:</span>{' '}
                <span className="line-through">{String(from)}</span>{' '}
                <span className="text-foreground">→ {String(to)}</span>
              </div>
            )
          }
          return (
            <div key={key} className="pl-4">
              <span className="font-medium">{key}:</span> {String(value)}
            </div>
          )
        })}
      </div>
    )
  }

  const content = (
    <div className="flex items-start gap-3">
      <div
        className={cn(
          "rounded-full p-2",
          actionInfo.color,
          showTimeline && "relative z-10"
        )}
      >
        {actionInfo.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <span className="font-medium">{userName}</span>{' '}
          <span className="text-muted-foreground">{actionInfo.label}</span>{' '}
          {entityName ? (
            <>
              <span className="text-muted-foreground">{entityInfo.label}</span>{' '}
              {href ? (
                <Link
                  href={href}
                  className="font-medium hover:underline text-primary"
                  onClick={(e) => e.stopPropagation()}
                >
                  {entityName}
                </Link>
              ) : (
                <span className="font-medium">{entityName}</span>
              )}
            </>
          ) : (
            <span className="text-muted-foreground">{entityInfo.label}</span>
          )}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatDateTime(timestamp)}
        </p>
        {renderChanges()}
      </div>
    </div>
  )

  if (showTimeline) {
    return (
      <div className={cn("relative", className)}>
        <div className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="relative">
              {content}
            </div>
            {!isLast && (
              <div className="w-px h-full bg-border mt-2" />
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("rounded-lg p-3 hover:bg-muted/50 transition-colors", className)}>
      {content}
    </div>
  )
}