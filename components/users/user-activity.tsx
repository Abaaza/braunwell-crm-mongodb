"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getInitials, formatDateTime } from "@/lib/utils"
import { 
  Activity, 
  Plus, 
  Edit, 
  Trash2, 
  User, 
  FolderOpen, 
  Contact, 
  CheckSquare,
  Shield,
  Settings,
  FileDown,
  Upload,
  Eye,
} from "lucide-react"
import { Id } from "@/convex/_generated/dataModel"

interface UserActivityProps {
  userId?: Id<"users">
  limit?: number
}

const actionIcons = {
  created: Plus,
  updated: Edit,
  deleted: Trash2,
  viewed: Eye,
  exported: FileDown,
  restored: Upload,
} as const

const actionColors = {
  created: "text-green-600",
  updated: "text-blue-600",
  deleted: "text-red-600",
  viewed: "text-gray-600",
  exported: "text-purple-600",
  restored: "text-orange-600",
} as const

const entityIcons = {
  projects: FolderOpen,
  contacts: Contact,
  tasks: CheckSquare,
  users: User,
  permissions: Shield,
  settings: Settings,
  backup: FileDown,
} as const

export function UserActivity({ userId, limit = 20 }: UserActivityProps) {
  const activity = useQuery(api.activity.getUserActivity, { userId, limit })
  const summary = useQuery(api.activity.getActivitySummary, { userId })

  if (!activity || !summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Activity</CardTitle>
          <CardDescription>Loading activity data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-muted" />
                    <div className="h-3 w-1/2 rounded bg-muted" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Activity Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium">Total Actions</h3>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.total}</p>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium">Today</h3>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.today}</p>
            <p className="text-xs text-muted-foreground">Actions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium">This Week</h3>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.thisWeek}</p>
            <p className="text-xs text-muted-foreground">Actions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium">This Month</h3>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.thisMonth}</p>
            <p className="text-xs text-muted-foreground">Actions</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            {userId ? "User activity timeline" : "All users activity timeline"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activity.length > 0 ? (
            <div className="space-y-4">
              {activity.map((log) => {
                const ActionIcon = actionIcons[log.action as keyof typeof actionIcons] || Activity
                const EntityIcon = entityIcons[log.entityType as keyof typeof entityIcons] || Activity
                const actionColor = actionColors[log.action as keyof typeof actionColors] || "text-gray-600"
                
                return (
                  <div key={log._id} className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {getInitials(log.userName)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{log.userName}</span>
                        <div className="flex items-center gap-1">
                          <ActionIcon className={`h-3 w-3 ${actionColor}`} />
                          <span className={`text-sm ${actionColor}`}>{log.action}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <EntityIcon className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{log.entityType}</span>
                        </div>
                        {log.entityDetails?.name && (
                          <Badge variant="outline" className="text-xs">
                            {log.entityDetails.name}
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(log.timestamp)}
                      </p>
                      
                      {log.changes && (
                        <div className="mt-2 p-2 rounded bg-muted/50 text-xs font-mono">
                          <details>
                            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                              View changes
                            </summary>
                            <pre className="mt-2 overflow-x-auto">
                              {JSON.stringify(JSON.parse(log.changes), null, 2)}
                            </pre>
                          </details>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="mx-auto h-12 w-12 mb-3 opacity-50" />
              <p>No activity found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}