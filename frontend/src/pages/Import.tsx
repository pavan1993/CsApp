import React, { useState, useEffect } from 'react'
import { FileText, BarChart3, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { useAppContext } from '../context/AppContext'
import { useSearchParams } from 'react-router-dom'
import LoadingSpinner from '../components/LoadingSpinner'
import CSVUploader from '../components/CSVUploader'
import UploadHistory from '../components/UploadHistory'
import ImportStatus from '../components/ImportStatus'
import DataPreview from '../components/DataPreview'

const Import: React.FC = () => {
  const { state } = useAppContext()
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<'tickets' | 'usage'>('tickets')
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'validating' | 'complete' | 'error'>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadMessage, setUploadMessage] = useState<string>()
  const [validationResult, setValidationResult] = useState<any>()
  const [uploadedData, setUploadedData] = useState<any[]>()
  const [showDataPreview, setShowDataPreview] = useState(false)

  // Set active tab based on URL parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam === 'usage' || tabParam === 'tickets') {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  const handleUploadComplete = (result: any) => {
    console.log('Upload completed:', result)
    setUploadStatus('complete')
    setUploadMessage('Upload completed successfully!')
    setValidationResult(result.validation)
    setUploadedData(result.data)
    setRefreshTrigger(prev => prev + 1)
  }

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error)
    setUploadStatus('error')
    setUploadMessage(error)
  }

  const handleUploadProgress = (progress: number, status: 'uploading' | 'validating') => {
    setUploadProgress(progress)
    setUploadStatus(status)
    setUploadMessage(status === 'uploading' ? 'Uploading file...' : 'Validating data...')
  }

  const handleRetry = () => {
    setUploadStatus('idle')
    setUploadProgress(0)
    setUploadMessage(undefined)
    setValidationResult(undefined)
    setUploadedData(undefined)
  }

  const handleViewData = () => {
    setShowDataPreview(true)
  }

  if (state.isLoading) {
    return <LoadingSpinner text="Loading import page..." />
  }


  if (!state.selectedOrganization && activeTab === 'usage') {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No organization selected</h3>
          <p className="mt-1 text-sm text-gray-500">
            Please select an organization from the sidebar to import usage data.
          </p>
          {state.organizations.length > 0 && (
            <p className="mt-2 text-xs text-gray-400">
              Available organizations: {state.organizations.map(org => org.name).join(', ')}
            </p>
          )}
        </div>
      </div>
    )
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
                <p className="mt-1">Import functionality may be limited.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Data Import</h1>
        <p className="mt-1 text-sm text-gray-600">
          Upload CSV files for {state.selectedOrganization?.name || 'selected organization'}
        </p>
      </div>

      {/* Status Banner */}
      {uploadStatus !== 'idle' && (
        <div className="mb-6">
          <div className={`rounded-md p-4 ${
            uploadStatus === 'complete' ? 'bg-green-50 border border-green-200' :
            uploadStatus === 'error' ? 'bg-red-50 border border-red-200' :
            'bg-blue-50 border border-blue-200'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {uploadStatus === 'complete' && <CheckCircle className="h-5 w-5 text-green-400" />}
                {uploadStatus === 'error' && <AlertCircle className="h-5 w-5 text-red-400" />}
                {(uploadStatus === 'uploading' || uploadStatus === 'validating') && <Clock className="h-5 w-5 text-blue-400" />}
              </div>
              <div className="ml-3">
                <h3 className={`text-sm font-medium ${
                  uploadStatus === 'complete' ? 'text-green-800' :
                  uploadStatus === 'error' ? 'text-red-800' :
                  'text-blue-800'
                }`}>
                  {uploadStatus === 'complete' ? 'Upload Complete' :
                   uploadStatus === 'error' ? 'Upload Failed' :
                   uploadStatus === 'uploading' ? 'Uploading...' :
                   'Validating...'}
                </h3>
                {uploadMessage && (
                  <div className={`mt-2 text-sm ${
                    uploadStatus === 'complete' ? 'text-green-700' :
                    uploadStatus === 'error' ? 'text-red-700' :
                    'text-blue-700'
                  }`}>
                    {uploadMessage}
                  </div>
                )}
                {(uploadStatus === 'uploading' || uploadStatus === 'validating') && (
                  <div className="mt-2">
                    <div className="bg-white rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('tickets')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'tickets'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Support Tickets
            </div>
          </button>
          <button
            onClick={() => setActiveTab('usage')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'usage'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <BarChart3 className="w-4 h-4 mr-2" />
              Usage Data
            </div>
          </button>
        </nav>
      </div>

      {/* Upload Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Upload {activeTab === 'tickets' ? 'Support Tickets' : 'Usage Data'}
            </h2>
            
            <CSVUploader
              uploadType={activeTab}
              onUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
              onUploadProgress={handleUploadProgress}
            />
          </div>

          {/* Import Status */}
          {uploadStatus !== 'idle' && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Import Status</h2>
              <ImportStatus
                status={uploadStatus}
                progress={uploadProgress}
                message={uploadMessage}
                validationResult={validationResult}
                uploadedData={uploadedData}
                onRetry={handleRetry}
                onViewData={handleViewData}
              />
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Upload History</h2>
            <UploadHistory refreshTrigger={refreshTrigger} />
          </div>

          {/* Quick Stats */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Organization:</span>
                <span className="font-medium">{state.selectedOrganization.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Upload Type:</span>
                <span className="font-medium capitalize">{activeTab}</span>
              </div>
              {validationResult && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total Rows:</span>
                    <span className="font-medium">{validationResult.rowCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Valid Rows:</span>
                    <span className="font-medium text-green-600">{validationResult.validRows}</span>
                  </div>
                  {validationResult.invalidRows > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Invalid Rows:</span>
                      <span className="font-medium text-red-600">{validationResult.invalidRows}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Data Preview Modal */}
      {showDataPreview && uploadedData && (
        <DataPreview
          data={uploadedData}
          title={`${activeTab === 'tickets' ? 'Support Tickets' : 'Usage Data'} Preview`}
          onClose={() => setShowDataPreview(false)}
        />
      )}
    </div>
  )
}

export default Import
