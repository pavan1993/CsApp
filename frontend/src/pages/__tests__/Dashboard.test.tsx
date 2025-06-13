import React from 'react'
import { screen } from '@testing-library/react'
import { render } from '../../utils/testUtils'
import Dashboard from '../Dashboard'

describe('Dashboard', () => {
  it('renders dashboard title', () => {
    render(<Dashboard />)
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('renders all stat cards', () => {
    render(<Dashboard />)
    
    expect(screen.getByText('Total Customers')).toBeInTheDocument()
    expect(screen.getByText('Customer Health Score')).toBeInTheDocument()
    expect(screen.getByText('Monthly Revenue')).toBeInTheDocument()
    expect(screen.getByText('Churn Rate')).toBeInTheDocument()
  })

  it('displays stat values', () => {
    render(<Dashboard />)
    
    expect(screen.getByText('2,651')).toBeInTheDocument()
    expect(screen.getByText('8.2/10')).toBeInTheDocument()
    expect(screen.getByText('$405,091')).toBeInTheDocument()
    expect(screen.getByText('2.1%')).toBeInTheDocument()
  })

  it('shows change indicators', () => {
    render(<Dashboard />)
    
    expect(screen.getByText('+4.75%')).toBeInTheDocument()
    expect(screen.getByText('+0.3')).toBeInTheDocument()
    expect(screen.getByText('+54.02%')).toBeInTheDocument()
    expect(screen.getByText('-0.5%')).toBeInTheDocument()
  })

  it('renders icons for each stat', () => {
    render(<Dashboard />)
    
    // Check that icons are rendered (they should have aria-hidden="true")
    const icons = document.querySelectorAll('[aria-hidden="true"]')
    expect(icons.length).toBeGreaterThan(0)
  })
})
