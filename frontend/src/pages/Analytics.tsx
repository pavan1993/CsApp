import React from 'react'
import { useAppContext } from '../context/AppContext'
import LoadingSpinner from '../components/LoadingSpinner'

const Analytics: React.FC = () => {
  const { state } = useAppContext()

  if (state.isLoading) {
    return <LoadingSpinner text="Loading analytics..." />
  }

  if (state.error) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="border-4 border-dashed border-red-200 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-red-900 mb-6">Error</h2>
          <p className="text-red-600">{state.error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="border-4 border-dashed border-gray-200 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Analytics</h2>
        <p className="text-gray-600">Advanced analytics dashboard coming soon...</p>
        {state.organizations.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-500">
              Organizations loaded: {state.organizations.length}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Analytics
