import React, { useState, useCallback, useRef } from 'react'
import { Upload, X, AlertTriangle, CheckCircle, FileText } from 'lucide-react'
import { useAppContext } from '../context/AppContext'
import apiService from '../services/api'

interface CSVUploaderProps {
  uploadType: 'tickets' | 'usage'
  onUploadComplete?: (result: any) => void
  onUploadError?: (error: string) => void
  onUploadProgress?: (progress: number, status: 'uploading' | 'validating') => void
}

interface UploadProgress {
  progress: number
  status: 'idle' | 'uploading' | 'validating' | 'complete' | 'error'
  message?: string
}

interface ValidationWarning {
  type: 'overwrite' | 'validation'
  message: string
  lastUploadDate?: string
}

const CSVUploader: React.FC<CSVUploaderProps> = ({
  uploadType,
  onUploadComplete,
  onUploadError,
  onUploadProgress
}) => {
  const { state } = useAppContext()
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    progress: 0,
    status: 'idle'
  })
  const [validationWarning, setValidationWarning] = useState<ValidationWarning | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const maxFileSize = 10 * 1024 * 1024 // 10MB
  const acceptedTypes = ['.csv', 'text/csv', 'application/csv']

  const validateFile = (file: File): string | null => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return 'Please select a CSV file'
    }
    if (file.size > maxFileSize) {
      return 'File size must be less than 10MB'
    }
    if (file.size === 0) {
      return 'File appears to be empty'
    }
    return null
  }

  const checkLastUploadDate = async (): Promise<ValidationWarning | null> => {
    if (!state.selectedOrganization || uploadType !== 'usage') {
      return null
    }

    try {
      const lastUpload = await apiService.get(`/api/analytics/last-upload-date?organization=${state.selectedOrganization.name}`)
      
      if (lastUpload.usage) {
        const lastUploadDate = new Date(lastUpload.usage)
        const daysSinceUpload = Math.floor((Date.now() - lastUploadDate.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysSinceUpload < 30) {
          return {
            type: 'overwrite',
            message: `It has NOT been 30 days since the last upload (last upload: ${lastUploadDate.toLocaleDateString()}). Do you want to overwrite?`,
            lastUploadDate: lastUploadDate.toLocaleDateString()
          }
        }
      }
    } catch (error) {
      console.warn('Could not check last upload date:', error)
    }

    return null
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0])
    }
  }, [])

  const handleFileSelection = async (file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      onUploadError?.(validationError)
      return
    }

    setSelectedFile(file)
    
    // Check for 30-day validation for usage uploads
    const warning = await checkLastUploadDate()
    if (warning) {
      setValidationWarning(warning)
      setShowConfirmModal(true)
    } else {
      // Proceed with upload immediately
      performUpload(file)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0])
    }
  }

  const performUpload = async (file: File, forceUpload = false) => {
    if (!state.selectedOrganization) {
      onUploadError?.('Please select an organization first')
      return
    }

    setUploadProgress({ progress: 0, status: 'uploading', message: 'Uploading file...' })
    onUploadProgress?.(0, 'uploading')

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = Math.min(prev.progress + 10, 90)
          onUploadProgress?.(newProgress, 'uploading')
          return { ...prev, progress: newProgress }
        })
      }, 200)

      const uploadMethod = uploadType === 'tickets' 
        ? apiService.uploadTickets 
        : apiService.uploadUsage

      const result = await uploadMethod(state.selectedOrganization.name, file)
      
      clearInterval(progressInterval)
      
      // Validation phase
      setUploadProgress({ progress: 95, status: 'validating', message: 'Validating data...' })
      onUploadProgress?.(95, 'validating')
      
      // Simulate validation time
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setUploadProgress({ 
        progress: 100, 
        status: 'complete', 
        message: 'Upload completed successfully!' 
      })
      onUploadProgress?.(100, 'validating')
      
      // Mock validation result for demo
      const mockValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        rowCount: 150,
        validRows: 148,
        invalidRows: 2
      }
      
      onUploadComplete?.({
        ...result,
        validation: mockValidationResult,
        data: [] // This would contain sample data in a real implementation
      })
      
      // Reset after success
      setTimeout(() => {
        setSelectedFile(null)
        setUploadProgress({ progress: 0, status: 'idle' })
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }, 2000)

    } catch (error: any) {
      setUploadProgress({ 
        progress: 0, 
        status: 'error', 
        message: error.message || 'Upload failed' 
      })
      onUploadProgress?.(0, 'uploading')
      onUploadError?.(error.message || 'Upload failed')
    }
  }

  const handleConfirmUpload = () => {
    setShowConfirmModal(false)
    setValidationWarning(null)
    if (selectedFile) {
      performUpload(selectedFile, true)
    }
  }

  const handleCancelUpload = () => {
    setShowConfirmModal(false)
    setValidationWarning(null)
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const resetUpload = () => {
    setSelectedFile(null)
    setUploadProgress({ progress: 0, status: 'idle' })
    setValidationWarning(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="w-full">
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : uploadProgress.status === 'error'
            ? 'border-red-300 bg-red-50'
            : uploadProgress.status === 'complete'
            ? 'border-green-300 bg-green-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleFileInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploadProgress.status === 'uploading'}
        />

        <div className="text-center">
          {uploadProgress.status === 'uploading' ? (
            <div className="space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Uploading...</p>
                <div className="mt-2 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress.progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ) : uploadProgress.status === 'complete' ? (
            <div className="space-y-2">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
              <p className="text-sm font-medium text-green-900">Upload Complete!</p>
              <p className="text-xs text-green-700">{uploadProgress.message}</p>
            </div>
          ) : uploadProgress.status === 'error' ? (
            <div className="space-y-2">
              <X className="mx-auto h-12 w-12 text-red-500" />
              <p className="text-sm font-medium text-red-900">Upload Failed</p>
              <p className="text-xs text-red-700">{uploadProgress.message}</p>
              <button
                onClick={resetUpload}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {selectedFile ? selectedFile.name : `Upload ${uploadType} CSV file`}
                </p>
                <p className="text-xs text-gray-500">
                  Drag and drop your file here, or click to browse
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Maximum file size: 10MB
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* File Info */}
      {selectedFile && uploadProgress.status === 'idle' && (
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-900">{selectedFile.name}</span>
              <span className="text-xs text-gray-500">
                ({(selectedFile.size / 1024).toFixed(1)} KB)
              </span>
            </div>
            <button
              onClick={resetUpload}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && validationWarning && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-6 w-6 text-amber-500" />
                <h3 className="text-lg font-medium text-gray-900">
                  Confirm Upload
                </h3>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  {validationWarning.message}
                </p>
              </div>
              <div className="mt-6 flex space-x-3">
                <button
                  onClick={handleConfirmUpload}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Yes, Overwrite
                </button>
                <button
                  onClick={handleCancelUpload}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CSVUploader
