import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppProvider } from '../context/AppContext'
import ErrorBoundary from '../components/ErrorBoundary'

// Custom render function that includes providers
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary>
      <AppProvider>
        <MemoryRouter>
          {children}
        </MemoryRouter>
      </AppProvider>
    </ErrorBoundary>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }

// Mock data generators
export const mockOrganization = (overrides = {}) => ({
  id: 'org-1',
  name: 'Test Organization',
  ...overrides,
})

export const mockUser = (overrides = {}) => ({
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  ...overrides,
})

// Test utilities
export const waitForLoadingToFinish = () => 
  new Promise(resolve => setTimeout(resolve, 0))

export const createMockApiResponse = <T,>(data: T) => ({
  data,
  success: true,
  message: 'Success',
})
