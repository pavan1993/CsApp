import React from 'react'
import { screen, fireEvent } from '@testing-library/react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AppHeader from '../AppHeader'
import { AppProvider } from '../../context/AppContext'

const renderAppHeader = (initialEntries = ['/']) => {
  return render(
    <AppProvider>
      <MemoryRouter initialEntries={initialEntries}>
        <AppHeader />
      </MemoryRouter>
    </AppProvider>
  )
}

describe('AppHeader', () => {
  it('renders app title', () => {
    renderAppHeader()
    expect(screen.getByText('Customer Success Analytics')).toBeInTheDocument()
  })

  it('renders navigation links', () => {
    renderAppHeader()
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Customers')).toBeInTheDocument()
    expect(screen.getByText('Analytics')).toBeInTheDocument()
  })

  it('shows mobile menu button', () => {
    renderAppHeader()
    
    const menuButton = screen.getByRole('button', { name: /open main menu/i })
    expect(menuButton).toBeInTheDocument()
  })

  it('toggles mobile menu', () => {
    renderAppHeader()
    
    const menuButton = screen.getByRole('button', { name: /open main menu/i })
    fireEvent.click(menuButton)
    
    // Mobile menu should be visible - check for multiple instances of navigation items
    const dashboardLinks = screen.getAllByText('Dashboard')
    expect(dashboardLinks.length).toBeGreaterThan(1) // Desktop + mobile menu
  })

  it('highlights active navigation item', () => {
    renderAppHeader(['/'])
    
    const dashboardLink = screen.getByRole('link', { name: /dashboard/i })
    expect(dashboardLink).toHaveClass('border-blue-500')
  })
})
