import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Download, Upload, Search, AlertCircle, CheckCircle, X } from 'lucide-react'
import { apiService } from '../services/api'
import LoadingSpinner from './LoadingSpinner'

interface ProductAreaMapping {
  id: string
  organization: string
  productArea: string
  dynatraceCapability: string
  isKeyModule: boolean
  createdAt: string
  updatedAt: string
}

interface ProductAreaMappingProps {
  organization: string
}

const ProductAreaMapping: React.FC<ProductAreaMappingProps> = ({ organization }) => {
  const [mappings, setMappings] = useState<ProductAreaMapping[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingMapping, setEditingMapping] = useState<ProductAreaMapping | null>(null)
  const [formData, setFormData] = useState({
    productArea: '',
    dynatraceCapability: '',
    isKeyModule: false
  })
  const [submitting, setSubmitting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    loadMappings()
  }, [organization])

  const loadMappings = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiService.getProductAreaMappings(organization)
      setMappings(Array.isArray(data) ? data : [])
    } catch (err: any) {
      setError(err.message || 'Failed to load product area mappings')
      setMappings([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.productArea.trim() || !formData.dynatraceCapability.trim()) {
      setError('Product area and Dynatrace capability are required')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      if (editingMapping) {
        await apiService.updateProductAreaMapping(organization, editingMapping.id, formData)
      } else {
        await apiService.createProductAreaMapping(organization, formData)
      }

      await loadMappings()
      resetForm()
    } catch (err: any) {
      setError(err.message || 'Failed to save mapping')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (mapping: ProductAreaMapping) => {
    setEditingMapping(mapping)
    setFormData({
      productArea: mapping.productArea,
      dynatraceCapability: mapping.dynatraceCapability,
      isKeyModule: mapping.isKeyModule
    })
    setShowAddForm(true)
  }

  const handleDelete = async (id: string) => {
    try {
      setError(null)
      await apiService.deleteProductAreaMapping(organization, id)
      await loadMappings()
      setDeleteConfirm(null)
    } catch (err: any) {
      setError(err.message || 'Failed to delete mapping')
    }
  }

  const resetForm = () => {
    setFormData({
      productArea: '',
      dynatraceCapability: '',
      isKeyModule: false
    })
    setEditingMapping(null)
    setShowAddForm(false)
  }

  const exportMappings = async () => {
    try {
      const data = await apiService.exportConfiguration(organization, 'mappings')
      const csv = [
        'Product Area,Dynatrace Capability,Key Module',
        ...mappings.map(m => `"${m.productArea}","${m.dynatraceCapability}",${m.isKeyModule}`)
      ].join('\n')

      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${organization}-product-area-mappings-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      setError(err.message || 'Failed to export mappings')
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setError(null)
      await apiService.importConfiguration(organization, file, 'mappings')
      await loadMappings()
      // Reset the input
      event.target.value = ''
    } catch (err: any) {
      setError(err.message || 'Failed to import mappings')
    }
  }

  const filteredMappings = mappings.filter(mapping =>
    mapping.productArea.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mapping.dynatraceCapability.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const unmappedAreas = mappings.length === 0 ? [] : 
    mappings.filter(m => !m.dynatraceCapability || m.dynatraceCapability.trim() === '')

  if (loading) {
    return <LoadingSpinner text="Loading product area mappings..." />
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search mappings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {unmappedAreas.length > 0 && (
            <div className="flex items-center text-amber-600 text-sm">
              <AlertCircle className="h-4 w-4 mr-1" />
              {unmappedAreas.length} unmapped areas
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={exportMappings}
            disabled={mappings.length === 0}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <label className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer">
            <Upload className="h-4 w-4 mr-2" />
            Import
            <input
              type="file"
              accept=".csv"
              onChange={handleImport}
              className="hidden"
            />
          </label>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Mapping
          </button>
        </div>
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
              {editingMapping ? 'Edit Mapping' : 'Add New Mapping'}
            </h3>
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  Dynatrace Capability *
                </label>
                <input
                  type="text"
                  value={formData.dynatraceCapability}
                  onChange={(e) => setFormData({ ...formData, dynatraceCapability: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Application Security, Real User Monitoring"
                  required
                />
              </div>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isKeyModule"
                checked={formData.isKeyModule}
                onChange={(e) => setFormData({ ...formData, isKeyModule: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isKeyModule" className="ml-2 block text-sm text-gray-900">
                Mark as key module (critical for business operations)
              </label>
            </div>
            <div className="flex justify-end space-x-3">
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
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {submitting ? 'Saving...' : editingMapping ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Mappings Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Product Area Mappings ({filteredMappings.length})
          </h3>
        </div>
        {filteredMappings.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500">
              {searchTerm ? 'No mappings match your search.' : 'No product area mappings configured.'}
            </div>
            {!searchTerm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-2 text-blue-600 hover:text-blue-500 text-sm"
              >
                Add your first mapping
              </button>
            )}
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
                    Dynatrace Capability
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMappings.map((mapping) => (
                  <tr key={mapping.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {mapping.productArea}
                        </div>
                        {mapping.isKeyModule && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Key Module
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{mapping.dynatraceCapability}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                        <span className="text-sm text-green-700">Mapped</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(mapping)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(mapping.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
              <h3 className="text-lg font-medium text-gray-900 mt-2">Delete Mapping</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this product area mapping? This action cannot be undone.
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

export default ProductAreaMapping
