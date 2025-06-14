import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Save, RotateCcw, AlertCircle, Info, X } from 'lucide-react'
import { apiService } from '../services/api'
import LoadingSpinner from './LoadingSpinner'

interface ThresholdConfiguration {
  id: string
  organization: string
  productArea: string
  severityLevel: 'CRITICAL' | 'SEVERE' | 'MODERATE' | 'LOW'
  ticketThreshold: number
  usageDropThreshold: number
  createdAt: string
  updatedAt: string
}

interface ThresholdConfigurationProps {
  organization: string
}

const SEVERITY_LEVELS = [
  { value: 'CRITICAL', label: 'Critical', color: 'red' },
  { value: 'SEVERE', label: 'Severe', color: 'orange' },
  { value: 'MODERATE', label: 'Moderate', color: 'yellow' },
  { value: 'LOW', label: 'Low', color: 'green' }
]

const ThresholdConfiguration: React.FC<ThresholdConfigurationProps> = ({ organization }) => {
  const [thresholds, setThresholds] = useState<ThresholdConfiguration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingThreshold, setEditingThreshold] = useState<ThresholdConfiguration | null>(null)
  const [formData, setFormData] = useState({
    productArea: '',
    severityLevel: 'MODERATE' as const,
    ticketThreshold: 5,
    usageDropThreshold: 20
  })
  const [submitting, setSubmitting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [previewScore, setPreviewScore] = useState<number | null>(null)
  const [selectedThresholds, setSelectedThresholds] = useState<Set<string>>(new Set())
  const [showBatchActions, setShowBatchActions] = useState(false)

  useEffect(() => {
    loadThresholds()
  }, [organization])

  useEffect(() => {
    // Calculate preview score when form data changes
    calculatePreviewScore()
  }, [formData])

  const loadThresholds = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiService.getThresholdConfigurations(organization)
      setThresholds(Array.isArray(data) ? data : [])
    } catch (err: any) {
      setError(err.message || 'Failed to load threshold configurations')
      setThresholds([])
    } finally {
      setLoading(false)
    }
  }

  const calculatePreviewScore = () => {
    // Simple scoring algorithm for preview
    const { ticketThreshold, usageDropThreshold, severityLevel } = formData
    
    const severityMultiplier = {
      'CRITICAL': 4,
      'SEVERE': 3,
      'MODERATE': 2,
      'LOW': 1
    }[severityLevel]

    const ticketScore = ticketThreshold * severityMultiplier * 2
    const usageScore = usageDropThreshold * 1.5
    const totalScore = ticketScore + usageScore

    setPreviewScore(Math.round(totalScore))
  }

  const getScoreCategory = (score: number) => {
    if (score <= 50) return { label: 'Good', color: 'green' }
    if (score <= 100) return { label: 'Moderate Risk', color: 'yellow' }
    if (score <= 200) return { label: 'High Risk', color: 'orange' }
    return { label: 'Critical', color: 'red' }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.productArea.trim()) {
      setError('Product area is required')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      if (editingThreshold) {
        await apiService.updateThresholdConfiguration(organization, editingThreshold.id, formData)
      } else {
        await apiService.createThresholdConfiguration(organization, formData)
      }

      await loadThresholds()
      resetForm()
    } catch (err: any) {
      setError(err.message || 'Failed to save threshold configuration')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (threshold: ThresholdConfiguration) => {
    setEditingThreshold(threshold)
    setFormData({
      productArea: threshold.productArea,
      severityLevel: threshold.severityLevel,
      ticketThreshold: threshold.ticketThreshold,
      usageDropThreshold: threshold.usageDropThreshold
    })
    setShowAddForm(true)
  }

  const handleDelete = async (id: string) => {
    try {
      setError(null)
      await apiService.deleteThresholdConfiguration(organization, id)
      await loadThresholds()
      setDeleteConfirm(null)
    } catch (err: any) {
      setError(err.message || 'Failed to delete threshold configuration')
    }
  }

  const resetForm = () => {
    setFormData({
      productArea: '',
      severityLevel: 'MODERATE',
      ticketThreshold: 5,
      usageDropThreshold: 20
    })
    setEditingThreshold(null)
    setShowAddForm(false)
    setPreviewScore(null)
  }

  const resetToDefaults = () => {
    setFormData({
      ...formData,
      ticketThreshold: 5,
      usageDropThreshold: 20
    })
  }

  const handleSelectThreshold = (id: string) => {
    const newSelected = new Set(selectedThresholds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedThresholds(newSelected)
    setShowBatchActions(newSelected.size > 0)
  }

  const handleSelectAllThresholds = () => {
    if (selectedThresholds.size === thresholds.length) {
      setSelectedThresholds(new Set())
      setShowBatchActions(false)
    } else {
      setSelectedThresholds(new Set(thresholds.map(t => t.id)))
      setShowBatchActions(true)
    }
  }

  const handleBatchDelete = async () => {
    try {
      setError(null)
      const promises = Array.from(selectedThresholds).map(id => 
        apiService.deleteThresholdConfiguration(organization, id)
      )
      await Promise.all(promises)
      await loadThresholds()
      setSelectedThresholds(new Set())
      setShowBatchActions(false)
    } catch (err: any) {
      setError(err.message || 'Failed to delete selected thresholds')
    }
  }

  if (loading) {
    return <LoadingSpinner text="Loading threshold configurations..." />
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Threshold Configuration</h2>
          <p className="text-sm text-gray-500">
            Set scoring thresholds for different product areas and severity levels
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Threshold
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="border border-red-200 rounded-lg p-4 bg-red-50">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {editingThreshold ? 'Edit Threshold Configuration' : 'Add New Threshold Configuration'}
            </h3>
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Area *
                </label>
                <input
                  type="text"
                  value={formData.productArea}
                  onChange={(e) => setFormData({ ...formData, productArea: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Authentication, Payment Processing"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Severity Level *
                </label>
                <select
                  value={formData.severityLevel}
                  onChange={(e) => setFormData({ ...formData, severityLevel: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  {SEVERITY_LEVELS.map(level => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ticket Threshold: {formData.ticketThreshold}
                </label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={formData.ticketThreshold}
                  onChange={(e) => setFormData({ ...formData, ticketThreshold: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1</span>
                  <span>50</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Number of tickets that trigger scoring
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Usage Drop Threshold: {formData.usageDropThreshold}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.usageDropThreshold}
                  onChange={(e) => setFormData({ ...formData, usageDropThreshold: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span>100%</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Percentage drop in usage that triggers scoring
                </p>
              </div>
            </div>

            {/* Score Preview */}
            {previewScore !== null && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Info className="h-5 w-5 text-blue-500 mr-2" />
                    <span className="text-sm font-medium text-gray-900">Score Preview</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl font-bold text-gray-900">{previewScore}</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      getScoreCategory(previewScore).color === 'green' ? 'bg-green-100 text-green-800' :
                      getScoreCategory(previewScore).color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                      getScoreCategory(previewScore).color === 'orange' ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {getScoreCategory(previewScore).label}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  This is an estimated score based on your threshold settings
                </p>
              </div>
            )}

            <div className="flex justify-between">
              <button
                type="button"
                onClick={resetToDefaults}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Defaults
              </button>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {submitting ? 'Saving...' : editingThreshold ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Thresholds Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Configured Thresholds ({thresholds.length})
          </h3>
        </div>
        {thresholds.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500">No threshold configurations found.</div>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-2 text-blue-600 hover:text-blue-500 text-sm"
            >
              Add your first threshold configuration
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product Area
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Severity Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ticket Threshold
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usage Drop %
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {thresholds.map((threshold) => {
                  const severityConfig = SEVERITY_LEVELS.find(s => s.value === threshold.severityLevel)
                  return (
                    <tr key={threshold.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {threshold.productArea}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          severityConfig?.color === 'red' ? 'bg-red-100 text-red-800' :
                          severityConfig?.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                          severityConfig?.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {severityConfig?.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {threshold.ticketThreshold}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {threshold.usageDropThreshold}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(threshold)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(threshold.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-2">Delete Threshold Configuration</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this threshold configuration? This action cannot be undone.
                </p>
              </div>
              <div className="flex justify-center space-x-3 mt-4">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="px-4 py-2 bg-red-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ThresholdConfiguration
