# Testing Setup Documentation

This document describes the comprehensive testing setup for the Braunwell CRM Next.js application.

## Overview

The testing infrastructure includes:
- **Jest** with React Testing Library for unit and integration tests
- **Playwright** for end-to-end (E2E) testing
- **TypeScript** support for all tests
- **Coverage reporting** with configurable thresholds
- **Comprehensive mocking** for Next.js, Convex, and UI components

## Test Structure

```
├── __tests__/
│   ├── components/          # Component unit tests
│   │   ├── button.test.tsx
│   │   ├── card.test.tsx
│   │   └── stat-card.test.tsx
│   ├── integration/         # Integration tests
│   │   ├── auth.test.tsx
│   │   └── form-components.test.tsx
│   ├── unit/               # Unit tests for utilities
│   │   ├── utils.test.ts
│   │   └── validations.test.ts
│   └── test-utils.tsx      # Testing utilities and setup
├── e2e/                    # Playwright E2E tests
│   ├── auth.spec.ts
│   ├── component-interactions.spec.ts
│   └── user-journey.spec.ts
├── jest.config.mjs         # Jest configuration
├── jest.setup.js           # Jest setup and global mocks
└── playwright.config.ts    # Playwright configuration
```

## Configuration Files

### Jest Configuration (`jest.config.mjs`)

```javascript
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  dir: './',
})

const config = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  preset: 'ts-jest',
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/', '<rootDir>/e2e/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'hooks/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
}

export default createJestConfig(config)
```

### Jest Setup (`jest.setup.js`)

Includes comprehensive mocks for:
- Next.js router and navigation
- Next.js Link component
- Convex React hooks
- Lucide React icons
- Browser APIs (matchMedia, IntersectionObserver, ResizeObserver)

### Playwright Configuration (`playwright.config.ts`)

```typescript
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

## Available Test Scripts

```bash
# Run all Jest tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run Playwright E2E tests
npm run test:e2e

# Run Playwright tests with UI mode
npm run test:e2e:ui

# Run Playwright tests in debug mode
npm run test:e2e:debug

# Run all tests (Jest + Playwright)
npm run test:all
```

## Test Utilities

### Custom Render Function (`__tests__/test-utils.tsx`)

```typescript
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConvexProvider } from 'convex/react'

// Custom render function with providers
export const customRender = (
  ui: React.ReactElement,
  options?: RenderOptions & { queryClient?: QueryClient }
) => {
  const { queryClient, ...renderOptions } = options || {}
  
  return render(ui, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient || createTestQueryClient()}>
        <ConvexProvider client={mockConvexClient}>
          {children}
        </ConvexProvider>
      </QueryClientProvider>
    ),
    ...renderOptions,
  })
}
```

### Test Data Factories

```typescript
// Create mock user data
export const createMockUser = (overrides = {}) => ({
  _id: 'user_123',
  email: 'test@example.com',
  name: 'Test User',
  role: 'user',
  status: 'active',
  createdAt: Date.now(),
  ...overrides,
})

// Create mock project data
export const createMockProject = (overrides = {}) => ({
  _id: 'project_123',
  name: 'Test Project',
  status: 'active',
  priority: 'medium',
  budget: 10000,
  startDate: Date.now(),
  endDate: Date.now() + 86400000 * 30,
  description: 'Test project description',
  createdBy: 'user_123',
  createdAt: Date.now(),
  ...overrides,
})
```

## Writing Tests

### Unit Tests

```typescript
import { render, screen, fireEvent } from '@/__tests__/test-utils'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('should render button with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('should handle click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### Integration Tests

```typescript
import { render, screen } from '@/__tests__/test-utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

describe('Component Integration', () => {
  it('should render card with button', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Card</CardTitle>
        </CardHeader>
        <CardContent>
          <Button>Click Me</Button>
        </CardContent>
      </Card>
    )

    expect(screen.getByText('Test Card')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Click Me' })).toBeInTheDocument()
  })
})
```

### E2E Tests

```typescript
import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login')
    
    await page.getByLabel('Email').fill('admin@braunwell.com')
    await page.getByLabel('Password').fill('admin123')
    await page.getByRole('button', { name: 'Sign In' }).click()
    
    await page.waitForURL('/dashboard')
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  })
})
```

## Best Practices

### 1. Test Structure
- Use descriptive test names that explain what is being tested
- Group related tests using `describe` blocks
- Use `beforeEach` and `afterEach` for setup and cleanup

### 2. Assertions
- Use semantic queries (`getByRole`, `getByLabelText`, `getByText`)
- Test user interactions, not implementation details
- Assert on what users see and experience

### 3. Mocking
- Mock external dependencies (APIs, third-party libraries)
- Use factory functions for test data
- Keep mocks simple and focused

### 4. Coverage
- Aim for high coverage but focus on critical paths
- Test edge cases and error conditions
- Don't test implementation details

## Troubleshooting

### Common Issues

1. **Import errors**: Ensure all dependencies are mocked in `jest.setup.js`
2. **Async operations**: Use `waitFor` or `findBy` queries for async content
3. **Environment variables**: Mock them in `jest.setup.js`
4. **CSS/styling**: Use `toHaveClass` matcher for class-based assertions

### Debugging Tests

```bash
# Run specific test file
npm test -- button.test.tsx

# Run tests in verbose mode
npm test -- --verbose

# Run tests with coverage
npm test -- --coverage

# Debug Playwright tests
npm run test:e2e:debug
```

## CI/CD Integration

The testing setup is designed for continuous integration:

- Jest tests run quickly for fast feedback
- Playwright tests run in parallel across multiple browsers
- Coverage reports are generated for quality gates
- Test results are reported in multiple formats

## Maintenance

### Adding New Tests
1. Create test files following the naming convention (`*.test.tsx` or `*.spec.ts`)
2. Place unit tests in `__tests__/` directory
3. Place E2E tests in `e2e/` directory
4. Update test utilities as needed

### Updating Mocks
1. Add new mocks to `jest.setup.js`
2. Update type definitions if needed
3. Ensure mocks match the actual API

### Performance
- Keep unit tests fast (< 100ms each)
- Use selective testing for large test suites
- Optimize E2E tests for critical user paths

This testing setup provides a solid foundation for maintaining high code quality and ensuring the application works correctly for end users.