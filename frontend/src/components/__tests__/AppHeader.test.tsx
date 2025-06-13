import React from 'react'
import { screen, fireEvent } from '@testing-library/react'
import { render, mockOrganization } from '../../utils/testUtils'
import AppHeader from '../AppHeader'
import { useAppContext } from '../../context/AppContext'

// Mock the context
vi.mock('../../context/AppContext')
const mockUseAppContext = vi.mocked(useAppContext)

describe('AppHeader', () => {
  beforeEach(() => {
    mockUseAppContext.mockReturnValue({
      state: {
        selectedOrganization: null,
        organizations: [],
        user: null,
        isLoading: false,
        error: null,
      },
      dispatch: vi.fn(),
    })
  })

  it('renders app title', () => {
    render(<AppHeader />)
    expect(screen.getByText('Customer Success Analytics')).toBeInTheDocument()
  })

  it('renders navigation links', () => {
    render(<AppHeader />)
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Customers')).toBeInTheDocument()
    expect(screen.getByText('Analytics')).toBeInTheDocument()
  })

  it('shows selected organization', () => {
    const org = mockOrganization({ name: 'Test Org' })
    mockUseAppContext.mockReturnValue({
      state: {
        selectedOrganization: org,
        organizations: [org],
        user: null,
        isLoading: false,
        error: null,
      },
      dispatch: vi.fn(),
    })

    render(<AppHeader />)
    expect(screen.getByText('Test Org')).toBeInTheDocument()
  })

  it('toggles mobile menu', () => {
    render(<AppHeader />)
    
    const menuButton = screen.getByRole('button', { name: /open main menu/i })
    fireEvent.click(menuButton)
    
    // Mobile menu should be visible
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Customers')).toBeInTheDocument()
    expect(screen.getByText('Analytics')).toBeInTheDocument()
  })

  it('highlights active navigation item', () => {
    render(<AppHeader />)
    
    const dashboardLink = screen.getByRole('link', { name: /dashboard/i })
    expect(dashboardLink).toHaveClass('border-blue-500')
  })
})
