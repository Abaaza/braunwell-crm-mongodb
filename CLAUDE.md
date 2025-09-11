# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Braunwell CRM is a Next.js 15.3 application with TypeScript, using Convex as the backend database/API layer. It's a modern CRM system designed for UK businesses with features including project management, invoicing, expense tracking, and analytics.

## Essential Commands

### Development
```bash
npm run dev      # Start Next.js development server
npm run convex   # Start Convex dev server (run in separate terminal)
```

### Build & Production
```bash
npm run build    # Build Next.js application
npm run start    # Start production server
```

### Testing
```bash
npm run test              # Run Jest unit tests
npm run test:watch        # Run tests in watch mode
npm run test:coverage     # Run tests with coverage report
npm run test:e2e          # Run Playwright E2E tests
npm run test:e2e:ui       # Run Playwright with UI mode
npm run test:e2e:debug    # Debug Playwright tests
npm run test:all          # Run all tests (unit + E2E)
```

### Code Quality
```bash
npm run lint     # Run ESLint
```

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 15.3 with App Router, React 19, TypeScript
- **Styling**: Tailwind CSS with custom animations, Radix UI primitives
- **Backend**: Convex (serverless database with real-time subscriptions)
- **State Management**: React Context (AuthProvider) + Convex real-time queries
- **Authentication**: Custom JWT-based auth with session management
- **Security**: CSRF protection, rate limiting, encryption for sensitive data

### Key Architectural Patterns

1. **Authentication Flow**
   - Custom authentication system in `lib/auth.tsx` using JWT tokens
   - Session management with HTTP-only cookies
   - CSRF protection middleware in `middleware.ts`
   - Role-based access control (admin/user roles)

2. **Data Layer (Convex)**
   - Schema defined in `convex/schema.ts` with comprehensive type safety
   - Mutations and queries in individual files under `convex/`
   - Encryption for sensitive data (e.g., project revenue) using `convex/lib/encryption.ts`
   - Real-time subscriptions for live updates

3. **Security Implementation**
   - Middleware-level security headers and rate limiting
   - CSRF token validation for state-changing operations
   - Encrypted storage for sensitive financial data
   - Comprehensive audit logging system

4. **Component Architecture**
   - Modular UI components in `components/ui/` (shadcn/ui pattern)
   - Domain-specific components organized by feature
   - Lazy loading for performance optimization
   - Custom hooks for common functionality

5. **Key Features**
   - **Projects & Tasks**: Full project management with recurring tasks
   - **Invoicing**: UK-compliant invoice generation with VAT handling
   - **Expenses**: Expense tracking with approval workflow
   - **Analytics**: Customizable dashboards with various chart types
   - **Custom Fields**: Dynamic field system for extending entities
   - **Audit Trail**: Comprehensive logging of all system actions

### Important Files & Directories
- `app/(dashboard)/` - Protected dashboard routes
- `convex/` - Backend functions and schema
- `lib/` - Core utilities, auth, encryption, security
- `components/` - Reusable UI components
- `hooks/` - Custom React hooks
- `middleware.ts` - Security and rate limiting middleware

### Development Considerations
- Always run both `npm run dev` and `npm run convex` for full development environment
- Sensitive data (revenue, financial info) must use encryption utilities
- All state-changing operations require CSRF token validation
- Follow existing patterns for component structure and naming conventions
- Use the established security utilities for any new sensitive operations