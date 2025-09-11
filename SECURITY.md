# Security Implementation Guide

This document outlines the comprehensive security measures implemented in the Braunwell CRM application.

## Overview

The application implements multiple layers of security to protect against common web vulnerabilities including:

- Cross-Site Request Forgery (CSRF)
- Cross-Site Scripting (XSS)
- SQL Injection
- Brute Force Attacks
- Rate Limiting
- Input Validation
- Session Management
- Content Security Policy (CSP)

## Security Features

### 1. CSRF Protection

**Implementation**: JWT-based CSRF tokens with session validation

**Files**:
- `lib/csrf.ts` - Token generation and validation
- `hooks/use-csrf.ts` - React hook for CSRF protection
- `app/api/csrf-token/route.ts` - CSRF token endpoint

**Features**:
- Secure token generation using JWT
- Session-based token validation
- Automatic token refresh
- One-time token consumption to prevent replay attacks

**Usage**:
```typescript
// In React components
const { token, getHeaders } = useCSRF()

// In API calls
fetch('/api/endpoint', {
  method: 'POST',
  headers: getHeaders(),
  body: JSON.stringify(data)
})
```

### 2. Rate Limiting

**Implementation**: In-memory token bucket algorithm with configurable limits

**Files**:
- `lib/rate-limit.ts` - Rate limiting implementation
- `middleware.ts` - Middleware integration

**Features**:
- Configurable limits per endpoint
- IP-based rate limiting
- Automatic cleanup of expired entries
- Different limits for authentication vs. general API calls

**Configuration**:
```typescript
// Login attempts: 5 per 15 minutes
// API calls: 100 per 15 minutes
// Registration: 3 per hour
```

### 3. Security Headers

**Implementation**: Comprehensive security headers via middleware and Next.js config

**Files**:
- `middleware.ts` - Runtime security headers
- `next.config.ts` - Build-time security headers

**Headers Applied**:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(), microphone=(), camera=()`
- `Content-Security-Policy: [strict policy]`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`

### 4. Input Validation & Sanitization

**Implementation**: Multi-layer validation with sanitization

**Files**:
- `lib/api-security.ts` - API input validation
- `lib/security-utils.ts` - Utility functions
- `lib/validations.ts` - Form validation schemas

**Features**:
- Email validation with regex patterns
- Password strength requirements
- HTML tag removal
- SQL injection pattern detection
- XSS attempt detection

### 5. Authentication Security

**Implementation**: Enhanced Convex authentication with rate limiting

**Files**:
- `convex/auth.ts` - Authentication functions
- `lib/auth.tsx` - Authentication context

**Features**:
- Rate limiting on login attempts
- Audit logging for authentication events
- Session token validation
- Account lockout after failed attempts

### 6. API Route Security

**Implementation**: Comprehensive middleware for API protection

**Files**:
- `lib/api-security.ts` - Security middleware
- `lib/security-config.ts` - Configuration
- `middleware.ts` - Global middleware

**Features**:
- Authentication requirement
- CSRF token validation
- Rate limiting
- Method validation
- Origin validation
- Content-Type validation

## Usage Examples

### Securing API Routes

```typescript
import { secureApiRoute } from '@/lib/api-security'

export const POST = secureApiRoute(async (req: NextRequest) => {
  // Your API logic here
  return NextResponse.json({ success: true })
}, {
  requireAuth: true,
  requireCSRF: true,
  allowedMethods: ['POST'],
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 20,
  },
})
```

### Using CSRF Protection in Forms

```typescript
import { useCSRF } from '@/hooks/use-csrf'

function MyForm() {
  const { token, getHeaders } = useCSRF()
  
  const handleSubmit = async (data) => {
    const response = await fetch('/api/submit', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    })
  }
}
```

### Rate Limiting Specific Endpoints

```typescript
import { authRateLimit } from '@/lib/rate-limit'

// In your API route
const rateLimitResult = await authRateLimit.login(clientIp)
if (!rateLimitResult.success) {
  return new Response('Rate limit exceeded', { status: 429 })
}
```

## Security Configuration

### Environment Variables

```env
# CSRF Secret (required in production)
CSRF_SECRET=your-secure-csrf-secret-key

# Encryption Key (for sensitive data)
ENCRYPTION_KEY=your-secure-encryption-key

# App URL (for CORS validation)
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Rate Limiting Configuration

Rate limits are configured in `lib/security-config.ts`:

```typescript
export const SECURITY_CONFIG = {
  rateLimit: {
    auth: {
      login: { windowMs: 15 * 60 * 1000, maxRequests: 5 },
      register: { windowMs: 60 * 60 * 1000, maxRequests: 3 },
    },
    api: {
      general: { windowMs: 15 * 60 * 1000, maxRequests: 100 },
    },
  },
}
```

## Testing

Security implementations are thoroughly tested:

- Unit tests for all security functions
- Integration tests for middleware
- Performance tests for rate limiting
- CSRF token validation tests

Run security tests:
```bash
npm test -- __tests__/security/
```

## Security Checklist

- [x] CSRF protection implemented
- [x] Rate limiting configured
- [x] Security headers applied
- [x] Input validation and sanitization
- [x] Authentication security enhanced
- [x] API route protection
- [x] Session management secured
- [x] Audit logging implemented
- [x] Content Security Policy configured
- [x] XSS protection measures
- [x] SQL injection prevention
- [x] Path traversal protection

## Best Practices

1. **Never store sensitive data in localStorage**
2. **Always validate input on both client and server**
3. **Use HTTPS in production**
4. **Regularly update dependencies**
5. **Monitor security logs**
6. **Implement proper error handling**
7. **Use secure cookies**
8. **Implement proper session management**

## Monitoring and Logging

Security events are logged for monitoring:

- Failed login attempts
- Rate limit violations
- CSRF token failures
- Suspicious activity detection
- Authentication events

## Production Considerations

1. **Use Redis for rate limiting** (replace in-memory storage)
2. **Implement proper logging infrastructure**
3. **Set up security monitoring**
4. **Configure proper SSL/TLS**
5. **Use environment-specific configurations**
6. **Implement backup and recovery procedures**

## Security Headers Details

### Content Security Policy (CSP)

The CSP header prevents XSS attacks by controlling resource loading:

```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:;
font-src 'self';
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
connect-src 'self' wss: ws:;
```

### Permissions Policy

Restricts access to browser APIs:

```
geolocation=(), microphone=(), camera=(), payment=(), usb=(), 
magnetometer=(), gyroscope=(), speaker=(), bluetooth=(), midi=(), 
document-domain=()
```

## Incident Response

In case of security incidents:

1. **Immediately review security logs**
2. **Check for rate limiting violations**
3. **Verify CSRF token usage**
4. **Analyze authentication attempts**
5. **Update security configurations if needed**
6. **Monitor for additional threats**

## Future Enhancements

Potential security improvements:

- [ ] Implement Redis-based rate limiting
- [ ] Add IP geolocation blocking
- [ ] Implement device fingerprinting
- [ ] Add advanced threat detection
- [ ] Implement automated security scanning
- [ ] Add security incident reporting

## Support

For security-related questions or concerns:

1. Review this documentation
2. Check the test files for examples
3. Consult the security configuration files
4. Review the middleware implementation

## Compliance

This security implementation helps meet various compliance requirements:

- **GDPR**: Data protection and privacy
- **OWASP**: Top 10 security risks mitigation
- **SOC 2**: Security controls
- **ISO 27001**: Information security management