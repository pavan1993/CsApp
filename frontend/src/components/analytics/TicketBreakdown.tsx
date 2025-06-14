import React, { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { Calendar, Download, Filter, TrendingUp } from 'lucide-react'
import LoadingSpinner from '../LoadingSpinner'

interface TicketData {
  productArea: string
  critical: number
  severe: number
  moderate: number
  low: number
  total: number
}

interface TicketBreakdownProps {
  organization: string
  onDrillDown?: (productArea: string, severity: string) => void
}

const SEVERITY_COLORS = {
  critical: '#dc2626',
  severe: '#ea580c',
  moderate: '#d97706',
  low: '#65a30d'
}

const TicketBreakdown: React.FC<TicketBreakdownProps> = ({ organization, onDrillDown }) => {
  const [data, setData] = useState<TicketData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState('30')
  const [viewType, setViewType] = useState<'bar' | 'pie'>('bar')
  const [selectedProductArea, setSelectedProductArea] = useState<string | null>(null)

  useEffect(() => {
    fetchTicketData()
  }, [organization, dateRange])

  const fetchTicketData = async () => {
    if (!organization) return

    setLoading(true)
    setError(null)
    
    try {
      // Mock data for now - replace with actual API call
      const mockData: TicketData[] = [
        { productArea: 'Authentication', critical: 5, severe: 12, moderate: 8, low: 15, total: 40 },
        { productArea: 'Payment Processing', critical: 8, severe: 6, moderate: 10, low: 12, total: 36 },
        { productArea: 'User Management', critical: 2, severe: 8, moderate: 15, low: 20, total: 45 },
        { productArea: 'Reporting', critical: 1, severe: 4, moderate: 12, low: 18, total: 35 },
        { productArea: 'API Gateway', critical: 6, severe: 9, moderate: 7, low: 8, total: 30 }
      ]
      
      setData(mockData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch ticket data')
    } finally {
      setLoading(false)
    }
  }

  const handleBarClick = (data: any, index: number) => {
    if (onDrillDown && data.payload) {
      const productArea = data.payload.productArea
      setSelectedProductArea(productArea)
      // Could trigger drill-down to show individual tickets
    }
  }

  const exportData = () => {
    const csvContent = [
      ['Product Area', 'Critical', 'Severe', 'Moderate', 'Low', 'Total'],
      ...data.map(item => [
        item.productArea,
        item.critical.toString(),
        item.severe.toString(),
        item.moderate.toString(),
        item.low.toString(),
        item.total.toString()
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ticket-breakdown-${organization}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getPieData = () => {
    const totalsByArea = data.map(item => ({
      name: item.productArea,
      value: item.total,
      critical: item.critical,
      severe: item.severe,
      moderate: item.moderate,
      low: item.low
    }))
    return totalsByArea
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.dataKey}: ${entry.value}`}
            </p>
          ))}
          <p className="text-sm text-gray-600 mt-1">
            Total: {payload.reduce((sum: number, entry: any) => sum + entry.value, 0)}
          </p>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return <LoadingSpinner text="Loading ticket breakdown..." />
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading ticket data: {error}</p>
        <button 
          onClick={fetchTicketData}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
            Ticket Breakdown by Product Area
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Support tickets grouped by severity and product area
          </p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
          </div>
          
          <div className="flex items-center border border-gray-300 rounded-md">
            <button
              onClick={() => setViewType('bar')}
              className={`px-3 py-1 text-sm ${viewType === 'bar' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'}`}
            >
              Bar
            </button>
            <button
              onClick={() => setViewType('pie')}
              className={`px-3 py-1 text-sm ${viewType === 'pie' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'}`}
            >
              Pie
            </button>
          </div>
          
          <button
            onClick={exportData}
            className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <Download className="h-4 w-4 mr-1" />
            Export
          </button>
        </div>
      </div>

      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          {viewType === 'bar' ? (
            <BarChart data={data} onClick={handleBarClick}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="productArea" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="critical" stackId="a" fill={SEVERITY_COLORS.critical} name="Critical" />
              <Bar dataKey="severe" stackId="a" fill={SEVERITY_COLORS.severe} name="Severe" />
              <Bar dataKey="moderate" stackId="a" fill={SEVERITY_COLORS.moderate} name="Moderate" />
              <Bar dataKey="low" stackId="a" fill={SEVERITY_COLORS.low} name="Low" />
            </BarChart>
          ) : (
            <PieChart>
              <Pie
                data={getPieData()}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {getPieData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 60%)`} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>

      {selectedProductArea && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            Selected: <strong>{selectedProductArea}</strong>
          </p>
          <button
            onClick={() => setSelectedProductArea(null)}
            className="text-xs text-blue-600 hover:text-blue-800 underline mt-1"
          >
            Clear selection
          </button>
        </div>
      )}
    </div>
  )
}

export default TicketBreakdown
