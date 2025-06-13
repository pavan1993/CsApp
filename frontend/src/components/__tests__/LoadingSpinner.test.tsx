import React from 'react'
import { screen } from '@testing-library/react'
import { render } from '../../utils/testUtils'
import LoadingSpinner, { PageLoading, InlineLoading } from '../LoadingSpinner'

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    render(<LoadingSpinner />)
    
    const spinner = screen.getByTestId('loading-spinner')
    expect(spinner).toBeInTheDocument()
  })

  it('renders with custom text', () => {
    render(<LoadingSpinner text="Loading data..." />)
    
    expect(screen.getByText('Loading data...')).toBeInTheDocument()
  })

  it('applies size classes correctly', () => {
    const { rerender } = render(<LoadingSpinner size="sm" />)
    expect(document.querySelector('.w-4')).toBeInTheDocument()
    
    rerender(<LoadingSpinner size="lg" />)
    expect(document.querySelector('.w-8')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<LoadingSpinner className="custom-class" />)
    
    expect(document.querySelector('.custom-class')).toBeInTheDocument()
  })
})

describe('PageLoading', () => {
  it('renders full page loading component', () => {
    render(<PageLoading />)
    
    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(document.querySelector('.min-h-screen')).toBeInTheDocument()
  })

  it('renders with custom text', () => {
    render(<PageLoading text="Please wait..." />)
    
    expect(screen.getByText('Please wait...')).toBeInTheDocument()
  })
})

describe('InlineLoading', () => {
  it('renders inline loading component', () => {
    render(<InlineLoading />)
    
    expect(document.querySelector('.py-8')).toBeInTheDocument()
  })

  it('renders with custom text', () => {
    render(<InlineLoading text="Fetching data..." />)
    
    expect(screen.getByText('Fetching data...')).toBeInTheDocument()
  })
})
