import React, { useState, useEffect } from 'react'
import { Calendar, Clock, CheckCircle, XCircle, AlertTriangle, FileText, Database } from 'lucide-react'
import { useAppContext } from '../context/AppContext'
import apiService from '../services/api'

interface UploadRecord {
  id: string
  type: 'tickets' | 'usage'
  organization: string
  uploadDate: Date
  status: 'success' | 'error' | 'warning'
  fileName?: string
  recordCount?: number
  validRecords?: number
  errors?: string[]
  warnings?: string[]
}

interface UploadHistoryProps {
  refreshTrigger?: number
}

const UploadHistory: React.FC<UploadHistoryProps> = ({ refreshTrigger }) => {
  const { state } = useAppContext()
  const [uploadHistory, setUploadHistory] = useState<UploadRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedType, setSelectedType] = useState<'all' | 'tickets' | 'usage'>('all')
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null)

  useEffect(() => {
    if (state.selectedOrganization) {
      loadUploadHistory()
    }
  }, [state.selectedOrganization, refreshTrigger])

  const loadUploadHistory = async () => {
    if (!state.selectedOrganization) return

    setIsLoading(true)
    try {
      // Mock data for now - replace with actual API call
      const mockHistory: UploadRecord[] = [
        {
          id: '1',
          type: 'tickets',
          organization: state.selectedOrganization.name,
          uploadDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          status: 'success',
          fileName: 'support_tickets_2024.csv',
          recordCount: 1250,
          validRecords: 1248,
          warnings: ['2 rows had missing assignee information']
        },
        {
          id: '2',
          type: 'usage',
          organization: state.selectedOrganization.name,
          uploadDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          status: 'success',
          fileName: 'usage_data_march.csv',
          recordCount: 45,
          validRecords: 45
        },
        {
          id: '3',
          type: 'tickets',
          organization: state.selectedOrganization.name,
          uploadDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          status: 'error',
          fileName: 'tickets_invalid.csv',
          recordCount: 0,
          errors: ['Invalid CSV format', 'Missing required columns: ID, Status']
        },
        {
          id: '4',
          type: 'usage',
          organization: state.selectedOrganization.name,
          uploadDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
          status: 'warning',
          fileName: 'usage_february.csv',
          recordCount: 42,
          validRecords: 38,
          warnings: ['4 rows had zero usage values', 'Some capability names were normalized']
        }
      ]

      setUploadHistory(mockHistory)
    } catch (error) {
      console.error('Failed to load upload history:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredHistory = uploadHistory.filter(record => 
    selectedType === 'all' || record.type === selectedType
  )

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-amber-50 border-amber-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getTypeIcon = (type: string) => {
    return type === 'tickets' ? (
      <FileText className="h-4 w-4 text-blue-500" />
    ) : (
      <Database className="h-4 w-4 text-purple-500" />
    )
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const getDaysAgo = (date: Date) => {
    const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    return `${days} days ago`
  }

  if (!state.selectedOrganization) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500 text-center">
          Select an organization to view upload history
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Upload History</h3>
            <p className="text-sm text-gray-500">
              Recent data uploads for {state.selectedOrganization.name}
            </p>
          </div>
          
          {/* Filter Tabs */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {[
              { key: 'all', label: 'All' },
              { key: 'tickets', label: 'Tickets' },
              { key: 'usage', label: 'Usage' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setSelectedType(tab.key as any)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  selectedType === tab.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading history...</span>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No upload history</h3>
            <p className="mt-1 text-sm text-gray-500">
              {selectedType === 'all' 
                ? 'No data has been uploaded yet.'
                : `No ${selectedType} data has been uploaded yet.`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHistory.map(record => (
              <div
                key={record.id}
                className={`border rounded-lg p-4 transition-all ${getStatusColor(record.status)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getStatusIcon(record.status)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(record.type)}
                        <h4 className="text-sm font-medium text-gray-900 capitalize">
                          {record.type} Upload
                        </h4>
                        <span className="text-xs text-gray-500">
                          {getDaysAgo(record.uploadDate)}
                        </span>
                      </div>
                      
                      <p className="mt-1 text-sm text-gray-600">
                        {record.fileName || 'Unknown file'}
                      </p>
                      
                      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                        <span>{formatDate(record.uploadDate)}</span>
                        {record.recordCount !== undefined && (
                          <span>{record.recordCount} records</span>
                        )}
                        {record.validRecords !== undefined && record.recordCount !== undefined && (
                          <span>
                            {record.validRecords}/{record.recordCount} valid
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {(record.errors?.length || record.warnings?.length) && (
                    <button
                      onClick={() => setExpandedRecord(
                        expandedRecord === record.id ? null : record.id
                      )}
                      className="text-sm text-blue-600 hover:text-blue-500"
                    >
                      {expandedRecord === record.id ? 'Hide' : 'Details'}
                    </button>
                  )}
                </div>

                {/* Expanded Details */}
                {expandedRecord === record.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    {record.errors && record.errors.length > 0 && (
                      <div className="mb-3">
                        <h5 className="text-sm font-medium text-red-800 mb-2">
                          Errors ({record.errors.length})
                        </h5>
                        <ul className="text-sm text-red-700 space-y-1">
                          {record.errors.map((error, index) => (
                            <li key={index} className="list-disc list-inside">
                              {error}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {record.warnings && record.warnings.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-amber-800 mb-2">
                          Warnings ({record.warnings.length})
                        </h5>
                        <ul className="text-sm text-amber-700 space-y-1">
                          {record.warnings.map((warning, index) => (
                            <li key={index} className="list-disc list-inside">
                              {warning}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default UploadHistory
