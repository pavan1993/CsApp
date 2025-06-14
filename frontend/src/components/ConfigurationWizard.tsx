import React, { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, Check, AlertCircle, Star, MapPin, Sliders } from 'lucide-react'
import { apiService } from '../services/api'

interface ConfigurationWizardProps {
  organization: string
  onClose: () => void
  onComplete: () => void
}

interface WizardStep {
  id: string
  title: string
  description: string
  icon: React.ComponentType<any>
}

interface MappingData {
  productArea: string
  dynatraceCapability: string
  isKeyModule: boolean
}

interface ThresholdData {
  productArea: string
  severityLevel: 'CRITICAL' | 'SEVERE' | 'MODERATE' | 'LOW'
  ticketThreshold: number
  usageDropThreshold: number
}

const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'welcome',
    title: 'Welcome',
    description: 'Get started with configuration setup',
    icon: Check
  },
  {
    id: 'mappings',
    title: 'Product Area Mapping',
    description: 'Map your product areas to Dynatrace capabilities',
    icon: MapPin
  },
  {
    id: 'thresholds',
    title: 'Threshold Configuration',
    description: 'Set scoring thresholds for different severity levels',
    icon: Sliders
  },
  {
    id: 'keymodules',
    title: 'Key Modules',
    description: 'Select critical modules for enhanced monitoring',
    icon: Star
  },
  {
    id: 'complete',
    title: 'Complete',
    description: 'Review and finish setup',
    icon: Check
  }
]

const SEVERITY_LEVELS = [
  { value: 'CRITICAL', label: 'Critical' },
  { value: 'SEVERE', label: 'Severe' },
  { value: 'MODERATE', label: 'Moderate' },
  { value: 'LOW', label: 'Low' }
]

const ConfigurationWizard: React.FC<ConfigurationWizardProps> = ({
  organization,
  onClose,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Step data
  const [mappings, setMappings] = useState<MappingData[]>([
    { productArea: '', dynatraceCapability: '', isKeyModule: false }
  ])
  const [thresholds, setThresholds] = useState<ThresholdData[]>([
    { productArea: '', severityLevel: 'MODERATE', ticketThreshold: 5, usageDropThreshold: 20 }
  ])

  const currentStepData = WIZARD_STEPS[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === WIZARD_STEPS.length - 1

  const addMapping = () => {
    setMappings([...mappings, { productArea: '', dynatraceCapability: '', isKeyModule: false }])
  }

  const updateMapping = (index: number, field: keyof MappingData, value: any) => {
    const updated = [...mappings]
    updated[index] = { ...updated[index], [field]: value }
    setMappings(updated)
  }

  const removeMapping = (index: number) => {
    if (mappings.length > 1) {
      setMappings(mappings.filter((_, i) => i !== index))
    }
  }

  const addThreshold = () => {
    setThresholds([...thresholds, { 
      productArea: '', 
      severityLevel: 'MODERATE', 
      ticketThreshold: 5, 
      usageDropThreshold: 20 
    }])
  }

  const updateThreshold = (index: number, field: keyof ThresholdData, value: any) => {
    const updated = [...thresholds]
    updated[index] = { ...updated[index], [field]: value }
    setThresholds(updated)
  }

  const removeThreshold = (index: number) => {
    if (thresholds.length > 1) {
      setThresholds(thresholds.filter((_, i) => i !== index))
    }
  }

  const validateCurrentStep = (): boolean => {
    switch (WIZARD_STEPS[currentStep].id) {
      case 'mappings':
        return mappings.some(m => m.productArea.trim() && m.dynatraceCapability.trim())
      case 'thresholds':
        return thresholds.some(t => t.productArea.trim())
      default:
        return true
    }
  }

  const handleNext = () => {
    if (validateCurrentStep() && !isLastStep) {
      setCurrentStep(currentStep + 1)
      setError(null)
    }
  }

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1)
      setError(null)
    }
  }

  const handleComplete = async () => {
    try {
      setLoading(true)
      setError(null)

      // Create mappings
      const validMappings = mappings.filter(m => m.productArea.trim() && m.dynatraceCapability.trim())
      for (const mapping of validMappings) {
        await apiService.createProductAreaMapping(organization, mapping)
      }

      // Create thresholds
      const validThresholds = thresholds.filter(t => t.productArea.trim())
      for (const threshold of validThresholds) {
        await apiService.createThresholdConfiguration(organization, threshold)
      }

      onComplete()
    } catch (err: any) {
      setError(err.message || 'Failed to complete configuration setup')
    } finally {
      setLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (WIZARD_STEPS[currentStep].id) {
      case 'welcome':
        return (
          <div className="text-center py-8">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
              <Check className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Welcome to Configuration Setup
            </h3>
            <p className="text-gray-600 mb-6">
              This wizard will help you set up your organization's configuration for technical debt analysis.
              We'll guide you through mapping product areas, setting thresholds, and selecting key modules.
            </p>
            <div className="bg-blue-50 rounded-lg p-4 text-left">
              <h4 className="font-medium text-blue-900 mb-2">What you'll configure:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Product area to Dynatrace capability mappings</li>
                <li>• Scoring thresholds for different severity levels</li>
                <li>• Key modules for enhanced monitoring</li>
              </ul>
            </div>
          </div>
        )

      case 'mappings':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Product Area Mapping</h3>
              <p className="text-gray-600 mb-4">
                Map your product areas to corresponding Dynatrace capabilities. This helps correlate 
                support tickets with usage data for accurate technical debt analysis.
              </p>
            </div>
            
            <div className="space-y-4">
              {mappings.map((mapping, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Product Area *
                      </label>
                      <input
                        type="text"
                        value={mapping.productArea}
                        onChange={(e) => updateMapping(index, 'productArea', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Authentication, Payment Processing"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dynatrace Capability *
                      </label>
                      <input
                        type="text"
                        value={mapping.dynatraceCapability}
                        onChange={(e) => updateMapping(index, 'dynatraceCapability', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Application Security, Real User Monitoring"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`keyModule-${index}`}
                        checked={mapping.isKeyModule}
                        onChange={(e) => updateMapping(index, 'isKeyModule', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`keyModule-${index}`} className="ml-2 block text-sm text-gray-900">
                        Mark as key module
                      </label>
                    </div>
                    {mappings.length > 1 && (
                      <button
                        onClick={() => removeMapping(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <button
              onClick={addMapping}
              className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-gray-400 hover:text-gray-700"
            >
              + Add Another Mapping
            </button>
          </div>
        )

      case 'thresholds':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Threshold Configuration</h3>
              <p className="text-gray-600 mb-4">
                Set scoring thresholds for different product areas and severity levels. These thresholds 
                determine when technical debt scores are calculated and how they're weighted.
              </p>
            </div>
            
            <div className="space-y-4">
              {thresholds.map((threshold, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Product Area *
                      </label>
                      <input
                        type="text"
                        value={threshold.productArea}
                        onChange={(e) => updateThreshold(index, 'productArea', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Authentication, Payment Processing"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Severity Level
                      </label>
                      <select
                        value={threshold.severityLevel}
                        onChange={(e) => updateThreshold(index, 'severityLevel', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        {SEVERITY_LEVELS.map(level => (
                          <option key={level.value} value={level.value}>
                            {level.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ticket Threshold: {threshold.ticketThreshold}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="50"
                        value={threshold.ticketThreshold}
                        onChange={(e) => updateThreshold(index, 'ticketThreshold', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Usage Drop Threshold: {threshold.usageDropThreshold}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={threshold.usageDropThreshold}
                        onChange={(e) => updateThreshold(index, 'usageDropThreshold', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                  {thresholds.length > 1 && (
                    <div className="flex justify-end">
                      <button
                        onClick={() => removeThreshold(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <button
              onClick={addThreshold}
              className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-gray-400 hover:text-gray-700"
            >
              + Add Another Threshold
            </button>
          </div>
        )

      case 'keymodules':
        return (
          <div className="text-center py-8">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
              <Star className="h-8 w-8 text-yellow-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Key Modules</h3>
            <p className="text-gray-600 mb-6">
              You've already marked some modules as "key modules" in the mapping step. 
              Key modules receive enhanced monitoring and have higher impact on technical debt scoring.
            </p>
            <div className="bg-yellow-50 rounded-lg p-4 text-left">
              <h4 className="font-medium text-yellow-900 mb-2">
                Key Modules Selected: {mappings.filter(m => m.isKeyModule).length}
              </h4>
              {mappings.filter(m => m.isKeyModule).length > 0 ? (
                <ul className="text-sm text-yellow-800 space-y-1">
                  {mappings.filter(m => m.isKeyModule).map((mapping, index) => (
                    <li key={index}>• {mapping.productArea}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-yellow-800">
                  No key modules selected. You can always configure this later.
                </p>
              )}
            </div>
          </div>
        )

      case 'complete':
        return (
          <div className="text-center py-8">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Setup Complete!</h3>
            <p className="text-gray-600 mb-6">
              Your configuration is ready to be saved. Here's a summary of what will be created:
            </p>
            <div className="bg-gray-50 rounded-lg p-4 text-left space-y-3">
              <div>
                <h4 className="font-medium text-gray-900">Product Area Mappings</h4>
                <p className="text-sm text-gray-600">
                  {mappings.filter(m => m.productArea.trim() && m.dynatraceCapability.trim()).length} mappings
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Threshold Configurations</h4>
                <p className="text-sm text-gray-600">
                  {thresholds.filter(t => t.productArea.trim()).length} threshold configurations
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Key Modules</h4>
                <p className="text-sm text-gray-600">
                  {mappings.filter(m => m.isKeyModule).length} key modules selected
                </p>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-8 mx-auto p-0 border w-full max-w-4xl shadow-lg rounded-lg bg-white mb-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Configuration Setup</h2>
            <p className="text-sm text-gray-600">Organization: {organization}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-900">
              Step {currentStep + 1} of {WIZARD_STEPS.length}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(((currentStep + 1) / WIZARD_STEPS.length) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / WIZARD_STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Navigation */}
        <div className="px-6 py-4 border-b border-gray-200">
          <nav className="flex justify-center">
            <ol className="flex items-center space-x-4">
              {WIZARD_STEPS.map((step, index) => {
                const Icon = step.icon
                const isActive = index === currentStep
                const isCompleted = index < currentStep
                
                return (
                  <li key={step.id} className="flex items-center">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                      isCompleted 
                        ? 'bg-blue-600 border-blue-600 text-white' 
                        : isActive 
                        ? 'border-blue-600 text-blue-600' 
                        : 'border-gray-300 text-gray-400'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className={`ml-2 text-sm font-medium ${
                      isActive ? 'text-blue-600' : isCompleted ? 'text-gray-900' : 'text-gray-400'
                    }`}>
                      {step.title}
                    </span>
                    {index < WIZARD_STEPS.length - 1 && (
                      <ChevronRight className="w-4 h-4 text-gray-400 ml-4" />
                    )}
                  </li>
                )
              })}
            </ol>
          </nav>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-6 mt-4 border border-red-200 rounded-lg p-4 bg-red-50">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className="p-6 min-h-[400px]">
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <button
            onClick={handlePrevious}
            disabled={isFirstStep}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </button>
          
          <div className="text-sm text-gray-500">
            {currentStepData.description}
          </div>
          
          {isLastStep ? (
            <button
              onClick={handleComplete}
              disabled={loading}
              className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Complete Setup'}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!validateCurrentStep()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ConfigurationWizard
