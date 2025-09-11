"use client"

import { ActivityItem, type ActivityType } from "./activity-item"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export interface Activity {
  id: string
  type: ActivityType
  entity: string
  entityId: string
  title: string
  description?: string
  timestamp: number
  user?: {
    name: string
    avatar?: string
  }
}

interface ActivityTimelineProps {
  activities: Activity[]
  className?: string
}

export function ActivityTimeline({ activities, className }: ActivityTimelineProps) {
  if (!activities || activities.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No activity to display</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-4">
            {activities.map((activity) => (
              <ActivityItem
                key={activity.id}
                action={activity.type}
                entityType={activity.entity as any}
                entityName={activity.title}
                entityId={activity.entityId}
                changes={activity.description}
                timestamp={activity.timestamp}
                userName={activity.user?.name || "Unknown"}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}