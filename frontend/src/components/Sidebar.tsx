import React, { useEffect, useState } from 'react'
import { ChevronDown, Building2, Upload, FileText, BarChart3, Settings, Home, Users } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAppContext, useAppActions } from '../context/AppContext'
import LoadingSpinner from './LoadingSpinner'

const Sidebar: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { state } = useAppContext()
  const { setSelectedOrganization } = useAppActions()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Debug logging
  console.log('🔍 Sidebar state:', {
    selectedOrganization: state.selectedOrganization,
    organizationsCount: state.organizations.length,
    isLoading: state.isLoading,
    error: state.error
  });

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

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/',
      icon: Home,
      description: 'Overview and analytics'
    },
    {
      name: 'Customers',
      href: '/customers',
      icon: Users,
      description: 'Manage organizations'
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      description: 'Technical debt analysis'
    },
    {
      name: 'Import Data',
      href: '/import',
      icon: Upload,
      description: 'Upload tickets and usage data'
    },
    {
      name: 'Configuration',
      href: '/configuration',
      icon: Settings,
      description: 'Product area mapping and settings'
    }
  ]

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

        {/* Main Navigation */}
        <div className="space-y-4">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Navigation
          </div>
          
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href
              return (
                <button
                  key={item.name}
                  onClick={() => navigate(item.href)}
                  className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors duration-200 flex items-center group ${
                    isActive
                      ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-500'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 mr-3 ${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-gray-500">{item.description}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4 mt-6">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Quick Actions
          </div>
          
          <div className="space-y-2">
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔄 Upload Tickets button clicked');
                console.log('🔄 Current location:', window.location.pathname);
                console.log('🔄 Selected organization:', state.selectedOrganization);
                console.log('🔄 Navigating to /import for tickets');
                try {
                  navigate('/import?tab=tickets');
                  console.log('✅ Navigation to /import successful');
                } catch (error) {
                  console.error('❌ Navigation failed:', error);
                }
              }}
              className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors duration-200 flex items-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Tickets
            </button>
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔄 Upload Usage Data button clicked');
                console.log('🔄 Current location:', window.location.pathname);
                console.log('🔄 Selected organization:', state.selectedOrganization);
                console.log('🔄 Navigating to /import for usage');
                try {
                  navigate('/import?tab=usage');
                  console.log('✅ Navigation to /import successful');
                } catch (error) {
                  console.error('❌ Navigation failed:', error);
                }
              }}
              className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors duration-200 flex items-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Usage Data
            </button>
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔄 View Analytics button clicked');
                console.log('🔄 Current location:', window.location.pathname);
                console.log('🔄 Selected organization:', state.selectedOrganization);
                console.log('🔄 Navigating to /analytics');
                try {
                  navigate('/analytics');
                  console.log('✅ Navigation to /analytics successful');
                } catch (error) {
                  console.error('❌ Navigation failed:', error);
                }
              }}
              className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors duration-200 flex items-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              View Analytics
            </button>
          </div>
          
          {!state.selectedOrganization && (
            <div className="mt-4">
              <p className="text-xs text-gray-500 px-3 py-2">
                💡 Tip: Select an organization above to get started
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
