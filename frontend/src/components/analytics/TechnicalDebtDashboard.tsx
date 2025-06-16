import React, { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts'
import { AlertCircle, CheckCircle, Clock, TrendingDown, TrendingUp } from 'lucide-react'
import LoadingSpinner from '../LoadingSpinner'

interface TechnicalDebtData {
  productArea: string
  debtScore: number
  category: 'Good' | 'Moderate Risk' | 'High Risk' | 'Critical'
  ticketCounts: {
    CRITICAL: number
    SEVERE: number
    MODERATE: number
    LOW: number
  }
  usageMetrics: {
    currentUsage: number
    previousUsage: number
    usageDropPercentage: number
    isZeroUsage: boolean
  }
  recommendations: string[]
  isKeyModule: boolean
  trend: number[]
}

interface TechnicalDebtDashboardProps {
  organization: string
}

const CATEGORY_COLORS = {
  'Good': '#10b981',
  'Moderate Risk': '#f59e0b',
  'High Risk': '#ef4444',
  'Critical': '#dc2626'
}

const CATEGORY_ICONS = {
  'Good': CheckCircle,
  'Moderate Risk': Clock,
  'High Risk': AlertCircle,
  'Critical': AlertCircle
}

const TechnicalDebtDashboard: React.FC<TechnicalDebtDashboardProps> = ({ organization }) => {
  const [data, setData] = useState<TechnicalDebtData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'score' | 'area'>('score')

  useEffect(() => {
    fetchTechnicalDebtData()
  }, [organization])

  const fetchTechnicalDebtData = async () => {
    if (!organization) return

    setLoading(true)
    setError(null)
    
    try {
      // Import apiService
      const { apiService } = await import('../../services/api')
      
      // Fetch real data from API
      const response = await apiService.getTechnicalDebtAnalysis(organization)
      
      // Transform API data to component format
      const transformedData: TechnicalDebtData[] = response.map((item: any) => ({
        productArea: item.productArea,
        debtScore: item.debtScore,
        category: item.category,
        ticketCounts: item.ticketCounts || { CRITICAL: 0, SEVERE: 0, MODERATE: 0, LOW: 0 },
        usageMetrics: item.usageMetrics || { 
          currentUsage: 0, 
          previousUsage: 0, 
          usageDropPercentage: 0, 
          isZeroUsage: true 
        },
        recommendations: item.recommendations || [],
        isKeyModule: item.isKeyModule || false,
        trend: [item.debtScore] // Single point trend for now, would need historical data for full trend
      }))
      
      setData(transformedData)
    } catch (err) {
      console.error('Error fetching technical debt data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch technical debt data')
    } finally {
      setLoading(false)
    }
  }

  const getSortedData = () => {
    const filtered = selectedCategory 
      ? data.filter(item => item.category === selectedCategory)
      : data

    return filtered.sort((a, b) => {
      if (sortBy === 'score') {
        return b.debtScore - a.debtScore
      }
      return a.productArea.localeCompare(b.productArea)
    })
  }

  const getCategoryCounts = () => {
    return {
      'Good': data.filter(d => d.category === 'Good').length,
      'Moderate Risk': data.filter(d => d.category === 'Moderate Risk').length,
      'High Risk': data.filter(d => d.category === 'High Risk').length,
      'Critical': data.filter(d => d.category === 'Critical').length
    }
  }

  const getAverageDebtScore = () => {
    if (data.length === 0) return 0
    return Math.round(data.reduce((sum, item) => sum + item.debtScore, 0) / data.length)
  }

  const getHighPriorityActions = () => {
    return data
      .filter(item => item.category === 'Critical' || item.category === 'High Risk')
      .flatMap(item => 
        item.recommendations.map(rec => ({
          productArea: item.productArea,
          recommendation: rec,
          priority: item.category === 'Critical' ? 'urgent' : 'high',
          isKeyModule: item.isKeyModule
        }))
      )
      .slice(0, 10)
  }

  if (loading) {
    return <LoadingSpinner text="Loading technical debt analysis..." />
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading technical debt data: {error}</p>
        <button 
          onClick={fetchTechnicalDebtData}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Retry
        </button>
      </div>
    )
  }

  const categoryCounts = getCategoryCounts()
  const averageScore = getAverageDebtScore()
  const highPriorityActions = getHighPriorityActions()
  const sortedData = getSortedData()

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Average Debt Score</p>
              <p className="text-2xl font-bold text-gray-900">{averageScore}</p>
            </div>
          </div>
        </div>

        {Object.entries(categoryCounts).map(([category, count]) => {
          const Icon = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS]
          const color = CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS]
          
          return (
            <div key={category} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" 
                       style={{ backgroundColor: color + '20' }}>
                    <Icon className="h-4 w-4" style={{ color }} />
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">{category}</p>
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Debt Score Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Technical Debt Scores</h3>
            <div className="flex items-center space-x-2">
              <select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="text-sm border border-gray-300 rounded-md px-2 py-1"
              >
                <option value="">All Categories</option>
                {Object.keys(categoryCounts).map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'score' | 'area')}
                className="text-sm border border-gray-300 rounded-md px-2 py-1"
              >
                <option value="score">Sort by Score</option>
                <option value="area">Sort by Area</option>
              </select>
            </div>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sortedData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis type="category" dataKey="productArea" width={100} fontSize={12} />
                <Tooltip 
                  formatter={(value: any, name: any, props: any) => [
                    `${value} (${props.payload.category})`,
                    'Debt Score'
                  ]}
                />
                <Bar dataKey="debtScore" radius={[0, 4, 4, 0]}>
                  {sortedData.map((entry, index) => (
                    <Bar key={`cell-${index}`} fill={CATEGORY_COLORS[entry.category]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* High Priority Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-red-600" />
            High Priority Actions
          </h3>
          
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {highPriorityActions.map((action, index) => (
              <div key={index} className={`p-3 rounded-lg border-l-4 ${
                action.priority === 'urgent' 
                  ? 'bg-red-50 border-red-400' 
                  : 'bg-yellow-50 border-yellow-400'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${
                      action.priority === 'urgent' ? 'text-red-900' : 'text-yellow-900'
                    }`}>
                      {action.productArea}
                      {action.isKeyModule && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          Key Module
                        </span>
                      )}
                    </p>
                    <p className={`text-sm mt-1 ${
                      action.priority === 'urgent' ? 'text-red-700' : 'text-yellow-700'
                    }`}>
                      {action.recommendation}
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    action.priority === 'urgent' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {action.priority.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Analysis</h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product Area
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Debt Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Critical Tickets
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usage Drop
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trend
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedData.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {item.productArea}
                        </div>
                        {item.isKeyModule && (
                          <div className="text-xs text-blue-600">Key Module</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-medium">{item.debtScore}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          style={{ 
                            backgroundColor: CATEGORY_COLORS[item.category] + '20',
                            color: CATEGORY_COLORS[item.category]
                          }}>
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.ticketCounts.CRITICAL + item.ticketCounts.SEVERE}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${
                      item.usageMetrics.usageDropPercentage > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {item.usageMetrics.usageDropPercentage > 0 ? '+' : ''}
                      {item.usageMetrics.usageDropPercentage.toFixed(1)}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-20 h-8">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={item.trend.map((value, i) => ({ value, index: i }))}>
                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            stroke={CATEGORY_COLORS[item.category]} 
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default TechnicalDebtDashboard
