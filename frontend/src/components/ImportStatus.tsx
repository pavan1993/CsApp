import React from 'react'
import { CheckCircle, XCircle, AlertTriangle, Clock, FileText } from 'lucide-react'

interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  rowCount: number
  validRows: number
  invalidRows: number
}

interface ImportStatusProps {
  status: 'idle' | 'uploading' | 'validating' | 'complete' | 'error'
  progress?: number
  message?: string
  validationResult?: ValidationResult
  uploadedData?: any[]
  onRetry?: () => void
  onViewData?: () => void
}

const ImportStatus: React.FC<ImportStatusProps> = ({
  status,
  progress = 0,
  message,
  validationResult,
  uploadedData,
  onRetry,
  onViewData
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'uploading':
      case 'validating':
        return <Clock className="h-6 w-6 text-blue-500 animate-pulse" />
      case 'complete':
        return <CheckCircle className="h-6 w-6 text-green-500" />
      case 'error':
        return <XCircle className="h-6 w-6 text-red-500" />
      default:
        return <FileText className="h-6 w-6 text-gray-400" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'uploading':
      case 'validating':
        return 'border-blue-200 bg-blue-50'
      case 'complete':
        return 'border-green-200 bg-green-50'
      case 'error':
        return 'border-red-200 bg-red-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  const getStatusMessage = () => {
    if (message) return message
    
    switch (status) {
      case 'uploading':
        return 'Uploading file...'
      case 'validating':
        return 'Validating data...'
      case 'complete':
        return 'Upload completed successfully!'
      case 'error':
        return 'Upload failed'
      default:
        return 'Ready to upload'
    }
  }

  if (status === 'idle') {
    return null
  }

  return (
    <div className={`border rounded-lg p-4 ${getStatusColor()}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getStatusIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">
              Import Status
            </h3>
            {(status === 'uploading' || status === 'validating') && (
              <span className="text-xs text-gray-500">
                {Math.round(progress)}%
              </span>
            )}
          </div>
          
          <p className="mt-1 text-sm text-gray-600">
            {getStatusMessage()}
          </p>

          {/* Progress Bar */}
          {(status === 'uploading' || status === 'validating') && (
            <div className="mt-3">
              <div className="bg-white rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Validation Results */}
          {validationResult && status === 'complete' && (
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    {validationResult.rowCount}
                  </div>
                  <div className="text-gray-500">Total Rows</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">
                    {validationResult.validRows}
                  </div>
                  <div className="text-gray-500">Valid</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-red-600">
                    {validationResult.invalidRows}
                  </div>
                  <div className="text-gray-500">Invalid</div>
                </div>
              </div>

              {/* Validation Errors */}
              {validationResult.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <div className="flex items-center space-x-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <h4 className="text-sm font-medium text-red-800">
                      Validation Errors ({validationResult.errors.length})
                    </h4>
                  </div>
                  <ul className="mt-2 text-sm text-red-700 space-y-1">
                    {validationResult.errors.slice(0, 5).map((error, index) => (
                      <li key={index} className="list-disc list-inside">
                        {error}
                      </li>
                    ))}
                    {validationResult.errors.length > 5 && (
                      <li className="text-red-600 font-medium">
                        ... and {validationResult.errors.length - 5} more errors
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* Validation Warnings */}
              {validationResult.warnings.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <h4 className="text-sm font-medium text-amber-800">
                      Warnings ({validationResult.warnings.length})
                    </h4>
                  </div>
                  <ul className="mt-2 text-sm text-amber-700 space-y-1">
                    {validationResult.warnings.slice(0, 3).map((warning, index) => (
                      <li key={index} className="list-disc list-inside">
                        {warning}
                      </li>
                    ))}
                    {validationResult.warnings.length > 3 && (
                      <li className="text-amber-600 font-medium">
                        ... and {validationResult.warnings.length - 3} more warnings
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-4 flex space-x-3">
            {status === 'error' && onRetry && (
              <button
                onClick={onRetry}
                className="text-sm bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Retry Upload
              </button>
            )}
            
            {status === 'complete' && uploadedData && onViewData && (
              <button
                onClick={onViewData}
                className="text-sm bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                View Data ({uploadedData.length} rows)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ImportStatus
