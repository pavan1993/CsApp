import React from 'react'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Sidebar from '../Sidebar'
import { AppProvider } from '../../context/AppContext'
import apiService from '../../services/api'

// Mock the API service
vi.mock('../../services/api')
const mockApiService = vi.mocked(apiService)

const renderSidebar = () => {
  return render(
    <AppProvider>
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    </AppProvider>
  )
}

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders organization selector', async () => {
    mockApiService.getOrganizations.mockResolvedValue([])
    
    renderSidebar()
    
    expect(screen.getByText('Organization')).toBeInTheDocument()
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.getByText('No organizations available. Upload some data to get started.')).toBeInTheDocument()
    })
  })

  it('loads and displays organizations', async () => {
    const orgs = ['Org 1', 'Org 2']
    mockApiService.getOrganizations.mockResolvedValue(orgs)
    
    renderSidebar()
    
    await waitFor(() => {
      expect(mockApiService.getOrganizations).toHaveBeenCalled()
    })
    
    // Should show the first organization as selected
    await waitFor(() => {
      expect(screen.getByText('Org 1')).toBeInTheDocument()
    })
  })

  it('opens dropdown when clicked', async () => {
    const orgs = ['Org 1', 'Org 2']
    mockApiService.getOrganizations.mockResolvedValue(orgs)
    
    renderSidebar()
    
    await waitFor(() => {
      expect(mockApiService.getOrganizations).toHaveBeenCalled()
    })
    
    // Wait for organizations to load and find the dropdown button
    await waitFor(() => {
      expect(screen.getByText('Org 1')).toBeInTheDocument()
    })
    
    const dropdown = screen.getByRole('button', { name: /org 1/i })
    fireEvent.click(dropdown)
    
    await waitFor(() => {
      expect(screen.getByText('Org 2')).toBeInTheDocument()
    })
  })

  it('shows quick actions section', () => {
    mockApiService.getOrganizations.mockResolvedValue([])
    
    renderSidebar()
    
    expect(screen.getByText('Quick Actions')).toBeInTheDocument()
  })

  it('handles API error gracefully', async () => {
    mockApiService.getOrganizations.mockRejectedValue(new Error('API Error'))
    
    renderSidebar()
    
    await waitFor(() => {
      expect(mockApiService.getOrganizations).toHaveBeenCalled()
    })
    
    // Should not crash and should show appropriate message
    await waitFor(() => {
      expect(screen.getByText('No organizations available. Upload some data to get started.')).toBeInTheDocument()
    })
  })
})
