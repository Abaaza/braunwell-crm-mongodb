"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useAuth } from "@/lib/auth"
import { NotificationToast } from "./notification-toast"

interface NotificationContextType {
  unreadCount: number
  notifications: any[]
  lastNotificationTime: number
  refreshNotifications: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}

interface NotificationProviderProps {
  children: React.ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { user } = useAuth()
  const [lastNotificationTime, setLastNotificationTime] = useState(Date.now())
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Query for all notifications
  const notifications = useQuery(
    api.notifications.getUserNotifications,
    user ? { 
      userId: user.id, 
      limit: 50 
    } : "skip"
  )

  // Query for unread count
  const unreadCount = useQuery(
    api.notifications.getUnreadCount,
    user ? { userId: user.id } : "skip"
  ) || 0

  // Update last notification time when new notifications come in
  useEffect(() => {
    if (notifications && notifications.length > 0) {
      const latestTime = Math.max(...notifications.map(n => n.createdAt))
      if (latestTime > lastNotificationTime) {
        setLastNotificationTime(latestTime)
      }
    }
  }, [notifications, lastNotificationTime])

  // Function to manually refresh notifications
  const refreshNotifications = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  // Provide real-time notification updates via polling
  useEffect(() => {
    if (!user) return

    const interval = setInterval(() => {
      // Force a refresh every 30 seconds to ensure real-time updates
      setRefreshTrigger(prev => prev + 1)
    }, 30000)

    return () => clearInterval(interval)
  }, [user])

  const contextValue: NotificationContextType = {
    unreadCount,
    notifications: notifications || [],
    lastNotificationTime,
    refreshNotifications,
  }

  return (
    <NotificationContext.Provider value={contextValue}>
      <NotificationToast>
        {children}
      </NotificationToast>
    </NotificationContext.Provider>
  )
}

// Hook to check for new notifications
export function useNewNotifications() {
  const { user } = useAuth()
  const [lastCheckedTime, setLastCheckedTime] = useState(Date.now())
  
  const newNotifications = useQuery(
    api.notifications.getUserNotifications,
    user ? { 
      userId: user.id, 
      limit: 10,
      onlyUnread: true 
    } : "skip"
  )

  // Filter for truly new notifications since last check
  const recentNotifications = newNotifications?.filter(notification => 
    notification.createdAt > lastCheckedTime
  ) || []

  // Update last checked time
  useEffect(() => {
    if (recentNotifications.length > 0) {
      const latestTime = Math.max(...recentNotifications.map(n => n.createdAt))
      setLastCheckedTime(latestTime)
    }
  }, [recentNotifications])

  return {
    newNotifications: recentNotifications,
    hasNewNotifications: recentNotifications.length > 0,
    clearNewNotifications: () => setLastCheckedTime(Date.now())
  }
}

// Hook to manage notification sound/vibration
export function useNotificationEffects() {
  const { newNotifications } = useNewNotifications()
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [vibrationEnabled, setVibrationEnabled] = useState(true)

  useEffect(() => {
    if (newNotifications.length > 0) {
      // Play notification sound
      if (soundEnabled && typeof window !== "undefined") {
        try {
          const audio = new Audio('/notification-sound.mp3')
          audio.volume = 0.3
          audio.play().catch(() => {
            // Ignore errors if audio can't be played
          })
        } catch (error) {
          // Ignore audio errors
        }
      }

      // Vibrate if supported
      if (vibrationEnabled && typeof window !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(200)
      }
    }
  }, [newNotifications, soundEnabled, vibrationEnabled])

  return {
    soundEnabled,
    setSoundEnabled,
    vibrationEnabled,
    setVibrationEnabled,
  }
}

// Hook to manage notification preferences
export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState({
    taskAssigned: true,
    taskUpdated: true,
    taskCompleted: true,
    projectCreated: true,
    projectUpdated: true,
    projectClosed: true,
    contactCreated: false,
    contactUpdated: false,
    paymentReceived: true,
    systemMaintenance: true,
    userMentioned: true,
  })

  // Load preferences from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("notificationPreferences")
    if (saved) {
      try {
        setPreferences(JSON.parse(saved))
      } catch (error) {
        // Ignore parsing errors
      }
    }
  }, [])

  // Save preferences to localStorage when changed
  useEffect(() => {
    localStorage.setItem("notificationPreferences", JSON.stringify(preferences))
  }, [preferences])

  return {
    preferences,
    setPreferences,
    updatePreference: (key: string, value: boolean) => {
      setPreferences(prev => ({
        ...prev,
        [key]: value
      }))
    }
  }
}