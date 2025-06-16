import React, { useState, useEffect } from 'react'
import { useAppContext } from '../context/AppContext'
import { useWorkflow } from '../hooks/useWorkflow'
import { useNotifications } from '../hooks/useNotifications'
import LoadingSpinner from '../components/LoadingSpinner'
import ExecutiveSummary from '../components/analytics/ExecutiveSummary'
import TicketBreakdown from '../components/analytics/TicketBreakdown'
import UsageCorrelation from '../components/analytics/UsageCorrelation'
import TechnicalDebtDashboard from '../components/analytics/TechnicalDebtDashboard'
import TrendAnalysis from '../components/analytics/TrendAnalysis'
import { exportService } from '../services/exportService'
import { apiService } from '../services/api'
import { BarChart3, TrendingUp, Activity, AlertTriangle, FileText, Download, Share2, ArrowLeft, CheckCircle } from 'lucide-react'

const Analytics: React.FC = () => {
  const { state } = useAppContext()
  const { updateStepData, previousStep, markStepComplete } = useWorkflow()
  const notifications = useNotifications()
  const [activeTab, setActiveTab] = useState('executive')
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false)

  // Load analytics data from API
  useEffect(() => {
    const loadAnalyticsData = async () => {
      if (!state.selectedOrganization) {
        setAnalyticsData(null)
        return
      }

      try {
        setIsLoadingAnalytics(true)
        const data = await apiService.getAnalyticsData(state.selectedOrganization.name)
        setAnalyticsData(data)
      } catch (error) {
        console.error('Failed to load analytics data:', error)
        setAnalyticsData(null)
      } finally {
        setIsLoadingAnalytics(false)
      }
    }

    loadAnalyticsData()
  }, [state.selectedOrganization])

  if (state.isLoading || isLoadingAnalytics) {
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

  // Mark analytics as reviewed when user switches tabs or spends time
  useEffect(() => {
    const timer = setTimeout(() => {
      updateStepData('analytics', { analyticsReviewed: true })
      markStepComplete('analytics', { analyticsReviewed: true })
    }, 10000) // Mark as reviewed after 10 seconds

    return () => clearTimeout(timer)
  }, [activeTab, updateStepData, markStepComplete])

  const handleExportPDF = async () => {
    if (!state.selectedOrganization) return

    try {
      setIsExporting(true)
      
      // Collect data for export
      const reportData = {
        organization: state.selectedOrganization.name,
        reportDate: new Date().toISOString().split('T')[0],
        summary: analyticsData?.summary || {},
        debtAnalysis: analyticsData?.technicalDebt || [],
        recommendations: analyticsData?.recommendations || []
      }

      exportService.exportTechnicalDebtPDF(reportData)
      
      notifications.success(
        'Export Complete',
        'Technical debt report has been downloaded as PDF.'
      )
    } catch (error) {
      notifications.error(
        'Export Failed',
        'Failed to export PDF report. Please try again.'
      )
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportCSV = async () => {
    if (!state.selectedOrganization || !analyticsData) return

    try {
      setIsExporting(true)
      
      const exportData = {
        title: `Analytics_Data_${state.selectedOrganization.name}`,
        data: analyticsData.technicalDebt || [],
        columns: ['productArea', 'debtScore', 'category', 'ticketCounts', 'usageMetrics']
      }

      exportService.exportAsCSV(exportData)
      
      notifications.success(
        'Export Complete',
        'Analytics data has been downloaded as CSV.'
      )
    } catch (error) {
      notifications.error(
        'Export Failed',
        'Failed to export CSV data. Please try again.'
      )
    } finally {
      setIsExporting(false)
    }
  }

  const handleShareDashboard = async () => {
    if (!state.selectedOrganization) return

    try {
      const shareableLink = exportService.generateShareableLink(
        state.selectedOrganization.name,
        { tab: activeTab }
      )
      
      await exportService.copyToClipboard(shareableLink)
      
      notifications.success(
        'Link Copied',
        'Shareable dashboard link has been copied to clipboard.'
      )
    } catch (error) {
      notifications.error(
        'Share Failed',
        'Failed to copy shareable link. Please try again.'
      )
    }
  }

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
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Comprehensive analytics for {state.selectedOrganization.name}
          </p>
        </div>
        
        {/* Export Controls */}
        <div className="flex space-x-2">
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export PDF'}
          </button>
          <button
            onClick={handleExportCSV}
            disabled={isExporting}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
          <button
            onClick={handleShareDashboard}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </button>
        </div>
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

      {/* Workflow Navigation */}
      <div className="mt-8 flex justify-between items-center p-4 bg-white rounded-lg shadow">
        <div className="flex items-center space-x-4">
          <button
            onClick={previousStep}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back: Configuration
          </button>
          <div className="text-sm text-gray-600">
            Step 3 of 3: Analytics Review
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center text-green-600">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium">Workflow Complete</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics
