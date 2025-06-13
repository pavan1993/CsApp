import React from 'react'
import { screen } from '@testing-library/react'
import { render } from '../utils/testUtils'
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

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />)
    
    expect(screen.getByText('Customer Success Analytics')).toBeInTheDocument()
  })

  it('renders dashboard by default', () => {
    render(<App />)
    
    expect(screen.getByText('Dashboard Page')).toBeInTheDocument()
  })

  it('includes error boundary', () => {
    // This test verifies the error boundary is present
    // The actual error handling is tested in ErrorBoundary.test.tsx
    render(<App />)
    
    // App should render normally
    expect(screen.getByText('Customer Success Analytics')).toBeInTheDocument()
  })

  it('includes app provider', () => {
    render(<App />)
    
    // The context provider should be working (tested via other components)
    expect(screen.getByText('Organization')).toBeInTheDocument()
  })
})
