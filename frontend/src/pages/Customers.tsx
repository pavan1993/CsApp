import React from 'react'
import { useAppContext } from '../context/AppContext'
import LoadingSpinner from '../components/LoadingSpinner'

const Customers: React.FC = () => {
  const { state } = useAppContext()

  if (state.isLoading) {
    return <LoadingSpinner text="Loading customers..." />
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      {state.error && (
        <div className="mb-6 border border-red-200 rounded-lg p-4 bg-red-50">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Connection Error
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{state.error}</p>
                <p className="mt-1">Showing demo data below.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="border-4 border-dashed border-gray-200 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Customers</h2>
        <p className="text-gray-600">Customer management interface coming soon...</p>
        {state.organizations.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-500">
              Organizations loaded: {state.organizations.length}
            </p>
          </div>
        )}
        {state.error && (
          <div className="mt-4">
            <p className="text-sm text-gray-500">
              Demo mode: Backend connection failed
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Customers
