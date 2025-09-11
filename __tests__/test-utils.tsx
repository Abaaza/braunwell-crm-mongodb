import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConvexProvider, ConvexReactClient } from 'convex/react'

// Create a test query client
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })
}

// Mock Convex client
const mockConvexClient = {
  watchQuery: jest.fn(),
  setAuth: jest.fn(),
  clearAuth: jest.fn(),
} as unknown as ConvexReactClient

interface AllTheProvidersProps {
  children: React.ReactNode
  queryClient?: QueryClient
}

// Create a wrapper with all providers
function AllTheProviders({ children, queryClient }: AllTheProvidersProps) {
  const testQueryClient = queryClient || createTestQueryClient()

  return (
    <QueryClientProvider client={testQueryClient}>
      <ConvexProvider client={mockConvexClient}>
        {children}
      </ConvexProvider>
    </QueryClientProvider>
  )
}

// Custom render function
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { queryClient?: QueryClient }
) => {
  const { queryClient, ...renderOptions } = options || {}
  
  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders queryClient={queryClient}>{children}</AllTheProviders>
    ),
    ...renderOptions,
  })
}

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }

// Test data factories
export const createMockUser = (overrides = {}) => ({
  _id: 'user_123',
  email: 'test@example.com',
  name: 'Test User',
  role: 'user',
  status: 'active',
  createdAt: Date.now(),
  ...overrides,
})

export const createMockProject = (overrides = {}) => ({
  _id: 'project_123',
  name: 'Test Project',
  status: 'active',
  priority: 'medium',
  budget: 10000,
  startDate: Date.now(),
  endDate: Date.now() + 86400000 * 30, // 30 days later
  description: 'Test project description',
  createdBy: 'user_123',
  createdAt: Date.now(),
  ...overrides,
})

export const createMockContact = (overrides = {}) => ({
  _id: 'contact_123',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  company: 'Test Company',
  status: 'active',
  createdAt: Date.now(),
  ...overrides,
})

export const createMockTask = (overrides = {}) => ({
  _id: 'task_123',
  title: 'Test Task',
  description: 'Test task description',
  status: 'pending',
  priority: 'medium',
  assignedTo: 'user_123',
  projectId: 'project_123',
  dueDate: Date.now() + 86400000 * 7, // 7 days later
  createdAt: Date.now(),
  ...overrides,
})

// Mock implementations for common hooks
export const mockUseQuery = (data: any) => {
  return jest.fn().mockReturnValue(data)
}

export const mockUseMutation = (mutationFn = jest.fn()) => {
  return jest.fn().mockReturnValue({
    mutate: mutationFn,
    mutateAsync: mutationFn,
    isLoading: false,
    isError: false,
    isSuccess: false,
    error: null,
    data: null,
  })
}

// Wait for async updates
export const waitForLoadingToFinish = () => {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

// Test to prevent empty test suite error
describe('Test Utils', () => {
  it('should export test utilities', () => {
    expect(render).toBeDefined()
    expect(createTestQueryClient).toBeDefined()
    expect(createMockUser).toBeDefined()
    expect(createMockProject).toBeDefined()
    expect(createMockContact).toBeDefined()
    expect(createMockTask).toBeDefined()
  })
})