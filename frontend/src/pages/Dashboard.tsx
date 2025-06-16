import React, { useState, useEffect } from 'react'
import { Users, TrendingUp, AlertTriangle, Target } from 'lucide-react'
import { useAppContext } from '../context/AppContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { apiService } from '../services/api'

interface DashboardStats {
  totalOrganizations: number
  totalProductAreas: number
  totalTickets: number
  criticalTickets: number
  averageTechnicalDebtScore: number
  highRiskAreas: number
}

const Dashboard: React.FC = () => {
  const { state } = useAppContext()
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null)
  const [isLoadingData, setIsLoadingData] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!state.selectedOrganization) {
        setIsLoadingData(false)
        return
      }

      try {
        setIsLoadingData(true)
        
        // Fetch multiple analytics endpoints to build dashboard data
        const [ticketBreakdown, technicalDebtData] = await Promise.all([
          apiService.getTicketBreakdown(state.selectedOrganization.id).catch(() => null),
          apiService.getTechnicalDebtAnalysis(state.selectedOrganization.id).catch(() => null)
        ])
        
        console.log('📊 Ticket breakdown data:', ticketBreakdown)
        console.log('📊 Technical debt data:', technicalDebtData)
        
        // Calculate totals from ticket breakdown
        let totalTickets = 0
        let criticalTickets = 0
        let totalProductAreas = 0
        
        if (ticketBreakdown && ticketBreakdown.breakdown && Array.isArray(ticketBreakdown.breakdown)) {
          totalProductAreas = ticketBreakdown.breakdown.length
          ticketBreakdown.breakdown.forEach(item => {
            totalTickets += (item.severityCounts?.CRITICAL || 0) + 
                           (item.severityCounts?.SEVERE || 0) + 
                           (item.severityCounts?.MODERATE || 0) + 
                           (item.severityCounts?.LOW || 0)
            criticalTickets += (item.severityCounts?.CRITICAL || 0)
          })
        } else if (ticketBreakdown && ticketBreakdown.summary) {
          // Use summary data if breakdown array is empty
          totalTickets = ticketBreakdown.summary.totalTickets || 0
          criticalTickets = ticketBreakdown.summary.criticalTickets || 0
          totalProductAreas = ticketBreakdown.summary.totalProductAreas || 0
        }
        
        // Calculate technical debt metrics
        let averageTechnicalDebtScore = 0
        let highRiskAreas = 0
        
        if (technicalDebtData && Array.isArray(technicalDebtData)) {
          const scores = technicalDebtData.map(item => item.debtScore || 0)
          averageTechnicalDebtScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
          
          highRiskAreas = technicalDebtData.filter(item => 
            item.category === 'High Risk' || item.category === 'Critical'
          ).length
        }
        
        setDashboardData({
          totalOrganizations: state.organizations.length,
          totalProductAreas,
          totalTickets,
          criticalTickets,
          averageTechnicalDebtScore,
          highRiskAreas
        })
        
        console.log('📊 Dashboard data calculated:', {
          totalOrganizations: state.organizations.length,
          totalProductAreas,
          totalTickets,
          criticalTickets,
          averageTechnicalDebtScore,
          highRiskAreas
        })
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
        // Set default values on error
        setDashboardData({
          totalOrganizations: state.organizations.length,
          totalProductAreas: 0,
          totalTickets: 0,
          criticalTickets: 0,
          averageTechnicalDebtScore: 0,
          highRiskAreas: 0
        })
      } finally {
        setIsLoadingData(false)
      }
    }

    fetchDashboardData()
  }, [state.selectedOrganization, state.organizations.length, state.lastRefresh])

  if (state.isLoading || isLoadingData) {
    return <LoadingSpinner text="Loading dashboard..." />
  }

  const stats = dashboardData ? [
    {
      name: 'Organizations',
      value: dashboardData.totalOrganizations.toString(),
      change: state.selectedOrganization ? `Selected: ${state.selectedOrganization.name}` : 'No selection',
      changeType: 'neutral' as const,
      icon: Users,
    },
    {
      name: 'Product Areas',
      value: dashboardData.totalProductAreas.toString(),
      change: state.selectedOrganization ? 'Current org' : 'Select org',
      changeType: 'neutral' as const,
      icon: Target,
    },
    {
      name: 'Total Tickets',
      value: dashboardData.totalTickets.toLocaleString(),
      change: `${dashboardData.criticalTickets} critical`,
      changeType: dashboardData.criticalTickets > 0 ? 'negative' as const : 'positive' as const,
      icon: TrendingUp,
    },
    {
      name: 'Technical Debt Score',
      value: dashboardData.averageTechnicalDebtScore.toFixed(1),
      change: `${dashboardData.highRiskAreas} high risk areas`,
      changeType: dashboardData.averageTechnicalDebtScore > 7 ? 'negative' as const : 
                 dashboardData.averageTechnicalDebtScore > 4 ? 'neutral' as const : 'positive' as const,
      icon: AlertTriangle,
    },
  ] : []

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
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>
        
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.name}
                className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden"
              >
                <dt>
                  <div className="absolute bg-primary-500 rounded-md p-3">
                    <Icon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <p className="ml-16 text-sm font-medium text-gray-500 truncate">
                    {item.name}
                  </p>
                </dt>
                <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
                  <p className="text-2xl font-semibold text-gray-900">
                    {item.value}
                  </p>
                  <p
                    className={`ml-2 flex items-baseline text-sm font-semibold ${
                      item.changeType === 'positive'
                        ? 'text-green-600'
                        : item.changeType === 'negative'
                        ? 'text-red-600'
                        : 'text-gray-500'
                    }`}
                  >
                    {item.change}
                  </p>
                </dd>
              </div>
            )
          })}
        </div>

        {!state.selectedOrganization && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  No Organization Selected
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>Please select an organization to view detailed analytics and technical debt data.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {state.selectedOrganization && !state.dataStatus.ticketsUploaded && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Get Started
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>Upload your support tickets and usage data to start analyzing technical debt.</p>
                  <p className="mt-1">
                    <a href="/import" className="font-medium underline hover:text-blue-600">
                      Go to Import →
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
