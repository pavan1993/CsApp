import React, { useState, useRef } from 'react'
import { Upload, X, FileText, CheckCircle } from 'lucide-react'
import { useAppContext } from '../context/AppContext'
import { apiService } from '../services/api'

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

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0])
    }
  }

  const handleFileSelection = (file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      onUploadError?.(validationError)
      return
    }

    setSelectedFile(file)
    setUploadProgress({ progress: 0, status: 'idle' })
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    console.log('🔄 Upload button clicked');
    console.log('🔄 Selected file:', selectedFile?.name);
    console.log('🔄 Upload type:', uploadType);

    if (!selectedFile) {
      const errorMsg = 'Please select a file';
      console.error('❌ Upload validation failed:', errorMsg);
      onUploadError?.(errorMsg);
      return;
    }

    // For usage uploads, still require organization
    if (uploadType === 'usage' && !state.selectedOrganization) {
      const errorMsg = 'Please select an organization for usage data upload';
      console.error('❌ Upload validation failed:', errorMsg);
      onUploadError?.(errorMsg);
      return;
    }

    console.log('✅ Starting upload process...');
    setUploadProgress({ progress: 0, status: 'uploading', message: 'Uploading file...' })
    
    let progressInterval: NodeJS.Timeout | undefined;

    try {
      // Simulate upload progress
      progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = Math.min(prev.progress + 10, 90)
          return { ...prev, progress: newProgress }
        })
      }, 200)

      console.log('🔄 Calling upload method...');
      let result;
      if (uploadType === 'tickets') {
        result = await apiService.uploadTickets(selectedFile);
      } else {
        result = await apiService.uploadUsage(state.selectedOrganization!.name, selectedFile);
      }
      console.log('✅ Upload method completed:', result);
      
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = undefined;
      }
      
      // Validation phase
      console.log('🔄 Starting validation phase...');
      setUploadProgress({ progress: 95, status: 'validating', message: 'Validating data...' })
      
      // Simulate validation time
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setUploadProgress({ 
        progress: 100, 
        status: 'complete', 
        message: 'Upload completed successfully!' 
      })
      
      // Create validation result from actual response
      const validationResult = {
        isValid: true,
        errors: result.data?.errors || [],
        warnings: [],
        rowCount: result.data?.inserted || 0,
        validRows: result.data?.inserted || 0,
        invalidRows: result.data?.errors?.length || 0
      }
      
      console.log('✅ Calling onUploadComplete...');
      onUploadComplete?.({
        ...result,
        validation: validationResult,
        data: result.data?.tickets || []
      })
      
      // Reset after success
      setTimeout(() => {
        console.log('🔄 Resetting upload state...');
        setSelectedFile(null)
        setUploadProgress({ progress: 0, status: 'idle' })
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }, 2000)

    } catch (error: any) {
      console.error('❌ Upload failed with error:', error);
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      setUploadProgress({ 
        progress: 0, 
        status: 'error', 
        message: error.message || 'Upload failed' 
      })
      onUploadError?.(error.message || 'Upload failed')
    }
  }

  const resetUpload = () => {
    setSelectedFile(null)
    setUploadProgress({ progress: 0, status: 'idle' })
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
          {selectedFile ? (
            <div className="space-y-2">
              <FileText className="mx-auto h-12 w-12 text-green-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <button
                  onClick={resetUpload}
                  className="mt-2 text-sm text-red-600 hover:text-red-500"
                >
                  Remove file
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Upload {uploadType} CSV file
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

      {/* Upload Progress */}
      {uploadProgress.status !== 'idle' && (
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{uploadProgress.message}</span>
            <span className="text-gray-600">{uploadProgress.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                uploadProgress.status === 'error'
                  ? 'bg-red-500'
                  : uploadProgress.status === 'complete'
                  ? 'bg-green-500'
                  : 'bg-blue-500'
              }`}
              style={{ width: `${uploadProgress.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Upload Button */}
      {selectedFile && uploadProgress.status === 'idle' && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleUpload}
            disabled={uploadType === 'usage' && !state.selectedOrganization}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Upload {uploadType === 'tickets' ? 'Tickets' : 'Usage Data'}
          </button>
        </div>
      )}
    </div>
  )
}

export default CSVUploader
