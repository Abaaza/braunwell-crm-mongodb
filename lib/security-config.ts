// Security configuration for the CRM application
export const SECURITY_CONFIG = {
  // Rate limiting configuration
  rateLimit: {
    // Global rate limit
    global: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100,
    },
    
    // Authentication endpoints
    auth: {
      login: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 5,
      },
      register: {
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 3,
      },
      passwordReset: {
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 3,
      },
    },
    
    // API endpoints
    api: {
      general: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 300,
      },
      upload: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 10,
      },
      export: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 5,
      },
    },
  },
  
  // Session configuration
  session: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    httpOnly: true,
  },
  
  // CSRF configuration
  csrf: {
    tokenExpiry: 60 * 60 * 1000, // 1 hour
    secret: process.env.CSRF_SECRET || 'your-csrf-secret-change-in-production',
  },
  
  // Password requirements
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxLength: 128,
  },
  
  // File upload limits
  fileUpload: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
  },
  
  // Content Security Policy
  csp: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:', 'blob:'],
    fontSrc: ["'self'"],
    objectSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    frameAncestors: ["'none'"],
    connectSrc: ["'self'", 'wss:', 'ws:'],
  },
  
  // Allowed origins
  allowedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'https://localhost:3000',
    'http://localhost:3001',
    'https://localhost:3001',
  ],
  
  // Security headers
  headers: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), speaker=(), bluetooth=(), midi=(), document-domain=()',
  },
  
  // Audit logging
  audit: {
    enabled: true,
    events: [
      'login_success',
      'login_failed',
      'logout',
      'password_changed',
      'user_created',
      'user_updated',
      'user_deleted',
      'permission_changed',
      'data_export',
      'data_import',
      'settings_changed',
      'security_violation',
    ],
    retention: 90 * 24 * 60 * 60 * 1000, // 90 days
  },
  
  // IP blocking
  ipBlocking: {
    enabled: true,
    maxFailedAttempts: 10,
    blockDuration: 60 * 60 * 1000, // 1 hour
  },
  
  // Suspicious activity detection
  suspiciousActivity: {
    enabled: true,
    patterns: [
      'rapid_requests',
      'failed_auth_attempts',
      'unusual_user_agent',
      'suspicious_ip',
      'sql_injection_attempt',
      'xss_attempt',
    ],
  },
} as const

// Security middleware configuration for different routes
export const ROUTE_SECURITY_CONFIG = {
  '/api/auth/login': {
    requireAuth: false,
    requireCSRF: false, // Skip CSRF for login
    rateLimit: SECURITY_CONFIG.rateLimit.auth.login,
    allowedMethods: ['POST'],
  },
  
  '/api/auth/register': {
    requireAuth: false,
    requireCSRF: true,
    rateLimit: SECURITY_CONFIG.rateLimit.auth.register,
    allowedMethods: ['POST'],
  },
  
  '/api/auth/logout': {
    requireAuth: true,
    requireCSRF: true,
    rateLimit: SECURITY_CONFIG.rateLimit.global,
    allowedMethods: ['POST'],
  },
  
  '/api/users': {
    requireAuth: true,
    requireCSRF: true,
    rateLimit: SECURITY_CONFIG.rateLimit.api.general,
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    requireRole: 'admin' as const,
  },
  
  '/api/contacts': {
    requireAuth: true,
    requireCSRF: true,
    rateLimit: SECURITY_CONFIG.rateLimit.api.general,
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
  
  '/api/projects': {
    requireAuth: true,
    requireCSRF: true,
    rateLimit: SECURITY_CONFIG.rateLimit.api.general,
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
  
  '/api/upload': {
    requireAuth: true,
    requireCSRF: true,
    rateLimit: SECURITY_CONFIG.rateLimit.api.upload,
    allowedMethods: ['POST'],
  },
  
  '/api/export': {
    requireAuth: true,
    requireCSRF: true,
    rateLimit: SECURITY_CONFIG.rateLimit.api.export,
    allowedMethods: ['GET'],
  },
} as const

// Helper function to get security config for a route
export function getRouteSecurityConfig(pathname: string) {
  // Find the most specific matching route
  const routes = Object.keys(ROUTE_SECURITY_CONFIG)
  const matchingRoute = routes.find(route => pathname.startsWith(route))
  
  if (matchingRoute) {
    return ROUTE_SECURITY_CONFIG[matchingRoute as keyof typeof ROUTE_SECURITY_CONFIG]
  }
  
  // Default configuration
  return {
    requireAuth: true,
    requireCSRF: true,
    rateLimit: SECURITY_CONFIG.rateLimit.global,
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  }
}

// Environment-specific security settings
export const getSecuritySettings = () => {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const isProduction = process.env.NODE_ENV === 'production'
  
  return {
    ...SECURITY_CONFIG,
    
    // Relax some restrictions in development
    csp: {
      ...SECURITY_CONFIG.csp,
      scriptSrc: isDevelopment 
        ? ["'self'", "'unsafe-inline'", "'unsafe-eval'"]
        : ["'self'"],
    },
    
    // Stricter settings in production
    session: {
      ...SECURITY_CONFIG.session,
      secure: isProduction,
    },
    
    // More aggressive rate limiting in production
    rateLimit: {
      ...SECURITY_CONFIG.rateLimit,
      global: {
        ...SECURITY_CONFIG.rateLimit.global,
        maxRequests: isProduction ? 50 : 100,
      },
    },
  }
}