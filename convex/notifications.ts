import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { Id } from "./_generated/dataModel"

// Send a notification to a user
export const sendNotification = mutation({
  args: {
    userId: v.id("users"),
    type: v.union(
      v.literal("task_assigned"),
      v.literal("task_updated"),
      v.literal("task_completed"),
      v.literal("project_created"),
      v.literal("project_updated"),
      v.literal("project_closed"),
      v.literal("contact_created"),
      v.literal("contact_updated"),
      v.literal("payment_received"),
      v.literal("system_maintenance"),
      v.literal("user_mentioned")
    ),
    title: v.string(),
    message: v.string(),
    entityType: v.optional(v.union(v.literal("task"), v.literal("project"), v.literal("contact"), v.literal("payment"))),
    entityId: v.optional(v.string()),
    entityName: v.optional(v.string()),
    actionUrl: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    createdBy: v.optional(v.id("users")),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    
    // Don't send notification to yourself (unless it's a system notification)
    if (args.createdBy && args.userId === args.createdBy && args.type !== "system_maintenance") {
      return null
    }
    
    const notificationId = await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      message: args.message,
      entityType: args.entityType,
      entityId: args.entityId,
      entityName: args.entityName,
      actionUrl: args.actionUrl,
      priority: args.priority || "medium",
      isRead: false,
      createdBy: args.createdBy,
      createdAt: now,
      expiresAt: args.expiresAt,
    })
    
    return notificationId
  },
})

// Send notification to multiple users
export const sendNotificationToUsers = mutation({
  args: {
    userIds: v.array(v.id("users")),
    type: v.union(
      v.literal("task_assigned"),
      v.literal("task_updated"),
      v.literal("task_completed"),
      v.literal("project_created"),
      v.literal("project_updated"),
      v.literal("project_closed"),
      v.literal("contact_created"),
      v.literal("contact_updated"),
      v.literal("payment_received"),
      v.literal("system_maintenance"),
      v.literal("user_mentioned")
    ),
    title: v.string(),
    message: v.string(),
    entityType: v.optional(v.union(v.literal("task"), v.literal("project"), v.literal("contact"), v.literal("payment"))),
    entityId: v.optional(v.string()),
    entityName: v.optional(v.string()),
    actionUrl: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    createdBy: v.optional(v.id("users")),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    const notificationIds = []
    
    for (const userId of args.userIds) {
      // Don't send notification to yourself (unless it's a system notification)
      if (args.createdBy && userId === args.createdBy && args.type !== "system_maintenance") {
        continue
      }
      
      const notificationId = await ctx.db.insert("notifications", {
        userId,
        type: args.type,
        title: args.title,
        message: args.message,
        entityType: args.entityType,
        entityId: args.entityId,
        entityName: args.entityName,
        actionUrl: args.actionUrl,
        priority: args.priority || "medium",
        isRead: false,
        createdBy: args.createdBy,
        createdAt: now,
        expiresAt: args.expiresAt,
      })
      
      notificationIds.push(notificationId)
    }
    
    return notificationIds
  },
})

// Get notifications for a user
export const getUserNotifications = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    onlyUnread: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50
    const now = Date.now()
    
    let notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_created", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect()
    
    // Filter out expired notifications
    notifications = notifications.filter(n => !n.expiresAt || n.expiresAt > now)
    
    // Filter by read status if requested
    if (args.onlyUnread) {
      notifications = notifications.filter(n => !n.isRead)
    }
    
    // Get creator info for notifications
    const notificationsWithCreator = await Promise.all(
      notifications.slice(0, limit).map(async (notification) => {
        const creator = notification.createdBy 
          ? await ctx.db.get(notification.createdBy)
          : null
        
        return {
          ...notification,
          createdByName: creator?.name,
          createdByAvatar: creator?.avatar,
        }
      })
    )
    
    return notificationsWithCreator
  },
})

// Get unread notification count for a user
export const getUnreadCount = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => q.eq("userId", args.userId).eq("isRead", false))
      .collect()
    
    // Filter out expired notifications
    const activeNotifications = notifications.filter(n => !n.expiresAt || n.expiresAt > now)
    
    return activeNotifications.length
  },
})

// Mark a notification as read
export const markAsRead = mutation({
  args: {
    notificationId: v.id("notifications"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId)
    
    if (!notification) {
      throw new Error("Notification not found")
    }
    
    if (notification.userId !== args.userId) {
      throw new Error("Not authorized to mark this notification as read")
    }
    
    await ctx.db.patch(args.notificationId, {
      isRead: true,
      readAt: Date.now(),
    })
    
    return { success: true }
  },
})

// Mark all notifications as read for a user
export const markAllAsRead = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => q.eq("userId", args.userId).eq("isRead", false))
      .collect()
    
    const now = Date.now()
    
    for (const notification of notifications) {
      await ctx.db.patch(notification._id, {
        isRead: true,
        readAt: now,
      })
    }
    
    return { markedCount: notifications.length }
  },
})

// Delete a notification
export const deleteNotification = mutation({
  args: {
    notificationId: v.id("notifications"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId)
    
    if (!notification) {
      throw new Error("Notification not found")
    }
    
    if (notification.userId !== args.userId) {
      throw new Error("Not authorized to delete this notification")
    }
    
    await ctx.db.delete(args.notificationId)
    
    return { success: true }
  },
})

// Delete all read notifications for a user
export const deleteAllRead = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => q.eq("userId", args.userId).eq("isRead", true))
      .collect()
    
    for (const notification of notifications) {
      await ctx.db.delete(notification._id)
    }
    
    return { deletedCount: notifications.length }
  },
})

// Clean up expired notifications (should be called periodically)
export const cleanupExpiredNotifications = mutation({
  handler: async (ctx) => {
    const now = Date.now()
    
    const notifications = await ctx.db.query("notifications").collect()
    
    let deletedCount = 0
    
    for (const notification of notifications) {
      if (notification.expiresAt && notification.expiresAt <= now) {
        await ctx.db.delete(notification._id)
        deletedCount++
      }
    }
    
    return { deletedCount }
  },
})

// Get notification statistics for admin
export const getNotificationStats = query({
  handler: async (ctx) => {
    const notifications = await ctx.db.query("notifications").collect()
    const now = Date.now()
    
    const activeNotifications = notifications.filter(n => !n.expiresAt || n.expiresAt > now)
    
    const stats = {
      total: activeNotifications.length,
      unread: activeNotifications.filter(n => !n.isRead).length,
      read: activeNotifications.filter(n => n.isRead).length,
      byType: {} as Record<string, number>,
      byPriority: {} as Record<string, number>,
      today: activeNotifications.filter(n => n.createdAt > now - 24 * 60 * 60 * 1000).length,
      thisWeek: activeNotifications.filter(n => n.createdAt > now - 7 * 24 * 60 * 60 * 1000).length,
    }
    
    // Count by type
    for (const notification of activeNotifications) {
      stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1
      stats.byPriority[notification.priority] = (stats.byPriority[notification.priority] || 0) + 1
    }
    
    return stats
  },
})

// Send a test notification (for testing purposes)
export const sendTestNotification = mutation({
  args: {
    userId: v.id("users"),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    
    // Create test notification directly
    const notificationId = await ctx.db.insert("notifications", {
      userId: args.userId,
      type: "system_maintenance",
      title: "Test Notification",
      message: "This is a test notification to verify the notification system is working correctly.",
      entityType: undefined,
      entityId: undefined,
      entityName: undefined,
      actionUrl: undefined,
      isRead: false,
      priority: "medium",
      expiresAt: now + 7 * 24 * 60 * 60 * 1000, // 7 days
      createdAt: now,
      createdBy: args.createdBy,
    })
    
    return notificationId
  },
})