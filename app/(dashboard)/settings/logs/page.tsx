"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useAuth } from "@/lib/auth"
import { ProtectedRoute } from "@/lib/auth"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function SystemLogsPage() {
  return (
    <ProtectedRoute adminOnly>
      <SystemLogsContent />
    </ProtectedRoute>
  )
}

function SystemLogsContent() {
  const { user } = useAuth()
  const logs = useQuery(api.auditLogs.list, {
    page: 0,
    pageSize: 50,
    dateRange: "last30days",
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Logs"
        description="View and analyze system activity"
      />

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {logs ? (
            <div className="space-y-3">
              {logs.logs.map((log) => (
                <div key={log._id} className="flex items-center gap-4 p-4 border rounded">
                  <div className="flex-1">
                    <div className="font-medium">{log.action}</div>
                    <div className="text-sm text-muted-foreground">
                      {log.entityType} • {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
              {logs.logs.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  No logs found
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}