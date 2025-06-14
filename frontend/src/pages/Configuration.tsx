import React, { useState, useEffect } from 'react'
import { Settings, MapPin, Sliders, Star, Zap, AlertCircle, CheckCircle, TrendingUp, Shield } from 'lucide-react'
import { useAppContext } from '../context/AppContext'
import { useSearchParams } from 'react-router-dom'
import LoadingSpinner from '../components/LoadingSpinner'
import ProductAreaMapping from '../components/ProductAreaMapping'
import ThresholdConfiguration from '../components/ThresholdConfiguration'
import KeyModulesSelector from '../components/KeyModulesSelector'
import ConfigurationWizard from '../components/ConfigurationWizard'
import { apiService } from '../services/api'

const Configuration: React.FC = () => {
  const { state } = useAppContext()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<'mapping' | 'thresholds' | 'modules' | 'wizard'>('mapping')
  const [showWizard, setShowWizard] = useState(false)
  const [configStatus, setConfigStatus] = useState<any>(null)
  const [loadingStatus, setLoadingStatus] = useState(false)

  // Set active tab based on URL parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && ['mapping', 'thresholds', 'modules', 'wizard'].includes(tabParam)) {
      setActiveTab(tabParam as any)
    }
  }, [searchParams])

  // Load configuration status
  useEffect(() => {
    if (state.selectedOrganization) {
      loadConfigurationStatus()
    }
  }, [state.selectedOrganization])

  const loadConfigurationStatus = async () => {
    try {
      setLoadingStatus(true)
      const status = await apiService.getConfigurationStatus(state.selectedOrganization!.name)
      setConfigStatus(status)
    } catch (err) {
      console.error('Failed to load configuration status:', err)
    } finally {
      setLoadingStatus(false)
    }
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as any)
    setSearchParams({ tab })
  }

  if (state.isLoading) {
    return <LoadingSpinner text="Loading configuration..." />
  }

  if (!state.selectedOrganization) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center py-12">
          <Settings className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No organization selected</h3>
          <p className="mt-1 text-sm text-gray-500">
            Please select an organization from the sidebar to configure settings.
          </p>
          {state.organizations.length > 0 && (
            <p className="mt-2 text-xs text-gray-400">
              Available organizations: {state.organizations.map(org => org.name).join(', ')}
            </p>
          )}
        </div>
      </div>
    )
  }

  const tabs = [
    {
      id: 'mapping',
      name: 'Product Area Mapping',
      icon: MapPin,
      description: 'Map product areas to Dynatrace capabilities'
    },
    {
      id: 'thresholds',
      name: 'Threshold Configuration',
      icon: Sliders,
      description: 'Set scoring thresholds for different severity levels'
    },
    {
      id: 'modules',
      name: 'Key Modules',
      icon: Star,
      description: 'Select critical modules for enhanced monitoring'
    }
  ]

  return (
    <div className="px-4 py-6 sm:px-0">
      {state.error && (
        <div className="mb-6 border border-red-200 rounded-lg p-4 bg-red-50">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Connection Error
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{state.error}</p>
                <p className="mt-1">Configuration functionality may be limited.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuration</h1>
          <p className="mt-1 text-sm text-gray-600">
            Configure settings for {state.selectedOrganization?.name || 'selected organization'}
          </p>
        </div>
        <button
          onClick={() => setShowWizard(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Zap className="w-4 h-4 mr-2" />
          Setup Wizard
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`group py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <Icon className="w-4 h-4 mr-2" />
                  <div className="text-left">
                    <div>{tab.name}</div>
                    <div className="text-xs text-gray-400 font-normal">
                      {tab.description}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'mapping' && (
          <ProductAreaMapping organization={state.selectedOrganization.name} />
        )}
        {activeTab === 'thresholds' && (
          <ThresholdConfiguration organization={state.selectedOrganization.name} />
        )}
        {activeTab === 'modules' && (
          <KeyModulesSelector organization={state.selectedOrganization.name} />
        )}
      </div>

      {/* Configuration Wizard Modal */}
      {showWizard && (
        <ConfigurationWizard
          organization={state.selectedOrganization.name}
          onClose={() => setShowWizard(false)}
          onComplete={() => {
            setShowWizard(false)
            // Refresh the current tab
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}

export default Configuration
