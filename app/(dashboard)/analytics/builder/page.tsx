"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { DashboardBuilder } from "@/components/dashboard/dashboard-builder"
import { useAuth } from "@/lib/auth"

export default function DashboardBuilderPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const dashboardId = searchParams.get('id')

  const handleSave = (dashboard: any) => {
    // Navigate back to analytics page or specific dashboard
    router.push('/analytics')
  }

  const handleCancel = () => {
    router.push('/analytics')
  }

  if (!user) {
    return <div>Please log in to access the dashboard builder.</div>
  }

  return (
    <DashboardBuilder
      dashboardId={dashboardId || undefined}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  )
}