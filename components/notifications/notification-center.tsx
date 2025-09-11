"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  MoreHorizontal,
  Trash2,
  X,
  User,
  Briefcase,
  CheckSquare,
  DollarSign,
  AlertTriangle,
  Settings,
} from "lucide-react"
import { cn, formatDistanceToNow, getInitials } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface NotificationCenterProps {
  className?: string
}

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

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "high":
      return "bg-red-500"
    case "medium":
      return "bg-yellow-500"
    case "low":
      return "bg-blue-500"
    default:
      return "bg-gray-500"
  }
}

export function NotificationCenter({ className }: NotificationCenterProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [filter, setFilter] = useState<"all" | "unread">("all")

  const notifications = useQuery(
    api.notifications.getUserNotifications,
    user ? { userId: user.id, limit: 50, onlyUnread: filter === "unread" } : "skip"
  )

  const unreadCount = useQuery(
    api.notifications.getUnreadCount,
    user ? { userId: user.id } : "skip"
  )

  const markAsRead = useMutation(api.notifications.markAsRead)
  const markAllAsRead = useMutation(api.notifications.markAllAsRead)
  const deleteNotification = useMutation(api.notifications.deleteNotification)
  const deleteAllRead = useMutation(api.notifications.deleteAllRead)

  const handleMarkAsRead = async (notificationId: string) => {
    if (!user) return
    
    try {
      await markAsRead({ notificationId: notificationId as Id<"notifications">, userId: user.id })
    } catch (error) {
      toast.error("Failed to mark notification as read")
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!user) return
    
    try {
      await markAllAsRead({ userId: user.id })
      toast.success("All notifications marked as read")
    } catch (error) {
      toast.error("Failed to mark all notifications as read")
    }
  }

  const handleDeleteNotification = async (notificationId: string) => {
    if (!user) return
    
    try {
      await deleteNotification({ notificationId: notificationId as Id<"notifications">, userId: user.id })
      toast.success("Notification deleted")
    } catch (error) {
      toast.error("Failed to delete notification")
    }
  }

  const handleDeleteAllRead = async () => {
    if (!user) return
    
    try {
      await deleteAllRead({ userId: user.id })
      toast.success("All read notifications deleted")
    } catch (error) {
      toast.error("Failed to delete read notifications")
    }
  }

  const handleNotificationClick = async (notification: any) => {
    // Mark as read if not already read
    if (!notification.isRead) {
      await handleMarkAsRead(notification._id)
    }
    
    // Navigate to the action URL if provided
    if (notification.actionUrl) {
      router.push(notification.actionUrl)
      setIsOpen(false)
    }
  }

  const filteredNotifications = notifications?.filter(notification => {
    if (filter === "unread") {
      return !notification.isRead
    }
    return true
  }) || []

  return (
    <div className={cn("relative", className)}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            {unreadCount && unreadCount > 0 ? (
              <BellRing className="h-5 w-5" />
            ) : (
              <Bell className="h-5 w-5" />
            )}
            {unreadCount && unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 max-h-96 p-0">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Notifications</h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilter(filter === "all" ? "unread" : "all")}
                >
                  {filter === "all" ? "Show Unread" : "Show All"}
                </Button>
                {unreadCount && unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                  >
                    <CheckCheck className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          <ScrollArea className="max-h-80">
            {filteredNotifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                {filter === "unread" ? "No unread notifications" : "No notifications"}
              </div>
            ) : (
              <div className="divide-y">
                {filteredNotifications.map((notification) => {
                  const Icon = getNotificationIcon(notification.type)
                  
                  return (
                    <div
                      key={notification._id}
                      className={cn(
                        "p-4 hover:bg-muted/50 cursor-pointer transition-colors",
                        !notification.isRead && "bg-blue-50/50"
                      )}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <div className="relative">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary text-white">
                                <Icon className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                            <div
                              className={cn(
                                "absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-white",
                                getPriorityColor(notification.priority)
                              )}
                            />
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {notification.title}
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(notification.createdAt))}
                                </span>
                                {notification.createdByName && (
                                  <>
                                    <span className="text-xs text-muted-foreground">•</span>
                                    <span className="text-xs text-muted-foreground">
                                      by {notification.createdByName}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1 ml-2">
                              {!notification.isRead && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleMarkAsRead(notification._id)
                                  }}
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteNotification(notification._id)
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </ScrollArea>
          
          {filteredNotifications.length > 0 && (
            <>
              <Separator />
              <div className="p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={handleDeleteAllRead}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Read Notifications
                </Button>
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}