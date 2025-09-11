import { Id } from "@/convex/_generated/dataModel"

// Audit context interface
export interface AuditContext {
  userId: Id<"users">
  ipAddress?: string
  userAgent?: string
  sessionId?: string
}

// Global audit context state
let currentAuditContext: AuditContext | null = null

// Function to set audit context (call this on app initialization/login)
export function setAuditContext(context: AuditContext) {
  currentAuditContext = context
}

// Function to get current audit context
export function getAuditContext(): AuditContext | null {
  return currentAuditContext
}

// Function to clear audit context (call this on logout)
export function clearAuditContext() {
  currentAuditContext = null
}

// Function to update audit context (e.g., when session changes)
export function updateAuditContext(updates: Partial<AuditContext>) {
  if (currentAuditContext) {
    currentAuditContext = { ...currentAuditContext, ...updates }
  }
}

// Function to get client-side audit information
export function getClientAuditInfo(): Partial<AuditContext> {
  if (typeof window === 'undefined') {
    return {} // Server-side, no client info available
  }

  return {
    userAgent: navigator.userAgent,
    // IP address would need to be fetched from the server or a service
    // For now, we'll leave it to be added by the server
  }
}

// Function to merge audit context with client info
export function getFullAuditContext(): AuditContext | null {
  if (!currentAuditContext) return null

  const clientInfo = getClientAuditInfo()
  
  return {
    ...currentAuditContext,
    ...clientInfo,
    sessionId: currentAuditContext.sessionId || generateSessionId(),
  }
}

// Generate a session ID if one doesn't exist
function generateSessionId(): string {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    let sessionId = sessionStorage.getItem('audit-session-id')
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('audit-session-id', sessionId)
    }
    return sessionId
  }
  
  // Fallback for server-side or when sessionStorage is not available
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Hook for React components to use audit context
export function useAuditContext() {
  return {
    auditContext: getAuditContext(),
    setAuditContext,
    clearAuditContext,
    updateAuditContext,
    getFullAuditContext,
  }
}

// Helper function to enhance mutation arguments with audit context
export function withAuditContext<T extends Record<string, any>>(args: T): T & Partial<AuditContext> {
  const auditContext = getFullAuditContext()
  
  if (!auditContext) {
    console.warn('No audit context available. Operations may not be properly logged.')
    return args
  }

  return {
    ...args,
    userId: auditContext.userId,
    ipAddress: auditContext.ipAddress,
    userAgent: auditContext.userAgent,
    sessionId: auditContext.sessionId,
  }
}

// Decorator for automatically adding audit context to mutations
export function auditLogged<T extends (...args: any[]) => any>(fn: T): T {
  return ((...args: any[]) => {
    // If the first argument is an object, enhance it with audit context
    if (args.length > 0 && typeof args[0] === 'object' && args[0] !== null) {
      args[0] = withAuditContext(args[0])
    }
    
    return fn(...args)
  }) as T
}

// Utility for detecting suspicious activity patterns
export class AuditAnalyzer {
  private static readonly SUSPICIOUS_PATTERNS = {
    RAPID_ACTIONS: { threshold: 10, window: 60000 }, // 10 actions in 1 minute
    BULK_OPERATIONS: { threshold: 100 }, // More than 100 records in one operation
    OFF_HOURS: { startHour: 22, endHour: 6 }, // Actions between 10 PM and 6 AM
    MULTIPLE_FAILURES: { threshold: 5, window: 300000 }, // 5 failures in 5 minutes
  }

  static analyzeActionRisk(action: string, entityType: string, metadata?: any): {
    riskScore: number
    flags: string[]
    recommendations: string[]
  } {
    let riskScore = 0
    const flags: string[] = []
    const recommendations: string[] = []

    // Base risk by action type
    const actionRisk = {
      'delete': 30,
      'bulk_delete': 60,
      'export': 25,
      'import': 35,
      'update': 15,
      'create': 10,
      'access': 5,
    }

    riskScore += actionRisk[action as keyof typeof actionRisk] || 10

    // Entity type sensitivity
    const entityRisk = {
      'users': 20,
      'permissions': 25,
      'settings': 20,
      'auditLogs': 25,
      'payments': 15,
      'contacts': 10,
      'projects': 5,
      'tasks': 5,
    }

    riskScore += entityRisk[entityType as keyof typeof entityRisk] || 5

    // Time-based risk (off-hours)
    const currentHour = new Date().getHours()
    const { startHour, endHour } = this.SUSPICIOUS_PATTERNS.OFF_HOURS
    if (currentHour >= startHour || currentHour <= endHour) {
      riskScore += 10
      flags.push('off_hours_activity')
      recommendations.push('Review off-hours activity patterns')
    }

    // Bulk operation risk
    if (metadata?.affectedRecords && metadata.affectedRecords > this.SUSPICIOUS_PATTERNS.BULK_OPERATIONS.threshold) {
      riskScore += 15
      flags.push('large_bulk_operation')
      recommendations.push('Verify bulk operation was intentional')
    }

    // High-privilege actions
    if (['delete', 'bulk_delete', 'export', 'permission_change'].includes(action)) {
      flags.push('high_privilege_action')
      recommendations.push('Ensure action was authorized')
    }

    // Failed actions
    if (metadata?.successful === false) {
      riskScore += 10
      flags.push('failed_action')
      recommendations.push('Investigate failure cause')
    }

    return {
      riskScore: Math.min(riskScore, 100),
      flags,
      recommendations,
    }
  }

  static isActionSuspicious(action: string, entityType: string, metadata?: any): boolean {
    const analysis = this.analyzeActionRisk(action, entityType, metadata)
    return analysis.riskScore > 50 || analysis.flags.some(flag => 
      ['off_hours_activity', 'large_bulk_operation', 'high_privilege_action'].includes(flag)
    )
  }
}

// IP address utilities (for client-side IP detection)
export class IPUtils {
  private static cachedIP: string | null = null

  static async getClientIP(): Promise<string | null> {
    if (this.cachedIP) return this.cachedIP

    if (typeof window === 'undefined') return null

    try {
      // Try multiple IP detection services
      const services = [
        'https://api.ipify.org?format=json',
        'https://ipapi.co/json/',
        'https://api.ip.sb/jsonip',
      ]

      for (const service of services) {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 5000)
          
          const response = await fetch(service, { 
            signal: controller.signal,
            headers: { 'Accept': 'application/json' }
          })
          
          clearTimeout(timeoutId)
          
          if (response.ok) {
            const data = await response.json()
            const ip = data.ip || data.query || data.ip_addr
            
            if (ip) {
              this.cachedIP = ip
              return ip
            }
          }
        } catch (error) {
          console.debug(`IP service ${service} failed:`, error)
          continue
        }
      }

      return null
    } catch (error) {
      console.debug('Failed to get client IP:', error)
      return null
    }
  }

  static clearIPCache() {
    this.cachedIP = null
  }
}

// Enhanced audit context with automatic IP detection
export async function getEnhancedAuditContext(): Promise<AuditContext | null> {
  const basicContext = getFullAuditContext()
  if (!basicContext) return null

  try {
    const ip = await IPUtils.getClientIP()
    return {
      ...basicContext,
      ipAddress: ip || basicContext.ipAddress,
    }
  } catch (error) {
    console.debug('Failed to enhance audit context with IP:', error)
    return basicContext
  }
}

// Browser fingerprinting for additional security context
export class BrowserFingerprint {
  static generate(): string {
    if (typeof window === 'undefined') return 'server'

    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
      !!window.localStorage,
      !!window.sessionStorage,
    ]

    const fingerprint = components.join('|')
    return this.hash(fingerprint)
  }

  private static hash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString(16)
  }
}