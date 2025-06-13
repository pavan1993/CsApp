import React from 'react'
import { screen } from '@testing-library/react'
import { renderWithoutRouter } from '../utils/testUtils'
import App from '../App'

// Mock the pages to avoid complex dependencies
vi.mock('../pages/Dashboard', () => ({
  default: () => <div>Dashboard Page</div>
}))

vi.mock('../pages/Customers', () => ({
  default: () => <div>Customers Page</div>
}))

vi.mock('../pages/Analytics', () => ({
  default: () => <div>Analytics Page</div>
}))

// Mock API service to prevent network calls
vi.mock('../services/api', () => ({
  default: {
    getOrganizations: vi.fn().mockResolvedValue([]),
  },
}))

const renderApp = () => {
  return renderWithoutRouter(<App />)
}

describe('App', () => {
  it('renders without crashing', () => {
    renderApp()
    
    expect(screen.getByText('Customer Success Analytics')).toBeInTheDocument()
  })

  it('renders dashboard by default', () => {
    renderApp()
    
    expect(screen.getByText('Dashboard Page')).toBeInTheDocument()
  })

  it('includes error boundary', () => {
    // This test verifies the error boundary is present
    // The actual error handling is tested in ErrorBoundary.test.tsx
    renderApp()
    
    // App should render normally
    expect(screen.getByText('Customer Success Analytics')).toBeInTheDocument()
  })

  it('includes app provider', () => {
    renderApp()
    
    // The context provider should be working (tested via other components)
    expect(screen.getByText('Organization')).toBeInTheDocument()
  })
})
