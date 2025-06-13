import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { AppProvider, useAppContext, useAppActions } from '../AppContext'
import { mockOrganization, mockUser } from '../../utils/testUtils'

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
    const { result } = renderHook(() => useAppActions(), { wrapper })
    const { result: contextResult } = renderHook(() => useAppContext(), { wrapper })
    
    act(() => {
      result.current.setLoading(true)
    })
    
    expect(contextResult.current.state.isLoading).toBe(true)
  })

  it('updates error state', () => {
    const { result } = renderHook(() => useAppActions(), { wrapper })
    const { result: contextResult } = renderHook(() => useAppContext(), { wrapper })
    
    act(() => {
      result.current.setError('Test error')
    })
    
    expect(contextResult.current.state.error).toBe('Test error')
  })

  it('updates organizations', () => {
    const { result } = renderHook(() => useAppActions(), { wrapper })
    const { result: contextResult } = renderHook(() => useAppContext(), { wrapper })
    
    const orgs = [mockOrganization()]
    
    act(() => {
      result.current.setOrganizations(orgs)
    })
    
    expect(contextResult.current.state.organizations).toEqual(orgs)
  })

  it('updates selected organization', () => {
    const { result } = renderHook(() => useAppActions(), { wrapper })
    const { result: contextResult } = renderHook(() => useAppContext(), { wrapper })
    
    const org = mockOrganization()
    
    act(() => {
      result.current.setSelectedOrganization(org)
    })
    
    expect(contextResult.current.state.selectedOrganization).toEqual(org)
  })

  it('resets state', () => {
    const { result } = renderHook(() => useAppActions(), { wrapper })
    const { result: contextResult } = renderHook(() => useAppContext(), { wrapper })
    
    // Set some state first
    act(() => {
      result.current.setLoading(true)
      result.current.setError('Test error')
      result.current.setOrganizations([mockOrganization()])
    })
    
    // Reset state
    act(() => {
      result.current.resetState()
    })
    
    expect(contextResult.current.state).toEqual({
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
