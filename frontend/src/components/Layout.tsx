import React from 'react'
import AppHeader from './AppHeader'
import Sidebar from './Sidebar'
import { useAppContext } from '../context/AppContext'
import LoadingSpinner from './LoadingSpinner'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { state } = useAppContext()

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <div className="flex h-[calc(100vh-4rem)]">
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
            ) : state.error ? (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Error
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      {state.error}
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

      {/* Mobile sidebar overlay */}
      <div className="lg:hidden">
        {/* This would be implemented with a mobile sidebar toggle */}
      </div>
    </div>
  )
}

export default Layout
