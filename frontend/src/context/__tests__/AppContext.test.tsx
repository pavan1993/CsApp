import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { AppProvider, useAppContext, useAppActions } from '../AppContext'

const mockOrganization = (overrides = {}) => ({
  id: 'org-1',
  name: 'Test Organization',
  ...overrides,
})

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AppProvider>{children}</AppProvider>
)

describe('AppContext', () => {
  it('provides initial state', () => {
    const { result } = renderHook(() => useAppContext(), { wrapper })
    
    expect(result.current.state).toEqual({
      selectedOrganization: null,
      organizations: [],
      user: null,
      isLoading: false,
      error: null,
    })
  })

  it('updates loading state', () => {
    const { result } = renderHook(() => {
      const context = useAppContext()
      const actions = useAppActions()
      return { context, actions }
    }, { wrapper })
    
    act(() => {
      result.current.actions.setLoading(true)
    })
    
    expect(result.current.context.state.isLoading).toBe(true)
  })

  it('updates error state', () => {
    const { result } = renderHook(() => {
      const context = useAppContext()
      const actions = useAppActions()
      return { context, actions }
    }, { wrapper })
    
    act(() => {
      result.current.actions.setError('Test error')
    })
    
    expect(result.current.context.state.error).toBe('Test error')
  })

  it('updates organizations', () => {
    const { result } = renderHook(() => {
      const context = useAppContext()
      const actions = useAppActions()
      return { context, actions }
    }, { wrapper })
    
    const orgs = [mockOrganization()]
    
    act(() => {
      result.current.actions.setOrganizations(orgs)
    })
    
    expect(result.current.context.state.organizations).toEqual(orgs)
  })

  it('updates selected organization', () => {
    const { result } = renderHook(() => {
      const context = useAppContext()
      const actions = useAppActions()
      return { context, actions }
    }, { wrapper })
    
    const org = mockOrganization()
    
    act(() => {
      result.current.actions.setSelectedOrganization(org)
    })
    
    expect(result.current.context.state.selectedOrganization).toEqual(org)
  })

  it('resets state', () => {
    const { result } = renderHook(() => {
      const context = useAppContext()
      const actions = useAppActions()
      return { context, actions }
    }, { wrapper })
    
    // Set some state first
    act(() => {
      result.current.actions.setLoading(true)
      result.current.actions.setError('Test error')
      result.current.actions.setOrganizations([mockOrganization()])
    })
    
    // Reset state
    act(() => {
      result.current.actions.resetState()
    })
    
    expect(result.current.context.state).toEqual({
      selectedOrganization: null,
      organizations: [],
      user: null,
      isLoading: false,
      error: null,
    })
  })

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    expect(() => {
      renderHook(() => useAppContext())
    }).toThrow('useAppContext must be used within an AppProvider')
    
    consoleSpy.mockRestore()
  })
})
