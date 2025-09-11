"use client"

import { useEffect, useRef } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useAuth } from "@/lib/auth"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
  Bell,
  BellRing,
  User,
  Briefcase,
  CheckSquare,
  DollarSign,
  AlertTriangle,
  Settings,
} from "lucide-react"

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "task_assigned":
    case "task_updated":
    case "task_completed":
      return CheckSquare
    case "project_created":
    case "project_updated":
    case "project_closed":
      return Briefcase
    case "contact_created":
    case "contact_updated":
      return User
    case "payment_received":
      return DollarSign
    case "system_maintenance":
      return Settings
    case "user_mentioned":
      return AlertTriangle
    default:
      return Bell
  }
}

interface NotificationToastProps {
  children: React.ReactNode
}

export function NotificationToast({ children }: NotificationToastProps) {
  const { user } = useAuth()
  const router = useRouter()
  const lastNotificationTime = useRef<number>(Date.now())
  
  // Query for recent notifications (last 30 seconds)
  const recentNotifications = useQuery(
    api.notifications.getUserNotifications,
    user ? { 
      userId: user.id, 
      limit: 5,
      onlyUnread: true 
    } : "skip"
  )

  useEffect(() => {
    if (!recentNotifications || !user) return

    // Filter notifications that are newer than our last check
    const newNotifications = recentNotifications.filter(notification => 
      notification.createdAt > lastNotificationTime.current
    )

    // Show toast for each new notification
    newNotifications.forEach(notification => {
      const Icon = getNotificationIcon(notification.type)
      
      const toastProps = {
        duration: 6000,
        action: notification.actionUrl ? {
          label: "View",
          onClick: () => router.push(notification.actionUrl!)
        } : undefined,
        icon: <Icon className="h-4 w-4" />,
      }

      switch (notification.priority) {
        case "high":
          toast.error(notification.title, {
            ...toastProps,
            description: notification.message,
          })
          break
        case "medium":
          toast.warning(notification.title, {
            ...toastProps,
            description: notification.message,
          })
          break
        case "low":
        default:
          toast.info(notification.title, {
            ...toastProps,
            description: notification.message,
          })
          break
      }
    })

    // Update the last notification time
    if (newNotifications.length > 0) {
      lastNotificationTime.current = Math.max(
        ...newNotifications.map(n => n.createdAt)
      )
    }
  }, [recentNotifications, user, router])

  // Initialize the last notification time when component mounts
  useEffect(() => {
    if (recentNotifications && recentNotifications.length > 0) {
      // Set to the most recent notification time to avoid showing old notifications as new
      lastNotificationTime.current = Math.max(
        ...recentNotifications.map(n => n.createdAt)
      )
    }
  }, []) // Only run once on mount

  return <>{children}</>
}

// Custom toast variants for notifications
export const showNotificationToast = (
  type: "success" | "error" | "warning" | "info",
  title: string,
  message?: string,
  actionUrl?: string,
  router?: any
) => {
  const action = actionUrl && router ? {
    label: "View",
    onClick: () => router.push(actionUrl)
  } : undefined

  switch (type) {
    case "success":
      toast.success(title, {
        description: message,
        action,
        duration: 4000,
      })
      break
    case "error":
      toast.error(title, {
        description: message,
        action,
        duration: 6000,
      })
      break
    case "warning":
      toast.warning(title, {
        description: message,
        action,
        duration: 5000,
      })
      break
    case "info":
    default:
      toast.info(title, {
        description: message,
        action,
        duration: 4000,
      })
      break
  }
}