import React from 'react'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { render, mockOrganization } from '../../utils/testUtils'
import Sidebar from '../Sidebar'
import apiService from '../../services/api'

// Mock the API service
vi.mock('../../services/api')
const mockApiService = vi.mocked(apiService)

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders organization selector', () => {
    mockApiService.getOrganizations.mockResolvedValue([])
    
    render(<Sidebar />)
    
    expect(screen.getByText('Organization')).toBeInTheDocument()
    expect(screen.getByText('Select organization')).toBeInTheDocument()
  })

  it('loads and displays organizations', async () => {
    const orgs = ['Org 1', 'Org 2']
    mockApiService.getOrganizations.mockResolvedValue(orgs)
    
    render(<Sidebar />)
    
    await waitFor(() => {
      expect(mockApiService.getOrganizations).toHaveBeenCalled()
    })
  })

  it('opens dropdown when clicked', async () => {
    const orgs = ['Org 1', 'Org 2']
    mockApiService.getOrganizations.mockResolvedValue(orgs)
    
    render(<Sidebar />)
    
    await waitFor(() => {
      expect(mockApiService.getOrganizations).toHaveBeenCalled()
    })
    
    const dropdown = screen.getByRole('button')
    fireEvent.click(dropdown)
    
    await waitFor(() => {
      expect(screen.getByText('Org 1')).toBeInTheDocument()
      expect(screen.getByText('Org 2')).toBeInTheDocument()
    })
  })

  it('shows quick actions section', () => {
    mockApiService.getOrganizations.mockResolvedValue([])
    
    render(<Sidebar />)
    
    expect(screen.getByText('Quick Actions')).toBeInTheDocument()
  })

  it('handles API error gracefully', async () => {
    mockApiService.getOrganizations.mockRejectedValue(new Error('API Error'))
    
    render(<Sidebar />)
    
    await waitFor(() => {
      expect(mockApiService.getOrganizations).toHaveBeenCalled()
    })
    
    // Should not crash and should show appropriate message
    expect(screen.getByText('No organizations available. Upload some data to get started.')).toBeInTheDocument()
  })
})
