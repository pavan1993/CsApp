import React, { useState, useEffect } from 'react'
import { Settings, MapPin, Sliders, Star, Zap, AlertCircle, CheckCircle, TrendingUp, Shield, ArrowRight, ArrowLeft } from 'lucide-react'
import { useAppContext } from '../context/AppContext'
import { useSearchParams } from 'react-router-dom'
import { useWorkflow } from '../hooks/useWorkflow'
import { useNotifications } from '../hooks/useNotifications'
import LoadingSpinner from '../components/LoadingSpinner'
import ProductAreaMapping from '../components/ProductAreaMapping'
import ThresholdConfiguration from '../components/ThresholdConfiguration'
import KeyModulesSelector from '../components/KeyModulesSelector'
import ConfigurationWizard from '../components/ConfigurationWizard'
import { apiService } from '../services/api'

const Configuration: React.FC = () => {
  const { state, dispatch } = useAppContext()
  const [searchParams, setSearchParams] = useSearchParams()
  const { updateStepData, nextStep, previousStep, isStepComplete } = useWorkflow()
  const notifications = useNotifications()
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
      
      // Update workflow state
      updateStepData('configuration', {
        mappingsConfigured: status.mappingsCount > 0,
        thresholdsConfigured: status.thresholdsCount > 0,
        keyModulesConfigured: status.keyModulesCount > 0,
        configurationComplete: status.isComplete
      })
      
      // Update app state
      dispatch({
        type: 'SET_CONFIGURATION_STATUS',
        payload: {
          mappingsConfigured: status.mappingsCount > 0,
          thresholdsConfigured: status.thresholdsCount > 0,
          keyModulesConfigured: status.keyModulesCount > 0,
          mappingsCount: status.mappingsCount,
          thresholdsCount: status.thresholdsCount,
          keyModulesCount: status.keyModulesCount,
          isComplete: status.isComplete
        }
      })
      
    } catch (err) {
      console.error('Failed to load configuration status:', err)
      notifications.error('Configuration Error', 'Failed to load configuration status')
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

      {/* Configuration Status Cards */}
      {configStatus && !loadingStatus && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="flex items-center">
              <MapPin className="h-8 w-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Mappings</p>
                <p className="text-lg font-semibold text-gray-900">
                  {configStatus.mappingsCount || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="flex items-center">
              <Sliders className="h-8 w-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Thresholds</p>
                <p className="text-lg font-semibold text-gray-900">
                  {configStatus.thresholdsCount || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-yellow-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Key Modules</p>
                <p className="text-lg font-semibold text-gray-900">
                  {configStatus.keyModulesCount || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-purple-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Status</p>
                <p className={`text-lg font-semibold ${
                  configStatus.isComplete ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {configStatus.isComplete ? 'Complete' : 'Incomplete'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`group py-4 px-4 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <Icon className="w-5 h-5 mr-2" />
                  <div className="text-left">
                    <div className="font-semibold">{tab.name}</div>
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1">
          <div className="bg-gray-50 rounded-md p-4 mb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              {tabs.find(t => t.id === activeTab)?.name}
            </h2>
            <p className="text-sm text-gray-600">
              {tabs.find(t => t.id === activeTab)?.description}
            </p>
          </div>
          
          <div className="p-4">
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
        </div>
      </div>

      {/* Configuration Wizard Modal */}
      {showWizard && (
        <ConfigurationWizard
          organization={state.selectedOrganization.name}
          onClose={() => setShowWizard(false)}
          onComplete={() => {
            setShowWizard(false)
            loadConfigurationStatus()
            notifications.success(
              'Configuration Complete',
              'Your configuration has been saved successfully.',
              {
                action: {
                  label: 'Next Step',
                  onClick: () => {
                    if (isStepComplete('configuration')) {
                      nextStep()
                    }
                  }
                }
              }
            )
          }}
        />
      )}

      {/* Workflow Navigation */}
      <div className="mt-8 flex justify-between items-center p-4 bg-white rounded-lg shadow">
        <div className="flex items-center space-x-4">
          <button
            onClick={previousStep}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back: Data Import
          </button>
          <div className="text-sm text-gray-600">
            Step 2 of 3: Configuration
          </div>
        </div>
        <div className="flex space-x-3">
          {isStepComplete('configuration') && (
            <button
              onClick={nextStep}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Next: Analytics
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Configuration
