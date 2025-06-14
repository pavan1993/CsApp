import React, { useState, useEffect } from 'react'
import { Star, Search, Filter, CheckSquare, Square, AlertCircle, Info } from 'lucide-react'
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

interface KeyModulesSelectorProps {
  organization: string
}

const KeyModulesSelector: React.FC<KeyModulesSelectorProps> = ({ organization }) => {
  const [mappings, setMappings] = useState<ProductAreaMapping[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'key' | 'regular'>('all')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [updating, setUpdating] = useState<Set<string>>(new Set())

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

  const handleToggleKeyModule = async (mapping: ProductAreaMapping) => {
    try {
      setUpdating(prev => new Set(prev).add(mapping.id))
      setError(null)
      
      await apiService.updateKeyModuleStatus(organization, mapping.id, !mapping.isKeyModule)
      await loadMappings()
    } catch (err: any) {
      setError(err.message || 'Failed to update key module status')
    } finally {
      setUpdating(prev => {
        const newSet = new Set(prev)
        newSet.delete(mapping.id)
        return newSet
      })
    }
  }

  const handleBulkToggle = async (makeKeyModule: boolean) => {
    if (selectedItems.size === 0) return

    try {
      setError(null)
      const promises = Array.from(selectedItems).map(id => {
        const mapping = mappings.find(m => m.id === id)
        if (mapping && mapping.isKeyModule !== makeKeyModule) {
          return apiService.updateKeyModuleStatus(organization, id, makeKeyModule)
        }
        return Promise.resolve()
      })

      await Promise.all(promises)
      await loadMappings()
      setSelectedItems(new Set())
    } catch (err: any) {
      setError(err.message || 'Failed to update key module status')
    }
  }

  const handleSelectAll = () => {
    if (selectedItems.size === filteredMappings.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(filteredMappings.map(m => m.id)))
    }
  }

  const handleSelectItem = (id: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedItems(newSelected)
  }

  const filteredMappings = mappings.filter(mapping => {
    const matchesSearch = 
      mapping.productArea.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mapping.dynatraceCapability.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = 
      filterType === 'all' ||
      (filterType === 'key' && mapping.isKeyModule) ||
      (filterType === 'regular' && !mapping.isKeyModule)

    return matchesSearch && matchesFilter
  })

  const keyModulesCount = mappings.filter(m => m.isKeyModule).length
  const totalMappings = mappings.length

  if (loading) {
    return <LoadingSpinner text="Loading key modules..." />
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Key Modules</p>
              <p className="text-2xl font-semibold text-gray-900">{keyModulesCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">All</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Modules</p>
              <p className="text-2xl font-semibold text-gray-900">{totalMappings}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">%</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Key Module %</p>
              <p className="text-2xl font-semibold text-gray-900">
                {totalMappings > 0 ? Math.round((keyModulesCount / totalMappings) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <Info className="h-5 w-5 text-blue-400 mt-0.5" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">About Key Modules</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Key modules are critical components that have higher impact on your business operations. 
                They receive enhanced monitoring and scoring adjustments in technical debt analysis.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search modules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
            >
              <option value="all">All Modules</option>
              <option value="key">Key Modules Only</option>
              <option value="regular">Regular Modules Only</option>
            </select>
          </div>
        </div>
        
        {selectedItems.size > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {selectedItems.size} selected
            </span>
            <button
              onClick={() => handleBulkToggle(true)}
              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-yellow-700 bg-yellow-100 hover:bg-yellow-200"
            >
              <Star className="h-3 w-3 mr-1" />
              Mark as Key
            </button>
            <button
              onClick={() => handleBulkToggle(false)}
              className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
            >
              Remove Key Status
            </button>
          </div>
        )}
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

      {/* Modules List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Product Area Modules ({filteredMappings.length})
            </h3>
            {filteredMappings.length > 0 && (
              <button
                onClick={handleSelectAll}
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500"
              >
                {selectedItems.size === filteredMappings.length ? (
                  <>
                    <CheckSquare className="h-4 w-4 mr-1" />
                    Deselect All
                  </>
                ) : (
                  <>
                    <Square className="h-4 w-4 mr-1" />
                    Select All
                  </>
                )}
              </button>
            )}
          </div>
        </div>
        
        {filteredMappings.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500">
              {searchTerm || filterType !== 'all' 
                ? 'No modules match your search or filter criteria.' 
                : 'No product area mappings found. Please add some mappings first.'}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredMappings.map((mapping) => (
              <div
                key={mapping.id}
                className={`px-6 py-4 hover:bg-gray-50 ${
                  selectedItems.has(mapping.id) ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleSelectItem(mapping.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {selectedItems.has(mapping.id) ? (
                        <CheckSquare className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Square className="h-5 w-5" />
                      )}
                    </button>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-medium text-gray-900">
                          {mapping.productArea}
                        </h4>
                        {mapping.isKeyModule && (
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {mapping.dynatraceCapability}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      mapping.isKeyModule 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {mapping.isKeyModule ? 'Key Module' : 'Regular Module'}
                    </span>
                    
                    <button
                      onClick={() => handleToggleKeyModule(mapping)}
                      disabled={updating.has(mapping.id)}
                      className={`inline-flex items-center px-3 py-1 border text-xs font-medium rounded focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        mapping.isKeyModule
                          ? 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-gray-500'
                          : 'border-transparent text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:ring-yellow-500'
                      } disabled:opacity-50`}
                    >
                      {updating.has(mapping.id) ? (
                        'Updating...'
                      ) : mapping.isKeyModule ? (
                        'Remove Key Status'
                      ) : (
                        <>
                          <Star className="h-3 w-3 mr-1" />
                          Mark as Key
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default KeyModulesSelector
