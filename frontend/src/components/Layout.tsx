import React, { useEffect } from 'react'
import AppHeader from './AppHeader'
import Sidebar from './Sidebar'
import WorkflowStepper from './WorkflowStepper'
import NotificationSystem from './NotificationSystem'
import { useAppContext } from '../context/AppContext'
import { useNotifications, setGlobalNotifications } from '../hooks/useNotifications'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import LoadingSpinner from './LoadingSpinner'
import { useLocation } from 'react-router-dom'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { state, dispatch } = useAppContext()
  const notifications = useNotifications()
  const location = useLocation()
  
  // Initialize keyboard shortcuts
  useKeyboardShortcuts()

  // Set global notifications for use in services
  useEffect(() => {
    setGlobalNotifications(notifications)
  }, [notifications])

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => dispatch({ type: 'SET_ONLINE_STATUS', payload: true })
    const handleOffline = () => dispatch({ type: 'SET_ONLINE_STATUS', payload: false })

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [dispatch])

  // Show offline notification
  useEffect(() => {
    if (!state.isOnline) {
      notifications.warning(
        'You are offline',
        'Some features may not be available until you reconnect.',
        { duration: 0 }
      )
    }
  }, [state.isOnline, notifications])

  // Determine if we should show the workflow stepper
  const showWorkflowStepper = ['/import', '/configuration', '/analytics'].includes(location.pathname)

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      {/* Workflow Stepper */}
      {showWorkflowStepper && (
        <div className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="max-w-7xl mx-auto">
            <WorkflowStepper showLabels={true} />
          </div>
        </div>
      )}
      
      <div className="flex h-[calc(100vh-4rem)]" style={{ height: showWorkflowStepper ? 'calc(100vh-8rem)' : 'calc(100vh-4rem)' }}>
        {/* Sidebar */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            {state.isLoading ? (
              <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" text="Loading..." />
              </div>
            ) : state.error && !state.isOnline ? (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Connection Error
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      {state.error}
                    </div>
                    <div className="mt-2 text-sm text-red-600">
                      Please check your internet connection and try again.
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              children
            )}
          </div>
        </main>
      </div>

      {/* Notification System */}
      <NotificationSystem />

      {/* Mobile sidebar overlay */}
      <div className="lg:hidden">
        {/* This would be implemented with a mobile sidebar toggle */}
      </div>

      {/* Accessibility announcements */}
      <div 
        id="accessibility-announcements" 
        className="sr-only" 
        aria-live="polite" 
        aria-atomic="true"
      />
    </div>
  )
}

export default Layout
