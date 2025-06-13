import React, { useEffect } from 'react'
import { ChevronDown, Building2, Upload, FileText, BarChart3 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppContext, useAppActions } from '../context/AppContext'
import LoadingSpinner from './LoadingSpinner'

const Sidebar: React.FC = () => {
  const navigate = useNavigate()
  const { state } = useAppContext()
  const { setSelectedOrganization } = useAppActions()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Auto-select first organization if none selected and organizations are loaded
  useEffect(() => {
    if (!state.selectedOrganization && state.organizations.length > 0 && !state.isLoading) {
      setSelectedOrganization(state.organizations[0])
    }
  }, [state.organizations, state.selectedOrganization, state.isLoading, setSelectedOrganization])

  const handleOrganizationSelect = (org: { id: string; name: string }) => {
    setSelectedOrganization(org)
    setIsDropdownOpen(false)
  }

  return (
    <aside className="w-64 bg-white shadow-sm border-r border-gray-200 h-full">
      <div className="p-4">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Organization
          </label>
          
          {state.isLoading ? (
            <div className="flex items-center justify-center py-2">
              <LoadingSpinner size="sm" />
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={state.organizations.length === 0}
              >
                <div className="flex items-center">
                  <Building2 className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="truncate">
                    {state.selectedOrganization?.name || 'Select organization'}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {isDropdownOpen && state.organizations.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                  {state.organizations.map((org) => (
                    <button
                      key={org.id}
                      onClick={() => handleOrganizationSelect(org)}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 focus:outline-none focus:bg-gray-100 ${
                        state.selectedOrganization?.id === org.id
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-900'
                      }`}
                    >
                      <div className="flex items-center">
                        <Building2 className="w-4 h-4 mr-2 text-gray-400" />
                        {org.name}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {state.organizations.length === 0 && !state.isLoading && (
            <p className="text-sm text-gray-500 mt-2">
              No organizations available. Upload some data to get started.
            </p>
          )}
        </div>

        {/* Additional sidebar content can go here */}
        <div className="space-y-4">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Quick Actions
          </div>
          
          {state.selectedOrganization && (
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors duration-200">
                Upload Tickets
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors duration-200">
                Upload Usage Data
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors duration-200">
                Generate Report
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
