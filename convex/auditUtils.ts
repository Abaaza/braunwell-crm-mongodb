import { Id } from "./_generated/dataModel"
import { internal } from "./_generated/api"

// Audit logging context interface
export interface AuditContext {
  userId: Id<"users">
  ipAddress?: string
  userAgent?: string
  sessionId?: string
}

// Audit logging options
export interface AuditLogOptions {
  action: string
  entityType: string
  entityId: string
  changes?: any
  severity?: "low" | "medium" | "high" | "critical"
  category?: string
  description?: string
  metadata?: any
  successful?: boolean
  errorMessage?: string
  affectedRecords?: number
  dataClassification?: "public" | "internal" | "confidential" | "restricted"
}

// Helper function to create audit log entry
export async function createAuditLog(
  ctx: { db: any; scheduler: any },
  auditContext: AuditContext,
  options: AuditLogOptions
) {
  const { action, entityType, entityId, changes, ...otherOptions } = options
  
  // Determine default severity based on action
  const defaultSeverity = getDefaultSeverity(action, entityType)
  
  // Determine default category based on action
  const defaultCategory = getDefaultCategory(action)
  
  // Determine data classification based on entity type
  const defaultDataClassification = getDefaultDataClassification(entityType)
  
  const auditData = {
    action,
    entityType,
    entityId,
    userId: auditContext.userId,
    changes: changes ? JSON.stringify(changes) : undefined,
    ipAddress: auditContext.ipAddress,
    userAgent: auditContext.userAgent,
    sessionId: auditContext.sessionId,
    severity: otherOptions.severity || defaultSeverity,
    category: otherOptions.category || defaultCategory,
    description: otherOptions.description || generateDescription(action, entityType, entityId),
    metadata: otherOptions.metadata ? JSON.stringify(otherOptions.metadata) : undefined,
    successful: otherOptions.successful ?? true,
    errorMessage: otherOptions.errorMessage,
    affectedRecords: otherOptions.affectedRecords || 1,
    dataClassification: otherOptions.dataClassification || defaultDataClassification,
  }
  
  try {
    await ctx.scheduler.runAfter(0, internal.auditLogs.logAuditEvent, auditData)
  } catch (error) {
    // Fallback: log directly if scheduler fails
    console.error("Failed to schedule audit log:", error)
    // In a real application, you might want to log this to a separate error logging system
  }
}

// Helper function to create audit log for data access (read operations)
export async function createDataAccessLog(
  ctx: { db: any; scheduler: any },
  auditContext: AuditContext,
  entityType: string,
  entityId: string,
  metadata?: any
) {
  await createAuditLog(ctx, auditContext, {
    action: "accessed",
    entityType,
    entityId,
    severity: "low",
    category: "data_access",
    description: `Accessed ${entityType} record ${entityId}`,
    metadata,
    dataClassification: getDefaultDataClassification(entityType),
  })
}

// Helper function to create audit log for authentication events
export async function createAuthenticationLog(
  ctx: { db: any; scheduler: any },
  auditContext: AuditContext,
  action: "login" | "logout" | "failed_login" | "password_change" | "session_expired",
  successful: boolean = true,
  errorMessage?: string
) {
  const severity = action === "failed_login" ? "medium" : "low"
  const description = getAuthenticationDescription(action, successful)
  
  await createAuditLog(ctx, auditContext, {
    action,
    entityType: "authentication",
    entityId: auditContext.userId,
    severity,
    category: "authentication",
    description,
    successful,
    errorMessage,
    dataClassification: "confidential",
  })
}

// Helper function to create audit log for authorization events
export async function createAuthorizationLog(
  ctx: { db: any; scheduler: any },
  auditContext: AuditContext,
  action: "permission_granted" | "permission_denied" | "role_change",
  targetResource: string,
  successful: boolean = true,
  errorMessage?: string
) {
  await createAuditLog(ctx, auditContext, {
    action,
    entityType: "authorization",
    entityId: targetResource,
    severity: successful ? "medium" : "high",
    category: "authorization",
    description: `${action} for resource ${targetResource}`,
    successful,
    errorMessage,
    dataClassification: "confidential",
  })
}

// Helper function to create audit log for bulk operations
export async function createBulkOperationLog(
  ctx: { db: any; scheduler: any },
  auditContext: AuditContext,
  action: string,
  entityType: string,
  affectedRecords: number,
  metadata?: any
) {
  await createAuditLog(ctx, auditContext, {
    action: `bulk_${action}`,
    entityType,
    entityId: "bulk_operation",
    severity: affectedRecords > 100 ? "high" : "medium",
    category: "data_modification",
    description: `Bulk ${action} operation on ${affectedRecords} ${entityType} records`,
    affectedRecords,
    metadata,
    dataClassification: getDefaultDataClassification(entityType),
  })
}

// Helper function to create audit log for system events
export async function createSystemLog(
  ctx: { db: any; scheduler: any },
  action: string,
  description: string,
  severity: "low" | "medium" | "high" | "critical" = "low",
  metadata?: any
) {
  const systemContext: AuditContext = {
    userId: "system" as Id<"users">,
    ipAddress: "127.0.0.1",
    userAgent: "System Process",
  }
  
  await createAuditLog(ctx, systemContext, {
    action,
    entityType: "system",
    entityId: "system",
    severity,
    category: "system",
    description,
    metadata,
    dataClassification: "internal",
  })
}

// Helper function to compare objects and generate changes
export function generateChanges(oldData: any, newData: any): any {
  const changes: any = {}
  
  // Get all keys from both objects
  const allKeys = new Set([...Object.keys(oldData || {}), ...Object.keys(newData || {})])
  
  for (const key of allKeys) {
    const oldValue = oldData?.[key]
    const newValue = newData?.[key]
    
    // Skip certain fields that shouldn't be audited
    if (key === 'updatedAt' || key === 'createdAt' || key === '_id' || key === '_creationTime') {
      continue
    }
    
    // Deep comparison for arrays and objects
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes[key] = {
        from: oldValue,
        to: newValue
      }
    }
  }
  
  return Object.keys(changes).length > 0 ? changes : null
}

// Helper function to get default severity based on action and entity type
function getDefaultSeverity(action: string, entityType: string): "low" | "medium" | "high" | "critical" {
  const criticalActions = ["delete", "bulk_delete", "restore", "permission_change"]
  const highActions = ["created", "updated", "export", "import", "backup"]
  const mediumActions = ["accessed", "login", "logout"]
  
  const criticalEntities = ["users", "permissions", "settings", "auditLogs"]
  
  if (criticalActions.includes(action) || criticalEntities.includes(entityType)) {
    return action === "delete" || action === "bulk_delete" ? "critical" : "high"
  }
  
  if (highActions.includes(action)) {
    return "medium"
  }
  
  if (mediumActions.includes(action)) {
    return "low"
  }
  
  return "low"
}

// Helper function to get default category based on action
function getDefaultCategory(action: string): string {
  const categoryMap: Record<string, string> = {
    created: "data_modification",
    updated: "data_modification",
    deleted: "data_modification",
    bulk_created: "data_modification",
    bulk_updated: "data_modification",
    bulk_deleted: "data_modification",
    accessed: "data_access",
    viewed: "data_access",
    exported: "data_access",
    imported: "data_modification",
    login: "authentication",
    logout: "authentication",
    failed_login: "authentication",
    password_change: "authentication",
    session_expired: "authentication",
    permission_granted: "authorization",
    permission_denied: "authorization",
    role_change: "authorization",
    backup: "system",
    restore: "system",
    cleanup: "system",
  }
  
  return categoryMap[action] || "general"
}

// Helper function to get default data classification based on entity type
function getDefaultDataClassification(entityType: string): "public" | "internal" | "confidential" | "restricted" {
  const classificationMap: Record<string, "public" | "internal" | "confidential" | "restricted"> = {
    users: "confidential",
    permissions: "restricted",
    settings: "confidential",
    auditLogs: "restricted",
    contacts: "confidential",
    projects: "internal",
    tasks: "internal",
    payments: "confidential",
    communications: "confidential",
    notes: "internal",
    templates: "internal",
    metrics: "internal",
    reports: "internal",
    authentication: "confidential",
    authorization: "restricted",
    system: "internal",
  }
  
  return classificationMap[entityType] || "internal"
}

// Helper function to generate description based on action and entity
function generateDescription(action: string, entityType: string, entityId: string): string {
  const actionMap: Record<string, string> = {
    created: "Created",
    updated: "Updated",
    deleted: "Deleted",
    accessed: "Accessed",
    viewed: "Viewed",
    exported: "Exported",
    imported: "Imported",
    login: "Logged in",
    logout: "Logged out",
    failed_login: "Failed login attempt",
    password_change: "Changed password",
    session_expired: "Session expired",
    permission_granted: "Permission granted",
    permission_denied: "Permission denied",
    role_change: "Role changed",
    backup: "Created backup",
    restore: "Restored from backup",
    cleanup: "Cleaned up",
  }
  
  const actionText = actionMap[action] || action
  return `${actionText} ${entityType} ${entityId}`
}

// Helper function to generate authentication description
function getAuthenticationDescription(action: string, successful: boolean): string {
  const descriptions: Record<string, string> = {
    login: successful ? "Successful login" : "Failed login attempt",
    logout: "User logged out",
    failed_login: "Failed login attempt",
    password_change: successful ? "Password changed successfully" : "Password change failed",
    session_expired: "Session expired",
  }
  
  return descriptions[action] || `Authentication event: ${action}`
}

// Helper function to sanitize sensitive data from audit logs
export function sanitizeAuditData(data: any): any {
  if (!data) return data
  
  const sensitiveFields = [
    'password',
    'passwordHash',
    'token',
    'secret',
    'key',
    'apiKey',
    'authToken',
    'sessionToken',
    'refreshToken',
    'accessToken',
    'privateKey',
    'creditCard',
    'ssn',
    'bankAccount',
  ]
  
  const sanitized = { ...data }
  
  function sanitizeObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null) return obj
    
    const result: any = {}
    for (const [key, value] of Object.entries(obj)) {
      const keyLower = key.toLowerCase()
      if (sensitiveFields.some(field => keyLower.includes(field))) {
        result[key] = '[REDACTED]'
      } else if (typeof value === 'object' && value !== null) {
        result[key] = sanitizeObject(value)
      } else {
        result[key] = value
      }
    }
    return result
  }
  
  return sanitizeObject(sanitized)
}