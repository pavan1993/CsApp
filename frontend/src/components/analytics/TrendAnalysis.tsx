import React, { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'
import { Calendar, TrendingUp, TrendingDown, Download } from 'lucide-react'
import LoadingSpinner from '../LoadingSpinner'

interface TrendData {
  date: string
  ticketCount: number
  usageScore: number
  criticalTickets: number
  severeTickets: number
  moderateTickets: number
  lowTickets: number
}

interface TrendAnalysisProps {
  organization: string
  productArea?: string
}

const TrendAnalysis: React.FC<TrendAnalysisProps> = ({ organization, productArea }) => {
  const [data, setData] = useState<TrendData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState('90')
  const [viewType, setViewType] = useState<'line' | 'area'>('line')
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['ticketCount', 'usageScore'])

  useEffect(() => {
    fetchTrendData()
  }, [organization, productArea, dateRange])

  const fetchTrendData = async () => {
    if (!organization) return

    setLoading(true)
    setError(null)
    
    try {
      // Mock data for now - replace with actual API call
      const mockData: TrendData[] = generateMockTrendData(parseInt(dateRange))
      setData(mockData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch trend data')
    } finally {
      setLoading(false)
    }
  }

  const generateMockTrendData = (days: number): TrendData[] => {
    const data: TrendData[] = []
    const today = new Date()
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      
      // Generate realistic trend data with some seasonality
      const dayOfWeek = date.getDay()
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
      const baseTickets = isWeekend ? 15 : 25
      const seasonalFactor = Math.sin((i / days) * Math.PI * 2) * 5
      
      const ticketCount = Math.max(0, Math.round(
        baseTickets + seasonalFactor + (Math.random() - 0.5) * 10
      ))
      
      const usageScore = Math.max(40, Math.min(100, Math.round(
        75 + Math.sin((i / days) * Math.PI * 4) * 15 + (Math.random() - 0.5) * 10
      )))
      
      data.push({
        date: date.toISOString().split('T')[0],
        ticketCount,
        usageScore,
        criticalTickets: Math.round(ticketCount * 0.1),
        severeTickets: Math.round(ticketCount * 0.2),
        moderateTickets: Math.round(ticketCount * 0.3),
        lowTickets: Math.round(ticketCount * 0.4)
      })
    }
    
    return data
  }

  const getMetricConfig = () => {
    return {
      ticketCount: { color: '#3b82f6', name: 'Total Tickets' },
      usageScore: { color: '#10b981', name: 'Usage Score' },
      criticalTickets: { color: '#dc2626', name: 'Critical Tickets' },
      severeTickets: { color: '#ea580c', name: 'Severe Tickets' },
      moderateTickets: { color: '#d97706', name: 'Moderate Tickets' },
      lowTickets: { color: '#65a30d', name: 'Low Tickets' }
    }
  }

  const calculateTrend = (metric: keyof TrendData) => {
    if (data.length < 2) return 0
    
    const recent = data.slice(-7).reduce((sum, item) => sum + (item[metric] as number), 0) / 7
    const previous = data.slice(-14, -7).reduce((sum, item) => sum + (item[metric] as number), 0) / 7
    
    return previous === 0 ? 0 : ((recent - previous) / previous) * 100
  }

  const exportData = () => {
    const csvContent = [
      ['Date', 'Total Tickets', 'Usage Score', 'Critical', 'Severe', 'Moderate', 'Low'],
      ...data.map(item => [
        item.date,
        item.ticketCount.toString(),
        item.usageScore.toString(),
        item.criticalTickets.toString(),
        item.severeTickets.toString(),
        item.moderateTickets.toString(),
        item.lowTickets.toString()
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `trend-analysis-${organization}-${productArea || 'all'}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value}${entry.dataKey === 'usageScore' ? '%' : ''}`}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (loading) {
    return <LoadingSpinner text="Loading trend analysis..." />
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading trend data: {error}</p>
        <button 
          onClick={fetchTrendData}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Retry
        </button>
      </div>
    )
  }

  const metricConfig = getMetricConfig()
  const ticketTrend = calculateTrend('ticketCount')
  const usageTrend = calculateTrend('usageScore')

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
            Trend Analysis
            {productArea && <span className="ml-2 text-sm text-gray-600">- {productArea}</span>}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Historical trends for tickets and usage patterns
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
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="180">Last 6 months</option>
              <option value="365">Last year</option>
            </select>
          </div>
          
          <div className="flex items-center border border-gray-300 rounded-md">
            <button
              onClick={() => setViewType('line')}
              className={`px-3 py-1 text-sm ${viewType === 'line' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'}`}
            >
              Line
            </button>
            <button
              onClick={() => setViewType('area')}
              className={`px-3 py-1 text-sm ${viewType === 'area' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'}`}
            >
              Area
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

      {/* Trend Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">Avg Daily Tickets</p>
              <p className="text-2xl font-bold text-blue-700">
                {Math.round(data.reduce((sum, item) => sum + item.ticketCount, 0) / data.length)}
              </p>
            </div>
            <div className={`flex items-center ${ticketTrend >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {ticketTrend >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span className="text-sm font-medium ml-1">{Math.abs(ticketTrend).toFixed(1)}%</span>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-900">Avg Usage Score</p>
              <p className="text-2xl font-bold text-green-700">
                {Math.round(data.reduce((sum, item) => sum + item.usageScore, 0) / data.length)}%
              </p>
            </div>
            <div className={`flex items-center ${usageTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {usageTrend >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span className="text-sm font-medium ml-1">{Math.abs(usageTrend).toFixed(1)}%</span>
            </div>
          </div>
        </div>
        
        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-900">Critical Tickets</p>
              <p className="text-2xl font-bold text-red-700">
                {data.reduce((sum, item) => sum + item.criticalTickets, 0)}
              </p>
            </div>
            <div className="text-xs text-red-600">
              Last {dateRange} days
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-900">Peak Day</p>
              <p className="text-lg font-bold text-yellow-700">
                {Math.max(...data.map(d => d.ticketCount))} tickets
              </p>
            </div>
            <div className="text-xs text-yellow-600">
              {data.find(d => d.ticketCount === Math.max(...data.map(d => d.ticketCount)))?.date}
            </div>
          </div>
        </div>
      </div>

      {/* Metric Selection */}
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Select metrics to display:</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(metricConfig).map(([key, config]) => (
            <button
              key={key}
              onClick={() => {
                if (selectedMetrics.includes(key)) {
                  setSelectedMetrics(selectedMetrics.filter(m => m !== key))
                } else {
                  setSelectedMetrics([...selectedMetrics, key])
                }
              }}
              className={`px-3 py-1 text-sm rounded-md border ${
                selectedMetrics.includes(key)
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span 
                className="inline-block w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: config.color }}
              ></span>
              {config.name}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          {viewType === 'line' ? (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {selectedMetrics.map(metric => (
                <Line
                  key={metric}
                  yAxisId={metric === 'usageScore' ? 'right' : 'left'}
                  type="monotone"
                  dataKey={metric}
                  stroke={metricConfig[metric as keyof typeof metricConfig].color}
                  strokeWidth={2}
                  name={metricConfig[metric as keyof typeof metricConfig].name}
                  connectNulls={false}
                />
              ))}
            </LineChart>
          ) : (
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {selectedMetrics.map(metric => (
                <Area
                  key={metric}
                  type="monotone"
                  dataKey={metric}
                  stackId={metric === 'usageScore' ? '2' : '1'}
                  stroke={metricConfig[metric as keyof typeof metricConfig].color}
                  fill={metricConfig[metric as keyof typeof metricConfig].color}
                  fillOpacity={0.6}
                  name={metricConfig[metric as keyof typeof metricConfig].name}
                />
              ))}
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default TrendAnalysis
