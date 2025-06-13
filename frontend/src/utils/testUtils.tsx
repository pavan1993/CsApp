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

// Providers without router for components that have their own router
const ProvidersWithoutRouter: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

const renderWithoutRouter = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: ProvidersWithoutRouter, ...options })

// Re-export everything
export * from '@testing-library/react'
export { customRender as render, renderWithoutRouter }

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

// Helper functions for testing data import components
export const createMockFile = (name: string, size: number, type: string = 'text/csv'): File => {
  const file = new File(['mock content'], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

export const createMockCSVData = (rowCount: number) => {
  return Array.from({ length: rowCount }, (_, index) => ({
    id: index + 1,
    name: `User ${index + 1}`,
    email: `user${index + 1}@example.com`,
    status: index % 2 === 0 ? 'active' : 'inactive',
    createdAt: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString()
  }))
}

export const validateCSVStructure = (data: any[], requiredColumns: string[]) => {
  const errors: string[] = []
  let validRows = 0
  let invalidRows = 0

  data.forEach((row, index) => {
    let rowValid = true

    requiredColumns.forEach(column => {
      if (!(column in row)) {
        errors.push(`Missing required column: ${column} in row ${index + 1}`)
        rowValid = false
      } else if (!row[column] || String(row[column]).trim() === '') {
        errors.push(`Empty value in required field: ${column} in row ${index + 1}`)
        rowValid = false
      }
    })

    if (rowValid) {
      validRows++
    } else {
      invalidRows++
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
    validRows,
    invalidRows,
    totalRows: data.length
  }
}

export const mockApiResponses = {
  uploadSuccess: { message: 'Upload completed successfully' },
  uploadError: new Error('Upload failed'),
  validationResult: {
    isValid: true,
    errors: [],
    warnings: ['Some minor warnings'],
    rowCount: 100,
    validRows: 98,
    invalidRows: 2
  },
  lastUploadDate: {
    tickets: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    usage: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  }
}
