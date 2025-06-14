import React, { useState, useEffect } from 'react'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts'
import { Activity, AlertTriangle, Download, Info } from 'lucide-react'
import LoadingSpinner from '../LoadingSpinner'

interface CorrelationData {
  productArea: string
  ticketCount: number
  usageScore: number
  usageChange: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  dynatraceCapability: string
}

interface UsageCorrelationProps {
  organization: string
}

const RISK_COLORS = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#ef4444',
  critical: '#dc2626'
}

const UsageCorrelation: React.FC<UsageCorrelationProps> = ({ organization }) => {
  const [data, setData] = useState<CorrelationData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPoint, setSelectedPoint] = useState<CorrelationData | null>(null)
  const [showProblemAreas, setShowProblemAreas] = useState(false)

  useEffect(() => {
    fetchCorrelationData()
  }, [organization])

  const fetchCorrelationData = async () => {
    if (!organization) return

    setLoading(true)
    setError(null)
    
    try {
      // Mock data for now - replace with actual API call
      const mockData: CorrelationData[] = [
        {
          productArea: 'Authentication',
          ticketCount: 40,
          usageScore: 85,
          usageChange: -5,
          riskLevel: 'medium',
          dynatraceCapability: 'Application Security'
        },
        {
          productArea: 'Payment Processing',
          ticketCount: 36,
          usageScore: 92,
          usageChange: 3,
          riskLevel: 'low',
          dynatraceCapability: 'Real User Monitoring'
        },
        {
          productArea: 'User Management',
          ticketCount: 45,
          usageScore: 78,
          usageChange: -12,
          riskLevel: 'high',
          dynatraceCapability: 'Session Replay'
        },
        {
          productArea: 'Reporting',
          ticketCount: 35,
          usageScore: 65,
          usageChange: -20,
          riskLevel: 'critical',
          dynatraceCapability: 'Database Monitoring'
        },
        {
          productArea: 'API Gateway',
          ticketCount: 30,
          usageScore: 88,
          usageChange: 8,
          riskLevel: 'low',
          dynatraceCapability: 'Synthetic Monitoring'
        },
        {
          productArea: 'File Storage',
          ticketCount: 25,
          usageScore: 45,
          usageChange: -35,
          riskLevel: 'critical',
          dynatraceCapability: 'Infrastructure Monitoring'
        }
      ]
      
      setData(mockData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch correlation data')
    } finally {
      setLoading(false)
    }
  }

  const getProblemAreas = () => {
    return data.filter(item => 
      (item.ticketCount > 35 && item.usageScore < 70) || 
      item.usageChange < -15
    )
  }

  const getCorrelationCoefficient = () => {
    if (data.length < 2) return 0
    
    const n = data.length
    const sumX = data.reduce((sum, item) => sum + item.ticketCount, 0)
    const sumY = data.reduce((sum, item) => sum + item.usageScore, 0)
    const sumXY = data.reduce((sum, item) => sum + (item.ticketCount * item.usageScore), 0)
    const sumX2 = data.reduce((sum, item) => sum + (item.ticketCount * item.ticketCount), 0)
    const sumY2 = data.reduce((sum, item) => sum + (item.usageScore * item.usageScore), 0)
    
    const numerator = (n * sumXY) - (sumX * sumY)
    const denominator = Math.sqrt(((n * sumX2) - (sumX * sumX)) * ((n * sumY2) - (sumY * sumY)))
    
    return denominator === 0 ? 0 : numerator / denominator
  }

  const exportData = () => {
    const csvContent = [
      ['Product Area', 'Ticket Count', 'Usage Score', 'Usage Change %', 'Risk Level', 'Dynatrace Capability'],
      ...data.map(item => [
        item.productArea,
        item.ticketCount.toString(),
        item.usageScore.toString(),
        item.usageChange.toString(),
        item.riskLevel,
        item.dynatraceCapability
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `usage-correlation-${organization}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg max-w-xs">
          <p className="font-medium text-gray-900 mb-2">{data.productArea}</p>
          <div className="space-y-1 text-sm">
            <p>Tickets: <span className="font-medium">{data.ticketCount}</span></p>
            <p>Usage Score: <span className="font-medium">{data.usageScore}%</span></p>
            <p>Usage Change: <span className={`font-medium ${data.usageChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.usageChange > 0 ? '+' : ''}{data.usageChange}%
            </span></p>
            <p>Risk Level: <span className={`font-medium capitalize`} style={{ color: RISK_COLORS[data.riskLevel] }}>
              {data.riskLevel}
            </span></p>
            <p className="text-gray-600 mt-2">Capability: {data.dynatraceCapability}</p>
          </div>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return <LoadingSpinner text="Loading usage correlation..." />
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading correlation data: {error}</p>
        <button 
          onClick={fetchCorrelationData}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Retry
        </button>
      </div>
    )
  }

  const problemAreas = getProblemAreas()
  const correlationCoeff = getCorrelationCoefficient()

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Activity className="h-5 w-5 mr-2 text-blue-600" />
            Usage vs Ticket Correlation
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Relationship between usage patterns and support ticket volume
          </p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button
            onClick={() => setShowProblemAreas(!showProblemAreas)}
            className={`flex items-center px-3 py-1 text-sm rounded-md border ${
              showProblemAreas 
                ? 'bg-red-100 text-red-700 border-red-300' 
                : 'text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <AlertTriangle className="h-4 w-4 mr-1" />
            Problem Areas ({problemAreas.length})
          </button>
          
          <button
            onClick={exportData}
            className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <Download className="h-4 w-4 mr-1" />
            Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <Info className="h-5 w-5 text-blue-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-blue-900">Correlation</p>
              <p className="text-lg font-bold text-blue-700">
                {correlationCoeff.toFixed(3)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <div>
              <p className="text-sm font-medium text-green-900">Low Risk</p>
              <p className="text-lg font-bold text-green-700">
                {data.filter(d => d.riskLevel === 'low').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
            <div>
              <p className="text-sm font-medium text-yellow-900">Medium Risk</p>
              <p className="text-lg font-bold text-yellow-700">
                {data.filter(d => d.riskLevel === 'medium').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <div>
              <p className="text-sm font-medium text-red-900">High/Critical</p>
              <p className="text-lg font-bold text-red-700">
                {data.filter(d => d.riskLevel === 'high' || d.riskLevel === 'critical').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="h-96 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              type="number" 
              dataKey="ticketCount" 
              name="Ticket Count"
              label={{ value: 'Ticket Count', position: 'insideBottom', offset: -10 }}
            />
            <YAxis 
              type="number" 
              dataKey="usageScore" 
              name="Usage Score"
              label={{ value: 'Usage Score (%)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Scatter name="Product Areas" dataKey="usageScore">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.riskLevel]} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {showProblemAreas && problemAreas.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2 text-red-600" />
            Problem Areas Requiring Attention
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {problemAreas.map((area, index) => (
              <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className="font-medium text-red-900">{area.productArea}</h5>
                    <p className="text-sm text-red-700 mt-1">{area.dynatraceCapability}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full`} 
                        style={{ 
                          backgroundColor: RISK_COLORS[area.riskLevel] + '20',
                          color: RISK_COLORS[area.riskLevel]
                        }}>
                    {area.riskLevel.toUpperCase()}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-gray-600">Tickets</p>
                    <p className="font-medium text-red-900">{area.ticketCount}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Usage</p>
                    <p className="font-medium text-red-900">{area.usageScore}%</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Change</p>
                    <p className={`font-medium ${area.usageChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {area.usageChange > 0 ? '+' : ''}{area.usageChange}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default UsageCorrelation
