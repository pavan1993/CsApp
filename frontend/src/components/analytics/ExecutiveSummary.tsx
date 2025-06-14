import React, { useState, useEffect } from 'react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Download, 
  FileText,
  TrendingDown,
  TrendingUp,
  Users
} from 'lucide-react'
import LoadingSpinner from '../LoadingSpinner'

interface ExecutiveSummaryData {
  totalProductAreas: number
  totalTickets: number
  criticalIssues: number
  averageUsageScore: number
  technicalDebtScore: number
  riskDistribution: {
    good: number
    moderate: number
    high: number
    critical: number
  }
  topIssues: Array<{
    productArea: string
    issueCount: number
    riskLevel: string
    impact: 'high' | 'medium' | 'low'
  }>
  keyInsights: string[]
  recommendations: Array<{
    priority: 'urgent' | 'high' | 'medium'
    action: string
    impact: string
    effort: 'low' | 'medium' | 'high'
  }>
  trends: {
    ticketTrend: number
    usageTrend: number
    debtTrend: number
  }
}

interface ExecutiveSummaryProps {
  organization: string
}

const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({ organization }) => {
  const [data, setData] = useState<ExecutiveSummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchExecutiveSummary()
  }, [organization])

  const fetchExecutiveSummary = async () => {
    if (!organization) return

    setLoading(true)
    setError(null)
    
    try {
      // Mock data for now - replace with actual API call
      const mockData: ExecutiveSummaryData = {
        totalProductAreas: 8,
        totalTickets: 186,
        criticalIssues: 14,
        averageUsageScore: 76,
        technicalDebtScore: 68,
        riskDistribution: {
          good: 2,
          moderate: 3,
          high: 2,
          critical: 1
        },
        topIssues: [
          { productArea: 'Reporting', issueCount: 45, riskLevel: 'Critical', impact: 'high' },
          { productArea: 'File Storage', issueCount: 25, riskLevel: 'High Risk', impact: 'high' },
          { productArea: 'User Management', issueCount: 45, riskLevel: 'High Risk', impact: 'medium' },
          { productArea: 'Authentication', issueCount: 40, riskLevel: 'Moderate Risk', impact: 'medium' }
        ],
        keyInsights: [
          'Reporting module shows critical technical debt with 95/100 debt score',
          'File Storage experiencing 43.8% usage drop - immediate attention required',
          'Authentication module has high ticket volume but stable usage patterns',
          'Payment Processing maintains good health with lowest debt score (45/100)'
        ],
        recommendations: [
          {
            priority: 'urgent',
            action: 'Refactor Reporting Engine',
            impact: 'Reduce critical tickets by 60%, improve system stability',
            effort: 'high'
          },
          {
            priority: 'urgent',
            action: 'Migrate File Storage to Cloud Solution',
            impact: 'Eliminate storage-related incidents, improve performance',
            effort: 'medium'
          },
          {
            priority: 'high',
            action: 'Optimize Authentication Flow',
            impact: 'Reduce authentication-related tickets by 30%',
            effort: 'medium'
          },
          {
            priority: 'medium',
            action: 'Implement Proactive Monitoring',
            impact: 'Early detection of issues, reduce MTTR by 40%',
            effort: 'low'
          }
        ],
        trends: {
          ticketTrend: 12.5,
          usageTrend: -8.2,
          debtTrend: 15.3
        }
      }
      
      setData(mockData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch executive summary')
    } finally {
      setLoading(false)
    }
  }

  const exportSummary = () => {
    if (!data) return

    const reportContent = `
EXECUTIVE SUMMARY REPORT
Organization: ${organization}
Generated: ${new Date().toLocaleDateString()}

=== KEY METRICS ===
Total Product Areas: ${data.totalProductAreas}
Total Tickets: ${data.totalTickets}
Critical Issues: ${data.criticalIssues}
Average Usage Score: ${data.averageUsageScore}%
Technical Debt Score: ${data.technicalDebtScore}/100

=== RISK DISTRIBUTION ===
Good: ${data.riskDistribution.good} areas
Moderate Risk: ${data.riskDistribution.moderate} areas
High Risk: ${data.riskDistribution.high} areas
Critical: ${data.riskDistribution.critical} areas

=== TOP ISSUES ===
${data.topIssues.map(issue => 
  `${issue.productArea}: ${issue.issueCount} tickets (${issue.riskLevel})`
).join('\n')}

=== KEY INSIGHTS ===
${data.keyInsights.map(insight => `• ${insight}`).join('\n')}

=== RECOMMENDATIONS ===
${data.recommendations.map(rec => 
  `${rec.priority.toUpperCase()}: ${rec.action}\n  Impact: ${rec.impact}\n  Effort: ${rec.effort}\n`
).join('\n')}
    `.trim()

    const blob = new Blob([reportContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `executive-summary-${organization}-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getRiskColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'good': return '#10b981'
      case 'moderate': case 'moderate risk': return '#f59e0b'
      case 'high': case 'high risk': return '#ef4444'
      case 'critical': return '#dc2626'
      default: return '#6b7280'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading) {
    return <LoadingSpinner text="Generating executive summary..." />
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading executive summary: {error}</p>
        <button 
          onClick={fetchExecutiveSummary}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Retry
        </button>
      </div>
    )
  }

  const riskChartData = [
    { name: 'Good', value: data.riskDistribution.good, color: '#10b981' },
    { name: 'Moderate', value: data.riskDistribution.moderate, color: '#f59e0b' },
    { name: 'High Risk', value: data.riskDistribution.high, color: '#ef4444' },
    { name: 'Critical', value: data.riskDistribution.critical, color: '#dc2626' }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <FileText className="h-6 w-6 mr-3 text-blue-600" />
              Executive Summary
            </h2>
            <p className="text-gray-600 mt-1">
              High-level overview for {organization} • Generated {new Date().toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={exportSummary}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Product Areas</p>
              <p className="text-2xl font-bold text-gray-900">{data.totalProductAreas}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Tickets</p>
              <div className="flex items-center">
                <p className="text-2xl font-bold text-gray-900">{data.totalTickets}</p>
                <div className={`ml-2 flex items-center ${data.trends.ticketTrend >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {data.trends.ticketTrend >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  <span className="text-sm font-medium ml-1">{Math.abs(data.trends.ticketTrend).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Critical Issues</p>
              <p className="text-2xl font-bold text-red-600">{data.criticalIssues}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Usage Score</p>
              <div className="flex items-center">
                <p className="text-2xl font-bold text-gray-900">{data.averageUsageScore}%</p>
                <div className={`ml-2 flex items-center ${data.trends.usageTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {data.trends.usageTrend >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  <span className="text-sm font-medium ml-1">{Math.abs(data.trends.usageTrend).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {riskChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Issues */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Issues</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.topIssues} layout="horizontal">
                <XAxis type="number" />
                <YAxis type="category" dataKey="productArea" width={100} fontSize={12} />
                <Bar dataKey="issueCount" radius={[0, 4, 4, 0]}>
                  {data.topIssues.map((entry, index) => (
                    <Bar key={`cell-${index}`} fill={getRiskColor(entry.riskLevel)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Key Insights */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.keyInsights.map((insight, index) => (
            <div key={index} className="flex items-start p-4 bg-blue-50 rounded-lg">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-600">{index + 1}</span>
                </div>
              </div>
              <p className="ml-3 text-sm text-blue-900">{insight}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Priority Recommendations</h3>
        <div className="space-y-4">
          {data.recommendations.map((rec, index) => (
            <div key={index} className={`border rounded-lg p-4 ${getPriorityColor(rec.priority)}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(rec.priority)}`}>
                      {rec.priority.toUpperCase()}
                    </span>
                    <span className="ml-2 text-xs text-gray-500">
                      Effort: {rec.effort}
                    </span>
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">{rec.action}</h4>
                  <p className="text-sm text-gray-700">{rec.impact}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ExecutiveSummary
