import React, { useState } from 'react'
import { Upload, FileText, BarChart3 } from 'lucide-react'
import { useAppContext } from '../context/AppContext'
import CSVUploader from '../components/CSVUploader'
import UploadHistory from '../components/UploadHistory'

const Import: React.FC = () => {
  const { state } = useAppContext()
  const [activeTab, setActiveTab] = useState<'tickets' | 'usage'>('tickets')
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleUploadComplete = (result: any) => {
    console.log('Upload completed:', result)
    setRefreshTrigger(prev => prev + 1)
  }

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error)
  }

  if (!state.selectedOrganization) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center py-12">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Organization Selected</h3>
          <p className="mt-1 text-sm text-gray-500">
            Please select an organization from the sidebar to upload data.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Data Import</h1>
        <p className="mt-1 text-sm text-gray-600">
          Upload CSV files for {state.selectedOrganization.name}
        </p>
      </div>

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
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Upload History</h2>
            <UploadHistory refreshTrigger={refreshTrigger} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Import
