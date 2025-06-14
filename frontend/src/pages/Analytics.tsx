import React, { useState } from 'react'
import { useAppContext } from '../context/AppContext'
import LoadingSpinner from '../components/LoadingSpinner'
import ExecutiveSummary from '../components/analytics/ExecutiveSummary'
import TicketBreakdown from '../components/analytics/TicketBreakdown'
import UsageCorrelation from '../components/analytics/UsageCorrelation'
import TechnicalDebtDashboard from '../components/analytics/TechnicalDebtDashboard'
import TrendAnalysis from '../components/analytics/TrendAnalysis'
import { BarChart3, TrendingUp, Activity, AlertTriangle, FileText } from 'lucide-react'

const Analytics: React.FC = () => {
  const { state } = useAppContext()
  const [activeTab, setActiveTab] = useState('executive')

  if (state.isLoading) {
    return <LoadingSpinner text="Loading analytics..." />
  }

  if (!state.selectedOrganization) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center py-12">
          <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Organization Selected</h3>
          <p className="mt-1 text-sm text-gray-500">
            Please select an organization from the sidebar to view analytics.
          </p>
        </div>
      </div>
    )
  }

  const tabs = [
    {
      id: 'executive',
      name: 'Executive Summary',
      icon: FileText,
      description: 'High-level KPIs and insights'
    },
    {
      id: 'tickets',
      name: 'Ticket Breakdown',
      icon: BarChart3,
      description: 'Tickets by product area and severity'
    },
    {
      id: 'correlation',
      name: 'Usage Correlation',
      icon: Activity,
      description: 'Usage vs ticket volume analysis'
    },
    {
      id: 'debt',
      name: 'Technical Debt',
      icon: AlertTriangle,
      description: 'Debt scores and recommendations'
    },
    {
      id: 'trends',
      name: 'Trend Analysis',
      icon: TrendingUp,
      description: 'Historical trends and forecasting'
    }
  ]

  const renderTabContent = () => {
    const organization = state.selectedOrganization.name

    switch (activeTab) {
      case 'executive':
        return <ExecutiveSummary organization={organization} />
      case 'tickets':
        return <TicketBreakdown organization={organization} />
      case 'correlation':
        return <UsageCorrelation organization={organization} />
      case 'debt':
        return <TechnicalDebtDashboard organization={organization} />
      case 'trends':
        return <TrendAnalysis organization={organization} />
      default:
        return <ExecutiveSummary organization={organization} />
    }
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

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Comprehensive analytics for {state.selectedOrganization.name}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className={`mr-2 h-5 w-5 ${
                    isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`} />
                  <div className="text-left">
                    <div>{tab.name}</div>
                    <div className="text-xs text-gray-400 font-normal">
                      {tab.description}
                    </div>
                  </div>
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-screen">
        {renderTabContent()}
      </div>
    </div>
  )
}

export default Analytics
