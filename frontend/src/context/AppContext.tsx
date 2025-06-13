import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react'
import { apiService } from '../services/api'

// Types
export interface Organization {
  id: string
  name: string
}

export interface User {
  id: string
  name: string
  email: string
}

export interface AppState {
  selectedOrganization: Organization | null
  organizations: Organization[]
  user: User | null
  isLoading: boolean
  error: string | null
}

export type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ORGANIZATIONS'; payload: Organization[] }
  | { type: 'SET_SELECTED_ORGANIZATION'; payload: Organization | null }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'RESET_STATE' }

// Initial state
const initialState: AppState = {
  selectedOrganization: null,
  organizations: [],
  user: null,
  isLoading: false,
  error: null,
}

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false }
    case 'SET_ORGANIZATIONS':
      return { ...state, organizations: action.payload }
    case 'SET_SELECTED_ORGANIZATION':
      return { ...state, selectedOrganization: action.payload }
    case 'SET_USER':
      return { ...state, user: action.payload }
    case 'RESET_STATE':
      return initialState
    default:
      return state
  }
}

// Context
const AppContext = createContext<{
  state: AppState
  dispatch: React.Dispatch<AppAction>
} | null>(null)

// Provider
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState)

  // Load organizations on mount
  useEffect(() => {
    const loadOrganizations = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true })
        
        // First test the backend connection
        console.log('🔄 Testing backend connection...');
        try {
          await apiService.testConnection();
          console.log('✅ Backend connection successful');
        } catch (connectionError) {
          console.warn('⚠️ Backend connection test failed, but continuing...');
        }
        
        // Try to load organizations
        console.log('🔄 Calling apiService.getOrganizations()...');
        const organizations = await apiService.getOrganizations()
        console.log('📋 Raw organizations response:', organizations);
        
        if (!Array.isArray(organizations)) {
          console.error('❌ Organizations response is not an array:', typeof organizations, organizations);
          throw new Error('Invalid organizations response format');
        }
        
        const orgObjects = organizations.map(name => ({ id: name, name }))
        console.log('🏢 Mapped organization objects:', orgObjects);
        
        dispatch({ type: 'SET_ORGANIZATIONS', payload: orgObjects })
        dispatch({ type: 'SET_ERROR', payload: null })
        
        // Auto-select first organization if available
        if (orgObjects.length > 0) {
          dispatch({ type: 'SET_SELECTED_ORGANIZATION', payload: orgObjects[0] })
          console.log('✅ Auto-selected organization:', orgObjects[0]);
        }
        
        console.log('✅ Organizations loaded successfully:', orgObjects);
      } catch (error) {
        console.error('❌ Failed to load organizations:', error)
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load organizations. Backend may be unavailable.' })
        
        // Provide fallback demo organizations so the app is still usable
        const demoOrganizations = [
          { id: 'demo-org-1', name: 'Demo Organization 1' },
          { id: 'demo-org-2', name: 'Demo Organization 2' }
        ]
        dispatch({ type: 'SET_ORGANIZATIONS', payload: demoOrganizations })
        dispatch({ type: 'SET_SELECTED_ORGANIZATION', payload: demoOrganizations[0] })
        console.log('🔄 Using demo organizations as fallback');
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    }

    loadOrganizations()
  }, [])

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

// Hook
export const useAppContext = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider')
  }
  return context
}

// Action creators
export const useAppActions = () => {
  const { dispatch } = useAppContext()

  return {
    setLoading: (loading: boolean) => dispatch({ type: 'SET_LOADING', payload: loading }),
    setError: (error: string | null) => dispatch({ type: 'SET_ERROR', payload: error }),
    setOrganizations: (organizations: Organization[]) => 
      dispatch({ type: 'SET_ORGANIZATIONS', payload: organizations }),
    setSelectedOrganization: (organization: Organization | null) => 
      dispatch({ type: 'SET_SELECTED_ORGANIZATION', payload: organization }),
    setUser: (user: User | null) => dispatch({ type: 'SET_USER', payload: user }),
    resetState: () => dispatch({ type: 'RESET_STATE' }),
  }
}
